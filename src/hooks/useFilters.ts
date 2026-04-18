"use client";

// ═══════════════════════════════════════════════════════════════
// useFilters — Estado de filtros por sector y anillo.
// Responsabilidad única: gestionar qué sectores/anillos están activos
// y derivar el Set de IDs de tecnologías visibles.
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback, useMemo } from "react";
import type { RadarConfig } from "@/types/radar-data.types";
import type { RadarLayout } from "@/types/radar-layout.types";
import type { ActiveFilters } from "@/types/radar-render.types";

export interface UseFiltersResult {
  filters: ActiveFilters;
  /** IDs de tecnologías que pasan los filtros activos (para render y animaciones) */
  filteredTechIds: Set<string>;
  /** Número de tecnologías visibles */
  filteredCount: number;
  /** Activa/desactiva un sector. Nunca desactiva el último activo. */
  toggleSector: (index: number) => void;
  /** Activa/desactiva un anillo. Nunca desactiva el último activo. */
  toggleRing: (index: number) => void;
  /** Resetea todos los filtros a "todo activo" */
  resetFilters: () => void;
}

/**
 * Gestiona el estado de filtros del radar (sectores y anillos).
 *
 * Inicializa con todos los sectores y anillos activos.
 * Los filtros se expresan como Sets de índices numéricos
 * (no IDs de string) para ser compatibles con el render SVG actual.
 *
 * @param config - RadarConfig; se usa para inicializar con todos los índices
 * @param layout - RadarLayout; se usa para derivar filteredTechIds
 *
 * @example
 * const { config } = useRadarData("telecomunicaciones")
 * const layout = useLayout(config)
 * const { filters, toggleSector, filteredTechIds } = useFilters(config, layout)
 */
export function useFilters(
  config: RadarConfig | null,
  layout: RadarLayout | null,
): UseFiltersResult {
  // Inicializar con todos los índices activos cuando config llega
  const initialFilters = useMemo<ActiveFilters>(() => {
    if (!config) return { sectors: new Set(), rings: new Set() };
    return {
      sectors: new Set(config.sectors.map((s) => s.index)),
      rings: new Set(config.rings.map((r) => r.index)),
    };
  }, [config]);

  const [filters, setFilters] = useState<ActiveFilters>(initialFilters);

  // Resincronizar si config cambia (nuevo dominio cargado)
  const [lastConfigId, setLastConfigId] = useState<string | null>(null);
  if (config && config.meta.id !== lastConfigId) {
    setLastConfigId(config.meta.id);
    setFilters(initialFilters);
  }

  // ── Toggle sector ────────────────────────────────────────────
  const toggleSector = useCallback((index: number) => {
    setFilters((prev) => {
      const next = new Set(prev.sectors);
      if (next.has(index)) {
        // No desactivar el último sector activo
        if (next.size > 1) next.delete(index);
      } else {
        next.add(index);
      }
      return { ...prev, sectors: next };
    });
  }, []);

  // ── Toggle ring ──────────────────────────────────────────────
  const toggleRing = useCallback((index: number) => {
    setFilters((prev) => {
      const next = new Set(prev.rings);
      if (next.has(index)) {
        // No desactivar el último anillo activo
        if (next.size > 1) next.delete(index);
      } else {
        next.add(index);
      }
      return { ...prev, rings: next };
    });
  }, []);

  // ── Reset ────────────────────────────────────────────────────
  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  // ── Derivar IDs visibles (memoizado) ─────────────────────────
  const filteredTechIds = useMemo<Set<string>>(() => {
    if (!layout) return new Set();
    const ids = new Set<string>();
    for (const tl of layout.technologies) {
      if (
        filters.sectors.has(tl.sectorIndex) &&
        filters.rings.has(tl.ringIndex)
      ) {
        ids.add(tl.tech.id);
      }
    }
    return ids;
  }, [layout, filters]);

  return {
    filters,
    filteredTechIds,
    filteredCount: filteredTechIds.size,
    toggleSector,
    toggleRing,
    resetFilters,
  };
}
