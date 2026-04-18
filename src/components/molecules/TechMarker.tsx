// ═══════════════════════════════════════════════════════════════
// TechMarker — Molécula SVG: punto + etiqueta de una tecnología.
// Compone RadarDot + TechLabel en un <g> con data-tech-id.
// ═══════════════════════════════════════════════════════════════

import { RadarDot } from "@/components/atoms/RadarDot";
import { TechLabel } from "@/components/atoms/TechLabel";
import type { TechMarkerProps } from "@/types/radar-render.types";

/**
 * Agrupa el punto interactivo y la etiqueta de texto de una tecnología.
 *
 * La separación RadarDot + TechLabel permite:
 * - Testear el dot sin texto y viceversa.
 * - El dot gestiona eventos de puntero; el label los ignora.
 * - El atributo `data-tech-id` facilita selección en tests E2E.
 *
 * El click toggle se resuelve en el padre (RadarSVG): si la tech ya
 * está seleccionada, onSelect pasa null (deselect); si no, pasa el id.
 */
export function TechMarker({
  layout,
  sectorColor,
  isSelected,
  isHovered,
  animationStyle,
  onSelect,
  onHover,
}: TechMarkerProps) {
  const { x, y, labelLines, labelOffsetY } = layout;
  const isActive = isSelected || isHovered;

  return (
    <g data-tech-id={layout.tech.id} style={animationStyle}>
      <RadarDot
        layout={layout}
        sectorColor={sectorColor}
        isSelected={isSelected}
        isHovered={isHovered}
        onSelect={onSelect}
        onHover={onHover}
      />
      <TechLabel
        lines={labelLines}
        x={x}
        y={y}
        offsetY={labelOffsetY}
        isActive={isActive}
        color={sectorColor}
      />
    </g>
  );
}
