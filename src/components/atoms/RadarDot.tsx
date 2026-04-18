// ═══════════════════════════════════════════════════════════════
// RadarDot — Átomo SVG: punto interactivo de una tecnología.
// Gestiona su propio estado visual (normal/hover/selected)
// y aplica el estilo de animación de filtrado.
// ═══════════════════════════════════════════════════════════════

import type { RadarDotProps } from "@/types/radar-render.types";

const DOT_RADIUS_NORMAL = 6;
const DOT_RADIUS_ACTIVE = 8;
const GLOW_RADIUS = 14;

/**
 * Renderiza el círculo interactivo de una tecnología en el radar.
 *
 * Estados visuales:
 * - Normal:    r=6, strokeWidth=1.5, opacity=0.85
 * - Activo:    r=8, strokeWidth=2.5, opacity=1.0
 *              + círculo de glow a r=14 con 20% opacidad del color del sector
 *
 * El `animationStyle` viene de useRadarAnimations y controla la
 * transición de opacidad al filtrar (FIX Defecto 10).
 *
 * El componente es un `<g>` para que el estilo de animación y el
 * cursor se apliquen tanto al dot como al glow.
 */
export function RadarDot({
  layout,
  sectorColor,
  isSelected,
  isHovered,
  onSelect,
  onHover,
}: Omit<RadarDotProps, "animationStyle">) {
  const { x, y } = layout;
  const isActive = isSelected || isHovered;
  const r = isActive ? DOT_RADIUS_ACTIVE : DOT_RADIUS_NORMAL;

  return (
    <g
      style={{ cursor: "grab" }}
      onClick={onSelect}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      aria-label={layout.tech.name}
      role="button"
    >
      {/* Glow — solo cuando activo */}
      {isActive && (
        <circle
          cx={x}
          cy={y}
          r={GLOW_RADIUS}
          fill={sectorColor}
          opacity={0.2}
          style={{ pointerEvents: "none" }}
        />
      )}

      {/* Punto principal */}
      <circle
        cx={x}
        cy={y}
        r={r}
        fill={sectorColor}
        stroke="#ffffff"
        strokeWidth={isActive ? 2.5 : 1.5}
        opacity={isActive ? 1 : 0.85}
      />
    </g>
  );
}
