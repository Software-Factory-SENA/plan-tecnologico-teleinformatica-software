// ═══════════════════════════════════════════════════════════════
// AreaDivider — Línea divisoria entre Áreas Tecnológicas.
// Más fina y sutil que SectorDivider. Se traza en el startAngle
// de cada área (excepto el primero que coincide con el sector).
// ═══════════════════════════════════════════════════════════════

import { polarToXY } from "@/lib/geometry/polarCoords";
import type { AreaGeometry } from "@/types/radar-layout.types";

interface AreaDividerProps {
  geometry: AreaGeometry;
  cx: number;
  cy: number;
  outerRadius: number;
  innerRadius: number;
  /** Color del trazo — por defecto gris neutro translúcido */
  color?: string;
}

/**
 * Traza una línea fina punteada desde `innerRadius` hasta `outerRadius`
 * en el `startAngle` del área, indicando el límite entre áreas contiguas.
 *
 * Propiedades visuales:
 *  - stroke 0.6px (vs 1px de SectorDivider)
 *  - strokeDasharray "3 5" (más corto y espaciado)
 *  - strokeOpacity 0.45 (sutil, no compite con el divisor de sector)
 *  - No se renderiza para la primera área del sector (coincide con el borde)
 */
export function AreaDivider({
  geometry,
  cx,
  cy,
  outerRadius,
  innerRadius,
  color = "#666666",
}: AreaDividerProps) {
  const inner = polarToXY(cx, cy, innerRadius, geometry.startAngle);
  const outer = polarToXY(cx, cy, outerRadius, geometry.startAngle);

  return (
    <line
      x1={inner.x}
      y1={inner.y}
      x2={outer.x}
      y2={outer.y}
      stroke={color}
      strokeWidth={0.6}
      strokeDasharray="3 5"
      strokeOpacity={0.45}
      strokeLinecap="round"
      style={{ pointerEvents: "none" }}
    />
  );
}
