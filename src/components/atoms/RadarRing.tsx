// ═══════════════════════════════════════════════════════════════
// RadarRing — Átomo SVG: un anillo concéntrico del radar.
// Renderiza exactamente un <circle> con los valores de RingGeometry.
// Sin estado, sin lógica de negocio.
// ═══════════════════════════════════════════════════════════════

import type { RadarRingProps } from "@/types/radar-render.types";

/**
 * Renderiza un anillo concéntrico del radar como círculo SVG.
 * El fill y stroke vienen del RingData embebido en la geometría.
 *
 * Nota de renderizado: los anillos deben dibujarse de mayor a menor
 * radio (el padre itera en orden inverso) para que los más pequeños
 * queden visualmente encima.
 */
export function RadarRing({ geometry, cx, cy }: RadarRingProps) {
  const { ring, outerRadius } = geometry;

  return (
    <circle
      cx={cx}
      cy={cy}
      r={outerRadius}
      fill={ring.fillColor}
      stroke={ring.borderColor}
      strokeWidth={1.5}
      opacity={0.9}
    />
  );
}
