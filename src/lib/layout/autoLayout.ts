// ═══════════════════════════════════════════════════════════════
// AUTO LAYOUT — Orquestador principal del motor de posicionamiento.
// Toma RadarConfig (JSON validado) y devuelve RadarLayout completo.
// FIX Defectos: 1 (colisiones), 4 (angleOff manual), 5 (radio),
//               8 (nameLines), 9 (startAngles hardcodeados).
// ═══════════════════════════════════════════════════════════════

import type { RadarConfig, TechnologyData } from "@/types/radar-data.types";
import type {
  RadarLayout,
  TechnologyLayout,
  SectorGeometry,
  RingGeometry,
  AreaGeometry,
} from "@/types/radar-layout.types";
import { computeRingGeometries } from "@/lib/geometry/ringGeometry";
import { computeSectorGeometries } from "@/lib/geometry/sectorGeometry";
import { computeAreaGeometries } from "@/lib/geometry/areaGeometry";
import { polarToXY, toRad } from "@/lib/geometry/polarCoords";
import { wrapText } from "@/lib/text/textWrapper";
import {
  resolveOverlaps,
  resolveLabelOverlaps,
  type BBox,
} from "@/lib/layout/collisionDetection";
import { toTitleCase } from "@/lib/text/titleCase";

// ── Constantes de layout ──────────────────────────────────────

/**
 * Fracción del ángulo del grupo disponible para distribuir puntos.
 * 0.88 deja un 6% de margen en cada borde del área/sector.
 */
const SAFE_FRACTION = 0.88;

/** Máximo de caracteres por línea en los labels de tecnología */
const MAX_CHARS_PER_LINE = 16;

/** Radio del punto en estado normal (px) */
const DOT_RADIUS_NORMAL = 6;

/** Gap entre el borde del punto y la primera línea del label (px) */
const LABEL_GAP_PX = 7;

/**
 * Distancia mínima entre centros de puntos para resolveOverlaps (px).
 * Debe ser suficiente para que dos etiquetas multilínea adyacentes no
 * se toquen. Con DOT_RADIUS=6 y labels de 3-4 líneas a 11 px, ~40 px
 * garantiza separación visual clara sin desbordar los anillos.
 */
const MIN_DIST_PX = 40;

/** Máximo de iteraciones de resolución de colisiones */
const MAX_OVERLAP_ITER = 60;

/**
 * Pitch mínimo entre centros de puntos en el mismo arco (px).
 * 2 × radio + margen visual cómodo.
 */
const DOT_PITCH = DOT_RADIUS_NORMAL * 2 + 6; // 18px

// ── Helpers privados ─────────────────────────────────────────

/** Construye Map<sectorId, SectorGeometry> para lookup O(1) */
function buildSectorMap(
  sectorGeoms: SectorGeometry[],
): Map<string, SectorGeometry> {
  return new Map(sectorGeoms.map((sg) => [sg.sector.id, sg]));
}

/** Construye Map<areaId, AreaGeometry> para lookup O(1) */
function buildAreaMap(
  areaGeoms: AreaGeometry[],
): Map<string, AreaGeometry> {
  return new Map(areaGeoms.map((ag) => [ag.area.id, ag]));
}

/** Construye Map<ringId, RingGeometry> para lookup O(1) */
function buildRingMap(ringGeoms: RingGeometry[]): Map<string, RingGeometry> {
  return new Map(ringGeoms.map((rg) => [rg.ring.id, rg]));
}

/**
 * Agrupa tecnologías por celda y ordena cada grupo por tech.id.
 * La clave compuesta usa "|" que no aparece en ningún ID del schema.
 *
 * Cuando `useAreas=true`: clave = `areaId|ringId` (layout jerárquico)
 * Cuando `useAreas=false`: clave = `sectorId|ringId` (layout plano — fallback)
 *
 * Ordenar por tech.id garantiza layout determinista entre runs.
 */
