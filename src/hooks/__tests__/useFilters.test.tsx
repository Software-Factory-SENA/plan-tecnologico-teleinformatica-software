import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFilters } from "../useFilters";
import { computeAutoLayout } from "@/lib/layout/autoLayout";
import { minimalConfig } from "@/test/fixtures/minimalConfig";

// ── Fixture ───────────────────────────────────────────────────

const layout = computeAutoLayout(minimalConfig);

// ── useFilters ────────────────────────────────────────────────

describe("useFilters", () => {
  it("inicializa con todos los sectores activos", () => {
    const { result } = renderHook(() => useFilters(minimalConfig, layout));
    const { filters } = result.current;
    expect(filters.sectors.has(0)).toBe(true);
    expect(filters.sectors.has(1)).toBe(true);
  });

  it("inicializa con todos los anillos activos", () => {
    const { result } = renderHook(() => useFilters(minimalConfig, layout));
    const { filters } = result.current;
    expect(filters.rings.has(0)).toBe(true);
    expect(filters.rings.has(1)).toBe(true);
  });

  it("filteredCount inicial = totalCount (todo activo)", () => {
    const { result } = renderHook(() => useFilters(minimalConfig, layout));
    expect(result.current.filteredCount).toBe(4);
  });

  it("toggleSector desactiva un sector activo", () => {
    const { result } = renderHook(() => useFilters(minimalConfig, layout));
    act(() => result.current.toggleSector(0));
    expect(result.current.filters.sectors.has(0)).toBe(false);
    expect(result.current.filters.sectors.has(1)).toBe(true); // el otro sigue activo
  });

  it("toggleSector activa un sector inactivo", () => {
    const { result } = renderHook(() => useFilters(minimalConfig, layout));
    act(() => result.current.toggleSector(0)); // desactivar
    act(() => result.current.toggleSector(0)); // reactivar
    expect(result.current.filters.sectors.has(0)).toBe(true);
  });

  it("min-1 enforcement: no desactiva el último sector activo", () => {
    const { result } = renderHook(() => useFilters(minimalConfig, layout));
    act(() => result.current.toggleSector(1)); // desactivar S2
    act(() => result.current.toggleSector(0)); // intentar desactivar S1 (el único activo)
    // S1 debe seguir activo porque es el último
    expect(result.current.filters.sectors.has(0)).toBe(true);
    expect(result.current.filters.sectors.size).toBe(1);
  });

  it("min-1 enforcement: no desactiva el último anillo activo", () => {
    const { result } = renderHook(() => useFilters(minimalConfig, layout));
    act(() => result.current.toggleRing(1));
    act(() => result.current.toggleRing(0)); // intentar desactivar el último
    expect(result.current.filters.rings.has(0)).toBe(true);
  });

  it("desactivar sector reduce filteredTechIds", () => {
    const { result } = renderHook(() => useFilters(minimalConfig, layout));
    // Desactivar S2 (sectores B01, B02)
    act(() => result.current.toggleSector(1));
    expect(result.current.filteredCount).toBeLessThan(4);
    expect(result.current.filteredTechIds.has("B01")).toBe(false);
    expect(result.current.filteredTechIds.has("A01")).toBe(true);
  });

  it("desactivar anillo 'outer' elimina B01 y B02 de filteredTechIds", () => {
    const { result } = renderHook(() => useFilters(minimalConfig, layout));
    act(() => result.current.toggleRing(1)); // outer es index=1
    expect(result.current.filteredTechIds.has("B01")).toBe(false);
    expect(result.current.filteredTechIds.has("B02")).toBe(false);
    expect(result.current.filteredTechIds.has("A01")).toBe(true);
  });

  it("resetFilters restaura todos los filtros a activos", () => {
    const { result } = renderHook(() => useFilters(minimalConfig, layout));
    act(() => result.current.toggleSector(1));
    act(() => result.current.toggleRing(1));
    act(() => result.current.resetFilters());
    expect(result.current.filteredCount).toBe(4);
    expect(result.current.filters.sectors.has(0)).toBe(true);
    expect(result.current.filters.sectors.has(1)).toBe(true);
    expect(result.current.filters.rings.has(0)).toBe(true);
    expect(result.current.filters.rings.has(1)).toBe(true);
  });

  it("config null → filteredTechIds vacío", () => {
    const { result } = renderHook(() => useFilters(null, null));
    expect(result.current.filteredTechIds.size).toBe(0);
    expect(result.current.filteredCount).toBe(0);
  });

  it("layout null → filteredTechIds vacío aunque config exista", () => {
    const { result } = renderHook(() => useFilters(minimalConfig, null));
    expect(result.current.filteredTechIds.size).toBe(0);
  });
});
