// ═══════════════════════════════════════════════════════════════
// GEOMETRÍA DE ÁREAS TECNOLÓGICAS — Sub-sectores proporcionales.
// Cada Área recibe espacio angular proporcional a su conteo de
// Tendencias (tecnologías) dentro del Direccionador padre.
//
// Algoritmo proporcional:
//   areaAngle_i = sectorAngle × (count_i / sectorTotal)
//   startAngle_i = sectorStart + Σ(areaAngle_j, j < i)
//
// Garantías:
//   - La suma de areaAngles = sectorAngle exactamente
//   - Los ángulos respetan el orden de definición en `areas[]`
//   - Un sector sin áreas no genera ninguna AreaGeometry
// ═══════════════════════════════════════════════════════════════

import type { AreaData, TechnologyData } from "@/types/radar-data.types";
import type { AreaGeometry, SectorGeometry } from "@/types/radar-layout.types";

/**
 * Calcula las geometrías angulares de todas las Áreas Tecnológicas.
 *
 * @param areas         - Array de AreaData del JSON (puede llegar en cualquier orden)
 * @param technologies  - Array completo de TechnologyData (para contar por área)
 * @param sectorGeoms   - Geometrías de sectores ya calculadas (para obtener ángulos base)
 * @returns             - Array de AreaGeometry ordenado por sector → posición en sector
 */
export function computeAreaGeometries(
  areas: AreaData[],
  technologies: TechnologyData[],
  sectorGeoms: SectorGeometry[],
): AreaGeometry[] {
  if (areas.length === 0) return [];

  // ── Paso 1: Contar tecnologías por área ──────────────────────
  const areaCount = new Map<string, number>();
  for (const area of areas) {
    areaCount.set(area.id, 0);
  }
  for (const tech of technologies) {
    if (tech.area && areaCount.has(tech.area)) {
      areaCount.set(tech.area, (areaCount.get(tech.area) ?? 0) + 1);
    }
  }

  // ── Paso 2: Agrupar áreas por sector y ordenar por definición ─
  // Usamos Map<sectorId, AreaData[]> preservando el orden del JSON
  const areasBySector = new Map<string, AreaData[]>();
  for (const area of areas) {
    const list = areasBySector.get(area.sector) ?? [];
    list.push(area);
    areasBySector.set(area.sector, list);
  }

  // ── Paso 3: Lookup de sectorGeometry por sectorId ─────────────
  const sectorGeomMap = new Map(sectorGeoms.map((sg) => [sg.sector.id, sg]));

  // ── Paso 4: Calcular AreaGeometry por sector ──────────────────
  const result: AreaGeometry[] = [];

  for (const [sectorId, sectorAreas] of areasBySector.entries()) {
    const sectorGeom = sectorGeomMap.get(sectorId);
    if (!sectorGeom) continue; // área referencia sector inexistente → ignorar

    // Total de tecnologías en este sector (solo las que tienen área asignada)
    const sectorTotal = sectorAreas.reduce(
      (sum, a) => sum + (areaCount.get(a.id) ?? 0),
      0,
    );

    if (sectorTotal === 0) continue; // sector sin tecnologías → omitir

    let currentAngle = sectorGeom.startAngle;
    const sectorAngle = sectorGeom.sectorAngle;

    for (const area of sectorAreas) {
      const count = areaCount.get(area.id) ?? 0;
      if (count === 0) continue; // área vacía → omitir (no genera divisor ni etiqueta)

      const areaAngle = sectorAngle * (count / sectorTotal);
      const startAngle = currentAngle;
      const endAngle = startAngle + areaAngle;
      const midAngle = startAngle + areaAngle / 2;

      result.push({
        area,
        startAngle,
        endAngle,
        midAngle,
        areaAngle,
        sectorIndex: sectorGeom.sector.index,
      });

      currentAngle = endAngle;
    }
  }

  return result;
}
