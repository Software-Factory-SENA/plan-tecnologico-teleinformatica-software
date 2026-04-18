import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FilterPanel } from "../FilterPanel";
import type { FilterPanelProps } from "@/types/radar-render.types";
import type { SectorData, RingData } from "@/types/radar-data.types";

// ── Fixtures ──────────────────────────────────────────────────

const sectors: SectorData[] = [
  {
    id: "D1",
    index: 0,
    label: "Conectividad",
    shortLabel: "D1: Conectividad",
    color: "#1b5e20",
    bgLight: "#e8f5e9",
    bgDark: "#c8e6c9",
    icon: "📡",
  },
  {
    id: "D2",
    index: 1,
    label: "Computación",
    shortLabel: "D2: Computación",
    color: "#0d47a1",
    bgLight: "#e3f2fd",
    bgDark: "#bbdefb",
    icon: "💻",
  },
];

const rings: RingData[] = [
  {
    id: "adopt",
    index: 0,
    label: "Adoptar",
    shortLabel: "ADO",
    radius: 110,
    color: "#2e7d32",
    fillColor: "#e8f5e9",
    borderColor: "#66bb6a",
    labelColor: "#1b5e20",
    desc: "Implementar ahora",
    trlRange: { min: 7, max: 9 },
    trlLabel: "TRL 7-9",
    action: "Acción adopt",
  },
  {
    id: "trial",
    index: 1,
    label: "Probar",
    shortLabel: "PRU",
    radius: 210,
    color: "#f57f17",
    fillColor: "#fffde7",
    borderColor: "#ffee58",
    labelColor: "#f57f17",
    desc: "Piloto recomendado",
    trlRange: { min: 4, max: 6 },
    trlLabel: "TRL 4-6",
    action: "Acción trial",
  },
];

function makeProps(overrides: Partial<FilterPanelProps> = {}): FilterPanelProps {
  return {
    sectors,
    rings,
    filters: {
      sectors: new Set([0, 1]),
      rings: new Set([0, 1]),
    },
    filteredCount: 10,
    totalCount: 10,
    onToggleSector: vi.fn(),
    onToggleRing: vi.fn(),
    onReset: vi.fn(),
    ...overrides,
  };
}

// ── FilterPanel ───────────────────────────────────────────────

describe("FilterPanel", () => {
  it("renderiza un botón por sector", () => {
    render(<FilterPanel {...makeProps()} />);
    expect(screen.getByTitle(/D1/)).toBeInTheDocument();
    expect(screen.getByTitle(/D2/)).toBeInTheDocument();
  });

  it("renderiza un botón por anillo", () => {
    render(<FilterPanel {...makeProps()} />);
    expect(screen.getByText("Adoptar")).toBeInTheDocument();
    expect(screen.getByText("Probar")).toBeInTheDocument();
  });

  it("sector activo tiene aria-pressed='true'", () => {
    render(<FilterPanel {...makeProps()} />);
    const d1Btn = screen.getByTitle(/Ocultar D1/);
    expect(d1Btn).toHaveAttribute("aria-pressed", "true");
  });

  it("sector inactivo tiene aria-pressed='false'", () => {
    const props = makeProps({
      filters: { sectors: new Set([1]), rings: new Set([0, 1]) }, // D1 inactivo
    });
    render(<FilterPanel {...props} />);
    const d1Btn = screen.getByTitle(/Mostrar D1/);
    expect(d1Btn).toHaveAttribute("aria-pressed", "false");
  });

  it("click en sector llama onToggleSector con su index", () => {
    const onToggleSector = vi.fn();
    render(<FilterPanel {...makeProps({ onToggleSector })} />);
    fireEvent.click(screen.getByTitle(/Ocultar D1/));
    expect(onToggleSector).toHaveBeenCalledWith(0);
  });

  it("click en anillo llama onToggleRing con su index", () => {
    const onToggleRing = vi.fn();
    render(<FilterPanel {...makeProps({ onToggleRing })} />);
    fireEvent.click(screen.getByText("Adoptar").closest("button")!);
    expect(onToggleRing).toHaveBeenCalledWith(0);
  });

  it("muestra el contador de tecnologías filtradas", () => {
    render(<FilterPanel {...makeProps({ filteredCount: 7, totalCount: 10 })} />);
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText(/10 tecnologías/)).toBeInTheDocument();
  });

  it("botón Restablecer NO se muestra cuando filteredCount = totalCount", () => {
    render(<FilterPanel {...makeProps({ filteredCount: 10, totalCount: 10 })} />);
    expect(screen.queryByText("Restablecer")).not.toBeInTheDocument();
  });

  it("botón Restablecer SE muestra cuando filteredCount < totalCount", () => {
    render(<FilterPanel {...makeProps({ filteredCount: 5, totalCount: 10 })} />);
    expect(screen.getByText("Restablecer")).toBeInTheDocument();
  });

  it("click en Restablecer llama onReset", () => {
    const onReset = vi.fn();
    render(
      <FilterPanel {...makeProps({ filteredCount: 5, totalCount: 10, onReset })} />,
    );
    fireEvent.click(screen.getByText("Restablecer"));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("icono del sector se renderiza en el botón", () => {
    render(<FilterPanel {...makeProps()} />);
    expect(screen.getByText("📡")).toBeInTheDocument();
    expect(screen.getByText("💻")).toBeInTheDocument();
  });

  it("etiqueta TRL del anillo se muestra", () => {
    render(<FilterPanel {...makeProps()} />);
    expect(screen.getByText("TRL 7-9")).toBeInTheDocument();
    expect(screen.getByText("TRL 4-6")).toBeInTheDocument();
  });
});
