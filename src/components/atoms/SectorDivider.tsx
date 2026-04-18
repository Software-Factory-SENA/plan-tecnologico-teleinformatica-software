// ═══════════════════════════════════════════════════════════════
// SectorDivider — Átomo SVG: línea divisoria entre sectores.
// FIX Defecto 3: reemplaza 20 <line> manuales por 1 <line> con
// strokeDasharray nativo de SVG. Reduce 100 elementos DOM → 5.
// ═══════════════════════════════════════════════════════════════

import { getSectorDividerEndpoint } from "@/lib/geometry/sectorGeometry";
import type { SectorDividerProps } from "@/types/radar-render.types";

/**
 * Renderiza la línea divisoria al inicio de un sector del radar.
 *
 * Solución (FIX Defecto 3):
 * El código legacy generaba 20 segmentos <line> por sector (40 iteraciones,
 * dibujando solo los pares) para simular un punteado. SVG tiene soporte
 * nativo para esto con strokeDasharray. Un solo elemento reemplaza 20.
 *
 * Antes: 40 iteraciones × 5 sectores = 200 <line> (100 visibles)
 * Ahora: 1 <line> × 5 sectores = 5 elementos
 *
 * @param dashArray - Patrón SVG "trazo espacio" (default "4 6")
 */
export function SectorDivider({
  geometry,
  cx,
  cy,
  outerRadius,
  dashArray = "4 6",
}: SectorDividerProps) {
  const endpoint = getSectorDividerEndpoint(cx, cy, outerRadius, geometry.startAngle);

  return (
    <line
      x1={cx}
      y1={cy}
      x2={endpoint.x}
      y2={endpoint.y}
      stroke="#9e9e9e"
      strokeWidth={0.8}
      strokeDasharray={dashArray}
      opacity={0.5}
    />
  );
}
