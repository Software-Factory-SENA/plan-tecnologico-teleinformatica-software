// ═══════════════════════════════════════════════════════════════
// SERVICIO DE VALIDACIÓN — Capa de servicio sobre el schema validator.
// Re-exporta el validador de tipos y agrega validateSafely:
// una variante no-lanzable útil para hooks y componentes que
// necesitan manejar errores sin try/catch.
// ═══════════════════════════════════════════════════════════════

import type { RadarConfig } from "@/types/radar-data.types";
import {
  validateRadarConfig as _validateRadarConfig,
  RadarConfigValidationError,
} from "@/types/radar-config.schema";

// Re-exportar el error tipado para que los consumidores no
// necesiten importar desde @/types directamente.
export { RadarConfigValidationError };

// Re-exportar el validador principal (lanza en caso de error).
export { _validateRadarConfig as validateRadarConfig };

// ── Resultado de validación segura ───────────────────────────

export type ValidationSuccess = {
  ok: true;
  config: RadarConfig;
};

export type ValidationFailure = {
  ok: false;
  error: RadarConfigValidationError;
};

export type ValidationResult = ValidationSuccess | ValidationFailure;

/**
 * Valida el JSON sin lanzar excepciones.
 * Retorna un objeto discriminado { ok: true, config } o { ok: false, error }.
 *
 * Útil en hooks y componentes donde el manejo de errores
 * debe ser declarativo en lugar de imperativo (try/catch).
 *
 * @example
 * const result = validateSafely(rawJson)
 * if (!result.ok) {
 *   setError(result.error.message)
 *   return
 * }
 * setConfig(result.config)
 */
export function validateSafely(raw: unknown): ValidationResult {
  try {
    const config = _validateRadarConfig(raw);
    return { ok: true, config };
  } catch (err) {
    if (err instanceof RadarConfigValidationError) {
      return { ok: false, error: err };
    }
    // Error inesperado — envolver en RadarConfigValidationError
    return {
      ok: false,
      error: new RadarConfigValidationError(
        err instanceof Error ? err.message : "Error de validación desconocido",
      ),
    };
  }
}
