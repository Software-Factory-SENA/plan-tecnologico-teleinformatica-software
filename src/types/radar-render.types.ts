// ═══════════════════════════════════════════════════════════════
// CAPA DE RENDER — Props para componentes React/SVG.
// Ningún componente importa tipos de las otras dos capas
// directamente; usa exclusivamente estas interfaces.
// ═══════════════════════════════════════════════════════════════

import type { CSSProperties } from "react";
import type {
  RingData,
  SectorData,
  RadarMeta,
  ExcludedTechnology,
} from "./radar-data.types";
import type {
  TechnologyLayout,
  RadarLayout,
  SectorGeometry,
  RingGeometry,
} from "./radar-layout.types";

// ── Filtros ──────────────────────────────────────────────────

export interface ActiveFilters {
  /** Índices de sectores activos */
  sectors: Set<number>;
  /** Índices de anillos activos */
  rings: Set<number>;
}

// ── Átomos ───────────────────────────────────────────────────

export interface RadarDotProps {
  layout: TechnologyLayout;
  sectorColor: string;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHover: (hovered: boolean) => void;
}

export interface RadarRingProps {
  geometry: RingGeometry;
  cx: number;
  cy: number;
}

export interface RingLabelProps {
  ring: RingData;
  geometry: RingGeometry;
  cx: number;
  cy: number;
  isActive: boolean;
}

export interface SectorDividerProps {
  geometry: SectorGeometry;
  cx: number;
  cy: number;
  outerRadius: number;
  /** Patrón SVG strokeDasharray, por defecto "4 6" */
  dashArray?: string;
}

export interface TechLabelProps {
  lines: string[];
  x: number;
  y: number;
  offsetY: number;
  isActive: boolean;
  color: string;
}

// ── Moléculas ────────────────────────────────────────────────

export interface TechMarkerProps {
  layout: TechnologyLayout;
  sectorColor: string;
  isSelected: boolean;
  isHovered: boolean;
  animationStyle: CSSProperties;
  onSelect: () => void;
  onHover: (hovered: boolean) => void;
}

export interface SectorLabelProps {
  geometry: SectorGeometry;
  cx: number;
  cy: number;
  outerRadius: number;
  isActive: boolean;
}

export interface FilterPanelProps {
  sectors: SectorData[];
  rings: RingData[];
  filters: ActiveFilters;
  filteredCount: number;
  totalCount: number;
  onToggleSector: (index: number) => void;
  onToggleRing: (index: number) => void;
  onReset: () => void;
}

// ── Organismos ───────────────────────────────────────────────

export interface RadarSVGProps {
  layout: RadarLayout;
  /** IDs de tecnologías visibles según filtros activos */
  filteredTechIds: Set<string>;
  selectedTechId: string | null;
  hoveredTechId: string | null;
  activeSectors: Set<number>;
  activeRings: Set<number>;
  meta: Pick<RadarMeta, "title" | "source" | "authors">;
  onSelectTech: (id: string | null) => void;
  onHoverTech: (id: string | null) => void;
}

export interface RadarLegendProps {
  rings: RingData[];
  sectors: SectorData[];
}

export interface TechDetailProps {
  layout: TechnologyLayout | null;
  rings: RingData[];
  sectors: SectorData[];
  onClose: () => void;
}

export interface NomenclatureTableProps {
  layout: RadarLayout;
  filteredTechIds: Set<string>;
  selectedTechId: string | null;
  excludedTechnologies: ExcludedTechnology[];
  onSelect: (id: string | null) => void;
}

export interface HeaderProps {
  meta: RadarMeta;
  rings: RingData[];
}
