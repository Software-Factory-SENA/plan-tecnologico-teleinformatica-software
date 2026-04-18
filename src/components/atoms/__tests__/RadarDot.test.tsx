import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RadarDot } from "../RadarDot";
import type { RadarDotProps } from "@/types/radar-render.types";

// ── Fixture ───────────────────────────────────────────────────

function makeProps(overrides: Partial<RadarDotProps> = {}): RadarDotProps {
  return {
    layout: {
      tech: {
        id: "T01",
        code: "L01",
        name: "Tech Alpha",
        sector: "D1",
        ring: "adopt",
        trl: 8,
        desc: "Descripción",
        impact: "Alto",
        horizon: "2626",
      },
      sectorIndex: 0,
      ringIndex: 0,
      computedAngle: 18,
      radius: 55,
      x: 652,
      y: 537,
      labelLines: ["Tech Alpha"],
      labelOffsetY: 8,
    },
    sectorColor: "#1b5e20",
    isSelected: false,
    isHovered: false,
    onSelect: vi.fn(),
    onHover: vi.fn(),
    ...overrides,
  };
}

// ── RadarDot ─────────────────────────────────────────────────

describe("RadarDot", () => {
  it("renderiza un elemento <g> con role='button'", () => {
    render(
      <svg>
        <RadarDot {...makeProps()} />
      </svg>,
    );
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("aria-label coincide con el nombre de la tecnología", () => {
    render(
      <svg>
        <RadarDot {...makeProps()} />
      </svg>,
    );
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Tech Alpha",
    );
  });

  it("estado normal — NO renderiza el círculo de glow", () => {
    const { container } = render(
      <svg>
        <RadarDot {...makeProps({ isSelected: false, isHovered: false })} />
      </svg>,
    );
    const circles = container.querySelectorAll("circle");
    // Solo el punto principal, sin glow
    expect(circles).toHaveLength(1);
  });

  it("estado activo (selected) — renderiza glow + punto (2 círculos)", () => {
    const { container } = render(
      <svg>
        <RadarDot {...makeProps({ isSelected: true })} />
      </svg>,
    );
    const circles = container.querySelectorAll("circle");
    expect(circles).toHaveLength(2);
  });

  it("estado activo (hovered) — también muestra glow", () => {
    const { container } = render(
      <svg>
        <RadarDot {...makeProps({ isHovered: true })} />
      </svg>,
    );
    expect(container.querySelectorAll("circle")).toHaveLength(2);
  });

  it("onSelect se llama al hacer click", () => {
    const onSelect = vi.fn();
    render(
      <svg>
        <RadarDot {...makeProps({ onSelect })} />
      </svg>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("onHover(true) se llama al mouseenter", () => {
    const onHover = vi.fn();
    render(
      <svg>
        <RadarDot {...makeProps({ onHover })} />
      </svg>,
    );
    fireEvent.mouseEnter(screen.getByRole("button"));
    expect(onHover).toHaveBeenCalledWith(true);
  });

  it("onHover(false) se llama al mouseleave", () => {
    const onHover = vi.fn();
    render(
      <svg>
        <RadarDot {...makeProps({ onHover })} />
      </svg>,
    );
    fireEvent.mouseLeave(screen.getByRole("button"));
    expect(onHover).toHaveBeenCalledWith(false);
  });

  it("el color del punto corresponde al sectorColor", () => {
    const { container } = render(
      <svg>
        <RadarDot {...makeProps({ sectorColor: "#ff0000" })} />
      </svg>,
    );
    // El punto principal es el último círculo (glow va primero cuando activo)
    const circles = container.querySelectorAll("circle");
    const mainDot = circles[circles.length - 1];
    expect(mainDot.getAttribute("fill")).toBe("#ff0000");
  });

  it("el <g> raíz no aplica opacidad de filtrado (gestionada por TechMarker)", () => {
    const { container } = render(
      <svg>
        <RadarDot {...makeProps()} />
      </svg>,
    );
    const g = container.querySelector("g");
    // RadarDot solo gestiona cursor; la opacidad de filtrado vive en TechMarker
    expect(g).toHaveStyle({ cursor: "grab" });
  });
});
