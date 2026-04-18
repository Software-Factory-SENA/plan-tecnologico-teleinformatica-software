// ═══════════════════════════════════════════════════════════════
// CAPA DE LAYOUT — Valores calculados por el motor de geometría.
// Ninguno de estos campos existe en el JSON; todos son derivados.
// ═══════════════════════════════════════════════════════════════

import type { SectorData, RingData, TechnologyData, AreaData } from "./radar-data.types";

/**
 * Geometría calculada para un Área Tecnológica (sub-sector).
 * El espacio angular es proporcional al número de Tendencias del área
 * respecto al total del Direccionador que la contiene.
 */
export interface AreaGeometry {
  area: AreaData;
  /** Ángulo de inicio en grados (dentro del sector padre) */
  startAngle: number;
  /** Ángulo de fin en grados */
  endAngle: number;
  /** Centro angular del área = (startAngle + endAngle) / 2 */
  midAngle: number;
  /** Amplitud angular proporcional al conteo de tecnologías */
  areaAngle: number;
  /** Índice del sector padre (para lookup de color y filtrado) */
  sectorIndex: number;
}

/** Geometría calculada para un sector (rebanada angular) */
export interface SectorGeometry {
  sector: SectorData;
  /** Ángulo de inicio en grados, calculado automáticamente */
  startAngle: number;
  /** Ángulo de fin en grados */
  endAngle: number;
  /** Centro angular del sector = (startAngle + endAngle) / 2 */
  midAngle: number;
  /** Amplitud angular = 360 / totalSectores */
  sectorAngle: number;
}

/** Geometría calculada para un anillo (banda circular) */
export interface RingGeometry {
  ring: RingData;
  /** Radio interior: 0 para el anillo 0, radio del anillo anterior para los demás */
  innerRadius: number;
  /** Radio exterior = ring.radius */
  outerRadius: number;
  /** Punto medio radial = (innerRadius + outerRadius) / 2 — fórmula consistente */
  midRadius: number;
}

/** Posición y metadatos de layout calculados para una tecnología */
export interface TechnologyLayout {
  tech: TechnologyData;
  /** Índice numérico del sector (resuelto desde tech.sector string) */
  sectorIndex: number;
  /** Índice numérico del anillo (resuelto desde tech.ring string) */
  ringIndex: number;
  /** Ángulo final en grados, distribuido automáticamente (sin angleOff manual) */
  computedAngle: number;
  /** Radio desde el centro = RingGeometry.midRadius */
  radius: number;
  /** Coordenada X en el SVG */
  x: number;
  /** Coordenada Y en el SVG */
  y: number;
  /** Líneas de texto calculadas automáticamente por textWrapper */
  labelLines: string[];
  /** Desplazamiento vertical de la etiqueta desde el punto, calculado */
  labelOffsetY: number;
}

/** Estructura completa del layout calculado para renderizar el radar */
export interface RadarLayout {
  sectors: SectorGeometry[];
  /**
   * Geometrías de Áreas Tecnológicas.
   * Array vacío cuando el JSON no define `areas`.
   */
  areas: AreaGeometry[];
  rings: RingGeometry[];
  technologies: TechnologyLayout[];
  svgWidth: number;
  svgHeight: number;
  centerX: number;
  centerY: number;
}
