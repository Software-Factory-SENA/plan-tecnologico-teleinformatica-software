// ═══════════════════════════════════════════════════════════════
// GEOMETRÍA DE ANILLOS — Calcula radios interior, exterior y medio.
// FIX Defecto 5: fórmula consistente (innerRadius+outerRadius)/2
// para todos los anillos, incluyendo el anillo 0.
// ═══════════════════════════════════════════════════════════════

import type { RingData } from "@/types/radar-data.types";
import type { RingGeometry } from "@/types/radar-layout.types";

/**
 * Calcula la geometría de cada anillo a partir de su configuración.
 *
 * El radio interior del anillo 0 siempre es 0 (el centro del radar).
 * El radio interior de cada anillo siguiente es el radio exterior del anterior.
 * El punto medio se calcula como (innerRadius + outerRadius) / 2 en todos los casos.
 *
 * Valores para telecomunicaciones_CD.json:
 *   adopt   → inner=0,   outer=110, mid=55    (antes: 110*0.55=60.5)
 *   trial   → inner=110, outer=210, mid=160
 *   assess  → inner=210, outer=305, mid=257.5
 *   monitor → inner=305, outer=400, mid=352.5
 *
 * @param rings - Array de RingData del JSON (puede estar en cualquier orden)
 * @returns Array de RingGeometry ordenado por index ascendente
 */
export function computeRingGeometries(rings: RingData[]): RingGeometry[] {
  if (rings.length === 0) return [];

  // Ordenar por index ascendente (defensivo: el JSON puede llegar en cualquier orden)
  const sorted = [...rings].sort((a, b) => a.index - b.index);

  return sorted.map((ring, i) => {
    const innerRadius = i === 0 ? 0 : sorted[i - 1].radius;
    const outerRadius = ring.radius;
    const midRadius = (innerRadius + outerRadius) / 2;

    return {
      ring,
      innerRadius,
      outerRadius,
      midRadius,
    };
  });
}
