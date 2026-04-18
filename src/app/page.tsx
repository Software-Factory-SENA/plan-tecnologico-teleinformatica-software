// ═══════════════════════════════════════════════════════════════
// Página raíz — redirige al radar del dominio por defecto.
// El dominio por defecto es "teleinformatica".
// Agregar nuevos dominios: registrar en radarConfigLoader.ts
// y crear el JSON en src/config/radars/.
// ═══════════════════════════════════════════════════════════════

import { redirect } from "next/navigation";

const DEFAULT_DOMAIN = "teleinformatica";

export default function Home() {
  redirect(`/radar/${DEFAULT_DOMAIN}`);
}
