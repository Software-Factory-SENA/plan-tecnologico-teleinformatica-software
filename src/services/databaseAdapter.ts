// ═══════════════════════════════════════════════════════════════
// ADAPTADOR — Transforma el JSON plano "database.json" (schema
// en español: anillos / direccionadores / areas / lineas) al
// RadarConfig que consume el resto del pipeline (rings / sectors
// / areas / technologies en inglés).
//
// Cada "línea" del JSON fuente se convierte en una tecnología
// (punto del radar) tomando el campo `nombre` como etiqueta
// visible. El resto de metadatos (sublíneas, evidencia) se
// concatenan para la vista de detalle.
// ═══════════════════════════════════════════════════════════════

import type {
  RadarConfig,
  RingData,
  SectorData,
  AreaData,
  TechnologyData,
} from "@/types/radar-data.types";

// ── Tipos crudos del JSON fuente ─────────────────────────────

interface RawMeta {
  titulo?: string;
  subtitulo?: string;
  version?: string;
  horizonte?: string;
  regional?: string;
  centro?: string;
  grupo?: string;
  vision_2035?: string;
  metodologia?: string[];
  taxonomias?: string[];
  fuente?: string;
  autores?: string[];
}

interface RawAnillo {
  id: string;
  nombre: string;
  descripcion: string;
  orden: number;
  color: string;
}

interface RawDireccionador {
  id: string;
  nombre: string;
  nombre_completo?: string;
  descripcion_completa?: string;
  color: string;
  color_fondo?: string;
  area_id?: string;
}

interface RawArea {
  id: string;
  direccionador_id: string;
  nombre: string;
  descripcion_completa?: string;
}

interface RawSublinea {
  id: string;
  nombre: string;
}

interface RawLinea {
  id: string;
  nombre: string;
  nombre_completo?: string;
  direccionador_id: string;
  area_id: string;
  fase_adopcion: string;
  trl_rango?: string;
  trl_valor: number;
  sublineas?: RawSublinea[];
  sublineas_texto_completo?: string;
  tendencias_evidencia?: string;
}

interface RawDatabase {
  meta?: RawMeta;
  anillos: RawAnillo[];
  direccionadores: RawDireccionador[];
  areas: RawArea[];
  lineas: RawLinea[];
}

// ── Constantes de diseño visual ───────────────────────────────

/** Radios de los 4 anillos del radar, de dentro hacia fuera (px). */
const RING_RADII = [160, 240, 320, 400];

/** Colores de borde por anillo (tono más oscuro que el fill). */
const RING_BORDER_COLORS: Record<string, string> = {
  ADOPTAR: "#66BB6A",
  PROBAR: "#9CCC65",
  EVALUAR: "#FFEB3B",
  MONITOREAR: "#FF7043",
};

/** Color de etiqueta por anillo. */
const RING_LABEL_COLORS: Record<string, string> = {
  ADOPTAR: "#2E7D32",
  PROBAR: "#558B2F",
  EVALUAR: "#F9A825",
  MONITOREAR: "#D84315",
};

/** Rango TRL esperado por fase de adopción. */
const RING_TRL_RANGES: Record<string, { min: number; max: number }> = {
  ADOPTAR: { min: 8, max: 9 },
  PROBAR: { min: 6, max: 8 },
  EVALUAR: { min: 5, max: 7 },
  MONITOREAR: { min: 3, max: 6 },
};

const RING_ACTIONS: Record<string, string> = {
  ADOPTAR: "Implementación inmediata en formación y proyectos.",
  PROBAR: "Pilotos controlados y capacitación focalizada.",
  EVALUAR: "Investigación aplicada y exploración curricular.",
  MONITOREAR: "Vigilancia tecnológica de largo plazo.",
};

/** Iconos por direccionador (D1–D5). */
const SECTOR_ICONS: Record<string, string> = {
  D1: "🧠",
  D2: "📊",
  D3: "💻",
  D4: "🤖",
  D5: "🔒",
};

/** Color de fondo claro por direccionador (bgLight). */
const SECTOR_BG_LIGHT_FALLBACK: Record<string, string> = {
  D1: "#E3F2FD",
  D2: "#FFEBEE",
  D3: "#FFF3E0",
  D4: "#F3E5F5",
  D5: "#E0F2F1",
};

/** Color de fondo oscuro por direccionador (bgDark). */
const SECTOR_BG_DARK: Record<string, string> = {
  D1: "#BBDEFB",
  D2: "#FFCDD2",
  D3: "#FFE0B2",
  D4: "#E1BEE7",
  D5: "#B2DFDB",
};

