"use client";

// ═══════════════════════════════════════════════════════════════
// RadarLegend — Organismo React: leyenda de anillos y sectores.
// Controlled component: todo viene de props (sin imports legacy).
// ═══════════════════════════════════════════════════════════════

import type { RadarLegendProps } from "@/types/radar-render.types";

/**
 * Leyenda visual del radar: muestra descripción de cada anillo
 * (fase de adopción) y cada sector (direccionador).
 *
 * Completamente parametrizable: no hardcodea nombres, colores ni
 * descripciones — todo proviene del JSON de configuración.
 */
export function RadarLegend({ rings, sectors }: RadarLegendProps) {
  return (
    <div className="border rounded-xl bg-card p-4 space-y-4 text-sm">

      {/* ── Anillos ────────────────────────────────────────── */}
      <div>
        <h4 className="font-bold text-xs uppercase tracking-wider text-foreground/80 mb-2.5">
          Anillos (fase de adopción)
        </h4>
        <div className="space-y-1.5">
          {rings.map((ring) => (
            <div key={ring.id} className="flex items-center gap-3">
              <span
                className="w-6 h-4 rounded-sm flex-shrink-0 border"
                style={{
                  backgroundColor: ring.fillColor,
                  borderColor: ring.borderColor,
                }}
              />
              <span className="text-xs">
                <strong style={{ color: ring.labelColor }}>{ring.label}</strong>
                <span className="text-muted-foreground"> — {ring.desc}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Sectores ───────────────────────────────────────── */}
      <div className="border-t pt-3">
        <h4 className="font-bold text-xs uppercase tracking-wider text-foreground/80 mb-2.5">
          Sectores (Direccionadores)
        </h4>
        <div className="space-y-1.5">
          {sectors.map((sector) => (
            <div key={sector.id} className="flex items-center gap-3">
              <span
                className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: sector.color }}
              />
              <span className="text-xs">
                <strong style={{ color: sector.color }}>{sector.id}:</strong>{" "}
                <span className="text-muted-foreground">{sector.label}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
