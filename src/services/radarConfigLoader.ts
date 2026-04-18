// ═══════════════════════════════════════════════════════════════
// CARGADOR DE CONFIGURACIÓN — Carga, parsea y valida el JSON
// de configuración de un radar por dominio.
//
// DISEÑO — Por qué un registro estático:
// Next.js (y cualquier bundler moderno) no puede analizar estáticamente
// rutas de import completamente dinámicas como:
//   await import(`@/config/radars/${domain}.json`)
// porque el grafo de módulos se construye en tiempo de build.
// Un mapa estático DOMAIN_LOADERS resuelve esto: el bundler
// ve todas las rutas concretas y las incluye en el bundle/chunk.
//
// Para agregar un nuevo dominio:
//   1. Crear src/config/radars/<dominio>.json siguiendo el schema.
//   2. Agregar una entrada en DOMAIN_LOADERS abajo.
//   3. Ningún otro archivo cambia.
// ═══════════════════════════════════════════════════════════════

import type { RadarConfig } from "@/types/radar-data.types";
import { validateRadarConfig, RadarConfigValidationError } from "@/services/radarConfigValidator";
import { adaptDatabaseToRadarConfig } from "@/services/databaseAdapter";

// ── Registro de dominios ──────────────────────────────────────

/**
 * Mapa de dominios disponibles → función de carga lazy.
 * Cada valor es una función que retorna un Promise del JSON.
 * Los imports estáticos permiten que el bundler analice las rutas
 * en tiempo de build y las incluya en el output correctamente.
 */
const DOMAIN_LOADERS: Record<string, () => Promise<unknown>> = {
  teleinformatica: () =>
    import("@/config/radars/database.json").then((m) => m.default ?? m),
};

/**
 * Detecta si el JSON crudo está en el esquema heredado "database"
 * (anillos / direccionadores / lineas en español). En ese caso debe
 * pasar por el adaptador antes de validarse como RadarConfig.
 */
function isLegacyDatabaseSchema(raw: unknown): boolean {
  if (typeof raw !== "object" || raw === null) return false;
  const obj = raw as Record<string, unknown>;
  return (
    Array.isArray(obj.anillos) &&
    Array.isArray(obj.direccionadores) &&
    Array.isArray(obj.lineas)
  );
}

// ── Error especializado del loader ────────────────────────────

export class RadarDomainNotFoundError extends Error {
  constructor(domain: string, available: string[]) {
    super(
      `[radarConfigLoader] Dominio "${domain}" no encontrado. ` +
        `Dominios disponibles: [${available.join(", ")}]. ` +
        `Para agregar "${domain}", crea src/config/radars/${domain}.json ` +
        `y registra su loader en DOMAIN_LOADERS.`,
    );
    this.name = "RadarDomainNotFoundError";
  }
}

// Re-exportar para que los consumidores no importen desde @/types
export { RadarConfigValidationError };

// ── API pública ───────────────────────────────────────────────

/**
 * Retorna los dominios de radar registrados y disponibles para cargar.
 */
export function getAvailableDomains(): string[] {
  return Object.keys(DOMAIN_LOADERS);
}

/**
 * Verifica si un dominio está registrado en el loader.
 * Útil para validar parámetros de ruta antes de cargar.
 */
export function isValidDomain(domain: string): boolean {
  return Object.prototype.hasOwnProperty.call(DOMAIN_LOADERS, domain);
}

/**
 * Carga, parsea y valida la configuración de un radar por dominio.
 *
 * Flujo:
 * 1. Busca el loader en DOMAIN_LOADERS.
 * 2. Ejecuta el import dinámico (lazy — solo carga cuando se llama).
 * 3. Valida la estructura con validateRadarConfig.
 * 4. Retorna el RadarConfig tipado o lanza un error descriptivo.
 *
 * @param domain - Identificador del dominio (ej: "telecomunicaciones")
 * @returns Promise<RadarConfig> — configuración validada y tipada
 * @throws RadarDomainNotFoundError — si el dominio no está registrado
 * @throws RadarConfigValidationError — si el JSON no pasa la validación
 *
 * @example
 * const config = await loadRadarConfig("telecomunicaciones")
 * // config es RadarConfig tipado y validado
 */
export async function loadRadarConfig(domain: string): Promise<RadarConfig> {
  const loader = DOMAIN_LOADERS[domain];

  if (!loader) {
    throw new RadarDomainNotFoundError(domain, getAvailableDomains());
  }

  const raw = await loader();
  const normalized = isLegacyDatabaseSchema(raw)
    ? adaptDatabaseToRadarConfig(raw)
    : raw;
  return validateRadarConfig(normalized);
}

/**
 * Precarga todos los dominios registrados en paralelo.
 * Útil para warmup en entornos SSR o para precargar en
 * el servidor antes de servir solicitudes de clientes.
 *
 * @returns Mapa de dominio → RadarConfig (solo los que cargaron sin error)
 */
export async function preloadAllDomains(): Promise<Map<string, RadarConfig>> {
  const entries = await Promise.allSettled(
    getAvailableDomains().map(async (domain) => {
      const config = await loadRadarConfig(domain);
      return [domain, config] as const;
    }),
  );

  const result = new Map<string, RadarConfig>();

  for (const entry of entries) {
    if (entry.status === "fulfilled") {
      const [domain, config] = entry.value;
      result.set(domain, config);
    } else {
      console.error(
        `[radarConfigLoader] Error precargando dominio:`,
        entry.reason,
      );
    }
  }

  return result;
}
