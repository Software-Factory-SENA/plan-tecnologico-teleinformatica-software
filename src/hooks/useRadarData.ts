"use client";

// ═══════════════════════════════════════════════════════════════
// useRadarData — Carga y valida la configuración JSON de un radar.
// Responsabilidad única: IO asíncrono + tipado de resultado.
// No calcula layout; eso lo hace useLayout.
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import type { RadarConfig } from "@/types/radar-data.types";
import {
  loadRadarConfig,
  RadarDomainNotFoundError,
  RadarConfigValidationError,
} from "@/services/radarConfigLoader";

export type RadarDataState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; config: RadarConfig }
  | { status: "error"; error: Error };

export interface UseRadarDataResult {
  config: RadarConfig | null;
  loading: boolean;
  error: Error | null;
  /** Dominio actualmente cargado */
  domain: string;
}

/**
 * Carga, valida y devuelve la configuración de un radar por dominio.
 *
 * Comportamiento:
 * - Recarga automáticamente si `domain` cambia.
 * - Cancela cargas en curso si el componente se desmonta.
 * - `loading` es true durante la carga; `error` es no-nulo si falla.
 * - Errores tipados: RadarDomainNotFoundError, RadarConfigValidationError.
 *
 * @param domain - Identificador del dominio, ej: "telecomunicaciones"
 *
 * @example
 * const { config, loading, error } = useRadarData("telecomunicaciones")
 */
export function useRadarData(domain: string): UseRadarDataResult {
  const [state, setState] = useState<RadarDataState>({ status: "idle" });

  useEffect(() => {
    if (!domain) return;

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ status: "loading" });

    loadRadarConfig(domain)
      .then((config) => {
        if (!cancelled) {
          setState({ status: "success", config });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const error =
            err instanceof RadarDomainNotFoundError ||
            err instanceof RadarConfigValidationError
              ? err
              : new Error(
                  err instanceof Error
                    ? err.message
                    : `Error cargando dominio "${domain}"`,
                );
          setState({ status: "error", error });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [domain]);

  return {
    config: state.status === "success" ? state.config : null,
    loading: state.status === "loading" || state.status === "idle",
    error: state.status === "error" ? state.error : null,
    domain,
  };
}
