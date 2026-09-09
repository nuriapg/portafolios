import { useEffect, useRef, useState } from "react";
import { Copy, LockKeyhole, LockKeyholeOpen, Pipette } from "lucide-react";
import { toast } from "sonner";
import { normalizeHex, readableInk, ROLES } from "@/lib/colorlab";
type Props = { color: string; index: number; locked: boolean; onChange: (value: string) => void; onToggleLock: () => void };
export default function ColorSwatch({ color, index, locked, onChange, onToggleLock }: Props) {
  const [draft, setDraft] = useState(color), [invalid, setInvalid] = useState(false);
  const picker = useRef<HTMLInputElement>(null);
  const cancelBlur = useRef(false);
  useEffect(() => { setDraft(color); setInvalid(false); }, [color]);
  function commit() { if (cancelBlur.current) { cancelBlur.current = false; return; } const next = normalizeHex(draft); if (!next) { setInvalid(true); return; } setInvalid(false); setDraft(next); if (next !== color) onChange(next); }
  async function copy() { try { await navigator.clipboard.writeText(color); toast.success(`${color} copiado.`); } catch { toast.error("No se ha podido copiar. Selecciona el código y cópialo manualmente."); } }
  return <article className="color-swatch" style={{ backgroundColor: color, color: readableInk(color) }} aria-label={`Color ${index + 1}: ${ROLES[index]}`}>
    <div className="swatch-top"><span className="swatch-number">0{index + 1}</span><button className="swatch-icon" onClick={copy} aria-label={`Copiar ${color}`} title="Copiar color"><Copy size={17} /></button></div>
    <button className="swatch-edit" onClick={() => picker.current?.click()} aria-label={`Elegir color de ${ROLES[index].toLowerCase()}`} title="Editar color"><Pipette size={22} /><span>Editar color</span></button>
    <input className="native-picker" ref={picker} type="color" value={color} tabIndex={-1} aria-label={`Selector de ${ROLES[index].toLowerCase()}`} onChange={(event) => onChange(event.target.value.toUpperCase())} />
    <div className="swatch-bottom"><div className="hex-field"><input aria-label={`Código hexadecimal de ${ROLES[index].toLowerCase()}`} aria-invalid={invalid} aria-describedby={invalid ? `hex-error-${index}` : undefined} value={draft} onChange={(event) => { setDraft(event.target.value); setInvalid(false); }} onBlur={commit} maxLength={7} spellCheck={false} autoComplete="off" onFocus={(event) => event.currentTarget.select()} onKeyDown={(event) => { if (event.key === "Enter") commit(); if (event.key === "Escape") { cancelBlur.current = true; setDraft(color); setInvalid(false); event.currentTarget.blur(); } }} /><span className="swatch-role">{ROLES[index]}</span>{invalid && <span id={`hex-error-${index}`} className="hex-error" role="alert">Usa #RGB o #RRGGBB</span>}</div><button className={`swatch-icon lock-button ${locked ? "is-locked" : ""}`} onClick={onToggleLock} aria-pressed={locked} aria-label={`${locked ? "Desbloquear" : "Bloquear"} ${ROLES[index].toLowerCase()}`} title={locked ? "Desbloquear color" : "Conservar al generar"}>{locked ? <LockKeyhole size={19} /> : <LockKeyholeOpen size={19} />}</button></div>
  </article>;
}
