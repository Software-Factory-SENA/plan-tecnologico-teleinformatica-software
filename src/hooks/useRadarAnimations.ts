"use client";

// ═══════════════════════════════════════════════════════════════
// useRadarAnimations — Transiciones CSS al filtrar tecnologías.
// FIX Defecto 10: en vez de eliminar puntos del DOM (cambio brusco),
// anima la opacidad de 1 → 0.15 con una transición suave.
// Los puntos siguen existiendo en el SVG; solo cambia su visibilidad.
// ═══════════════════════════════════════════════════════════════

import { useMemo, type CSSProperties } from "react";

export interface UseRadarAnimationsResult {
  /**
   * Retorna el estilo CSS de animación para una tecnología dada.
   * - Visible (en filteredTechIds): opacity 1
   * - Oculta (fuera de filtros):   opacity 0.15
   * Siempre incluye transition para la animación suave.
   */
  getAnimationStyle: (techId: string) => CSSProperties;
  /**
   * Retorna true si la tecnología es visible según los filtros activos.
   */
  isVisible: (techId: string) => boolean;
}

const STYLE_VISIBLE: CSSProperties = {
  opacity: 1,
  transition: "opacity 300ms ease",
  pointerEvents: "auto",
};

const STYLE_HIDDEN: CSSProperties = {
  opacity: 0.15,
  transition: "opacity 300ms ease",
  pointerEvents: "none",
};

/**
 * Gestiona las transiciones de visibilidad al aplicar filtros.
 *
 * En lugar de montar/desmontar componentes del DOM SVG (que produce
 * cambios abruptos), este hook retorna estilos CSS con transition.
 * El componente RadarDot siempre existe; solo cambia su opacidad.
 *
 * @param filteredTechIds - Set de IDs visibles según filtros activos
 *
 * @example
 * const { getAnimationStyle, isVisible } = useRadarAnimations(filteredTechIds)
 * // En el render:
 * <g style={getAnimationStyle(tech.id)}>...</g>
 */
export function useRadarAnimations(
  filteredTechIds: Set<string>,
): UseRadarAnimationsResult {
  // Memoizar las funciones para evitar re-renders en componentes hijos
  const { getAnimationStyle, isVisible } = useMemo(() => {
    return {
      getAnimationStyle: (techId: string): CSSProperties =>
        filteredTechIds.has(techId) ? STYLE_VISIBLE : STYLE_HIDDEN,

      isVisible: (techId: string): boolean =>
        filteredTechIds.has(techId),
    };
  }, [filteredTechIds]);

  return { getAnimationStyle, isVisible };
}
