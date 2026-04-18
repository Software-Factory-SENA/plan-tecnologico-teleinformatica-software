import { describe, it, expect } from "vitest";
import { computeRingGeometries } from "../ringGeometry";
import type { RingData } from "@/types/radar-data.types";

// ── Helpers ───────────────────────────────────────────────────

function makeRing(
  overrides: Partial<RingData> & { id: string; index: number; radius: number },
): RingData {
  return {
    label: overrides.id,
    shortLabel: overrides.id,
    color: "#000",
    fillColor: "#fff",
    borderColor: "#999",
    labelColor: "#000",
    desc: "",
    trlRange: { min: 1, max: 9 },
    trlLabel: "TRL 1-9",
    action: "",
    ...overrides,
  };
}

// Fixture del radar de telecomunicaciones (4 anillos)
const telecomRings: RingData[] = [
  makeRing({ id: "adopt", index: 0, radius: 110 }),
  makeRing({ id: "trial", index: 1, radius: 210 }),
  makeRing({ id: "assess", index: 2, radius: 305 }),
  makeRing({ id: "monitor", index: 3, radius: 400 }),
];

// ── computeRingGeometries ─────────────────────────────────────

describe("computeRingGeometries", () => {
  it("array vacío devuelve []", () => {
    expect(computeRingGeometries([])).toEqual([]);
  });

  it("FIX Defecto 5 — anillo 0 (adopt) midRadius = 55, no 60.5", () => {
    const geoms = computeRingGeometries(telecomRings);
    const adopt = geoms.find((g) => g.ring.id === "adopt")!;
    expect(adopt.innerRadius).toBe(0);
    expect(adopt.outerRadius).toBe(110);
    expect(adopt.midRadius).toBe(55); // (0+110)/2 — NO 110*0.55=60.5
  });

  it("anillo trial — innerRadius = radio de adopt", () => {
    const geoms = computeRingGeometries(telecomRings);
    const trial = geoms.find((g) => g.ring.id === "trial")!;
    expect(trial.innerRadius).toBe(110);
    expect(trial.outerRadius).toBe(210);
    expect(trial.midRadius).toBe(160);
  });

  it("anillo assess — midRadius = 257.5", () => {
    const geoms = computeRingGeometries(telecomRings);
    const assess = geoms.find((g) => g.ring.id === "assess")!;
    expect(assess.innerRadius).toBe(210);
    expect(assess.outerRadius).toBe(305);
    expect(assess.midRadius).toBe(257.5);
  });

  it("anillo monitor — midRadius = 352.5", () => {
    const geoms = computeRingGeometries(telecomRings);
    const monitor = geoms.find((g) => g.ring.id === "monitor")!;
    expect(monitor.innerRadius).toBe(305);
    expect(monitor.outerRadius).toBe(400);
    expect(monitor.midRadius).toBe(352.5);
  });

  it("orden de salida siempre ascendente por index, aunque la entrada esté desordenada", () => {
    const desordenados = [...telecomRings].reverse();
    const geoms = computeRingGeometries(desordenados);
    const indices = geoms.map((g) => g.ring.index);
    expect(indices).toEqual([0, 1, 2, 3]);
  });

  it("no muta el array de entrada", () => {
    const original = [...telecomRings];
    computeRingGeometries(telecomRings);
    expect(telecomRings).toEqual(original);
  });

  it("un solo anillo — innerRadius=0, midRadius = radius/2", () => {
    const geoms = computeRingGeometries([makeRing({ id: "solo", index: 0, radius: 200 })]);
    expect(geoms).toHaveLength(1);
    expect(geoms[0].innerRadius).toBe(0);
    expect(geoms[0].midRadius).toBe(100);
  });
});
