"use client";

// ═══════════════════════════════════════════════════════════════
// TrayectoriaModal — Molécula React: ventana flotante que muestra
// el "Mapa de Trayectoria Tecnológica" del área de Teleinformática –
// Software del CEET.
//
// Distribución (capas × horizonte) y paleta reproducidas del ejercicio
// de prospectiva del CEET. El contenido de cada direccionador (D1–D6)
// proviene del JSON de dominio — nunca hardcodeado en TypeScript:
//   src/config/radars/mapa-trayectoria-tec-teleinformatica-software.json
// (generado desde el Excel "Mapas de Trayectoria Tecnologica.xlsx").
//
// El color de cada tecnología codifica su MADUREZ (TRL). Incluye
// exportación a PDF (jsPDF, dibujado vectorial), notas metodológicas,
// glosario y las fuentes al pie.
// ═══════════════════════════════════════════════════════════════

import { useMemo, useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Map as MapIcon, Download, Loader2 } from "lucide-react";
import roadmap from "@/config/radars/mapa-trayectoria-tec-teleinformatica-software.json";

// ── Tipos locales (derivados del JSON de dominio) ─────────────

interface Capa {
  id: string;
  label: string;
  color: string;
}
interface Horizonte {
  id: string;
  label: string;
  color: string;
}
interface Madurez {
  id: string;
  label: string;
  color: string;
}
interface RoadmapItem {
  capa: string;
  horizonte: string;
  title: string;
  trl: string | null;
  madurez: string | null;
}
interface Direccionador {
  code: string;
  name: string;
  area: string;
  items: RoadmapItem[];
}
interface Glosario {
  sigla: string;
  definicion: string;
}
interface Fuente {
  text: string;
  url: string;
}

interface TrayectoriaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const capas = (roadmap.capas ?? []) as Capa[];
const horizontes = (roadmap.horizontes ?? []) as Horizonte[];
const madurezNiveles = (roadmap.madurez ?? []) as Madurez[];
const direccionadores = (roadmap.direccionadores ?? []) as Direccionador[];
const notas = (roadmap.notas ?? []) as string[];
const glosario = (roadmap.glosario ?? []) as Glosario[];
const fuentes = (roadmap.fuentes ?? []) as Fuente[];

const madurezColor = (id: string | null): string | null =>
  madurezNiveles.find((m) => m.id === id)?.color ?? null;

// ── Tarjeta de un ítem del roadmap ────────────────────────────

