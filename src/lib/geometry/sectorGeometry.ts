// ═══════════════════════════════════════════════════════════════
// GEOMETRÍA DE SECTORES — Calcula ángulos automáticamente.
// FIX Defecto 9: startAngle = rotationOffset + (360/n) * index
// Elimina los startAngles hardcodeados del JSON.
// ═══════════════════════════════════════════════════════════════

import type { SectorData } from "@/types/radar-data.types";
import type { SectorGeometry } from "@/types/radar-layout.types";
import { polarToXY } from "./polarCoords";

/**
 * Calcula la geometría angular de cada sector.
 *
 * Modo igual (por defecto): ángulos derivados de 360/N × index:
 *   startAngle = rotationOffset + (360 / n) × sector.index
 *
 * Modo proporcional (cuando `techCountBySectorId` está definido):
 *   sectorAngle_i = 360 × (count_i / total)
 *   startAngle_i  = rotationOffset + Σ(sectorAngle_j, j < i)
 *
 * @param sectors             - Array de SectorData del JSON (puede llegar en cualquier orden)
 * @param rotationOffset      - Rotación global en grados (ej: -18 para centrar D1 arriba)
 * @param techCountBySectorId - Conteo de tecnologías por sector.id. Cuando se pasa,
 *                              activa la asignación proporcional de ángulos.
 * @returns Array de SectorGeometry ordenado por index ascendente
 */
export function computeSectorGeometries(
  sectors: SectorData[],
  rotationOffset: number,
  techCountBySectorId?: Map<string, number>,
): SectorGeometry[] {
  if (sectors.length === 0) return [];

  // Ordenar por index ascendente (defensivo)
  const sorted = [...sectors].sort((a, b) => a.index - b.index);

  if (techCountBySectorId && techCountBySectorId.size > 0) {
    // ── Modo proporcional ────────────────────────────────────
    const total = Array.from(techCountBySectorId.values()).reduce(
      (sum, n) => sum + n,
      0,
    );

    if (total > 0) {
      const result: SectorGeometry[] = [];
      let currentAngle = rotationOffset;

      for (const sector of sorted) {
        const count = techCountBySectorId.get(sector.id) ?? 0;
        // Cada sector con 0 tecnologías recibe un ángulo mínimo de 5°
        // para mantener visibilidad aunque esté vacío.
        const sectorAngle =
          count > 0 ? 360 * (count / total) : 5;
        const startAngle = currentAngle;
        const endAngle = startAngle + sectorAngle;
        const midAngle = startAngle + sectorAngle / 2;

        result.push({ sector, startAngle, endAngle, midAngle, sectorAngle });
        currentAngle = endAngle;
      }
      return result;
    }
  }

  // ── Modo igual (defecto) ─────────────────────────────────
  const n = sectors.length;
  const sectorAngle = 360 / n;

  return sorted.map((sector) => {
    const startAngle = rotationOffset + sectorAngle * sector.index;
    const endAngle = startAngle + sectorAngle;
    const midAngle = startAngle + sectorAngle / 2;
    return { sector, startAngle, endAngle, midAngle, sectorAngle };
  });
}

/**
 * Calcula el punto extremo de la línea divisoria de un sector.
 * Usado por SectorDivider para trazar la línea desde el centro
 * hasta el borde exterior del radar en el ángulo startAngle.
 *
 * @param cx - Centro X del radar
 * @param cy - Centro Y del radar
 * @param outerRadius - Radio del anillo más exterior
 * @param startAngle - Ángulo de inicio del sector en grados
 */
export function getSectorDividerEndpoint(
  cx: number,
  cy: number,
  outerRadius: number,
  startAngle: number,
): { x: number; y: number } {
  return polarToXY(cx, cy, outerRadius, startAngle);
}
