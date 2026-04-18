// ═══════════════════════════════════════════════════════════════
// DETECCIÓN DE COLISIONES — Repulsión 2D cartesiana iterativa.
// FIX Defecto 1: elimina solapamientos entre puntos del radar.
// La repulsión es bidireccional (x,y) para separar tanto radial
// como angularmente, a diferencia de la anterior que solo empujaba
// en dirección radial (ineficaz para puntos al mismo radio).
// Función pura: no muta el array de entrada.
// ═══════════════════════════════════════════════════════════════

import type {
  TechnologyLayout,
  RingGeometry,
} from "@/types/radar-layout.types";
import { toDeg, round4 } from "@/lib/geometry/polarCoords";

// ── Helpers privados ─────────────────────────────────────────

/** Distancia euclidiana entre dos puntos de layout */
function dist(a: TechnologyLayout, b: TechnologyLayout): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Desplaza un punto en coordenadas cartesianas (ddx, ddy) y recalcula
 * radio y ángulo desde el nuevo (x, y).
 *
 * El radio resultante se clamp a ≥ 1 para evitar que el punto colapse
 * al centro del radar.
 */
function repelCartesian(
  point: TechnologyLayout,
  ddx: number,
  ddy: number,
  cx: number,
  cy: number,
): TechnologyLayout {
  const newX = round4(point.x + ddx);
  const newY = round4(point.y + ddy);
  const rx = newX - cx;
  const ry = newY - cy;
  const newRadius = round4(Math.max(1, Math.sqrt(rx * rx + ry * ry)));
  const newAngle = round4(toDeg(Math.atan2(ry, rx)));
  return { ...point, x: newX, y: newY, radius: newRadius, computedAngle: newAngle };
}

// ── API pública ───────────────────────────────────────────────

/**
 * Resuelve solapamientos entre puntos del radar mediante repulsión 2D iterativa.
 *
 * Estrategia:
 * Para cada par de puntos cuya distancia sea menor a minDistPx,
 * se calcula el vector unitario que los separa y se empuja cada
 * punto por la mitad del déficit en su dirección correspondiente.
 * La repulsión es cartesiana (no puramente radial), lo que permite
 * separar puntos que están al mismo radio pero diferentes ángulos.
 *
 * Convergencia temprana: si ningún par se mueve en una iteración, termina.
 *
 * @param points    - Array de TechnologyLayout (no se muta)
 * @param cx        - Centro X del radar
 * @param cy        - Centro Y del radar
 * @param minDistPx - Distancia mínima entre centros de puntos
 * @param maxIter   - Máximo de iteraciones
 * @returns Nuevo array con posiciones ajustadas
 */
export function resolveOverlaps(
  points: TechnologyLayout[],
  cx: number,
  cy: number,
  minDistPx = 36,
  maxIter = 80,
): TechnologyLayout[] {
  if (points.length <= 1) return points.map((p) => ({ ...p }));
  if (minDistPx <= 0 || maxIter <= 0) return points.map((p) => ({ ...p }));

  // Shallow copy: cada elemento es un nuevo objeto
  const working: TechnologyLayout[] = points.map((p) => ({ ...p }));

  for (let iter = 0; iter < maxIter; iter++) {
    let moved = false;

    for (let i = 0; i < working.length; i++) {
      for (let j = i + 1; j < working.length; j++) {
        let dx = working[i].x - working[j].x;
        let dy = working[i].y - working[j].y;
        let d = dist(working[i], working[j]);

        if (d >= minDistPx) continue;

        // Caso degenerado: puntos en la misma posición exacta.
        // Usar un ángulo basado en los índices para dispersar en distintas
        // direcciones cada par, evitando que todos colisionen en el mismo eje.
        if (d < 0.001) {
          const angle = ((i * 7 + j * 13) * 137.5) % 360;
          dx = Math.cos((angle * Math.PI) / 180) * 0.5;
          dy = Math.sin((angle * Math.PI) / 180) * 0.5;
          d = 0.5;
        }

        const deficit = minDistPx - d;
        const halfDeficit = deficit / 2;
        const nx = dx / d; // vector unitario de j→i
        const ny = dy / d;

        working[i] = repelCartesian(working[i], nx * halfDeficit, ny * halfDeficit, cx, cy);
        working[j] = repelCartesian(working[j], -nx * halfDeficit, -ny * halfDeficit, cx, cy);
        moved = true;
      }
    }

    // Convergencia temprana
    if (!moved) break;
  }

  return working;
}

