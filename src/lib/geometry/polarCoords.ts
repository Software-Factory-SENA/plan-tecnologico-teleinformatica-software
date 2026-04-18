// ═══════════════════════════════════════════════════════════════
// COORDENADAS POLARES — Primitivas matemáticas puras.
// Sin imports. Sin efectos secundarios.
// ═══════════════════════════════════════════════════════════════

/** Convierte grados a radianes */
export function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Convierte radianes a grados */
export function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/** Redondea a 4 decimales para evitar ruido de punto flotante en coordenadas SVG */
export function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

/**
 * Convierte coordenadas polares a cartesianas para SVG.
 *
 * Convención de ángulos (estándar SVG / matemático):
 *   0°   → derecha  (3 en punto del reloj)
 *   90°  → abajo    (6 en punto — Y aumenta hacia abajo en SVG)
 *   180° → izquierda
 *   270° → arriba   (12 en punto)
 *   Ángulos negativos van en sentido antihorario.
 *
 * @param cx - Coordenada X del centro
 * @param cy - Coordenada Y del centro
 * @param r  - Radio
 * @param angleDeg - Ángulo en grados
 */
export function polarToXY(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
): { x: number; y: number } {
  return {
    x: round4(cx + r * Math.cos(toRad(angleDeg))),
    y: round4(cy + r * Math.sin(toRad(angleDeg))),
  };
}
