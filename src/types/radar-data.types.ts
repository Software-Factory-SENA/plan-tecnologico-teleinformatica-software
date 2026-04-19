// ═══════════════════════════════════════════════════════════════
// CAPA DE DATOS — Interfaces que mapean 1:1 con el JSON de config
// Sin preocupaciones de renderizado, sin valores calculados.
// angleOff, nameLines, labelDy, startAngle NO existen aquí.
// ═══════════════════════════════════════════════════════════════

export interface RadarMeta {
  id: string;
  domain: string;
  title: string;
  subtitle: string;
  description: string;
  version: string;
  year: string;
  organization: string;
  authors: string[];
  methodology: string;
  source: string;
  locale: string;
}

export interface RadarTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
}

export interface RadarLayoutConfig {
  svgWidth: number;
  svgHeight: number;
  centerX: number;
  centerY: number;
  /** Rotación global del radar en grados. -18 centra D1 en la parte superior */
  sectorRotationOffset: number;
  /**
   * Modo de asignación de ángulos a los Direccionadores.
   * - "equal"        → cada sector recibe 360/N grados (defecto)
   * - "proportional" → cada sector recibe 360 × (techCount / total) grados
   *
   * Usar "proportional" cuando los sectores tienen conteos muy distintos
   * para evitar saturación en sectores con muchas tecnologías.
   */
  sectorAllocation?: "equal" | "proportional";
}

export interface TrlRange {
  min: number;
  max: number;
}

export interface TrlLevel {
  range: [number, number];
  label: string;
  title: string;
  color: string;
}

export interface TrlConfig {
  scale: { min: number; max: number };
  levels: TrlLevel[];
}

export interface RingData {
  /** Identificador único, ej: "adopt" */
  id: string;
  /** Posición desde el centro: 0 = más cercano */
  index: number;
  label: string;
  shortLabel: string;
  /** Radio exterior del anillo en píxeles SVG */
  radius: number;
  color: string;
  fillColor: string;
  borderColor: string;
  labelColor: string;
  desc: string;
  /** Rango de TRL esperado para tecnologías en este anillo */
  trlRange: TrlRange;
  trlLabel: string;
  /** Texto de acción recomendada para el CEET */
  action: string;
}

export interface SectorData {
  /** Identificador único, ej: "D1" */
  id: string;
  /** Posición en el radar: 0 = primer sector desde rotationOffset */
  index: number;
  label: string;
  shortLabel: string;
  color: string;
  bgLight: string;
  bgDark: string;
  icon: string;
}

/**
 * Área Tecnológica — nivel jerárquico 2 dentro de un Direccionador.
 * Agrupa Líneas Tecnológicas afines. La asignación de espacio angular
 * es proporcional al número de Tendencias (tecnologías) que contiene.
 */
export interface AreaData {
  /** Identificador único, ej: "A1-1" */
  id: string;
  /** Nombre completo del área */
  label: string;
  /** Nombre corto para etiqueta en SVG */
  shortLabel: string;
  /** Referencia al SectorData.id que contiene esta área */
  sector: string;
}

export interface SublineData {
  /** Identificador, ej: "SL01a" */
  id: string;
  /** Nombre completo de la sublínea */
  name: string;
}

export interface TechnologyData {
  /** Identificador único, ej: "T01" */
  id: string;
  /** Código de la línea tecnológica, ej: "L04" */
  code: string;
  name: string;
  /** Referencia al SectorData.id — resuelto por el loader */
  sector: string;
  /** Referencia al AreaData.id — opcional, activa layout jerárquico */
  area?: string;
  /** Referencia al RingData.id — resuelto por el loader */
  ring: string;
  /** Technology Readiness Level (1-9) */
  trl: number;
  desc: string;
  impact: string;
  horizon: string;
  tags?: string[];
  /** Sublíneas estructuradas — usadas en el panel de detalle */
  sublines?: SublineData[];
}

export interface ExcludedTechnology {
  code: string;
  name: string;
  justification: string;
  sublines: string[];
}

/** Configuración completa de un radar — raíz del JSON */
export interface RadarConfig {
  $schema?: string;
  meta: RadarMeta;
  theme: RadarTheme;
  layout: RadarLayoutConfig;
  rings: RingData[];
  sectors: SectorData[];
  /**
   * Áreas Tecnológicas (nivel 2 de jerarquía). Opcional.
   * Cuando está presente, el layout distribuye tecnologías
   * proporcionalmente dentro de cada área en lugar de por sector completo.
   */
  areas?: AreaData[];
  technologies: TechnologyData[];
  excludedTechnologies: ExcludedTechnology[];
  trlConfig: TrlConfig;
}
