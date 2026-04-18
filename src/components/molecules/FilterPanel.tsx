"use client";

// ═══════════════════════════════════════════════════════════════
// FilterPanel — Molécula React: panel de filtros por sector y anillo.
// Extraído de RadarTemplate.tsx (líneas 567-693).
// Responsabilidad única: renderizar controles de filtrado.
// Sin estado propio — todo viene de props (controlled component).
// ═══════════════════════════════════════════════════════════════

import { Filter } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toTitleCase } from "@/lib/text/titleCase";
import type { FilterPanelProps } from "@/types/radar-render.types";

/**
 * Panel de filtros interactivo para sectores (Direccionadores) y anillos
 * (Fase de Adopción). Controlled component: no tiene estado propio.
 *
 * Comportamiento de los botones:
 * - Click en sector/anillo activo → lo desactiva (min 1 siempre activo,
 *   lógica gestionada en useFilters).
 * - Click en sector/anillo inactivo → lo activa.
 * - Botón reset → restablece todos los filtros.
 *
 * Diseño fiel al sidebar original de RadarTemplate, generalizado
 * para cualquier dominio (no hardcodea nombres ni colores).
 */
export function FilterPanel({
  sectors,
  rings,
  filters,
  filteredCount,
  totalCount,
  onToggleSector,
  onToggleRing,
  onReset,
}: FilterPanelProps) {
  return (
    <div className="space-y-4">

      {/* ── Sectores / Direccionadores ─────────────────────── */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Filter className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Direccionadores
          </span>
        </div>

        {sectors.map((sector) => {
          const isOn = filters.sectors.has(sector.index);
          const sectorName = toTitleCase(sector.label);
          return (
            <button
              key={sector.id}
              onClick={() => onToggleSector(sector.index)}
              className={[
                "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg mb-1",
                "transition-all duration-150 text-left border-l-[3px]",
                isOn
                  ? "bg-accent/30 border-l-current"
                  : "bg-transparent border-l-transparent opacity-40 hover:opacity-60",
              ].join(" ")}
              style={{ color: sector.color }}
              aria-pressed={isOn}
              title={`${isOn ? "Ocultar" : "Mostrar"} ${sector.id}: ${sectorName}`}
            >
              <span className="text-xs" aria-hidden="true">
                {sector.icon}
              </span>
              <span className="text-[11px] font-medium flex-1 leading-tight">
                {sectorName}
              </span>
            </button>
          );
        })}
      </div>

      <Separator />

      {/* ── Anillos / Fase de Adopción ─────────────────────── */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">
          Fase de Adopción
        </span>

        {rings.map((ring) => {
          const isOn = filters.rings.has(ring.index);
          return (
            <button
              key={ring.id}
              onClick={() => onToggleRing(ring.index)}
              className={[
                "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg mb-1",
                "transition-all duration-150 text-left",
                isOn ? "bg-muted" : "opacity-35 hover:opacity-50",
              ].join(" ")}
              aria-pressed={isOn}
              title={`${isOn ? "Ocultar" : "Mostrar"} ${ring.label} (${ring.trlLabel})`}
            >
              {/* Swatch de color del anillo */}
              <span
                className="w-4 h-3 rounded-sm flex-shrink-0 border"
                aria-hidden="true"
                style={{
                  backgroundColor: ring.fillColor,
                  borderColor: ring.borderColor,
                  opacity: isOn ? 1 : 0.3,
                }}
              />
              <span
                className="text-[11px] font-medium flex-1"
                style={{ color: isOn ? ring.labelColor : undefined }}
              >
                {ring.label}
              </span>
              <span className="text-[8px] text-muted-foreground font-mono">
                {ring.trlLabel}
              </span>
            </button>
          );
        })}
      </div>

      <Separator />

      {/* ── Contador + Reset ───────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground">
          <span className="font-semibold text-foreground">{filteredCount}</span>
          {" / "}
          {totalCount} tecnologías
        </p>

        {filteredCount < totalCount && (
          <button
            onClick={onReset}
            className="text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
            title="Mostrar todas las tecnologías"
          >
            Restablecer
          </button>
        )}
      </div>
    </div>
  );
}
