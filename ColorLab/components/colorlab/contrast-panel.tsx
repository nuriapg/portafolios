import { useState } from "react";
import { ArrowDownUp, Check, ExternalLink, ScanEye, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { contrastChecks, contrastRatio, ROLES, type PaletteColors } from "@/lib/colorlab";
function Result({ pass }: { pass: boolean }) { return <span className={`contrast-result ${pass ? "pass" : "fail"}`}>{pass ? <Check size={13} /> : <X size={13} />}<span>{pass ? "Cumple" : "No cumple"}</span></span>; }
function ColorSelect({ label, value, colors, onChange }: { label: string; value: string; colors: PaletteColors; onChange: (value: string) => void }) {
  return <div className="contrast-select-field"><span id={`label-${label}`} className="field-label">{label}</span><Select value={value} onValueChange={onChange}><SelectTrigger className="contrast-select" aria-labelledby={`label-${label}`}><SelectValue /></SelectTrigger><SelectContent position="popper">{colors.map((hex, index) => <SelectItem key={index} value={String(index)}><span className="color-dot" style={{ background: hex }} /><span>{ROLES[index]}</span><span className="select-hex">{hex}</span></SelectItem>)}</SelectContent></Select></div>;
}
export default function ContrastPanel({ colors }: { colors: PaletteColors }) {
  const [foreground, setForeground] = useState("4"), [background, setBackground] = useState("0");
  const ratio = contrastRatio(colors[Number(foreground)], colors[Number(background)]), checks = contrastChecks(ratio);
  const displayRatio = (Math.floor(ratio * 100) / 100).toFixed(2);
  return <aside className="contrast-panel" aria-labelledby="contrast-heading">
    <div className="panel-heading"><h2 id="contrast-heading"><ScanEye size={19} /> Contraste</h2><span className="tiny-tag">WCAG 2.2</span></div>
    <div className="contrast-selectors"><ColorSelect label="Texto" value={foreground} colors={colors} onChange={setForeground} /><button className="icon-button swap-button" aria-label="Intercambiar texto y fondo" title="Intercambiar colores" onClick={() => { setForeground(background); setBackground(foreground); }}><ArrowDownUp size={16} /></button><ColorSelect label="Fondo" value={background} colors={colors} onChange={setBackground} /></div>
    <div className="contrast-specimen" style={{ color: colors[Number(foreground)], background: colors[Number(background)] }}><span className="specimen-aa">Aa</span><span>El color también se lee.</span></div>
    <div className="contrast-score" aria-live="polite" aria-atomic="true"><div><strong>{displayRatio}<span>:1</span></strong><span className="score-label">Relación de contraste</span></div><span className={`score-verdict ${checks.normalAA ? "pass" : "fail"}`}>{checks.normalAAA ? "Excelente" : checks.normalAA ? "Buen contraste" : "Contraste bajo"}</span></div>
    <Table className="contrast-table"><TableCaption className="sr-only">Cumplimiento de contraste de texto</TableCaption><TableHeader><TableRow><TableHead scope="col">Texto</TableHead><TableHead scope="col">AA</TableHead><TableHead scope="col">AAA</TableHead></TableRow></TableHeader><TableBody><TableRow><TableHead scope="row">Normal</TableHead><TableCell><Result pass={checks.normalAA} /></TableCell><TableCell><Result pass={checks.normalAAA} /></TableCell></TableRow><TableRow><TableHead scope="row">Grande</TableHead><TableCell><Result pass={checks.largeAA} /></TableCell><TableCell><Result pass={checks.largeAAA} /></TableCell></TableRow></TableBody></Table>
    <p className="contrast-note">Texto grande: desde 24 px, o 18,67 px en negrita. Se evalúa esta pareja de colores.</p><a className="wcag-link" href="https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html" target="_blank" rel="noreferrer">Cómo se calcula el contraste <ExternalLink size={13} /></a>
  </aside>;
}