// ── Helpers ───────────────────────────────────────────────────

function shortLabelFrom(id: string, nombre: string): string {
  // Para sectores D1..D5 y áreas A1..A5 usar el id como short label.
  if (/^[A-Z]\d+$/.test(id)) return id;
  // Caso genérico: primeras 3–4 palabras del nombre.
  return nombre.split(/\s+/).slice(0, 2).join(" ").slice(0, 18);
}

function trlRangeLabel(range: { min: number; max: number }): string {
  return range.min === range.max
    ? `TRL ${range.min}`
    : `TRL ${range.min}-${range.max}`;
}

function adaptRings(anillos: RawAnillo[]): RingData[] {
  const sorted = [...anillos].sort((a, b) => a.orden - b.orden);

  return sorted.map((a, i) => {
    const range = RING_TRL_RANGES[a.id] ?? { min: 1, max: 9 };
    const radius = RING_RADII[i] ?? RING_RADII[RING_RADII.length - 1];

    return {
      id: a.id,
      index: i,
      label: a.nombre,
      shortLabel: a.nombre,
      radius,
      color: a.color,
      fillColor: a.color,
      borderColor: RING_BORDER_COLORS[a.id] ?? a.color,
      labelColor: RING_LABEL_COLORS[a.id] ?? "#333333",
      desc: a.descripcion,
      trlRange: range,
      trlLabel: trlRangeLabel(range),
      action: RING_ACTIONS[a.id] ?? a.descripcion,
    };
  });
}

function adaptSectors(direccionadores: RawDireccionador[]): SectorData[] {
  const sorted = [...direccionadores].sort((a, b) =>
    a.id.localeCompare(b.id, "en", { numeric: true }),
  );

  return sorted.map((d, i) => ({
    id: d.id,
    index: i,
    label: d.nombre,
    shortLabel: shortLabelFrom(d.id, d.nombre),
    color: d.color,
    bgLight: d.color_fondo ?? SECTOR_BG_LIGHT_FALLBACK[d.id] ?? "#F5F5F5",
    bgDark: SECTOR_BG_DARK[d.id] ?? "#E0E0E0",
    icon: SECTOR_ICONS[d.id] ?? "⬤",
  }));
}

function adaptAreas(areas: RawArea[]): AreaData[] {
  return areas.map((a) => ({
    id: a.id,
    label: a.nombre,
    shortLabel: shortLabelFrom(a.id, a.nombre),
    sector: a.direccionador_id,
  }));
}

function buildTechDescription(l: RawLinea): string {
  const parts: string[] = [];
  if (l.sublineas_texto_completo) parts.push(l.sublineas_texto_completo);
  else if (l.sublineas?.length) {
    parts.push(l.sublineas.map((s) => `• ${s.nombre}`).join("\n"));
  }
  if (l.tendencias_evidencia) parts.push(l.tendencias_evidencia);
  return parts.join("\n\n");
}

function horizonFromPhase(fase: string): string {
  switch (fase) {
    case "ADOPTAR":
      return "Corto (1-2 años)";
    case "PROBAR":
      return "Medio (2-5 años)";
    case "EVALUAR":
      return "Largo (5-10 años)";
    case "MONITOREAR":
      return "Muy largo (>10 años)";
    default:
      return "Por definir";
  }
}

function impactFromTrl(trl: number): string {
  if (trl >= 8) return "Muy Alto";
  if (trl >= 6) return "Alto";
  if (trl >= 4) return "Medio";
  return "Bajo";
}

function clampTrl(trl: number): number {
  if (!Number.isFinite(trl)) return 5;
  return Math.min(9, Math.max(1, Math.round(trl)));
}

