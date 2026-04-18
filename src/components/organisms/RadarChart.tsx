"use client";

// ═══════════════════════════════════════════════════════════════
// RadarChart — Wrapper delegante: expone RadarSVG al árbol de páginas.
// Responsabilidad única: forwarding del ref para exportación PNG/PDF.
// Toda la lógica de render vive en RadarSVG.
// ═══════════════════════════════════════════════════════════════

import { forwardRef } from "react";
import { RadarSVG } from "./RadarSVG";
import type { RadarSVGProps } from "@/types/radar-render.types";

export const RadarChart = forwardRef<SVGSVGElement, RadarSVGProps>(
  function RadarChart(props, ref) {
    return <RadarSVG ref={ref} {...props} />;
  },
);
