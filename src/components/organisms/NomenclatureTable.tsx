"use client";

// ═══════════════════════════════════════════════════════════════
// NomenclatureTable — Organismo React: tabla de nomenclaturas.
// Agrupa tecnologías por sector y las filtra por filteredTechIds.
// Acepta RadarLayout: sin imports de la capa legacy.
// ═══════════════════════════════════════════════════════════════

import type { NomenclatureTableProps } from "@/types/radar-render.types";

/**
 * Lista compacta de tecnologías agrupadas por sector (Direccionador).
 *
 * - Solo muestra tecnologías cuyo ID esté en filteredTechIds
 * - El click en una fila selecciona/deselecciona la tecnología
 * - Las tecnologías excluidas aparecen en una sección al final
 * - Completamente parametrizable: colores e iconos vienen del JSON
 */
export function NomenclatureTable({
  layout,
  filteredTechIds,
  selectedTechId,
  excludedTechnologies,
  onSelect,
}: NomenclatureTableProps) {
  const { sectors, rings, technologies } = layout;

  // Mapa rápido: ringIndex → RingData (para mostrar label del anillo)
  const ringMap = new Map(rings.map((rg) => [rg.ring.index, rg.ring]));

  // Agrupar tecnologías visibles por sector
  const grouped = sectors
    .map((sectorGeom) => ({
      sector: sectorGeom.sector,
      techs: technologies
        .filter(
          (tl) =>
            tl.sectorIndex === sectorGeom.sector.index &&
            filteredTechIds.has(tl.tech.id),
        )
        .sort((a, b) => a.ringIndex - b.ringIndex),
    }))
    .filter((g) => g.techs.length > 0);

  return (
    <div className="space-y-2">
      {grouped.map(({ sector, techs }) => (
        <div key={sector.id}>
          {/* Cabecera de sector */}
          <div
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-md mb-1 border-l-[3px]"
            style={{
              backgroundColor: sector.bgDark,
              borderLeftColor: sector.color,
            }}
          >
            <span className="text-xs">{sector.icon}</span>
            <span
              className="text-[10px] font-bold truncate"
              style={{ color: sector.color }}
            >
              {sector.id}: {sector.label}
            </span>
          </div>

          {/* Filas de tecnologías */}
          <div className="space-y-px">
            {techs.map((tl) => {
              const isSelected = tl.tech.id === selectedTechId;
              const ring = ringMap.get(tl.ringIndex);
              const dotColor = ring?.labelColor ?? "#888";

              return (
                <button
                  key={tl.tech.id}
                  onClick={() => onSelect(isSelected ? null : tl.tech.id)}
                  className={[
                    "w-full flex items-start gap-2 px-2 py-1.5 rounded-md text-left",
                    "transition-all duration-150 border",
                    isSelected
                      ? "bg-accent/50 border-border shadow-sm"
                      : "bg-transparent border-transparent hover:bg-muted/50",
                  ].join(" ")}
                  aria-pressed={isSelected}
                >
                  {/* Dot de color del anillo */}
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                    style={{ backgroundColor: dotColor }}
                  />

                  {/* Código */}
                  <span
                    className="text-[9px] font-mono font-bold w-6 flex-shrink-0 mt-0.5"
                    style={{ color: sector.color }}
                  >
                    {tl.tech.code}
                  </span>

                  {/* Nombre — multilínea */}
                  <span className="text-[11px] font-medium flex-1 leading-tight">
                    {tl.tech.name}
                  </span>

                  {/* Fase (anillo) — solo en pantallas anchas */}
                  {ring && (
                    <span className="text-[8px] font-semibold px-1 py-0.5 rounded bg-muted text-muted-foreground flex-shrink-0 hidden xl:inline self-start mt-0.5">
                      {ring.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* ── Tecnologías excluidas ─────────────────────────── */}
      {excludedTechnologies.length > 0 && (
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md mb-1 bg-muted/50">
            <span className="text-xs">🚫</span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              No Graficadas / Excluidas
            </span>
          </div>
          <div className="space-y-2 px-2">
            {excludedTechnologies.map((item) => (
              <div
                key={item.code}
                className="text-[10px] text-muted-foreground bg-muted/30 p-2 rounded border border-border/50"
              >
                <div className="font-bold flex items-center gap-2 mb-1">
                  <span className="font-mono">{item.code}</span>
                  <span>{item.name}</span>
                </div>
                <div className="text-[9px] italic mb-1.5 opacity-80">
                  {item.justification}
                </div>
                <ul className="list-disc list-inside space-y-0.5 opacity-70">
                  {item.sublines.map((sub, i) => (
                    <li key={i} className="text-[9px] pl-1 leading-tight">
                      {sub}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
