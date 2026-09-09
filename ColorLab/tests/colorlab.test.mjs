import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { INITIAL_COLORS, EMPTY_LOCKS, contrastRatio, relativeLuminance, contrastChecks, readableInk, normalizeHex, generatePalette, toCssVariables, parseFavorites, hslToHex } from '../lib/colorlab.ts';

describe('WCAG 2.2 contrast', () => {
  it('returns 21:1 for black and white, and 1:1 for identical colors', () => {
    assert.equal(contrastRatio('#000000', '#FFFFFF'), 21);
    for (const color of INITIAL_COLORS) assert.equal(contrastRatio(color, color), 1);
  });
  it('uses linearized sRGB luminance, including both sides of the transfer threshold', () => {
    assert.equal(relativeLuminance('#000'), 0);
    assert.equal(relativeLuminance('#fff'), 1);
    assert.ok(Math.abs(relativeLuminance('#ff0000') - 0.2126) < 1e-12);
    assert.ok(Math.abs(relativeLuminance('#0a0a0a') - 0.003035269835488375) < 1e-12);
    assert.ok(Math.abs(relativeLuminance('#0b0b0b') - 0.003346535763899161) < 1e-12);
  });
  it('is symmetric and stays within 1:1–21:1', () => {
    for (const a of INITIAL_COLORS) for (const b of INITIAL_COLORS) {
      const ratio = contrastRatio(a, b);
      assert.equal(ratio, contrastRatio(b, a));
      assert.ok(ratio >= 1 && ratio <= 21);
    }
  });
  it('does not round a failing contrast into a pass', () => {
    assert.equal(contrastChecks(4.49999).normalAA, false);
    assert.equal(contrastChecks(4.5).normalAA, true);
    assert.equal(contrastChecks(6.99999).normalAAA, false);
    assert.equal(contrastChecks(7).normalAAA, true);
    assert.equal(contrastChecks(2.99999).largeAA, false);
    assert.equal(contrastChecks(3).largeAA, true);
    assert.equal(contrastChecks(4.5).largeAAA, true);
  });
  it('classifies known near-threshold gray on white correctly', () => {
    assert.equal(contrastChecks(contrastRatio('#767676', '#ffffff')).normalAA, true);
    assert.equal(contrastChecks(contrastRatio('#777777', '#ffffff')).normalAA, false);
  });
  it('selects a readable button label for light and dark backgrounds', () => {
    assert.equal(readableInk('#fff'), '#000000');
    assert.equal(readableInk('#000'), '#FFFFFF');
    for (let hue = 0; hue < 360; hue += 5) {
      const color = hslToHex(hue, 70, 50);
      assert.ok(contrastRatio(readableInk(color), color) >= 4.5);
    }
  });
  it('rejects invalid, transparent and nonhex color strings', () => {
    for (const color of ['nope', '#12345', '#abcd', '#ff00ff00', 'rgb(0,0,0)', '']) assert.throws(() => contrastRatio(color, '#fff'), TypeError);
  });
});
describe('Palette generation and export', () => {
  it('normalizes shorthand, case and whitespace while rejecting invalid input', () => {
    assert.equal(normalizeHex(' abc '), '#AABBCC');
    assert.equal(normalizeHex('#aB09fF'), '#AB09FF');
    assert.equal(normalizeHex('#12gg34'), null);
  });
  it('preserves all 32 combinations of locked slots without mutating input', () => {
    for (let mask = 0; mask < 32; mask++) {
      const colors = Object.freeze([...INITIAL_COLORS]);
      const locks = Object.freeze(Array.from({length: 5}, (_, i) => Boolean(mask & (1 << i))));
      const next = generatePalette(colors, locks, () => 0.23);
      assert.equal(next.length, 5);
      next.forEach((hex, index) => { assert.match(hex, /^#[0-9A-F]{6}$/); if (locks[index]) assert.equal(hex, colors[index]); });
      if (mask === 31) assert.deepEqual(next, colors);
      else assert.notDeepEqual(next, colors);
    }
  });
  it('produces valid, readable base themes across a range of hues', () => {
    for (let step = 0; step < 100; step++) {
      const next = generatePalette(INITIAL_COLORS, EMPTY_LOCKS, () => step / 100);
      assert.equal(new Set(next).size, 5);
      assert.ok(contrastRatio(next[4], next[0]) >= 7);
      assert.ok(contrastRatio(next[4], next[1]) >= 4.5);
    }
  });
  it('exports five semantic colors and the actual button label colors', () => {
    const css = toCssVariables(INITIAL_COLORS);
    for (const hex of INITIAL_COLORS) assert.ok(css.includes(hex));
    assert.match(css, /^:root \{\n/);
    assert.ok(css.includes(`--color-on-primary: ${readableInk(INITIAL_COLORS[3])};`));
    assert.equal((css.match(/--color-/g) || []).length, 7);
  });
});
describe('Favorite persistence data', () => {
  const saved = { id:'a', name:'Mi paleta', colors:INITIAL_COLORS, createdAt:'2026-09-09T00:00:00.000Z' };
  it('round-trips favorites in the versioned storage format', () => {
    assert.deepEqual(parseFavorites(JSON.stringify({version:1, palettes:[saved]})), [saved]);
  });
  it('recovers safely from broken storage and unsupported versions', () => {
    for (const raw of [null, '', '{broken', 'null', '[]', JSON.stringify({version:99, palettes:[saved]})]) assert.deepEqual(parseFavorites(raw), []);
  });
  it('ignores malformed colors and duplicate palettes without losing good entries', () => {
    const entries = [null, {}, {...saved, id:'bad', colors:['#fff']}, saved, {...saved, id:'duplicate'}];
    assert.deepEqual(parseFavorites(JSON.stringify({version:1, palettes:entries})), [saved]);
  });
});
