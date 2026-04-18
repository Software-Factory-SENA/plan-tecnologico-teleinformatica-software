// ═══════════════════════════════════════════════════════════════
// SectorLabel — Molécula SVG: etiqueta exterior de un sector.
// Muestra el nombre completo del direccionador en estilo "título"
// (Title Case), con tipografía vectorial cuyo tamaño y ancho de
// envolvente son proporcionales al ángulo del sector. La escala
// responsive es natural: el SVG usa viewBox y se re-escala solo.
// ═══════════════════════════════════════════════════════════════

import { toRad, polarToXY } from "@/lib/geometry/polarCoords";
import { wrapText } from "@/lib/text/textWrapper";
import { toTitleCase } from "@/lib/text/titleCase";
import type { SectorLabelProps } from "@/types/radar-render.types";

/**
 * Distancia radial desde `outerRadius` hasta el ancla de texto.
 * Pensada para dejar hueco suficiente entre:
 *  - el arco del AreaLabel (outerRadius + ~14)
 *  - la primera línea del título multilínea del direccionador.
 */
const LABEL_RADIAL_OFFSET = 58;

/** Separación horizontal entre el ancla y el inicio del texto. */
const LABEL_PADDING = 12;

/**
 * Decide alineación y desplazamiento X según el lado del radar
 * en que cae el sector (cos del midAngle).
 */
function resolveTextPosition(
  pos: { x: number; y: number },
  midAngle: number,
): { textX: number; textAnchor: "start" | "end" | "middle" } {
  const cosAngle = Math.cos(toRad(midAngle));

  if (cosAngle > 0.1) {
    return { textX: pos.x + LABEL_PADDING, textAnchor: "start" };
  }
  if (cosAngle < -0.1) {
    return { textX: pos.x - LABEL_PADDING, textAnchor: "end" };
  }
  return { textX: pos.x, textAnchor: "middle" };
}

/**
 * Tamaño de fuente proporcional al radio exterior y al ángulo del sector.
 * En modo "proportional" los sectores con más líneas reciben un ángulo
 * mayor y, por tanto, tipografía más grande.
 *
 * Se ancla a [9.5, 15] px para garantizar legibilidad sin invadir
 * sectores vecinos en pantallas pequeñas.
 */
function computeFontSize(outerRadius: number, sectorAngle: number): number {
  const base = outerRadius * 0.029;              // ≈ 11.6 a r=400
  const arcFactor = Math.min(1.25, Math.max(0.8, sectorAngle / 60));
  const raw = base * arcFactor;
  return Math.round(Math.max(9.5, Math.min(15, raw)) * 10) / 10;
}

/**
 * Número máximo de caracteres por línea, proporcional al arco disponible.
 * Un sector de 72° → ~25 caracteres; uno de 36° → ~14.
 * El mínimo (14) evita más de 3 líneas en nombres muy largos como
 * "Aceleración de la Inteligencia Artificial (Superciclo IA)".
 */
function computeMaxChars(sectorAngle: number): number {
  return Math.max(14, Math.min(28, Math.round(sectorAngle * 0.35)));
}

/**
 * Renderiza el nombre del direccionador fuera del anillo externo.
 * Word-wrap automático en 1-3 líneas con altura de línea compacta.
 */
export function SectorLabel({
  geometry,
  cx,
  cy,
  outerRadius,
  isActive,
}: SectorLabelProps) {
  const { sector, midAngle, sectorAngle } = geometry;

  const labelRadius = outerRadius + LABEL_RADIAL_OFFSET;
  const pos = polarToXY(cx, cy, labelRadius, midAngle);
  const { textX, textAnchor } = resolveTextPosition(pos, midAngle);

  const title = toTitleCase(sector.label);
  const fontSize = computeFontSize(outerRadius, sectorAngle);
  const maxChars = computeMaxChars(sectorAngle);
  const lines = wrapText(title, maxChars);

  // Centrar verticalmente el bloque multilínea en el punto polar.
  const lineHeightEm = 1.15;
  const startDyEm = -((lines.length - 1) / 2) * lineHeightEm;

  return (
    <text
      x={textX}
      y={pos.y}
      textAnchor={textAnchor}
      dominantBaseline="middle"
      fill={isActive ? sector.color : "#9e9e9e"}
      fontSize={fontSize}
      fontWeight={600}
      letterSpacing="0.15"
      opacity={isActive ? 1 : 0.3}
      style={{ pointerEvents: "none", userSelect: "none" }}
    >
      {lines.map((line, i) => (
        <tspan
          key={i}
          x={textX}
          dy={i === 0 ? `${startDyEm}em` : `${lineHeightEm}em`}
        >
          {line}
        </tspan>
      ))}
    </text>
  );
}