function ItemCard({
  item,
  horizonteColor,
}: {
  item: RoadmapItem;
  horizonteColor: string;
}) {
  const fill = madurezColor(item.madurez);

  // Tecnologías (con madurez/TRL): tarjeta rellena en color de madurez.
  // Resto de capas: tarjeta clara con borde izquierdo del color del horizonte.
  if (fill) {
    return (
      <div
        className="relative rounded-md px-2.5 py-2 text-[11px] md:text-xs leading-snug font-semibold text-white shadow-sm"
        style={{ backgroundColor: fill }}
      >
        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-white/60" />
        <span className="block pr-3">{item.title}</span>
        {item.trl && (
          <span className="mt-1.5 inline-block rounded-md bg-white/25 px-2 py-0.5 text-[10px] font-bold text-white">
            TRL {item.trl}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className="rounded-md border border-sena-gray-light bg-white px-2.5 py-2 text-[11px] md:text-xs leading-snug font-medium text-sena-gray-dark shadow-sm"
      style={{ borderLeft: `4px solid ${horizonteColor}` }}
    >
      {item.title}
    </div>
  );
}

// ── Exportación a PDF (jsPDF vectorial, un direccionador por página) ─

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

async function exportRoadmapPDF(): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const M = 8;
  const labelW = 32;
  const colW = (pageW - M * 2 - labelW) / horizontes.length;

  const setFill = (hex: string) => pdf.setFillColor(...hexToRgb(hex));
  const setText = (hex: string) => pdf.setTextColor(...hexToRgb(hex));

  direccionadores.forEach((dir, di) => {
    if (di > 0) pdf.addPage();

    // Título
    setText("#00324d");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text(roadmap.meta.title, M, 11);
    pdf.setFontSize(9);
    setText("#39a900");
    pdf.text(`${dir.code} · ${dir.name}`, M, 16.5);
    setText("#333333");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.text(`Área: ${dir.area}`, M, 21);

    // Cabecera de horizontes
    let gy = 25;
    const headerH = 8;
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    setFill("#00324d");
    pdf.rect(M, gy, labelW, headerH, "F");
    setText("#ffffff");
    pdf.setFontSize(6.5);
    pdf.text("Capas / Horizonte", M + 1.5, gy + headerH / 2 + 1);
    horizontes.forEach((h, i) => {
      const x = M + labelW + i * colW;
      setFill(h.color);
      pdf.rect(x, gy, colW, headerH, "F");
      setText("#ffffff");
      pdf.setFontSize(8);
      pdf.text(h.label, x + colW / 2, gy + headerH / 2 + 1.3, { align: "center" });
    });
    gy += headerH;

    // Filas de capas
    const lineH = 2.6;
    const cardPadV = 1.6;
    const cardGap = 1.4;
    const pad = 1.4;
    const availH = pageH - gy - 22; // reservar pie para notas/fuentes

    // Precalcular alturas de tarjeta por celda (según nº de líneas de texto)
    const cardLines = (title: string, hasTrl: boolean, cw: number): number => {
      pdf.setFontSize(6);
      const lines = pdf.splitTextToSize(title, cw - 4).length;
      return Math.min(lines, 4) + (hasTrl ? 1 : 0);
    };

    const rowHeights = capas.map((capa) => {
      let maxH = 8;
      horizontes.forEach((h) => {
        const cell = dir.items.filter(
          (it) => it.capa === capa.id && it.horizonte === h.id,
        );
        let stack = cardGap;
        cell.forEach((it) => {
          const nl = cardLines(it.title, Boolean(it.trl), colW - pad * 2);
          stack += nl * lineH + cardPadV * 2 + cardGap;
        });
        maxH = Math.max(maxH, stack);
      });
      return maxH;
    });
    const totalH = rowHeights.reduce((a, b) => a + b, 0);
    const scale = totalH > availH ? availH / totalH : 1;

    capas.forEach((capa, ri) => {
      const rowH = rowHeights[ri] * scale;

      setFill(capa.color);
      pdf.rect(M, gy, 1.8, rowH, "F");
      pdf.setFillColor(245, 247, 250);
      pdf.rect(M + 1.8, gy, labelW - 1.8, rowH, "F");
      setText(capa.color);
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "bold");
      const label = pdf.splitTextToSize(capa.label, labelW - 5);
      pdf.text(label, M + 3.5, gy + rowH / 2 - (label.length - 1) * 1.3);

      horizontes.forEach((h, i) => {
        const x = M + labelW + i * colW;
        pdf.setDrawColor(230, 232, 236);
        pdf.rect(x, gy, colW, rowH, "S");

        const cell = dir.items.filter(
          (it) => it.capa === capa.id && it.horizonte === h.id,
        );
        let cy = gy + cardGap;
        cell.forEach((it) => {
          const cw = colW - pad * 2;
          const nl = cardLines(it.title, Boolean(it.trl), cw);
          const ch = (nl * lineH + cardPadV * 2) * scale;
          const cx = x + pad;
          const fill = madurezColor(it.madurez);
          if (fill) {
            setFill(fill);
            pdf.roundedRect(cx, cy, cw, ch, 1, 1, "F");
            setText("#ffffff");
          } else {
            pdf.setFillColor(255, 255, 255);
            pdf.roundedRect(cx, cy, cw, ch, 1, 1, "F");
            setFill(h.color);
            pdf.rect(cx, cy, 1, ch, "F");
            setText("#1f2937");
          }
          pdf.setFontSize(6);
          pdf.setFont("helvetica", "bold");
          const lines = (pdf.splitTextToSize(it.title, cw - 4) as string[]).slice(
            0,
            4,
          );
          pdf.text(lines, cx + 2.5, cy + 2.4 * scale + 0.6);
          if (it.trl) {
            setText(fill ? "#ffffff" : "#15803d");
            pdf.setFontSize(5.5);
            pdf.text(`TRL ${it.trl}`, cx + 2.5, cy + ch - 1.4);
          }
          cy += ch + cardGap;
        });
      });

      gy += rowH;
    });

    // Fuentes al pie
    gy += 3;
    setText("#333333");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6.5);
    pdf.text("FUENTES", M, gy);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(5.5);
    fuentes.forEach((f, fi) => {
      const y = gy + 3 + fi * 2.8;
      if (y < pageH - 3) {
        const line = pdf.splitTextToSize(
          `${f.text}${f.url ? " " + f.url : ""}`,
          pageW - M * 2,
        );
        pdf.text(line.slice(0, 1), M, y);
      }
    });
  });

  pdf.save("Mapa_Trayectoria_Tecnologica_Teleinformatica_CEET.pdf");
}

