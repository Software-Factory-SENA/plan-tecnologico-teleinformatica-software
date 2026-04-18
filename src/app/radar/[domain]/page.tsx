// ═══════════════════════════════════════════════════════════════
// /radar/[domain] — Ruta dinámica del radar tecnológico.
// Pasa el parámetro de ruta al template; sin lógica propia.
// Cualquier dominio registrado en radarConfigLoader es válido.
// ═══════════════════════════════════════════════════════════════

import { RadarTemplate } from "@/components/templates/RadarTemplate";

interface RadarPageProps {
  params: Promise<{ domain: string }>;
}

/**
 * Página dinámica del radar.
 *
 * URL ejemplo: /radar/telecomunicaciones
 *
 * El dominio se valida en useRadarData → loadRadarConfig.
 * Si no existe, RadarTemplate muestra un mensaje de error.
 */
export default async function RadarPage({ params }: RadarPageProps) {
  const { domain } = await params;
  return <RadarTemplate domain={domain} />;
}
