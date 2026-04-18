// ═══════════════════════════════════════════════════════════════
// VALIDADOR DE SCHEMA — Validación estructural del JSON de config.
// Sin dependencias externas (no requiere Zod).
// Exporta: validateRadarConfig, RadarConfigValidationError
// ═══════════════════════════════════════════════════════════════

import type {
  RadarConfig,
  RingData,
  SectorData,
  TechnologyData,
} from "./radar-data.types";

// ── Error tipado ─────────────────────────────────────────────

export class RadarConfigValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: unknown,
  ) {
    super(message);
    this.name = "RadarConfigValidationError";
  }
}

// ── Helpers internos ─────────────────────────────────────────

function assertPresent(
  value: unknown,
  field: string,
): asserts value is NonNullable<typeof value> {
  if (value === undefined || value === null) {
    throw new RadarConfigValidationError(
      `Campo requerido ausente: "${field}"`,
      field,
      value,
    );
  }
}

function assertString(value: unknown, field: string): asserts value is string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new RadarConfigValidationError(
      `"${field}" debe ser una cadena de texto no vacía`,
      field,
      value,
    );
  }
}

function assertNumber(value: unknown, field: string): asserts value is number {
  if (typeof value !== "number" || isNaN(value)) {
    throw new RadarConfigValidationError(
      `"${field}" debe ser un número válido`,
      field,
      value,
    );
  }
}

function assertArray(
  value: unknown,
  field: string,
  minLength = 1,
): asserts value is unknown[] {
  if (!Array.isArray(value) || value.length < minLength) {
    throw new RadarConfigValidationError(
      `"${field}" debe ser un arreglo con al menos ${minLength} elemento(s)`,
      field,
      value,
    );
  }
}

// ── Validadores por sección ───────────────────────────────────

function validateMeta(meta: unknown): void {
  assertPresent(meta, "meta");
  const m = meta as Record<string, unknown>;
  assertString(m.id, "meta.id");
  assertString(m.domain, "meta.domain");
  assertString(m.title, "meta.title");
  assertString(m.organization, "meta.organization");
  assertString(m.version, "meta.version");
}

function validateLayout(layout: unknown): void {
  assertPresent(layout, "layout");
  const l = layout as Record<string, unknown>;
  assertNumber(l.svgWidth, "layout.svgWidth");
  assertNumber(l.svgHeight, "layout.svgHeight");
  assertNumber(l.centerX, "layout.centerX");
  assertNumber(l.centerY, "layout.centerY");
  assertNumber(l.sectorRotationOffset, "layout.sectorRotationOffset");
}

function validateRings(rings: unknown): RingData[] {
  assertArray(rings, "rings", 1);
  return (rings as unknown[]).map((r, i) => {
    const ring = r as Record<string, unknown>;
    assertString(ring.id, `rings[${i}].id`);
    assertNumber(ring.index, `rings[${i}].index`);
    assertString(ring.label, `rings[${i}].label`);
    assertNumber(ring.radius, `rings[${i}].radius`);
    assertString(ring.color, `rings[${i}].color`);
    assertPresent(ring.trlRange, `rings[${i}].trlRange`);
    const trlRange = ring.trlRange as Record<string, unknown>;
    assertNumber(trlRange.min, `rings[${i}].trlRange.min`);
    assertNumber(trlRange.max, `rings[${i}].trlRange.max`);
    return r as RingData;
  });
}

function validateSectors(sectors: unknown): SectorData[] {
  assertArray(sectors, "sectors", 1);
  return (sectors as unknown[]).map((s, i) => {
    const sector = s as Record<string, unknown>;
    assertString(sector.id, `sectors[${i}].id`);
    assertNumber(sector.index, `sectors[${i}].index`);
    assertString(sector.label, `sectors[${i}].label`);
    assertString(sector.color, `sectors[${i}].color`);
    return s as SectorData;
  });
}

function validateTechnologies(
  technologies: unknown,
  rings: RingData[],
  sectors: SectorData[],
): TechnologyData[] {
  assertArray(technologies, "technologies", 1);

  const ringIds = new Set(rings.map((r) => r.id));
  const sectorIds = new Set(sectors.map((s) => s.id));

  return (technologies as unknown[]).map((t, i) => {
    const tech = t as Record<string, unknown>;

    assertString(tech.id, `technologies[${i}].id`);
    assertString(tech.name, `technologies[${i}].name`);
    assertString(tech.sector, `technologies[${i}].sector`);
    assertString(tech.ring, `technologies[${i}].ring`);
    assertNumber(tech.trl, `technologies[${i}].trl`);

    // Validar que el sector referenciado existe
    if (!sectorIds.has(tech.sector as string)) {
      throw new RadarConfigValidationError(
        `technologies[${i}] (${tech.id}) referencia sector "${tech.sector}" que no existe en sectors[]`,
        `technologies[${i}].sector`,
        tech.sector,
      );
    }

    // Validar que el anillo referenciado existe
    if (!ringIds.has(tech.ring as string)) {
      throw new RadarConfigValidationError(
        `technologies[${i}] (${tech.id}) referencia ring "${tech.ring}" que no existe en rings[]`,
        `technologies[${i}].ring`,
        tech.ring,
      );
    }

    // Validar rango TRL global (1-9)
    const trl = tech.trl as number;
    if (trl < 1 || trl > 9) {
      throw new RadarConfigValidationError(
        `technologies[${i}] (${tech.id}) tiene TRL=${trl} fuera del rango válido [1-9]`,
        `technologies[${i}].trl`,
        trl,
      );
    }

    // Cross-validar TRL contra el rango esperado del anillo (warning, no error)
    const ring = rings.find((r) => r.id === (tech.ring as string))!;
    if (trl < ring.trlRange.min || trl > ring.trlRange.max) {
      console.warn(
        `[RadarConfig] ⚠ technologies[${i}] "${tech.id}" tiene TRL=${trl} ` +
          `pero el anillo "${ring.id}" espera TRL ${ring.trlRange.min}-${ring.trlRange.max}. ` +
          `Esto puede ser intencional (decisión editorial).`,
      );
    }

    return t as TechnologyData;
  });
}

// ── Validador principal ───────────────────────────────────────

/**
 * Valida la estructura completa del JSON de configuración del radar.
 * Lanza RadarConfigValidationError si hay errores estructurales.
 * Emite console.warn para inconsistencias no críticas (TRL vs anillo).
 *
 * @param raw - Objeto crudo parseado del JSON
 * @returns RadarConfig tipado y validado
 */
export function validateRadarConfig(raw: unknown): RadarConfig {
  if (typeof raw !== "object" || raw === null) {
    throw new RadarConfigValidationError(
      "La configuración del radar debe ser un objeto JSON válido",
    );
  }

  const config = raw as Record<string, unknown>;

  validateMeta(config.meta);
  validateLayout(config.layout);
  const rings = validateRings(config.rings);
  const sectors = validateSectors(config.sectors);
  const technologies = validateTechnologies(
    config.technologies,
    rings,
    sectors,
  );

  // Verificar IDs únicos en tecnologías
  const techIds = technologies.map((t) => t.id);
  const duplicateTechIds = techIds.filter(
    (id, i) => techIds.indexOf(id) !== i,
  );
  if (duplicateTechIds.length > 0) {
    throw new RadarConfigValidationError(
      `IDs duplicados en technologies: ${duplicateTechIds.join(", ")}`,
      "technologies[].id",
    );
  }

  return raw as RadarConfig;
}