// ═══════════════════════════════════════════════════════════════
// REPULSIÓN POR ETIQUETA (bbox) — Segunda pasada que considera el
// tamaño de las etiquetas multilínea. La pasada de puntos no
// detecta solapes cuando dos dots están lejos pero sus etiquetas
// caen una sobre otra (caso típico entre anillos adyacentes al
// mismo ángulo angular).
// ═══════════════════════════════════════════════════════════════

export interface BBox {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

/**
 * Estima el bounding box del dot + etiqueta multilínea en espacio SVG.
 *
 * Asume:
 *  - fontSize 9 (tech label inactiva; activo sería 11 pero el layout
 *    se calcula para el estado por defecto).
 *  - Ancho de carácter ≈ 0.55 × fontSize (heurística Work Sans).
 *  - Interlínea 1.2 em.
 *  - La etiqueta está centrada bajo el dot (textAnchor=middle) y
 *    comienza a `labelOffsetY` px bajo el centro del dot.
 */
function computeLabelBBox(layout: TechnologyLayout): BBox {
  const FONT = 9;
  const CHAR_W = FONT * 0.55;
  const LINE_H = FONT * 1.2;
  const DOT_R = 6;

  const lines = layout.labelLines;
  const longest = lines.reduce((m, l) => Math.max(m, l.length), 0);
  const halfW = Math.max(DOT_R, (longest * CHAR_W) / 2);
  const totalH = lines.length * LINE_H;
  const topY = layout.y + layout.labelOffsetY - LINE_H / 2;

  return {
    xMin: layout.x - halfW,
    xMax: layout.x + halfW,
    yMin: layout.y - DOT_R,
    yMax: topY + totalH,
  };
}

/**
 * Mueve el punto (dx, dy) pero lo mantiene dentro del anillo asignado:
 * el radio resultante se clamp a [innerR + 8, outerR - 8] para dejar
 * margen al dot.
 */
function repelWithRingClamp(
  point: TechnologyLayout,
  ddx: number,
  ddy: number,
  cx: number,
  cy: number,
  ringGeom: RingGeometry | undefined,
): TechnologyLayout {
  const nx = point.x + ddx;
  const ny = point.y + ddy;
  const rx = nx - cx;
  const ry = ny - cy;
  let newRadius = Math.sqrt(rx * rx + ry * ry);

  if (ringGeom) {
    const rMin = ringGeom.innerRadius + 8;
    const rMax = ringGeom.outerRadius - 8;
    newRadius = Math.max(rMin, Math.min(rMax, newRadius));
  } else {
    newRadius = Math.max(1, newRadius);
  }

  // Reconstituir (x, y) respetando el nuevo radio (pero preservando
  // la dirección angular post-empuje para no anular la repulsión).
  const currentR = Math.sqrt(rx * rx + ry * ry) || 1;
  const scale = newRadius / currentR;
  const finalX = round4(cx + rx * scale);
  const finalY = round4(cy + ry * scale);
  const finalAngle = round4(toDeg(Math.atan2(ry, rx)));

  return {
    ...point,
    x: finalX,
    y: finalY,
    radius: round4(newRadius),
    computedAngle: finalAngle,
  };
}

/**
 * Resuelve solapamientos entre BOUNDING BOXES (dot + etiqueta)
 * mediante traslación mínima (MTV) iterativa. Cada dot se clamp
 * al anillo al que pertenece para no invadir bandas vecinas.
 *
 * Axis de empuje:
 *   - Si el solape en Y es menor que en X → empuja vertical
 *     (más barato en pixels reales para separar etiquetas apiladas).
 *   - Si el solape en X es menor → empuja horizontal.
 *
 * No considera etiquetas de anillo (ADOPTAR/PROBAR/…); éstas se
 * tratan con opacidad reducida en el render.
 *
 * @param points    Capas de tecnología ya posicionadas
 * @param ringByIndex Mapa ringIndex → RingGeometry para clamping
 * @param cx, cy    Centro del radar
 * @param maxIter   Iteraciones máximas
 */
export function resolveLabelOverlaps(
  points: TechnologyLayout[],
  ringByIndex: Map<number, RingGeometry>,
  cx: number,
  cy: number,
  maxIter = 40,
  staticObstacles: BBox[] = [],
): TechnologyLayout[] {
  if (points.length === 0 || maxIter <= 0) {
    return points.map((p) => ({ ...p }));
  }

  const working = points.map((p) => ({ ...p }));
  const PUSH_PADDING = 1;

  for (let iter = 0; iter < maxIter; iter++) {
    let moved = false;

    // ── Pares tech-tech: empuje mutuo (mitad cada uno) ───────
    for (let i = 0; i < working.length; i++) {
      for (let j = i + 1; j < working.length; j++) {
        const a = computeLabelBBox(working[i]);
        const b = computeLabelBBox(working[j]);

        const overlapX =
          Math.min(a.xMax, b.xMax) - Math.max(a.xMin, b.xMin);
        const overlapY =
          Math.min(a.yMax, b.yMax) - Math.max(a.yMin, b.yMin);

        if (overlapX <= 0 || overlapY <= 0) continue;

        let dx = 0;
        let dy = 0;

        if (overlapY < overlapX) {
          const sign = working[i].y < working[j].y ? -1 : 1;
          dy = (sign * (overlapY + PUSH_PADDING)) / 2;
        } else {
          const sign = working[i].x < working[j].x ? -1 : 1;
          dx = (sign * (overlapX + PUSH_PADDING)) / 2;
        }

        const ringA = ringByIndex.get(working[i].ringIndex);
        const ringB = ringByIndex.get(working[j].ringIndex);

        working[i] = repelWithRingClamp(working[i], dx, dy, cx, cy, ringA);
        working[j] = repelWithRingClamp(working[j], -dx, -dy, cx, cy, ringB);
        moved = true;
      }
    }

    // ── Pares tech ↔ obstáculo inamovible (etiquetas de anillo) ─
    // El obstáculo no se mueve; la tech recibe el empuje completo.
    for (let i = 0; i < working.length; i++) {
      const ringA = ringByIndex.get(working[i].ringIndex);

      for (const obs of staticObstacles) {
        const a = computeLabelBBox(working[i]);

        const overlapX =
          Math.min(a.xMax, obs.xMax) - Math.max(a.xMin, obs.xMin);
        const overlapY =
          Math.min(a.yMax, obs.yMax) - Math.max(a.yMin, obs.yMin);

        if (overlapX <= 0 || overlapY <= 0) continue;

        const obsCenterX = (obs.xMin + obs.xMax) / 2;
        const obsCenterY = (obs.yMin + obs.yMax) / 2;

        // Empuje TANGENCIAL: el dot está sujeto a su anillo, así
        // que un push radial (p. ej. vertical en midAngle=-90°) se
        // absorbe por el ring-clamp. La dirección tangencial al
        // anillo es perpendicular al radio del dot: (-ry, rx) / |r|.
        const rx = working[i].x - cx;
        const ry = working[i].y - cy;
        const rLen = Math.hypot(rx, ry) || 1;
        let tx = -ry / rLen;
        let ty = rx / rLen;

        // Orientar la tangente comparando los ÁNGULOS (no los X) —
        // la comparación por X solo funciona en el top del radar.
        // `(-ry, rx)/|r|` apunta en dirección CCW (ángulo creciente
        // en convención atan2). Si el obstáculo está CCW del dot
        // (delta > 0), invertimos a CW; de lo contrario lo dejamos.
        const techAng = Math.atan2(ry, rx);
        const obsAng = Math.atan2(obsCenterY - cy, obsCenterX - cx);
        let delta = obsAng - techAng;
        while (delta > Math.PI) delta -= 2 * Math.PI;
        while (delta < -Math.PI) delta += 2 * Math.PI;
        if (delta > 0) {
          tx = -tx;
          ty = -ty;
        }

        // Magnitud: dominante entre ejes + padding, para escapar
        // aunque el overlap esté mayormente en el eje bloqueado.
        const stepMag = Math.max(overlapX, overlapY) + PUSH_PADDING * 2;
        const dx = tx * stepMag;
        const dy = ty * stepMag;

        working[i] = repelWithRingClamp(working[i], dx, dy, cx, cy, ringA);
        moved = true;
      }
    }

    if (!moved) break;
  }

  return working;
}
