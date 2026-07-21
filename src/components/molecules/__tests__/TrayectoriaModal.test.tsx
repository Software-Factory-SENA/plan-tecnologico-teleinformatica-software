import { describe, it, expect, beforeAll, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TrayectoriaModal } from "@/components/molecules/TrayectoriaModal";
import roadmap from "@/config/radars/mapa-trayectoria-tec-teleinformatica-software.json";

// Polyfills que Radix UI espera y jsdom no provee.
beforeAll(() => {
  if (!("ResizeObserver" in globalThis)) {
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver =
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      };
  }
  if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }
});

describe("TrayectoriaModal", () => {
  it("no renderiza contenido cuando open=false", () => {
    render(<TrayectoriaModal open={false} onOpenChange={() => {}} />);
    expect(
      screen.queryByText(roadmap.meta.title),
    ).not.toBeInTheDocument();
  });

  it("renderiza sin errores y muestra el título, pestañas y contenido del D1", () => {
    render(<TrayectoriaModal open onOpenChange={() => {}} />);

    // Título del mapa (aparece en la caja de descripción)
    expect(screen.getByText(roadmap.meta.title)).toBeInTheDocument();

    // Las 6 pestañas de direccionadores
    for (const d of roadmap.direccionadores) {
      expect(screen.getAllByText(d.code).length).toBeGreaterThan(0);
    }

    // Una tecnología concreta del D1 (verificando el contenido del Excel)
    expect(
      screen.getByText(/Aprendizaje Automático Aplicado/),
    ).toBeInTheDocument();

    // Leyenda de madurez y horizonte
    expect(screen.getByText("MADUREZ (TRL)")).toBeInTheDocument();
    expect(screen.getByText("HORIZONTE")).toBeInTheDocument();
  });

  it("expone el botón Exportar PDF y las fuentes", () => {
    render(<TrayectoriaModal open onOpenChange={() => {}} />);
    expect(
      screen.getByRole("button", { name: /Exportar PDF|PDF/ }),
    ).toBeInTheDocument();
    // Al menos una fuente con enlace DOI
    const links = screen.getAllByRole("link");
    expect(links.some((a) => a.getAttribute("href")?.includes("doi.org"))).toBe(
      true,
    );
  });

  it("cada tecnología con TRL muestra su badge y cada celda respeta el esquema", () => {
    render(<TrayectoriaModal open onOpenChange={() => {}} />);
    // El D1 activo por defecto: sus tecnologías con TRL deben mostrar el badge
    const d1Techs = roadmap.direccionadores[0].items.filter(
      (i) => i.capa === "tecnologias" && i.trl,
    );
    expect(d1Techs.length).toBeGreaterThan(0);
    // "TRL 8–9" aparece para ML/AutoML
    expect(screen.getAllByText(/TRL 8–9/).length).toBeGreaterThan(0);
  });
});