function groupByCell(
  technologies: TechnologyData[],
  useAreas: boolean,
): Map<string, TechnologyData[]> {
  const cellMap = new Map<string, TechnologyData[]>();

  for (const tech of technologies) {
    const groupKey = useAreas && tech.area ? tech.area : tech.sector;
    const key = `${groupKey}|${tech.ring}`;
    const group = cellMap.get(key);
    if (group) {
      group.push(tech);
    } else {
      cellMap.set(key, [tech]);
    }
  }

  // Ordenar cada grupo por tech.id para layout determinista
  for (const group of cellMap.values()) {
    group.sort((a, b) => a.id.localeCompare(b.id));
  }

  return cellMap;
}

/**
 * Distribuye N puntos en la celda (área/sector × anillo) usando una cuadrícula
 * de arcos concéntricos que respeta la geometría real del espacio disponible.
 *
 * Algoritmo de arcos concéntricos:
 * ─────────────────────────────────
 * 1. Calcular el espacio angulares seguro: safeAngle = groupAngle × safeFraction
 * 2. Determinar la geometría radial usable: [minR, maxR] dentro del anillo
 * 3. Calcular el aspect-ratio del arco medio: midArcLen / ringUsable
 * 4. Derivar una cuadrícula de `rows × cols` cuya proporción se ajusta a
 *    la geometría → los puntos se distribuyen de forma quasi-cuadrada
 * 5. Fila 0 = arco externo (más espacio), fila N-1 = arco interno
 * 6. Dentro de cada fila, los puntos se espacian uniformemente en ángulo
 *
 * Ventajas sobre la distribución diagonal anterior:
 * - Aprovecha el 100% del ancho del anillo
 * - Las filas externas (más arco disponible) reciben más puntos si hace falta
 * - No hay puntos acumulados en el radio central
 * - Funciona bien con sectores proporcionales (D1 tiene más ángulo → más columnas)
 *
 * @param centerAngle  - Ángulo central del grupo (midAngle del área o sector)
 * @param groupAngle   - Amplitud angular total del grupo en grados
 * @param innerRadius  - Radio interior del anillo
 * @param outerRadius  - Radio exterior del anillo
 * @param count        - Número de tecnologías en la celda
 * @param safeFraction - Fracción del ángulo disponible (default: SAFE_FRACTION)
 */
function distributePositions(
  centerAngle: number,
  groupAngle: number,
  innerRadius: number,
  outerRadius: number,
  count: number,
  safeFraction = SAFE_FRACTION,
): Array<{ angle: number; radius: number }> {
  if (count === 0) return [];

  const safeAngle = groupAngle * safeFraction;
  const halfSafe = safeAngle / 2;
  const safeAngleRad = safeAngle * (Math.PI / 180);

  // Márgenes radiales: dejar espacio para el radio del dot
  const minR = Math.max(innerRadius + DOT_RADIUS_NORMAL + 2, DOT_RADIUS_NORMAL + 4);
  const maxR = outerRadius - DOT_RADIUS_NORMAL - 2;
  const ringUsable = Math.max(0, maxR - minR);
  const midR = (minR + maxR) / 2;

  // Caso degenerado: anillo demasiado estrecho
  if (ringUsable < 2 || safeAngle < 1) {
    const r = (innerRadius + outerRadius) / 2;
    const spacing = count > 1 ? safeAngle / count : 0;
    return Array.from({ length: count }, (_, i) => ({
      angle: centerAngle - halfSafe + spacing * (i + 0.5),
      radius: r,
    }));
  }

  if (count === 1) {
    return [{ angle: centerAngle, radius: midR }];
  }

  // ── Cálculo de la cuadrícula rows × cols ─────────────────────
  // Arc length en el radio medio: determina cuántas columnas caben "naturalmente"
  const midArcLen = midR * safeAngleRad;
  const aspectRatio = midArcLen / ringUsable; // cols/rows natural

  // Número de filas: sqrt(count / aspectRatio), acotado por el espacio radial
  const maxRowsBySpace = Math.max(
    1,
    Math.floor(ringUsable / DOT_PITCH) + 1,
  );

  // Forzar un mínimo de filas cuando hay varios puntos en la celda:
  // las etiquetas de tecnología son multilínea (30-55 px), por lo que
  // colocar 3+ puntos en una única fila los apila sobre las etiquetas
  // del vecino. Dos filas reparten la carga radialmente.
  const minRowsByCount =
    count >= 5 ? 3 : count >= 3 ? 2 : 1;
  const minRows = Math.min(minRowsByCount, maxRowsBySpace);

  let rows = Math.min(
    maxRowsBySpace,
    Math.max(minRows, Math.round(Math.sqrt(count / Math.max(aspectRatio, 0.2)))),
  );
  let cols = Math.ceil(count / rows);

  // Ajuste fino: asegurar rows × cols ≥ count
  while (cols * rows < count) rows++;

  // ── Colocación en la cuadrícula ──────────────────────────────
  const results: Array<{ angle: number; radius: number }> = [];
  let idx = 0;

  for (let row = 0; row < rows && idx < count; row++) {
    // Radio de la fila: distribuido uniformemente de maxR (exterior) a minR (interior)
    const r =
      rows === 1
        ? midR
        : maxR - (ringUsable * row) / (rows - 1);

    // Puntos en esta fila
    const dotsInRow = Math.min(cols, count - idx);

    for (let col = 0; col < dotsInRow; col++) {
      // Fracción centrada: 0.5/dotsInRow … (dotsInRow-0.5)/dotsInRow
      const fraction = (col + 0.5) / dotsInRow;
      results.push({
        angle: centerAngle - halfSafe + safeAngle * fraction,
        radius: r,
      });
      idx++;
    }
  }

  return results;
}

