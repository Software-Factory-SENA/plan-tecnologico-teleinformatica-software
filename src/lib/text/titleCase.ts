// ═══════════════════════════════════════════════════════════════
// TITLE CASE — Conversión de texto a estilo "Título" en español.
// Puro, sin dependencias. Compartido entre SectorLabel y AreaLabel.
// ═══════════════════════════════════════════════════════════════

/** Palabras funcionales del español que se mantienen en minúscula. */
const STOP_WORDS = new Set([
  "de", "del", "la", "el", "los", "las", "y", "o", "u",
  "en", "a", "al", "con", "por", "para", "como", "que",
]);

/**
 * Convierte un texto (usualmente en mayúsculas) a estilo "Title Case"
 * en español:
 * - Capitaliza palabras mayores.
 * - Deja en minúscula los conectores (de/la/y/por/con/…), excepto
 *   cuando son la primera palabra de la frase.
 * - Preserva acrónimos cortos en mayúsculas (IA, ML, XR, MAS, PQC).
 *
 * @example
 * toTitleCase("ACELERACIÓN DE LA INTELIGENCIA ARTIFICIAL (Superciclo IA)")
 *   // → "Aceleración de la Inteligencia Artificial (Superciclo IA)"
 */
export function toTitleCase(original: string): string {
  const tokens = original.split(/(\s+|\(|\)|,|·|–|—|-|\/)/);
  let isFirst = true;

  return tokens
    .map((tok) => {
      if (!tok) return tok;
      if (/^(\s+|[(),·–—\-/])$/.test(tok)) return tok;

      const lower = tok.toLocaleLowerCase("es");

      // Conector del español → minúscula, salvo si es primera palabra.
      if (!isFirst && STOP_WORDS.has(lower)) return lower;

      // Acrónimo corto en mayúsculas → preservar (IA, ML, XR, …).
      // Evaluar DESPUÉS de stop-words para que "DE" o "POR" no sean
      // confundidos con siglas.
      const isShortAcronym =
        tok.length <= 3 && /^[A-ZÁÉÍÓÚÑ0-9]+$/.test(tok);
      if (isShortAcronym) {
        isFirst = false;
        return tok;
      }

      isFirst = false;
      return lower.charAt(0).toLocaleUpperCase("es") + lower.slice(1);
    })
    .join("");
}
