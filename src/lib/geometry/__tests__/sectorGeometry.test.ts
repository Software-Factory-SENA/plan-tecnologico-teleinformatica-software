import { describe, it, expect } from "vitest";
import {
  computeSectorGeometries,
  getSectorDividerEndpoint,
} from "../sectorGeometry";
import type { SectorData } from "@/types/radar-data.types";

// ── Helpers ───────────────────────────────────────────────────

function makeSector(id: string, index: number): SectorData {
  return {
    id,
    index,
    label: `Sector ${id}`,
    shortLabel: id,
    color: "#000",
    bgLight: "#fff",
    bgDark: "#eee",
    icon: "⚫",
  };
}

// 5 sectores del radar de telecomunicaciones
const telecomSectors: SectorData[] = [
  makeSector("D1", 0),
  makeSector("D2", 1),
  makeSector("D3", 2),
  makeSector("D4", 3),
  makeSector("D5", 4),
];

// ── computeSectorGeometries ───────────────────────────────────

describe("computeSectorGeometries", () => {
  it("array vacío devuelve []", () => {
    expect(computeSectorGeometries([], 0)).toEqual([]);
  });

  it("FIX Defecto 9 — startAngles derivados automáticamente (rotationOffset=-18, n=5)", () => {
    const geoms = computeSectorGeometries(telecomSectors, -18);
    const startAngles = geoms.map((g) => g.startAngle);
    expect(startAngles).toEqual([-18, 54, 126, 198, 270]);
  });

  it("sectorAngle = 360/n para todos los sectores", () => {
    const geoms = computeSectorGeometries(telecomSectors, 0);
    for (const g of geoms) {
      expect(g.sectorAngle).toBeCloseTo(72);
    }
  });

  it("midAngle = startAngle + sectorAngle/2", () => {
    const geoms = computeSectorGeometries(telecomSectors, -18);
    for (const g of geoms) {
      expect(g.midAngle).toBeCloseTo(g.startAngle + g.sectorAngle / 2);
    }
  });

  it("endAngle = startAngle + sectorAngle", () => {
    const geoms = computeSectorGeometries(telecomSectors, -18);
    for (const g of geoms) {
      expect(g.endAngle).toBeCloseTo(g.startAngle + g.sectorAngle);
    }
  });

  it("el primer sector (D1) tiene midAngle = 18° con rotationOffset=-18", () => {
    const geoms = computeSectorGeometries(telecomSectors, -18);
    const d1 = geoms.find((g) => g.sector.id === "D1")!;
    expect(d1.midAngle).toBeCloseTo(18);
  });

  it("rotationOffset=0 con 4 sectores → startAngles [0, 90, 180, 270]", () => {
    const cuatro = [0, 1, 2, 3].map((i) => makeSector(`Q${i}`, i));
    const geoms = computeSectorGeometries(cuatro, 0);
    const starts = geoms.map((g) => g.startAngle);
    expect(starts).toEqual([0, 90, 180, 270]);
  });

  it("ordena por index aunque la entrada esté desordenada", () => {
    const desordenados = [...telecomSectors].reverse();
    const geoms = computeSectorGeometries(desordenados, -18);
    const indices = geoms.map((g) => g.sector.index);
    expect(indices).toEqual([0, 1, 2, 3, 4]);
  });

  it("no muta el array de entrada", () => {
    const original = [...telecomSectors];
    computeSectorGeometries(telecomSectors, -18);
    expect(telecomSectors).toEqual(original);
  });

  it("un solo sector — sectorAngle = 360°", () => {
    const geoms = computeSectorGeometries([makeSector("S0", 0)], 0);
    expect(geoms[0].sectorAngle).toBe(360);
    expect(geoms[0].startAngle).toBe(0);
    expect(geoms[0].endAngle).toBe(360);
    expect(geoms[0].midAngle).toBe(180);
  });
});

// ── getSectorDividerEndpoint ──────────────────────────────────

describe("getSectorDividerEndpoint", () => {
  it("ángulo 0° apunta a la derecha del centro", () => {
    const pt = getSectorDividerEndpoint(0, 0, 100, 0);
    expect(pt.x).toBeCloseTo(100);
    expect(pt.y).toBeCloseTo(0);
  });

  it("ángulo 90° apunta hacia abajo", () => {
    const pt = getSectorDividerEndpoint(0, 0, 100, 90);
    expect(pt.x).toBeCloseTo(0);
    expect(pt.y).toBeCloseTo(100);
  });

  it("aplica el centro cx/cy correctamente", () => {
    const pt = getSectorDividerEndpoint(600, 520, 400, 0);
    expect(pt.x).toBeCloseTo(1000);
    expect(pt.y).toBeCloseTo(520);
  });
});
