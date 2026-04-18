import { describe, it, expect } from "vitest";
import { toRad, toDeg, round4, polarToXY } from "../polarCoords";

// ── toRad ────────────────────────────────────────────────────

describe("toRad", () => {
  it("converts 0° to 0", () => {
    expect(toRad(0)).toBe(0);
  });

  it("converts 180° to π", () => {
    expect(toRad(180)).toBeCloseTo(Math.PI);
  });

  it("converts 360° to 2π", () => {
    expect(toRad(360)).toBeCloseTo(2 * Math.PI);
  });

  it("converts 90° to π/2", () => {
    expect(toRad(90)).toBeCloseTo(Math.PI / 2);
  });

  it("handles negative angles", () => {
    expect(toRad(-90)).toBeCloseTo(-Math.PI / 2);
  });
});

// ── toDeg ────────────────────────────────────────────────────

describe("toDeg", () => {
  it("converts π to 180°", () => {
    expect(toDeg(Math.PI)).toBeCloseTo(180);
  });

  it("converts 0 to 0°", () => {
    expect(toDeg(0)).toBe(0);
  });

  it("is the inverse of toRad", () => {
    const angles = [0, 30, 45, 90, 135, 180, 270, 360, -18, -90];
    for (const deg of angles) {
      expect(toDeg(toRad(deg))).toBeCloseTo(deg, 10);
    }
  });
});

// ── round4 ───────────────────────────────────────────────────

describe("round4", () => {
  it("rounds up at 5th decimal", () => {
    expect(round4(1.23456)).toBe(1.2346);
  });

  it("rounds down below 5th decimal", () => {
    expect(round4(1.23454)).toBe(1.2345);
  });

  it("leaves exact 4-decimal values unchanged", () => {
    expect(round4(1.5)).toBe(1.5);
    expect(round4(0.1234)).toBe(0.1234);
  });

  it("handles zero", () => {
    expect(round4(0)).toBe(0);
  });

  it("handles negative values", () => {
    expect(round4(-1.23456)).toBe(-1.2346);
  });
});

// ── polarToXY ────────────────────────────────────────────────

describe("polarToXY", () => {
  it("0° → punto a la derecha del centro", () => {
    const { x, y } = polarToXY(0, 0, 1, 0);
    expect(x).toBeCloseTo(1);
    expect(y).toBeCloseTo(0);
  });

  it("90° → punto abajo (convención Y-down de SVG)", () => {
    const { x, y } = polarToXY(0, 0, 1, 90);
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(1);
  });

  it("180° → punto a la izquierda", () => {
    const { x, y } = polarToXY(0, 0, 1, 180);
    expect(x).toBeCloseTo(-1);
    expect(y).toBeCloseTo(0);
  });

  it("270° → punto arriba (Y negativa en SVG)", () => {
    const { x, y } = polarToXY(0, 0, 1, 270);
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(-1);
  });

  it("aplica offset del centro correctamente", () => {
    const { x, y } = polarToXY(100, 200, 50, 0);
    expect(x).toBeCloseTo(150);
    expect(y).toBeCloseTo(200);
  });

  it("radio 0 devuelve el centro exacto", () => {
    const { x, y } = polarToXY(300, 400, 0, 45);
    expect(x).toBe(300);
    expect(y).toBe(400);
  });

  it("resultado redondeado a 4 decimales", () => {
    const { x } = polarToXY(0, 0, 1, 30); // cos(30°) = √3/2 ≈ 0.8660
    expect(x).toBe(round4(x)); // garantiza que round4 fue aplicado
  });

  it("verificación radar: D1 (angle=-18°, r=55, cx=600, cy=520)", () => {
    // Con rotationOffset=-18, midAngle de D1 = -18 + 72/2 = 18°
    const { x, y } = polarToXY(600, 520, 55, 18);
    expect(x).toBeCloseTo(600 + 55 * Math.cos(toRad(18)), 1);
    expect(y).toBeCloseTo(520 + 55 * Math.sin(toRad(18)), 1);
  });
});
