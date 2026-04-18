// ═══════════════════════════════════════════════════════════════
// TEXT WRAPPER — Word-wrap automático para etiquetas SVG.
// FIX Defecto 8: elimina nameLines manual del JSON.
// Sin imports. Sin efectos secundarios.
// ═══════════════════════════════════════════════════════════════

/**
 * Divide un texto en líneas usando un algoritmo greedy (primera línea posible).
 *
 * Reglas:
 * - Nunca rompe una palabra a la mitad.
 * - Si una palabra sola excede maxCharsPerLine, ocupa su propia línea.
 * - Texto vacío o solo espacios devuelve [].
 *
 * Calibración del default maxCharsPerLine=24:
 * Analizando los 24 nombres del JSON, la mayoría tienen 30-50 chars.
 * Con 24 chars/línea casi todos generan 2 líneas, igualando el
 * comportamiento del nameLines manual del código legacy.
 *
 * @param text - Texto a dividir
 * @param maxCharsPerLine - Máximo de caracteres por línea (default: 24)
 * @returns Array de líneas (puede estar vacío si text es vacío)
 */
export function wrapText(text: string, maxCharsPerLine = 24): string[] {
  const words = text.trim().split(/\s+/);

  // Filtrar el caso de string vacío que genera [""] al split
  if (words.length === 0 || (words.length === 1 && words[0] === "")) {
    return [];
  }

  // Límite mínimo: cada palabra en su propia línea si maxCharsPerLine <= 0
  const limit = maxCharsPerLine > 0 ? maxCharsPerLine : 1;

  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const candidate = currentLine + " " + word;

    if (candidate.length <= limit) {
      currentLine = candidate;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  lines.push(currentLine);
  return lines;
}

/**
 * Devuelve las primeras N palabras de un texto como etiqueta corta para el radar.
 *
 * Ejemplos (maxWords=2):
 *   "Redes Autónomas / Zero-Touch (Niveles L0-L5)" → "Redes Autónomas"
 *   "5G NR"                                        → "5G NR"
 *   "IA"                                           → "IA"
 *
 * @param name     - Nombre completo de la tecnología
 * @param maxWords - Máximo de palabras a incluir (default: 2)
 */
export function shortLabel(name: string, maxWords = 2): string {
  if (!name || !name.trim()) return "";
  return name.trim().split(/\s+/).slice(0, maxWords).join(" ");
}

/**
 * Calcula el desplazamiento vertical de la etiqueta desde el centro del punto.
 *
 * El bloque de texto se centra verticalmente debajo del punto:
 * - La primera línea comienza a (dotRadius + 2)px bajo el centro.
 * - Las líneas adicionales empujan el bloque hacia arriba para centrarlo.
 *
 * Fórmula: dotRadius + 2 - ((lineCount - 1) * lineHeightPx) / 2
 *
 * Ejemplo con dotRadius=6, lineCount=2, lineHeightPx=13:
 *   offset = 6 + 2 - (1 × 13) / 2 = 8 - 6.5 = 1.5 px
 *   → el bloque sube 6.5px para centrar las 2 líneas bajo el punto.
 *
 * @param dotRadius - Radio del punto en píxeles (6 normal, 8 activo)
 * @param lineCount - Número de líneas del label
 * @param lineHeightPx - Altura de línea en píxeles (default: 13)
 */
export function computeLabelOffsetY(
  dotRadius: number,
  lineCount: number,
  lineHeightPx = 13,
): number {
  const baseOffset = dotRadius + 2;
  const centeringShift = ((lineCount - 1) * lineHeightPx) / 2;
  return baseOffset - centeringShift;
}
