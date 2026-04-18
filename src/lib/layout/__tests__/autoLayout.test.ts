import { describe, it, expect } from "vitest";
import { computeAutoLayout } from "../autoLayout";
import { minimalConfig } from "@/test/fixtures/minimalConfig";
import type { RadarConfig } from "@/types/radar-data.types";

// ── Helpers ───────────────────────────────────────────────────

function pairwiseDist(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// ── computeAutoLayout (fixture mínimo: 2×2 sectores/anillos, 4 techs) ──

describe("computeAutoLayout con minimalConfig", () => {
  const layout = computeAutoLayout(minimalConfig);

  it("devuelve los sectores correctos", () => {
    expect(layout.sectors).toHaveLength(2);
    const ids = layout.sectors.map((s) => s.sector.id);
    expect(ids).toContain("S1");
    expect(ids).toContain("S2");
  });

  it("devuelve los anillos correctos", () => {
    expect(layout.rings).toHaveLength(2);
    const ids = layout.rings.map((r) => r.ring.id);
    expect(ids).toContain("inner");
    expect(ids).toContain("outer");
  });

  it("genera un TechnologyLayout por cada tecnología (4 en total)", () => {
    expect(layout.technologies).toHaveLength(4);
  });

  it("svgWidth y svgHeight provienen del JSON de config", () => {
    expect(layout.svgWidth).toBe(minimalConfig.layout.svgWidth);
    expect(layout.svgHeight).toBe(minimalConfig.layout.svgHeight);
  });

  it("centerX y centerY provienen del JSON de config", () => {
    expect(layout.centerX).toBe(minimalConfig.layout.centerX);
    expect(layout.centerY).toBe(minimalConfig.layout.centerY);
  });

  it("FIX Defecto 5 — anillo 'inner' (index=0) tiene midRadius = 50 (0+100)/2", () => {
    const innerRing = layout.rings.find((r) => r.ring.id === "inner")!;
    expect(innerRing.midRadius).toBe(50); // (0 + 100) / 2
  });

  it("tecnologías del sector S1 tienen sectorIndex=0", () => {
    const s1Techs = layout.technologies.filter((tl) => tl.sectorIndex === 0);
    const ids = s1Techs.map((tl) => tl.tech.id);
    expect(ids).toContain("A01");
    expect(ids).toContain("A02");
  });

  it("tecnologías del anillo 'outer' tienen ringIndex=1", () => {
    const outerTechs = layout.technologies.filter((tl) => tl.ringIndex === 1);
    const ids = outerTechs.map((tl) => tl.tech.id);
    expect(ids).toContain("B01");
    expect(ids).toContain("B02");
  });

  it("FIX Defecto 1 — todas las distancias pairwise ≥ MIN_DIST (28px)", () => {
    const techs = layout.technologies;
    for (let i = 0; i < techs.length; i++) {
      for (let j = i + 1; j < techs.length; j++) {
        const d = pairwiseDist(techs[i], techs[j]);
        // Tolerancia de 0.5px por el redondeo de round4
        expect(d).toBeGreaterThanOrEqual(27.5);
      }
    }
  });

  it("FIX Defecto 4 — N=2 en celda S1|inner: ángulos simétricos alrededor del midAngle", () => {
    // S1 tiene index=0, rotationOffset=0, sectorAngle=180° → midAngle=90°
    const a01 = layout.technologies.find((tl) => tl.tech.id === "A01")!;
    const a02 = layout.technologies.find((tl) => tl.tech.id === "A02")!;
    const midAngle = 90; // (0 + 180) / 2
    const offset01 = Math.abs(a01.computedAngle - midAngle);
    const offset02 = Math.abs(a02.computedAngle - midAngle);
    // Ángulos aproximadamente simétricos: tolerancia de 2° para micro-ajustes
    // del algoritmo de resolución de colisiones 2D.
    expect(Math.abs(offset01 - offset02)).toBeLessThan(2);
  });

  it("FIX Defecto 8 — labelLines generado automáticamente (nombre completo con wrap)", () => {
    for (const tl of layout.technologies) {
      expect(tl.labelLines.length).toBeGreaterThanOrEqual(1);
      // La concatenación de líneas debe reproducir el nombre original
      expect(tl.labelLines.join(" ")).toBe(tl.tech.name);
    }
  });

  it("Tech con nombre largo genera 2+ líneas", () => {
    const longName = layout.technologies.find((tl) => tl.tech.id === "B02")!;
    // "Tech Delta con Nombre Muy Largo Para Probar Wrap" > 16 chars → ≥2 líneas
    expect(longName.labelLines.length).toBeGreaterThan(1);
  });

  it("todas las tecnologías tienen coordenadas x,y no-NaN", () => {
    for (const tl of layout.technologies) {
      expect(isNaN(tl.x)).toBe(false);
      expect(isNaN(tl.y)).toBe(false);
    }
  });
});

// ── computeAutoLayout (config vacía de tecnologías) ──────────

describe("computeAutoLayout con cero tecnologías", () => {
  const emptyConfig: RadarConfig = {
    ...minimalConfig,
    technologies: [],
  };

  it("devuelve technologies: [] sin lanzar error", () => {
    const layout = computeAutoLayout(emptyConfig);
    expect(layout.technologies).toEqual([]);
  });

  it("devuelve sectores y anillos correctamente", () => {
    const layout = computeAutoLayout(emptyConfig);
    expect(layout.sectors).toHaveLength(2);
    expect(layout.rings).toHaveLength(2);
  });
});

// ── Guard: sector inválido ────────────────────────────────────

describe("computeAutoLayout — guard de referencias inválidas", () => {
  it("sector inexistente → lanza Error descriptivo", () => {
    const badConfig: RadarConfig = {
      ...minimalConfig,
      technologies: [
        {
          id: "X99",
          code: "X99",
          name: "Bad",
          sector: "S_INEXISTENTE",
          ring: "inner",
          trl: 5,
          desc: "",
          impact: "",
          horizon: "",
        },
      ],
    };
    expect(() => computeAutoLayout(badConfig)).toThrow(/[Ss]ector/);
  });

  it("anillo inexistente → lanza Error descriptivo", () => {
    const badConfig: RadarConfig = {
      ...minimalConfig,
      technologies: [
        {
          id: "X99",
          code: "X99",
          name: "Bad",
          sector: "S1",
          ring: "RING_INEXISTENTE",
          trl: 5,
          desc: "",
          impact: "",
          horizon: "",
        },
      ],
    };
    expect(() => computeAutoLayout(badConfig)).toThrow(/[Aa]nillo/);
  });
});
