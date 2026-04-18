import { describe, it, expect } from "vitest";
import { resolveOverlaps } from "../collisionDetection";
import type { TechnologyLayout } from "@/types/radar-layout.types";

// ── Helpers ───────────────────────────────────────────────────

function makePoint(
  id: string,
  x: number,
  y: number,
  radius = 100,
): TechnologyLayout {
  return {
    tech: {
      id,
      code: id,
      name: id,
      sector: "S1",
      ring: "r1",
      trl: 5,
      desc: "",
      impact: "",
      horizon: "",
    },
    sectorIndex: 0,
    ringIndex: 0,
    computedAngle: 0,
    radius,
    x,
    y,
    labelLines: [id],
    labelOffsetY: 8,
  };
}

function dist(a: TechnologyLayout, b: TechnologyLayout): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

const CX = 200;
const CY = 200;
const MIN_DIST = 28;

// ── resolveOverlaps ───────────────────────────────────────────

describe("resolveOverlaps", () => {
  it("array vacío → devuelve []", () => {
    expect(resolveOverlaps([], CX, CY)).toEqual([]);
  });

  it("un solo punto → se devuelve copia sin modificar posición", () => {
    const p = makePoint("P1", 250, 200);
    const result = resolveOverlaps([p], CX, CY);
    expect(result).toHaveLength(1);
    expect(result[0].x).toBeCloseTo(p.x);
    expect(result[0].y).toBeCloseTo(p.y);
  });

  it("dos puntos separados ≥ minDist → no se mueven significativamente", () => {
    const a = makePoint("A", 250, 200); // a la derecha del centro
    const b = makePoint("B", 300, 200); // 50px más a la derecha
    const before = dist(a, b);
    expect(before).toBeGreaterThanOrEqual(MIN_DIST);

    const result = resolveOverlaps([a, b], CX, CY, MIN_DIST);
    const after = dist(result[0], result[1]);
    expect(after).toBeGreaterThanOrEqual(MIN_DIST - 0.1);
  });

  it("dos puntos solapados → distancia post-resolve ≥ minDist", () => {
    // Poner dos puntos muy juntos (10px de separación)
    const a = makePoint("A", 250, 200, 55);
    const b = makePoint("B", 258, 200, 55); // 8px apart
    expect(dist(a, b)).toBeLessThan(MIN_DIST);

    const result = resolveOverlaps([a, b], CX, CY, MIN_DIST);
    expect(dist(result[0], result[1])).toBeGreaterThanOrEqual(MIN_DIST - 0.5);
  });

  it("el array de entrada no es mutado", () => {
    const a = makePoint("A", 250, 200);
    const b = makePoint("B", 252, 200); // overlapping
    const originalX_A = a.x;
    const originalX_B = b.x;

    resolveOverlaps([a, b], CX, CY, MIN_DIST);

    // Puntos originales no cambiaron
    expect(a.x).toBe(originalX_A);
    expect(b.x).toBe(originalX_B);
  });

  it("devuelve un nuevo array (no el mismo objeto)", () => {
    const points = [makePoint("A", 250, 200)];
    const result = resolveOverlaps(points, CX, CY);
    expect(result).not.toBe(points);
    expect(result[0]).not.toBe(points[0]);
  });

  it("3 puntos en la misma posición → todos separados ≥ minDist", () => {
    const pts = [
      makePoint("A", 250, 200, 100),
      makePoint("B", 250, 200, 100),
      makePoint("C", 250, 200, 100),
    ];
    const result = resolveOverlaps(pts, CX, CY, MIN_DIST, 100);

    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        expect(dist(result[i], result[j])).toBeGreaterThanOrEqual(MIN_DIST - 1);
      }
    }
  });

  it("minDistPx <= 0 → devuelve copias sin modificar posición", () => {
    const a = makePoint("A", 250, 200);
    const b = makePoint("B", 252, 200);
    const result = resolveOverlaps([a, b], CX, CY, 0);
    expect(result[0].x).toBeCloseTo(a.x);
    expect(result[1].x).toBeCloseTo(b.x);
  });

  it("todos los puntos resultantes tienen radius >= 1 (nunca colapsan al centro)", () => {
    const pts = Array.from({ length: 5 }, (_, i) =>
      makePoint(`P${i}`, 201, 200, 1), // muy cerca del centro
    );
    const result = resolveOverlaps(pts, CX, CY, MIN_DIST, 100);
    for (const p of result) {
      expect(p.radius).toBeGreaterThanOrEqual(1);
    }
  });
});
