import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { EMPTY_LOCKS, FAVORITES_KEY, INITIAL_COLORS, generatePalette, paletteName, parseFavorites, samePalette, type ColorLocks, type Favorite, type PaletteColors } from "@/lib/colorlab";
export function useColorLab() {
  const [colors, setColors] = useState<PaletteColors>([...INITIAL_COLORS]);
  const [locks, setLocks] = useState<ColorLocks>([...EMPTY_LOCKS]);
  const [name, setName] = useState("Órbita creativa");
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const favoritesRef = useRef<Favorite[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  useEffect(() => {
    try { const saved = parseFavorites(localStorage.getItem(FAVORITES_KEY)); setFavorites(saved); favoritesRef.current = saved; }
    catch { setStorageAvailable(false); }
    setLoaded(true);
  }, []);
  const generate = useCallback(() => {
    if (locks.every(Boolean)) { toast.info("Desbloquea al menos un color para generar otra paleta."); return; }
    const next = generatePalette(colors, locks); setColors(next); setName(paletteName(next));
  }, [colors, locks]);
  function editColor(index: number, value: string) { setColors((previous) => previous.map((c, i) => i === index ? value : c) as PaletteColors); setName("Paleta personalizada"); }
  function toggleLock(index: number) { setLocks((previous) => previous.map((locked, i) => i === index ? !locked : locked) as ColorLocks); }
  function persist(next: Favorite[]): boolean {
    setFavorites(next); favoritesRef.current = next;
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify({ version: 1, palettes: next })); setStorageAvailable(true); return true; }
    catch { setStorageAvailable(false); toast.warning("El navegador no permite guardar. Tus favoritas estarán disponibles durante esta sesión."); return false; }
  }
  const isSaved = favorites.some((favorite) => samePalette(favorite.colors, colors));
  function saveFavorite() {
    if (!loaded || isSaved) return;
    if (favoritesRef.current.length >= 60) { toast.info("Puedes guardar hasta 60 paletas. Elimina una para añadir otra."); return; }
    const favorite = { id: crypto.randomUUID(), name, colors: [...colors] as PaletteColors, createdAt: new Date().toISOString() };
    if (persist([favorite, ...favoritesRef.current])) toast.success("Paleta guardada en tus favoritas.");
  }
  function removeFavorite(id: string) {
    const favorite = favoritesRef.current.find((item) => item.id === id);
    const saved = persist(favoritesRef.current.filter((item) => item.id !== id));
    if (favorite && saved) toast("Paleta eliminada", { action: { label: "Deshacer", onClick: () => { if (!favoritesRef.current.some((f) => samePalette(f.colors, favorite.colors))) persist([favorite, ...favoritesRef.current].slice(0, 60)); } } });
  }
  function applyFavorite(favorite: Favorite) { setColors([...favorite.colors]); setName(favorite.name); setLocks([...EMPTY_LOCKS]); toast.success("Paleta aplicada."); }
  return { colors, locks, name, favorites, loaded, storageAvailable, generate, editColor, toggleLock, isSaved, saveFavorite, removeFavorite, applyFavorite };
}