// ── API pública ───────────────────────────────────────────────

/**
 * Calcula el layout completo del radar a partir de su configuración JSON.
 *
 * Algoritmo (9 pasos):
 * 1. Calcular geometrías de anillos (midRadius consistente)
 * 2. Calcular geometrías de sectores (startAngles automáticos)
 * 3. Construir lookup maps para resolución de referencias
 * 4. Agrupar tecnologías por celda (sector × anillo)
 * 5. Distribuir ángulos automáticamente (N+1 slots)
 * 6. Convertir polar → cartesiano para cada punto
 * 7. Calcular label lines (word-wrap) y labelOffsetY
 * 8. Resolver solapamientos (repulsión radial iterativa)
 * 9. Ensamblar y devolver RadarLayout
 *
 * @param config - RadarConfig validado por validateRadarConfig
 * @returns RadarLayout completo, listo para renderizar
 */
export function computeAutoLayout(config: RadarConfig): RadarLayout {
  const { layout: layoutCfg, rings, sectors, areas, technologies } = config;
  const { centerX: cx, centerY: cy } = layoutCfg;

  // ── Paso 1: Geometrías de anillos ────────────────────────────
  const ringGeoms = computeRingGeometries(rings);

  // ── Paso 2: Geometrías de sectores ───────────────────────────
  // Modo proporcional: cada sector recibe ángulo ∝ a su conteo de tecnologías.
  // Evita saturación en sectores con muchas más tecnologías que el resto.
  let techCountBySector: Map<string, number> | undefined;
  if (layoutCfg.sectorAllocation === "proportional") {
    techCountBySector = new Map<string, number>();
    for (const sector of sectors) techCountBySector.set(sector.id, 0);
    for (const tech of technologies) {
      if (techCountBySector.has(tech.sector)) {
        techCountBySector.set(
          tech.sector,
          (techCountBySector.get(tech.sector) ?? 0) + 1,
        );
      }
    }
  }

  const sectorGeoms = computeSectorGeometries(
    sectors,
    layoutCfg.sectorRotationOffset,
    techCountBySector,
  );

  // ── Paso 2b: Geometrías de áreas (si están definidas) ────────
  const hasAreas = Array.isArray(areas) && areas.length > 0;
  const areaGeoms = hasAreas
    ? computeAreaGeometries(areas!, technologies, sectorGeoms)
    : [];

  // ── Paso 3: Lookup maps ──────────────────────────────────────
  const sectorMap = buildSectorMap(sectorGeoms);
  const areaMap = buildAreaMap(areaGeoms);
  const ringMap = buildRingMap(ringGeoms);

  // ── Paso 4: Agrupar por celda ────────────────────────────────
  // Modo jerárquico (áreas): clave = areaId|ringId
  // Modo plano (fallback):   clave = sectorId|ringId
  const cellMap = groupByCell(technologies, hasAreas);

  // ── Pasos 5-7: Calcular posición y labels por celda ──────────
  const rawLayouts: TechnologyLayout[] = [];

  for (const [cellKey, cellTechs] of cellMap.entries()) {
    const [groupId, ringId] = cellKey.split("|");

    const ringGeom = ringMap.get(ringId);
    if (!ringGeom) {
      throw new Error(
        `[autoLayout] Anillo "${ringId}" referenciado en tecnología no existe en la configuración.`,
      );
    }

    // Obtener la geometría angular según el modo activo
    let centerAngle: number;
    let groupAngle: number;
    let sectorIndex: number;

    if (hasAreas) {
      // Modo jerárquico: groupId = areaId
      const areaGeom = areaMap.get(groupId);
      if (!areaGeom) {
        // Área no encontrada → fallback a sector de la primera tech del grupo
        const sectorGeom = sectorMap.get(cellTechs[0].sector);
        if (!sectorGeom) {
          throw new Error(
            `[autoLayout] Sector "${cellTechs[0].sector}" no existe en la configuración.`,
          );
        }
        centerAngle = sectorGeom.midAngle;
        groupAngle = sectorGeom.sectorAngle;
        sectorIndex = sectorGeom.sector.index;
      } else {
        centerAngle = areaGeom.midAngle;
        groupAngle = areaGeom.areaAngle;
        sectorIndex = areaGeom.sectorIndex;
      }
    } else {
      // Modo plano: groupId = sectorId
      const sectorGeom = sectorMap.get(groupId);
      if (!sectorGeom) {
        throw new Error(
          `[autoLayout] Sector "${groupId}" referenciado en tecnología no existe en la configuración.`,
        );
      }
      centerAngle = sectorGeom.midAngle;
      groupAngle = sectorGeom.sectorAngle;
      sectorIndex = sectorGeom.sector.index;
    }

    // Paso 5: Distribuir posiciones dentro de la celda (área × anillo)
    const positions = distributePositions(
      centerAngle,
      groupAngle,
      ringGeom.innerRadius,
      ringGeom.outerRadius,
      cellTechs.length,
    );

    // Pasos 6-7: Posición y labels por tecnología
    cellTechs.forEach((tech, i) => {
      const { angle: computedAngle, radius } = positions[i];
      const { x, y } = polarToXY(cx, cy, radius, computedAngle);

      const labelLines = wrapText(tech.name, MAX_CHARS_PER_LINE);
      const labelOffsetY = DOT_RADIUS_NORMAL + LABEL_GAP_PX;

      rawLayouts.push({
        tech,
        sectorIndex,
        ringIndex: ringGeom.ring.index,
        computedAngle,
        radius,
        x,
        y,
        labelLines,
        labelOffsetY,
      });
    });
  }

  // ── Paso 8a: Resolver solapamientos de DOTS (centros) ───────
  const dotResolvedLayouts = resolveOverlaps(
    rawLayouts,
    cx,
    cy,
    MIN_DIST_PX,
    MAX_OVERLAP_ITER,
  );

  // ── Paso 8b: Resolver solapamientos de ETIQUETAS (bbox) ─────
  // Considera el tamaño real del label multilínea y reparte los
  // dots entre anillos adyacentes cuyos labels se apilen.
  // Cada dot queda clamp-eado a su anillo original.
  const ringByIndex = new Map<number, typeof ringGeoms[number]>(
    ringGeoms.map((rg) => [rg.ring.index, rg]),
  );

  // Obstáculos estáticos: las etiquetas de anillo (ADOPTAR, PROBAR,
  // EVALUAR, MONITOREAR) en el top de cada banda. Son inamovibles;
  // si una tech-label las invade, el dot es reubicado angularmente
  // (dentro de su anillo) para liberarlas.
  const ringLabelObstacles: BBox[] = ringGeoms.map((rg) => {
    // Debe coincidir con RingLabel.tsx:
    //   y = cy - outerRadius + 14, dominantBaseline=middle,
    //   fontSize=11, letterSpacing=2.
    const RING_FONT = 11;
    const RING_LS = 2;
    const charAdv = RING_FONT * 0.55 + RING_LS;     // ≈ 8.05 px
    const labelW = rg.ring.label.length * charAdv + 8; // +padding
    const labelH = RING_FONT + 4;                    // ascent+descent+margen
    const labelY = cy - rg.outerRadius + 14;
    return {
      xMin: cx - labelW / 2,
      xMax: cx + labelW / 2,
      yMin: labelY - labelH / 2,
      yMax: labelY + labelH / 2,
    };
  });

  // Obstáculos curvos: etiquetas de AREA que curvan fuera del anillo
  // exterior (ver AreaLabel.tsx). Una tech-label en MONITOREAR puede
  // extenderse hacia afuera y cruzar el arco del área label; aquí
  // aproximamos el arco con N rectángulos pequeños a lo largo del
  // rango angular real que ocupa el texto del área, para que el pase
  // de colisión desplace el dot angularmente dentro de su anillo.
  const outerRingR = ringGeoms.at(-1)?.outerRadius ?? 400;
  const AREA_LABEL_RADIAL_OFFSET = 14;   // debe coincidir con AreaLabel.tsx
  const AREA_LABEL_SAFE_FRACTION = 0.88; // debe coincidir con AreaLabel.tsx
  const areaLabelArcR = outerRingR + AREA_LABEL_RADIAL_OFFSET;

  const areaLabelObstacles: BBox[] = [];
  for (const ag of areaGeoms) {
    // Debe replicar AreaLabel.computeFontSize:
    const base = outerRingR * 0.022;
    const arcFactor = Math.min(1.3, Math.max(0.85, ag.areaAngle / 60));
    const fontSize =
      Math.round(Math.max(8, Math.min(12, base * arcFactor)) * 10) / 10;
    const charW = fontSize * 0.55;

    // Texto real en estilo título (puede venir truncado con "…").
    const title = toTitleCase(ag.area.label);
    const arcLenPx = areaLabelArcR * toRad(ag.areaAngle);
    const safeArcLenPx = arcLenPx * AREA_LABEL_SAFE_FRACTION;
    const maxChars = Math.max(4, Math.floor(safeArcLenPx / charW));
    const visibleChars = Math.min(title.length, maxChars);

    // Extensión angular real que ocupa el texto.
    const textPx = visibleChars * charW;
    const textAngDeg = (textPx / areaLabelArcR) * (180 / Math.PI);
    const halfAngDeg = textAngDeg / 2;
    const startA = ag.midAngle - halfAngDeg;

    // El texto "hangs" desde el path hacia afuera ≈ fontSize px.
    // Sampleamos el arco en segmentos de ≈4° y generamos un bbox por
    // segmento, con grosor radial suficiente para cubrir el texto.
    const SEG_DEG = 4;
    const segments = Math.max(3, Math.ceil(textAngDeg / SEG_DEG));
    const step = textAngDeg / segments;
    const boxThicknessRadial = fontSize + 6;          // radial coverage
    const segArcHalfLen = (toRad(step) * areaLabelArcR) / 2 + 2;

    for (let s = 0; s < segments; s++) {
      const a = startA + step * (s + 0.5);
      // Centro del bbox: ligeramente hacia afuera del arco para cubrir
      // los caracteres que cuelgan outward.
      const centerR = areaLabelArcR + boxThicknessRadial / 2 - 2;
      const c = polarToXY(cx, cy, centerR, a);
      areaLabelObstacles.push({
        xMin: c.x - segArcHalfLen,
        xMax: c.x + segArcHalfLen,
        yMin: c.y - boxThicknessRadial / 2,
        yMax: c.y + boxThicknessRadial / 2,
      });
    }
  }

  const resolvedLayouts = resolveLabelOverlaps(
    dotResolvedLayouts,
    ringByIndex,
    cx,
    cy,
    MAX_OVERLAP_ITER,
    [...ringLabelObstacles, ...areaLabelObstacles],
  );

  // ── Paso 9: Ensamblar RadarLayout ────────────────────────────
  return {
    sectors: sectorGeoms,
    areas: areaGeoms,
    rings: ringGeoms,
    technologies: resolvedLayouts,
    svgWidth: layoutCfg.svgWidth,
    svgHeight: layoutCfg.svgHeight,
    centerX: cx,
    centerY: cy,
  };
}
