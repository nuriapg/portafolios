import { useEffect, useState } from "react";
import { ArrowRight, Check, Code2, Copy, Heart, LockKeyhole, Palette, Shuffle, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Toaster } from "@/components/ui/sonner";
import { useColorLab } from "@/hooks/use-colorlab";
import { toCssVariables } from "@/lib/colorlab";
import ColorSwatch from "./color-swatch";
import ContrastPanel from "./contrast-panel";
import LivePreview from "./live-preview";

export default function ColorLab() {
  const studio = useColorLab();
  const [showFavorites, setShowFavorites] = useState(false), [showExport, setShowExport] = useState(false), [copied, setCopied] = useState(false);
  const lockedCount = studio.locks.filter(Boolean).length, css = toCssVariables(studio.colors);
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (event.code !== "Space" || event.repeat || event.ctrlKey || event.metaKey || event.altKey || showFavorites || showExport || target.isContentEditable || target.closest("input,textarea,button,select,a,[role='button'],[role='tab'],[role='combobox'],[role='dialog']")) return;
      event.preventDefault(); studio.generate();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [studio.generate, showFavorites, showExport]);
  useEffect(() => { setCopied(false); }, [css, showExport]);
  async function copyCss() {
    try { await navigator.clipboard.writeText(css); setCopied(true); toast.success("Variables CSS copiadas."); }
    catch { toast.error("No se ha podido copiar. Selecciona el código para copiarlo manualmente."); }
  }

  return <div className="colorlab-app">
    <a href="#studio" className="skip-link">Saltar al estudio</a>
    <header className="app-header"><div className="header-inner"><a className="brand" href="#studio" aria-label="ColorLab, ir al estudio"><span className="brand-symbol" aria-hidden="true"><i /><i /><i /></span><span>ColorLab<span className="brand-period">.</span></span></a><span className="header-description">Tu pequeño estudio de color</span><div className="header-actions"><button className="button button-quiet favorites-trigger" onClick={() => setShowFavorites(true)}><Heart size={17} /> Favoritas <span className="count-badge">{studio.favorites.length}</span></button><span className="header-divider" /><button className="button button-dark" onClick={() => setShowExport(true)}><Code2 size={17} /><span>Copiar CSS</span></button></div></div></header>
    <main id="studio" className="studio-shell">
      <div className="studio-intro"><div><div className="eyebrow"><Palette size={14} /> EL COLOR ES SOLO EL PRINCIPIO</div><h1>Encuentra tu próxima paleta<span>.</span></h1></div><div className="generate-group"><button className="button generate-button" onClick={studio.generate} aria-keyshortcuts="Space"><Shuffle size={18} /> Generar paleta <kbd>␣</kbd></button><span className="keyboard-hint">o pulsa la barra espaciadora</span></div></div>
      <section className="palette-section" aria-label="Editor de paleta de cinco colores"><div className="palette-grid">{studio.colors.map((color, index) => <ColorSwatch key={index} color={color} index={index} locked={studio.locks[index]} onChange={(value) => studio.editColor(index, value)} onToggleLock={() => studio.toggleLock(index)} />)}</div><div className="palette-meta"><div className="palette-name"><span className="palette-spark"><Sparkles size={14} /></span><span>{studio.name}</span><span className="meta-divider">/</span><span className="lock-hint"><LockKeyhole size={13} />{lockedCount ? `${lockedCount} de 5 bloqueados` : "Bloquea los colores que quieras conservar"}</span></div><button className={`save-button ${studio.isSaved ? "saved" : ""}`} onClick={studio.saveFavorite} disabled={!studio.loaded || studio.isSaved}>{studio.isSaved ? <Check size={16} /> : <Heart size={16} />}{studio.isSaved ? "Guardada" : "Guardar paleta"}</button></div></section>
      <div className="workspace-grid"><LivePreview colors={studio.colors} /><ContrastPanel colors={studio.colors} /></div>
      <footer className="app-footer"><span>Hecho para jugar con el color.</span><span><span className="footer-small-colors" aria-hidden="true">{studio.colors.map((color, i) => <i key={i} style={{ backgroundColor: color }} />)}</span> Cinco colores. Infinitas posibilidades.</span></footer>
    </main>
    <Sheet open={showFavorites} onOpenChange={setShowFavorites}><SheetContent className="favorites-sheet" showCloseButton={false}><SheetClose className="icon-button overlay-close" aria-label="Cerrar favoritas"><X size={19} /></SheetClose><SheetHeader><div className="overlay-eyebrow"><Heart size={18} /> TU COLECCIÓN</div><SheetTitle>Paletas favoritas<span>.</span></SheetTitle><SheetDescription>Vuelve a tus combinaciones preferidas. Se guardan en este navegador.</SheetDescription></SheetHeader>{!studio.storageAvailable && <p className="storage-warning" role="status">El almacenamiento no está disponible. Las favoritas solo durarán esta sesión.</p>}<div className="favorites-list">{studio.favorites.length === 0 ? <Empty className="favorites-empty"><EmptyHeader><EmptyMedia variant="icon"><Heart size={28} /></EmptyMedia><EmptyTitle>Aquí empieza tu colección</EmptyTitle><EmptyDescription>Cuando una paleta te encante, pulsa «Guardar paleta» y la encontrarás aquí.</EmptyDescription></EmptyHeader><EmptyContent><button className="button button-dark" onClick={() => setShowFavorites(false)}>Seguir creando <ArrowRight size={16} /></button></EmptyContent></Empty> : studio.favorites.map((favorite) => <article className="favorite-card" key={favorite.id}><button className="favorite-apply" onClick={() => { studio.applyFavorite(favorite); setShowFavorites(false); }} aria-label={`Aplicar ${favorite.name}`}><span className="favorite-colors">{favorite.colors.map((color, i) => <i key={i} style={{ background: color }} />)}</span><span className="favorite-name">{favorite.name}<span>Aplicar ↗</span></span><span className="favorite-hexes">{favorite.colors.join(" · ")}</span></button><button className="icon-button favorite-delete" onClick={() => studio.removeFavorite(favorite.id)} aria-label={`Eliminar ${favorite.name}`} title="Eliminar paleta"><Trash2 size={16} /></button></article>)}</div><p className="favorites-footnote">{studio.favorites.length} / 60 paletas guardadas · Sin cuentas</p></SheetContent></Sheet>
    <Dialog open={showExport} onOpenChange={setShowExport}><DialogContent className="export-dialog" showCloseButton={false}><DialogClose className="icon-button overlay-close" aria-label="Cerrar exportación"><X size={19} /></DialogClose><DialogHeader><div className="overlay-eyebrow"><Code2 size={18} /> LISTA PARA TU PROYECTO</div><DialogTitle>Un poco de color en tu CSS<span>.</span></DialogTitle><DialogDescription>Copia estas variables en tu hoja de estilos y empieza a crear.</DialogDescription></DialogHeader><div className="export-colors" aria-label="Colores que se exportarán">{studio.colors.map((color, i) => <i key={i} style={{ backgroundColor: color }} />)}</div><pre className="css-code" tabIndex={0} aria-label="Variables CSS de la paleta"><code>{css}</code></pre><p className="export-note">Incluye colores de texto para los botones primario y de acento.</p><button className="button button-dark export-copy" onClick={copyCss}>{copied ? <Check size={17} /> : <Copy size={17} />}{copied ? "¡Copiado!" : "Copiar variables CSS"}</button></DialogContent></Dialog>
    <Toaster position="bottom-center" theme="light" richColors closeButton />
  </div>;
}
