"use client";

// ═══════════════════════════════════════════════════════════════
// RadarSVG — Organismo SVG puro: renderiza el radar completo.
// Sin estado propio. forwardRef expone el SVGSVGElement para export.
// Compone átomos y moléculas de Fase 5; cero imports de radar-data.
// ═══════════════════════════════════════════════════════════════

import { forwardRef, useMemo } from "react";
import { RadarRing } from "@/components/atoms/RadarRing";
import { RingLabel } from "@/components/atoms/RingLabel";
import { SectorDivider } from "@/components/atoms/SectorDivider";
import { AreaDivider } from "@/components/atoms/AreaDivider";
import { AreaLabel } from "@/components/atoms/AreaLabel";
import { TechMarker } from "@/components/molecules/TechMarker";
import { SectorLabel } from "@/components/molecules/SectorLabel";
import { useRadarAnimations } from "@/hooks/useRadarAnimations";
import type { RadarSVGProps } from "@/types/radar-render.types";

/**
 * Renderizador SVG del radar tecnológico.
 *
 * Orden de capas (de atrás a adelante):
 *  1. Fondo blanco
 *  2. Título
 *  3. Anillos (outermost → innermost)
 *  4. Etiquetas de anillo
 *  5. Divisores de sector (línea punteada)
 *  6. Etiquetas de sector (fuera del anillo exterior)
 *  7. Marcadores de tecnología (dot + label)
 *  8. Atribución de fuente
 */
