import { describe, it, expect } from "vitest";
import {
  validateSafely,
  RadarConfigValidationError,
} from "../radarConfigValidator";
import { minimalConfig } from "@/test/fixtures/minimalConfig";

// ── validateSafely ────────────────────────────────────────────

describe("validateSafely", () => {
  it("config válida → { ok: true, config }", () => {
    const result = validateSafely(minimalConfig);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.config.meta.id).toBe("test-radar");
      expect(result.config.rings).toHaveLength(2);
      expect(result.config.sectors).toHaveLength(2);
      expect(result.config.technologies).toHaveLength(4);
    }
  });

  it("null → { ok: false }", () => {
    const result = validateSafely(null);
    expect(result.ok).toBe(false);
  });

  it("string → { ok: false }", () => {
    const result = validateSafely("no es un objeto");
    expect(result.ok).toBe(false);
  });

  it("objeto vacío → { ok: false }", () => {
    const result = validateSafely({});
    expect(result.ok).toBe(false);
  });

  it("meta faltante → { ok: false } con error descriptivo", () => {
    const { meta: _meta, ...noMeta } = minimalConfig;
    const result = validateSafely(noMeta);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(RadarConfigValidationError);
      expect(result.error.message).toBeTruthy();
    }
  });

  it("rings vacío → { ok: false }", () => {
    const result = validateSafely({ ...minimalConfig, rings: [] });
    expect(result.ok).toBe(false);
  });

  it("sectors vacío → { ok: false }", () => {
    const result = validateSafely({ ...minimalConfig, sectors: [] });
    expect(result.ok).toBe(false);
  });

  it("technologies faltante → { ok: false }", () => {
    const { technologies: _t, ...noTechs } = minimalConfig;
    const result = validateSafely(noTechs);
    expect(result.ok).toBe(false);
  });

  it("el error tiene instanceof RadarConfigValidationError", () => {
    const result = validateSafely({ bad: "data" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(RadarConfigValidationError);
    }
  });

  it("result.config referencia la misma configuración validada", () => {
    const result = validateSafely(minimalConfig);
    if (result.ok) {
      expect(result.config.meta.domain).toBe("test");
      expect(result.config.technologies[0].id).toBe("A01");
    }
  });
});
