// ═══════════════════════════════════════════════════════════════
// TechLabel — Átomo SVG: etiqueta multi-línea de una tecnología.
// FIX Defecto 8: recibe labelLines ya calculadas por textWrapper
// (no requiere nameLines manual en el JSON).
// FIX Defecto 6: usa offsetY calculado (no labelDy fantasma).
// Sin estado, sin lógica de negocio.
// ═══════════════════════════════════════════════════════════════

import type { TechLabelProps } from "@/types/radar-render.types";

/**
 * Renderiza la etiqueta de texto de una tecnología bajo su punto.
 *
 * El bloque de texto se centra horizontalmente en (x) y se desplaza
 * verticalmente desde el centro del punto usando offsetY, calculado
 * por computeLabelOffsetY para centrar el bloque multi-línea.
 *
 * Líneas adicionales usan dy="1.2em" (interlineado proporcional).
 */
export function TechLabel({ lines, x, y, offsetY, isActive, color }: TechLabelProps) {
  if (lines.length === 0) return null;

  return (
    <text
      x={x}
      y={y + offsetY}
      textAnchor="middle"
      fill={isActive ? color : "#3a3a5c"}
      fontSize={isActive ? 11 : 9}
      fontWeight={isActive ? 700 : 500}
      style={{ pointerEvents: "none", userSelect: "none" }}
    >
      {lines.map((line, i) => (
        <tspan
          key={i}
          x={x}
          dy={i === 0 ? 0 : "1.2em"}
        >
          {line}
        </tspan>
      ))}
    </text>
  );
}
