import { describe, it, expect } from "vitest";
import { wrapText, computeLabelOffsetY, shortLabel } from "../textWrapper";

// ── wrapText ─────────────────────────────────────────────────

describe("wrapText", () => {
  it("string vacío devuelve []", () => {
    expect(wrapText("")).toEqual([]);
  });

  it("solo espacios devuelve []", () => {
    expect(wrapText("   ")).toEqual([]);
  });

  it("palabra única corta → una línea", () => {
    expect(wrapText("Radar", 24)).toEqual(["Radar"]);
  });

  it("texto que cabe en una línea → una línea", () => {
    expect(wrapText("Red 5G", 24)).toEqual(["Red 5G"]);
  });

  it("texto que excede el límite → dos líneas", () => {
    const result = wrapText("Inteligencia Artificial Generativa", 24);
    expect(result.length).toBeGreaterThan(1);
    for (const line of result) {
      // Cada línea debe tener ≤ maxCharsPerLine O ser una palabra larga sola
      expect(line.length).toBeLessThanOrEqual(40); // holgura para palabras largas
    }
  });

  it("nunca rompe una palabra a la mitad", () => {
    const text = "Arquitectura Cloud Computing Distribuida";
    const lines = wrapText(text, 12);
    const words = text.split(" ");
    for (const word of words) {
      // Cada palabra debe aparecer en alguna línea, completa
      const inSomeLine = lines.some((line) =>
        line.split(" ").includes(word),
      );
      expect(inSomeLine).toBe(true);
    }
  });

  it("palabra más larga que el límite → línea propia sin romper", () => {
    const result = wrapText("Supercalifragilistico", 5);
    expect(result).toContain("Supercalifragilistico");
  });

  it("preserva el orden de las palabras", () => {
    const words = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"];
    const text = words.join(" ");
    const lines = wrapText(text, 10);
    const reconstructed = lines.join(" ");
    expect(reconstructed).toBe(text);
  });

  it("maxCharsPerLine=1 → cada palabra en su propia línea", () => {
    const result = wrapText("A B C", 1);
    expect(result).toEqual(["A", "B", "C"]);
  });

  it("verificación caso real: 'Red de Acceso 5G y Beamforming' a 24 chars", () => {
    const lines = wrapText("Red de Acceso 5G y Beamforming", 24);
    expect(lines.length).toBeGreaterThanOrEqual(1);
    // Toda la línea debe tener ≤ 24 chars
    for (const line of lines) {
      if (line.split(" ").length > 1) {
        expect(line.length).toBeLessThanOrEqual(24);
      }
    }
  });
});

// ── shortLabel ────────────────────────────────────────────────

describe("shortLabel", () => {
  it("nombre largo → primeras 2 palabras", () => {
    expect(shortLabel("Redes Autónomas / Zero-Touch (Niveles L0-L5)")).toBe("Redes Autónomas");
  });

  it("nombre de exactamente 2 palabras → intacto", () => {
    expect(shortLabel("5G NR")).toBe("5G NR");
  });

  it("una sola palabra → esa palabra", () => {
    expect(shortLabel("IA")).toBe("IA");
  });

  it("string vacío → string vacío", () => {
    expect(shortLabel("")).toBe("");
  });

  it("espacios extra se ignoran", () => {
    expect(shortLabel("  Redes   Autónomas  y más")).toBe("Redes Autónomas");
  });

  it("maxWords=3 → primeras 3 palabras", () => {
    expect(shortLabel("Redes Autónomas Zero Touch", 3)).toBe("Redes Autónomas Zero");
  });
});

// ── computeLabelOffsetY ───────────────────────────────────────

describe("computeLabelOffsetY", () => {
  it("1 línea: offset = dotRadius + 2 (sin corrección vertical)", () => {
    expect(computeLabelOffsetY(6, 1, 13)).toBe(8); // 6+2 - 0*13/2 = 8
  });

  it("2 líneas: offset = dotRadius + 2 - lineHeight/2", () => {
    // 6 + 2 - (1 * 13) / 2 = 8 - 6.5 = 1.5
    expect(computeLabelOffsetY(6, 2, 13)).toBe(1.5);
  });

  it("3 líneas: offset puede ser negativo (etiqueta sube sobre el punto)", () => {
    // 6 + 2 - (2 * 13) / 2 = 8 - 13 = -5
    expect(computeLabelOffsetY(6, 3, 13)).toBe(-5);
  });

  it("dot activo (r=8): offset es mayor que con r=6", () => {
    const normal = computeLabelOffsetY(6, 1, 13);
    const active = computeLabelOffsetY(8, 1, 13);
    expect(active).toBeGreaterThan(normal);
  });

  it("lineHeight=0 → sin corrección vertical (solo baseOffset)", () => {
    expect(computeLabelOffsetY(6, 5, 0)).toBe(8);
  });
});
