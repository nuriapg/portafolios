export type PaletteColors = [string, string, string, string, string];
export type ColorLocks = [boolean, boolean, boolean, boolean, boolean];
export type Favorite = { id: string; name: string; colors: PaletteColors; createdAt: string };
export const ROLES = ["Fondo", "Superficie", "Acento", "Primario", "Texto"] as const;
export const CSS_ROLES = ["background", "surface", "accent", "primary", "text"] as const;
export const INITIAL_COLORS: PaletteColors = ["#F6F4FB", "#E6DDF5", "#D0EE93", "#7953B5", "#292238"];
export const EMPTY_LOCKS: ColorLocks = [false, false, false, false, false];
export const FAVORITES_KEY = "colorlab:favorites:v1";

/** Accept opaque sRGB hex only; normalize both #RGB and #RRGGBB. */
export function normalizeHex(value: string): string | null {
  const hex = value.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(hex)) return "#" + [...hex].map((c) => c + c).join("").toUpperCase();
  return /^[0-9a-f]{6}$/i.test(hex) ? "#" + hex.toUpperCase() : null;
}
function rgb(hex: string): [number, number, number] {
  const normalized = normalizeHex(hex);
  if (!normalized) throw new TypeError(`Invalid opaque hex color: ${hex}`);
  return [1, 3, 5].map((i) => parseInt(normalized.slice(i, i + 2), 16)) as [number, number, number];
}
/** WCAG 2.2 relative luminance, linearized sRGB. */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((channel) => {
    const s = channel / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground), b = relativeLuminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
/** Compare full precision; never round before deciding a pass. */
export function contrastChecks(ratio: number) {
  return { normalAA: ratio >= 4.5, normalAAA: ratio >= 7, largeAA: ratio >= 3, largeAAA: ratio >= 4.5 };
}
export function readableInk(background: string): string {
  return contrastRatio("#000000", background) >= contrastRatio("#FFFFFF", background) ? "#000000" : "#FFFFFF";
}
export function hexToHsl(hex: string): [number, number, number] {
  const [r, g, b] = rgb(hex).map((c) => c / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min, light = (max + min) / 2;
  if (delta === 0) return [0, 0, light * 100];
  const hue = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  return [(hue * 60 + 360) % 360, (delta / (1 - Math.abs(2 * light - 1))) * 100, light * 100];
}
export function hslToHex(hue: number, saturation: number, lightness: number): string {
  const h = ((hue % 360) + 360) % 360, s = saturation / 100, l = lightness / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  const parts = h < 60 ? [c,x,0] : h < 120 ? [x,c,0] : h < 180 ? [0,c,x] : h < 240 ? [0,x,c] : h < 300 ? [x,0,c] : [c,0,x];
  return "#" + parts.map((v) => Math.round((v + m) * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
}
/** Five semantic roles; generation preserves every locked slot. */
export function generatePalette(current: PaletteColors, locks: ColorLocks, random: () => number = Math.random): PaletteColors {
  if (locks.every(Boolean)) return [...current];
  const anchor = locks[3] ? hexToHsl(current[3])[0] : random() * 360;
  const hue = locks[3] ? anchor + (random() - 0.5) * 35 : anchor, saturation = 45 + random() * 28;
  const generated = [hslToHex(hue, 28 + random() * 24, 96 + random() * 2), hslToHex(hue + 12, 35 + random() * 22, 86 + random() * 5), hslToHex(hue + 145 + random() * 55, 65 + random() * 20, 69 + random() * 9), hslToHex(hue, saturation, 37 + random() * 10), hslToHex(hue, 20 + random() * 14, 13 + random() * 6)];
  return generated.map((color, index) => locks[index] ? current[index] : color) as PaletteColors;
}
export function paletteName(colors: PaletteColors): string {
  const hue = hexToHsl(colors[3])[0];
  return hue < 25 ? "Terracota viva" : hue < 60 ? "Hora dorada" : hue < 100 ? "Lima fresca" : hue < 165 ? "Jardín secreto" : hue < 200 ? "Marea suave" : hue < 250 ? "Azul infinito" : hue < 290 ? "Órbita creativa" : hue < 335 ? "Rosa eléctrico" : "Rojo en calma";
}
export function toCssVariables(colors: PaletteColors): string {
  const variables = colors.map((hex, i) => `  --color-${CSS_ROLES[i]}: ${hex};`);
  variables.push(`  --color-on-primary: ${readableInk(colors[3])};`, `  --color-on-accent: ${readableInk(colors[2])};`);
  return `:root {\n${variables.join("\n")}\n}`;
}
export function samePalette(a: PaletteColors, b: PaletteColors): boolean { return a.every((hex, index) => hex.toUpperCase() === b[index].toUpperCase()); }
/** Browser storage is untrusted; ignore malformed entries and unknown schemas. */
export function parseFavorites(raw: string | null): Favorite[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object" || !("version" in data) || data.version !== 1 || !("palettes" in data) || !Array.isArray(data.palettes)) return [];
    const favorites: Favorite[] = [];
    for (const entry of data.palettes) {
      if (!entry || typeof entry.id !== "string" || !entry.id || typeof entry.name !== "string" || typeof entry.createdAt !== "string" || !Array.isArray(entry.colors) || entry.colors.length !== 5) continue;
      const colors = entry.colors.map((c: unknown) => typeof c === "string" ? normalizeHex(c) : null);
      if (colors.some((c: string | null) => !c) || favorites.some((f) => f.id === entry.id || samePalette(f.colors, colors as PaletteColors))) continue;
      favorites.push({ id: entry.id.slice(0, 100), name: entry.name.slice(0, 80), colors: colors as PaletteColors, createdAt: entry.createdAt });
      if (favorites.length === 60) break;
    }
    return favorites;
  } catch { return []; }
}