export const RadarSVG = forwardRef<SVGSVGElement, RadarSVGProps>(
  function RadarSVG(
    {
      layout,
      filteredTechIds,
      selectedTechId,
      hoveredTechId,
      activeSectors,
      activeRings,
      meta,
      onSelectTech,
      onHoverTech,
    },
    ref,
  ) {
    const { svgWidth, svgHeight, centerX: cx, centerY: cy, rings, sectors, areas, technologies } = layout;
    const { getAnimationStyle } = useRadarAnimations(filteredTechIds);

    // Radio del anillo más externo (último en el array ordenado por index)
    const outerRadius = rings.at(-1)?.outerRadius ?? 400;
    // Radio del anillo más interno (primero en el array)
    const innerRadius = rings.at(0)?.innerRadius ?? 0;

    // ── Posiciones dinámicas de título y atribución ────────────
    // Se anclan al padding vertical disponible (arriba/abajo del
    // radar) para respetar cualquier cambio en el layout del JSON
    // sin hard-codes. topPad = centerY - outerRadius.
    const topPad = cy - outerRadius;
    const bottomPad = svgHeight - cy - outerRadius;
    const titleY = Math.round(topPad * 0.32);
    const sourceY = svgHeight - Math.round(bottomPad * 0.38);
    const titleFontSize = Math.max(18, Math.min(30, svgWidth * 0.021));
    const sourceFontSize = Math.max(10, Math.min(16, svgWidth * 0.011));
    const authorFontSize = Math.max(9, Math.min(14, svgWidth * 0.0095));
    const authorY = sourceY + Math.round(sourceFontSize * 1.4);
    const firstAuthor = meta.authors?.[0];

    // Mapa rápido: sectorIndex → color del sector
    const sectorColorMap = useMemo(
      () => new Map(sectors.map((s) => [s.sector.index, s.sector.color])),
      [sectors],
    );

    // Mapa rápido: sectorIndex → color del sector (para área labels)
    const sectorColorBySectorIndex = sectorColorMap;

    // Áreas: filtrar la primera de cada sector (coincide con el divisor de sector)
    // para evitar líneas duplicadas sobre los bordes del cono.
    const areaDividersToRender = useMemo(() => {
      if (!areas || areas.length === 0) return [];
      // Para cada sector, encontrar el startAngle mínimo (= startAngle del sector)
      const sectorFirstAngle = new Map<number, number>();
      for (const sg of sectors) {
        sectorFirstAngle.set(sg.sector.index, sg.startAngle);
      }
      // Solo renderizar el divisor si el startAngle del área NO coincide
      // con el startAngle de su sector padre (primera área → skip)
      return areas.filter((ag) => {
        const sectorStart = sectorFirstAngle.get(ag.sectorIndex);
        return sectorStart !== undefined && Math.abs(ag.startAngle - sectorStart) > 0.01;
      });
    }, [areas, sectors]);

    return (
      <svg
        ref={ref}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-full"
        style={{ fontFamily: "system-ui, sans-serif" }}
        aria-label={meta.title}
      >
        {/* Fondo blanco — cubre todo el viewBox incluyendo área de etiquetas */}
        <rect width={svgWidth} height={svgHeight} fill="#ffffff" rx="16" />

        {/* Título — Y proporcional al padding superior */}
        <text
          x={cx}
          y={titleY}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#1a1a2e"
          fontSize={titleFontSize}
          fontWeight={700}
          letterSpacing="0.5"
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          {meta.title}
        </text>

        {/* Anillos — el más externo primero para que los interiores queden encima */}
        {[...rings].reverse().map((ringGeom) => (
          <RadarRing key={ringGeom.ring.id} geometry={ringGeom} cx={cx} cy={cy} />
        ))}

        {/* Etiquetas de anillo — dimmed si el anillo está inactivo */}
        {rings.map((ringGeom) => (
          <RingLabel
            key={`rl-${ringGeom.ring.id}`}
            ring={ringGeom.ring}
            geometry={ringGeom}
            cx={cx}
            cy={cy}
            isActive={activeRings.has(ringGeom.ring.index)}
          />
        ))}

        {/* Divisores de sector — 1 línea punteada por sector (FIX Defecto 3) */}
        {sectors.map((sectorGeom) => (
          <SectorDivider
            key={`sd-${sectorGeom.sector.id}`}
            geometry={sectorGeom}
            cx={cx}
            cy={cy}
            outerRadius={outerRadius}
          />
        ))}

        {/* Divisores de Área Tecnológica — línea fina entre áreas del mismo sector */}
        {areaDividersToRender.map((areaGeom) => (
          <AreaDivider
            key={`ad-${areaGeom.area.id}`}
            geometry={areaGeom}
            cx={cx}
            cy={cy}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            color={sectorColorBySectorIndex.get(areaGeom.sectorIndex) ?? "#666666"}
          />
        ))}

        {/* Etiquetas de sector — posicionamiento geométrico (FIX Defecto 7) */}
        {sectors.map((sectorGeom) => (
          <SectorLabel
            key={`sl-${sectorGeom.sector.id}`}
            geometry={sectorGeom}
            cx={cx}
            cy={cy}
            outerRadius={outerRadius}
            isActive={activeSectors.has(sectorGeom.sector.index)}
          />
        ))}

        {/* Etiquetas de Área Tecnológica — shortLabel dentro del cono */}
        {areas && areas.map((areaGeom) => (
          <AreaLabel
            key={`al-${areaGeom.area.id}`}
            geometry={areaGeom}
            cx={cx}
            cy={cy}
            outerRadius={outerRadius}
            color={sectorColorBySectorIndex.get(areaGeom.sectorIndex) ?? "#666666"}
            isActive={activeSectors.has(areaGeom.sectorIndex)}
          />
        ))}

        {/* Marcadores de tecnología — dot + label con animación de filtrado (FIX Defecto 10) */}
        {technologies.map((techLayout) => {
          const sectorColor = sectorColorMap.get(techLayout.sectorIndex) ?? "#888888";
          const isSelected = techLayout.tech.id === selectedTechId;
          const isHovered = techLayout.tech.id === hoveredTechId;

          return (
            <TechMarker
              key={techLayout.tech.id}
              layout={techLayout}
              sectorColor={sectorColor}
              isSelected={isSelected}
              isHovered={isHovered}
              animationStyle={getAnimationStyle(techLayout.tech.id)}
              onSelect={() => onSelectTech(isSelected ? null : techLayout.tech.id)}
              onHover={(hovered) => onHoverTech(hovered ? techLayout.tech.id : null)}
            />
          );
        })}

        {/* Atribución de fuente — Y proporcional al padding inferior */}
        <text
          x={cx}
          y={sourceY}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#8e8e8e"
          fontSize={sourceFontSize}
          fontWeight={500}
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          {meta.source}
        </text>

        {/* Autor — línea secundaria bajo la fuente */}
        {firstAuthor && (
          <text
            x={cx}
            y={authorY}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#8e8e8e"
            fontSize={authorFontSize}
            fontWeight={500}
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            {`Autor: ${firstAuthor}`}
          </text>
        )}
      </svg>
    );
  },
);