// ── Componente principal ──────────────────────────────────────

export function TrayectoriaModal({ open, onOpenChange }: TrayectoriaModalProps) {
  const [active, setActive] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [showGlosario, setShowGlosario] = useState(false);

  const dir = direccionadores[active];

  const itemsByCell = useMemo(() => {
    const map = new Map<string, RoadmapItem[]>();
    for (const it of dir.items) {
      const key = `${it.capa}|${it.horizonte}`;
      const arr = map.get(key) ?? [];
      arr.push(it);
      map.set(key, arr);
    }
    return map;
  }, [dir]);

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await exportRoadmapPDF();
    } catch (err) {
      console.error("[TrayectoriaModal] Error al exportar PDF:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-screen h-[100dvh] max-w-none border-none rounded-none sm:w-[97vw] sm:h-[95vh] sm:max-w-[1700px] sm:border sm:border-solid sm:rounded-xl flex flex-col p-0 gap-0 overflow-hidden z-50"
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Cabecera */}
        <DialogHeader className="px-4 md:px-6 py-3 md:py-4 border-b bg-white flex-none m-0 flex-row items-center justify-between gap-3 space-y-0">
          <DialogTitle className="flex items-center gap-2 text-base md:text-xl text-sena-blue min-w-0">
            <MapIcon className="w-5 h-5 md:w-6 md:h-6 text-sena-green shrink-0" />
            <span className="truncate">Mapa de Trayectoria Tecnológica</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Proyección temporal ({roadmap.meta.horizonteRange}) de las capacidades
            del área de Teleinformática – Software por direccionador estratégico y
            horizonte de adopción.
          </DialogDescription>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="mr-7 md:mr-8 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sena-gray-dark/20 text-sm font-medium text-sena-blue hover:bg-sena-gray-light/50 transition-colors disabled:opacity-60 shrink-0"
          >
            {exporting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            <span className="hidden sm:inline">Exportar PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>
        </DialogHeader>

        {/* Cuerpo desplazable */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-white">
          {/* Descripción */}
          <div className="rounded-lg border border-sena-green/25 bg-sena-green/5 border-l-4 border-l-sena-green p-4">
            <h3 className="text-sm md:text-base font-bold text-sena-blue">
              {roadmap.meta.title}
            </h3>
            <p className="mt-1.5 text-[12px] md:text-[13px] leading-relaxed text-sena-gray-dark">
              {roadmap.meta.description}
            </p>
          </div>

          {/* Pestañas de direccionadores */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 rounded-lg border border-sena-gray-light bg-sena-gray-light/40 p-1.5">
            {direccionadores.map((d, i) => {
              const isActive = i === active;
              return (
                <button
                  key={d.code}
                  onClick={() => setActive(i)}
                  title={`${d.code} · ${d.name}`}
                  className={`rounded-md px-2 py-2 text-center transition-colors ${
                    isActive
                      ? "bg-white shadow-sm ring-1 ring-sena-blue/20"
                      : "hover:bg-white/60"
                  }`}
                >
                  <span
                    className={`block text-sm font-bold ${
                      isActive ? "text-sena-blue" : "text-sena-gray-dark"
                    }`}
                  >
                    {d.code}
                  </span>
                  <span
                    className={`block text-[10px] leading-tight mt-0.5 line-clamp-2 ${
                      isActive ? "text-sena-blue" : "text-sena-gray-dark/70"
                    }`}
                  >
                    {d.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Subtítulo del direccionador activo */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-sm font-bold text-sena-blue">
              {dir.code} · {dir.name}
            </span>
            <span className="text-[12px] text-sena-gray-dark/80">
              Área: {dir.area}
            </span>
          </div>

          {/* Grilla + leyendas */}
          <div className="flex flex-col xl:flex-row gap-4">
            {/* Grilla */}
            <div className="flex-1 min-w-0 overflow-x-auto">
              <div className="min-w-[820px]">
                {/* Cabecera de horizontes */}
                <div
                  className="grid rounded-t-lg overflow-hidden"
                  style={{
                    gridTemplateColumns: `160px repeat(${horizontes.length}, 1fr)`,
                  }}
                >
                  <div className="bg-sena-blue text-white text-[11px] font-semibold flex flex-col justify-between p-2">
                    <span className="self-end text-sena-green">Horizonte →</span>
                    <span>Capas ↓</span>
                  </div>
                  {horizontes.map((h) => (
                    <div
                      key={h.id}
                      className="text-white text-[12px] md:text-sm font-bold flex items-center justify-center p-2 text-center"
                      style={{ backgroundColor: h.color }}
                    >
                      {h.label}
                    </div>
                  ))}
                </div>

                {/* Filas de capas */}
                {capas.map((capa) => (
                  <div
                    key={capa.id}
                    className="grid border-b border-sena-gray-light last:rounded-b-lg last:border-b-0"
                    style={{
                      gridTemplateColumns: `160px repeat(${horizontes.length}, 1fr)`,
                    }}
                  >
                    {/* Etiqueta de capa */}
                    <div
                      className="flex items-center p-3 text-sm font-bold"
                      style={{
                        color: capa.color,
                        borderLeft: `5px solid ${capa.color}`,
                        backgroundColor: `${capa.color}0d`,
                      }}
                    >
                      {capa.label}
                    </div>

                    {/* Celdas por horizonte */}
                    {horizontes.map((h) => {
                      const cellItems =
                        itemsByCell.get(`${capa.id}|${h.id}`) ?? [];
                      return (
                        <div
                          key={h.id}
                          className="p-1.5 space-y-1.5 border-l border-sena-gray-light min-h-[68px]"
                          style={{ backgroundColor: `${h.color}08` }}
                        >
                          {cellItems.map((it, idx) => (
                            <ItemCard
                              key={idx}
                              item={it}
                              horizonteColor={h.color}
                            />
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Leyendas */}
            <aside className="xl:w-56 flex-none flex flex-row flex-wrap xl:flex-col gap-x-8 gap-y-4">
              <LegendBlock title="CAPAS">
                {capas.map((c) => (
                  <LegendRow key={c.id} color={c.color} label={c.label} />
                ))}
              </LegendBlock>
              <LegendBlock title="MADUREZ (TRL)">
                {madurezNiveles.map((m) => (
                  <LegendRow key={m.id} color={m.color} label={m.label} />
                ))}
              </LegendBlock>
              <LegendBlock title="HORIZONTE">
                {horizontes.map((h) => (
                  <LegendRow key={h.id} color={h.color} label={h.label} />
                ))}
              </LegendBlock>
            </aside>
          </div>

          {/* Notas metodológicas */}
          <div className="space-y-1.5 pt-2">
            {notas.filter(Boolean).map((n, i) => (
              <p
                key={i}
                className="text-[11px] leading-relaxed text-sena-gray-dark/80"
              >
                {n}
              </p>
            ))}
          </div>

          {/* Glosario (colapsable) */}
          <div className="border-t border-sena-gray-light pt-3">
            <button
              onClick={() => setShowGlosario((v) => !v)}
              className="text-[11px] font-bold tracking-wider text-sena-gray-dark/70 uppercase hover:text-sena-blue transition-colors"
            >
              {showGlosario ? "▾" : "▸"} Glosario de siglas y acrónimos (
              {glosario.length})
            </button>
            {showGlosario && (
              <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5">
                {glosario.map((g) => (
                  <div key={g.sigla} className="text-[11px] leading-snug">
                    <dt className="inline font-bold text-sena-blue">
                      {g.sigla}:
                    </dt>{" "}
                    <dd className="inline text-sena-gray-dark">{g.definicion}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {/* Fuentes */}
          <div className="pt-3 border-t border-sena-gray-light">
            <h4 className="text-[11px] font-bold tracking-wider text-sena-gray-dark/70 uppercase mb-2">
              Fuentes
            </h4>
            <ul className="space-y-1.5">
              {fuentes.map((f, i) => (
                <li
                  key={i}
                  className="text-[11px] leading-relaxed text-sena-gray-dark"
                >
                  {f.text}
                  {f.url && (
                    <>
                      {" "}
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sena-green-dark underline break-all hover:text-sena-green"
                      >
                        {f.url}
                      </a>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Sub-componentes de leyenda ────────────────────────────────

function LegendBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-[11px] font-bold tracking-wider text-sena-gray-dark/70 uppercase">
        {title}
      </h4>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-3.5 w-3.5 rounded-sm flex-none"
        style={{ backgroundColor: color }}
      />
      <span className="text-[12px] text-sena-gray-dark">{label}</span>
    </div>
  );
}
