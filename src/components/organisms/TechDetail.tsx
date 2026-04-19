"use client";

// ═══════════════════════════════════════════════════════════════
// TechDetail — Organismo React: panel de detalle de una tecnología.
// Sin imports de la capa legacy. Usa ring.action del JSON de config
// en lugar del array RING_ACTIONS hardcodeado (FIX Defecto acción).
// ═══════════════════════════════════════════════════════════════

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Target, Gauge, Lightbulb } from "lucide-react";
import type { TechDetailProps } from "@/types/radar-render.types";

/**
 * Muestra el detalle completo de una tecnología seleccionada.
 *
 * Estado idle (layout=null):
 *   Prompt visual para seleccionar un punto del radar.
 *
 * Estado activo (layout!=null):
 *   - Cabecera con sector, código y nombre
 *   - Barra TRL con gradiente de color del anillo
 *   - Descripción, metadatos (fase, impacto, horizonte, madurez)
 *   - Acción recomendada (ring.action — viene del JSON, no hardcodeado)
 */
export function TechDetail({ layout, rings, sectors, onClose: _onClose }: TechDetailProps) {
  if (!layout) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Target className="w-7 h-7 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-base mb-2">Selecciona una tecnología</h3>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-[220px]">
          Haz clic en un punto del radar o en la tabla de nomenclaturas para ver
          detalles, madurez (TRL) y recomendaciones.
        </p>

        {/* Vista rápida de anillos */}
        <div className="grid grid-cols-2 gap-2 w-full mt-6">
          {rings.map((ring) => (
            <div key={ring.id} className="rounded-lg bg-muted p-3 text-center">
              <p
                className="text-[10px] font-bold truncate"
                style={{ color: ring.labelColor }}
              >
                {ring.label}
              </p>
              <p className="text-[9px] text-muted-foreground font-mono mt-0.5">
                {ring.trlLabel}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { tech, ringIndex, sectorIndex } = layout;
  const ring = rings.find((r) => r.index === ringIndex);
  const sector = sectors.find((s) => s.index === sectorIndex);
  const trlColor = ring?.labelColor ?? "#888888";

  return (
    <div className="p-4 space-y-4 animate-fade-in">

      {/* ── Cabecera sector + código + nombre ──────────────── */}
      <div
        className="rounded-xl p-4 border-l-4"
        style={{
          backgroundColor: sector?.bgDark ?? "#f5f5f5",
          borderLeftColor: sector?.color ?? "#888888",
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{sector?.icon}</span>
          <Badge
            className="text-[10px]"
            style={{
              backgroundColor: `${sector?.color ?? "#888"}20`,
              color: sector?.color ?? "#888",
              borderColor: `${sector?.color ?? "#888"}30`,
            }}
          >
            {tech.code}
          </Badge>
        </div>
        <h3 className="font-bold text-base leading-tight">{tech.name}</h3>
        <p className="text-[11px] text-muted-foreground mt-1">{sector?.label}</p>
      </div>

      {/* ── Barra TRL ──────────────────────────────────────── */}
      <Card className="border-0 bg-muted">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Nivel de TRL
              </span>
            </div>
            <span className="text-xs font-bold" style={{ color: trlColor }}>
              {ring?.trlLabel ?? `TRL ${tech.trl}`}
            </span>
          </div>
          <div className="h-2 rounded-full bg-background overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(tech.trl / 9) * 100}%`,
                background: `linear-gradient(90deg, #4FC3F7, ${trlColor})`,
              }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[9px] text-muted-foreground">TRL 1</span>
            <span className="text-sm font-bold" style={{ color: trlColor }}>
              TRL {tech.trl}
            </span>
            <span className="text-[9px] text-muted-foreground">TRL 9</span>
          </div>
        </CardContent>
      </Card>

      {/* ── Sublíneas ──────────────────────────────────────── */}
      {tech.sublines && tech.sublines.length > 0 && (
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
            Sublíneas
          </span>
          <ul className="space-y-1.5">
            {tech.sublines.map((sub) => (
              <li
                key={sub.id}
                className="flex gap-2 text-xs leading-relaxed"
              >
                <span
                  className="font-mono text-[10px] font-semibold flex-shrink-0 mt-0.5"
                  style={{ color: sector?.color ?? "#888888" }}
                >
                  {sub.id}
                </span>
                <span className="text-muted-foreground">{sub.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Metadatos ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Fase", value: ring?.label ?? "—", color: trlColor },
          { label: "Impacto", value: tech.impact, color: "#00304d" },
          { label: "Horizonte", value: tech.horizon, color: "#007832" },
          { label: "Madurez", value: `TRL ${tech.trl}`, color: trlColor },
        ].map((item) => (
          <div key={item.label} className="rounded-lg bg-muted p-2.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">
              {item.label}
            </span>
            <span
              className="text-xs font-semibold mt-0.5 block"
              style={{ color: item.color }}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>

      <Separator />

      {/* ── Acción recomendada (desde ring.action en el JSON) ── */}
      {ring?.action && (
        <div className="rounded-xl p-3 bg-muted border border-border/50">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-yellow-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/80">
              Acción Recomendada
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {ring.action}
          </p>
        </div>
      )}
    </div>
  );
}
