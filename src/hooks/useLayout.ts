"use client";

// ═══════════════════════════════════════════════════════════════
// useLayout — Calcula el RadarLayout completo desde RadarConfig.
// Responsabilidad única: memoizar computeAutoLayout.
// Devuelve null mientras config no esté disponible.
// ═══════════════════════════════════════════════════════════════

import { useMemo } from "react";
import type { RadarConfig } from "@/types/radar-data.types";
import type { RadarLayout } from "@/types/radar-layout.types";
import { computeAutoLayout } from "@/lib/layout/autoLayout";

/**
 * Calcula y memoiza el layout completo del radar.
 *
 * El cálculo solo se re-ejecuta cuando `config` cambia (nueva referencia).
 * Devuelve `null` si `config` es null (ej: mientras carga).
 *
 * @param config - RadarConfig validado, o null si aún no está disponible
 * @returns RadarLayout con posiciones calculadas, o null
 *
 * @example
 * const { config } = useRadarData("telecomunicaciones")
 * const layout = useLayout(config)
 * if (!layout) return <Spinner />
 */
export function useLayout(config: RadarConfig | null): RadarLayout | null {
  return useMemo(() => {
    if (!config) return null;
    return computeAutoLayout(config);
  }, [config]);
}
