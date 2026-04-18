// ═══════════════════════════════════════════════════════════════
// AreaLabel — Etiqueta del Área Tecnológica dentro del radar SVG.
//
// Muestra el nombre completo del área en estilo "Título" curvado
// a lo largo del arco interior del anillo exterior, usando
// <textPath>. Se oculta cuando el área es demasiado estrecha para
// leer el texto. El tamaño de fuente y los márgenes angulares son
// proporcionales al ángulo del área, y la dirección del arco se
// invierte en la mitad inferior para mantener el texto en pie.
// ═══════════════════════════════════════════════════════════════

import { polarToXY, toRad } from "@/lib/geometry/polarCoords";
import { toTitleCase } from "@/lib/text/titleCase";
import type { AreaGeometry } from "@/types/radar-layout.types";

interface AreaLabelProps {
  geometry: AreaGeometry;
  cx: number;
  cy: number;
  /** Radio exterior del radar — base para posicionar la etiqueta. */
  outerRadius: number;
  /** Color del texto — por defecto gris medio. */
  color?: string;
  /** True si el área pasa los filtros activos. */
  isActive: boolean;
}

/** Amplitud angular mínima (grados) para renderizar la etiqueta. */
const MIN_ANGLE_FOR_LABEL = 10;

/**
 * Desfase radial desde `outerRadius` hasta el arco del texto.
 * Positivo = fuera del anillo exterior, evitando los dots del
 * MONITOREAR. El arco queda entre el anillo y el SectorLabel
 * (`SectorLabel.LABEL_RADIAL_OFFSET` = 48).
 */
const LABEL_RADIAL_OFFSET = 14;

/** Fracción del arco que se usa para el texto (deja 6% de margen). */
const SAFE_ARC_FRACTION = 0.88;

/**
 * Tamaño de fuente proporcional al radio exterior y al ángulo del área.
 * Acotado a [8, 12] px para garantizar legibilidad sin saturar.
 */
function computeFontSize(outerRadius: number, areaAngle: number): number {
  const base = outerRadius * 0.022;                            // ≈ 8.8 a r=400
  const arcFactor = Math.min(1.3, Math.max(0.85, areaAngle / 60));
  return Math.round(Math.max(8, Math.min(12, base * arcFactor)) * 10) / 10;
}

/**
 * Trunca el texto con "…" si excede la capacidad angular aproximada del arco.
 * La estimación usa ancho medio de carácter ≈ 0.55 × fontSize.
 */
function truncateToArc(
  text: string,
  arcLengthPx: number,
  fontSize: number,
): string {
  const approxCharWidth = fontSize * 0.55;
  const maxChars = Math.max(4, Math.floor(arcLengthPx / approxCharWidth));
  if (text.length <= maxChars) return text;
  return text.slice(0, Math.max(1, maxChars - 1)).trimEnd() + "…";
}

/**
 * Construye el atributo `d` de un path de arco circular.
 * Para arcos en la mitad inferior (sin(midAngle) > 0) invierte
 * el sentido del barrido para que `<textPath>` no voltee el texto.
 */
function buildArcPath(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  midAngle: number,
): string {
  const start = polarToXY(cx, cy, radius, startAngle);
  const end = polarToXY(cx, cy, radius, endAngle);
  const isBottomHalf = Math.sin(toRad(midAngle)) > 0.05;

  // SVG arc flags: largeArcFlag=0 (siempre <180° por diseño), sweepFlag.
  // sweep=1 → clockwise; sweep=0 → counter-clockwise (útil para invertir).
  return isBottomHalf
    ? `M${end.x},${end.y} A${radius},${radius} 0 0,0 ${start.x},${start.y}`
    : `M${start.x},${start.y} A${radius},${radius} 0 0,1 ${end.x},${end.y}`;
}

/**
 * Renderiza el nombre del área curvado a lo largo del anillo exterior.
 * La tipografía es vectorial (SVG <text>) y escala de forma natural
 * con el `viewBox` del radar — responsive en web y móvil sin reglas
 * adicionales.
 */
export function AreaLabel({
  geometry,
  cx,
  cy,
  outerRadius,
  color = "#555555",
  isActive,
}: AreaLabelProps) {
  const { area, areaAngle, midAngle, startAngle, endAngle } = geometry;

  if (areaAngle < MIN_ANGLE_FOR_LABEL) return null;

  const title = toTitleCase(area.label);
  const radius = outerRadius + LABEL_RADIAL_OFFSET;
  const fontSize = computeFontSize(outerRadius, areaAngle);

  // Acotar el arco al 88% del ángulo total para evitar el borde del sector.
  const safeAngle = areaAngle * SAFE_ARC_FRACTION;
  const angleMargin = (areaAngle - safeAngle) / 2;
  const a0 = startAngle + angleMargin;
  const a1 = endAngle - angleMargin;

  const arcLengthPx = radius * toRad(safeAngle);
  const truncated = truncateToArc(title, arcLengthPx, fontSize);

  const pathD = buildArcPath(cx, cy, radius, a0, a1, midAngle);
  const pathId = `area-label-path-${area.id}`;

  return (
    <g opacity={isActive ? 0.85 : 0.3}>
      <path id={pathId} d={pathD} fill="none" stroke="none" />
      <text
        fill={color}
        fontSize={fontSize}
        fontWeight={500}
        letterSpacing="0.2"
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <textPath
          href={`#${pathId}`}
          startOffset="50%"
          textAnchor="middle"
        >
          {truncated}
        </textPath>
      </text>
    </g>
  );
}
