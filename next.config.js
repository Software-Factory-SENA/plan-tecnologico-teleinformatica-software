/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Permite servir los recursos de desarrollo (/_next/*, HMR) cuando se
  // accede al dev server por la IP de red y no por localhost — p. ej. para
  // probar en móvil o en otro equipo de la LAN.
  // Sin esto Next.js 16 bloquea los chunks del cliente: React no hidrata,
  // el useEffect de useRadarData nunca corre y la página se queda en
  // "Cargando radar...". Solo aplica en `next dev`.
  allowedDevOrigins: ["192.168.1.7", "192.168.1.*"],
};

module.exports = nextConfig;
