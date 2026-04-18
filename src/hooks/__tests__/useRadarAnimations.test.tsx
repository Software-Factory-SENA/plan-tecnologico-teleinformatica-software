import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useRadarAnimations } from "../useRadarAnimations";

// ── useRadarAnimations ────────────────────────────────────────

describe("useRadarAnimations", () => {
  const visibleIds = new Set(["T01", "T03", "T05"]);

  it("tech visible → opacity 1", () => {
    const { result } = renderHook(() => useRadarAnimations(visibleIds));
    const style = result.current.getAnimationStyle("T01");
    expect(style.opacity).toBe(1);
  });

  it("tech oculta → opacity 0.15", () => {
    const { result } = renderHook(() => useRadarAnimations(visibleIds));
    const style = result.current.getAnimationStyle("T02"); // no está en el set
    expect(style.opacity).toBe(0.15);
  });

  it("tech visible → pointerEvents 'auto'", () => {
    const { result } = renderHook(() => useRadarAnimations(visibleIds));
    const style = result.current.getAnimationStyle("T03");
    expect(style.pointerEvents).toBe("auto");
  });

  it("tech oculta → pointerEvents 'none'", () => {
    const { result } = renderHook(() => useRadarAnimations(visibleIds));
    const style = result.current.getAnimationStyle("T99");
    expect(style.pointerEvents).toBe("none");
  });

  it("siempre incluye transition de 300ms", () => {
    const { result } = renderHook(() => useRadarAnimations(visibleIds));
    const visibleStyle = result.current.getAnimationStyle("T01");
    const hiddenStyle = result.current.getAnimationStyle("T99");
    expect(String(visibleStyle.transition)).toContain("300ms");
    expect(String(hiddenStyle.transition)).toContain("300ms");
  });

  it("isVisible → true para ID en el set", () => {
    const { result } = renderHook(() => useRadarAnimations(visibleIds));
    expect(result.current.isVisible("T05")).toBe(true);
  });

  it("isVisible → false para ID fuera del set", () => {
    const { result } = renderHook(() => useRadarAnimations(visibleIds));
    expect(result.current.isVisible("T99")).toBe(false);
  });

  it("set vacío → todos ocultos", () => {
    const { result } = renderHook(() => useRadarAnimations(new Set()));
    const style = result.current.getAnimationStyle("T01");
    expect(style.opacity).toBe(0.15);
    expect(result.current.isVisible("T01")).toBe(false);
  });

  it("se rememoiza: misma instancia de función si el set no cambia", () => {
    const { result, rerender } = renderHook(
      ({ ids }: { ids: Set<string> }) => useRadarAnimations(ids),
      { initialProps: { ids: visibleIds } },
    );
    const fn1 = result.current.getAnimationStyle;
    rerender({ ids: visibleIds }); // mismo objeto de Set
    const fn2 = result.current.getAnimationStyle;
    expect(fn1).toBe(fn2); // referencia estable (useMemo)
  });

  it("actualiza cuando el set cambia", () => {
    const { result, rerender } = renderHook(
      ({ ids }: { ids: Set<string> }) => useRadarAnimations(ids),
      { initialProps: { ids: new Set(["T01"]) } },
    );
    expect(result.current.isVisible("T02")).toBe(false);

    rerender({ ids: new Set(["T01", "T02"]) });
    expect(result.current.isVisible("T02")).toBe(true);
  });
});