function adaptTechnologies(
  lineas: RawLinea[],
  validRingIds: Set<string>,
  validSectorIds: Set<string>,
  validAreaIds: Set<string>,
): TechnologyData[] {
  return lineas.map((l) => {
    const ringId = validRingIds.has(l.fase_adopcion)
      ? l.fase_adopcion
      : [...validRingIds][0];

    const sectorId = validSectorIds.has(l.direccionador_id)
      ? l.direccionador_id
      : [...validSectorIds][0];

    const areaId = validAreaIds.has(l.area_id) ? l.area_id : undefined;

    const tags = (l.sublineas ?? [])
      .map((s) => s.nombre.split(/[(,:]/)[0].trim())
      .filter((t) => t.length > 0 && t.length < 40)
      .slice(0, 5);

    return {
      id: l.id,
      code: l.id,
      name: l.nombre,
      sector: sectorId,
      area: areaId,
      ring: ringId,
      trl: clampTrl(l.trl_valor),
      desc: buildTechDescription(l),
      impact: impactFromTrl(l.trl_valor),
      horizon: horizonFromPhase(l.fase_adopcion),
      tags,
    };
  });
}

// ── API pública ───────────────────────────────────────────────

/**
 * Transforma el JSON en esquema "database" (anillos / direccionadores /
 * areas / lineas) al RadarConfig que consumen los hooks y componentes.
 *
 * Los campos omitidos por el JSON fuente (theme, layout, trlConfig) se
 * completan con valores por defecto coherentes con el diseño del radar
 * CEET.
 */
export function adaptDatabaseToRadarConfig(raw: unknown): RadarConfig {
  if (typeof raw !== "object" || raw === null) {
    throw new Error(
      "[databaseAdapter] El JSON de entrada debe ser un objeto válido.",
    );
  }

  const db = raw as RawDatabase;

  if (!Array.isArray(db.anillos) || !Array.isArray(db.direccionadores)) {
    throw new Error(
      '[databaseAdapter] El JSON debe contener "anillos" y "direccionadores".',
    );
  }
  if (!Array.isArray(db.lineas)) {
    throw new Error('[databaseAdapter] El JSON debe contener "lineas".');
  }

  const rings = adaptRings(db.anillos);
  const sectors = adaptSectors(db.direccionadores);
  const areas = adaptAreas(db.areas ?? []);

  const ringIds = new Set(rings.map((r) => r.id));
  const sectorIds = new Set(sectors.map((s) => s.id));
  const areaIds = new Set(areas.map((a) => a.id));

  const technologies = adaptTechnologies(
    db.lineas,
    ringIds,
    sectorIds,
    areaIds,
  );

  const meta = db.meta ?? {};
  const outerRadius = rings[rings.length - 1]?.radius ?? 400;

  // ── Padding asimétrico ──────────────────────────────────────
  // Top/Bottom: espacio para el título, la atribución y el wrap
  //   multilínea del SectorLabel superior/inferior.
  // Sides: espacio para el wrap multilínea del SectorLabel lateral
  //   — el caso crítico es D2 y D5 (≈18° respecto a la horizontal),
  //   donde el texto anclado "start"/"end" se extiende ~170px.
  const TOP_PADDING = 160;
  const BOTTOM_PADDING = 140;
  const SIDE_PADDING = 280;

  const svgWidth = outerRadius * 2 + SIDE_PADDING * 2;
  const svgHeight = outerRadius * 2 + TOP_PADDING + BOTTOM_PADDING;
  const centerX = svgWidth / 2;
  const centerY = TOP_PADDING + outerRadius;

  // -126° centra el primer sector (D1) en la parte superior: con 5
  // sectores de 72°, el midAngle del primero queda en -90° (arriba).
  const sectorRotationOffset = -126;

  return {
    meta: {
      id: "teleinformatica",
      domain: "teleinformatica",
      title: meta.titulo ?? "Radar Tecnológico",
      subtitle: meta.subtitulo ?? "",
      description:
        meta.vision_2035 ??
        "Vigilancia científico-tecnológica del CEET-GICS (SENA).",
      version: meta.version ?? "v1.0",
      year: meta.horizonte ?? "2026-2036",
      organization: meta.centro ?? meta.regional ?? "CEET — SENA",
      authors:
        meta.autores && meta.autores.length > 0
          ? meta.autores
          : meta.grupo
            ? [meta.grupo]
            : ["GICS — CEET"],
      methodology: (meta.metodologia ?? []).join(" · "),
      source: meta.fuente ?? "Elaboración propia CEET-GICS",
      locale: "es",
    },
    theme: {
      primaryColor: "#00843D",
      secondaryColor: "#003B71",
      accentColor: "#F7A800",
      fontFamily: "system-ui, -apple-system, sans-serif",
    },
    layout: {
      svgWidth,
      svgHeight,
      centerX,
      centerY,
      sectorRotationOffset,
      sectorAllocation: "equal",
    },
    rings,
    sectors,
    areas,
    technologies,
    excludedTechnologies: [],
    trlConfig: {
      scale: { min: 1, max: 9 },
      levels: [
        { range: [1, 3], label: "Básica", title: "Investigación básica", color: "#4FC3F7" },
        { range: [4, 6], label: "Aplicada", title: "Desarrollo aplicado", color: "#FFB74D" },
        { range: [7, 9], label: "Madura", title: "Despliegue industrial", color: "#66BB6A" },
      ],
    },
  };
}
