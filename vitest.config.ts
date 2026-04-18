import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

/**
 * Configuración de Vitest para el radar tecnológico.
 *
 * - jsdom: entorno DOM para tests de componentes React/SVG.
 * - resolve.tsconfigPaths: resuelve el alias "@/*" → "./src/*" nativamente
 *   (sustituye al plugin vite-tsconfig-paths que genera un warning en Vite 6+).
 * - globals: true permite usar describe/it/expect sin importarlos.
 * - setupFiles: importa @testing-library/jest-dom para matchers extra.
 * - coverage: v8 para cobertura nativa sin babel.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: [
        "src/lib/**",
        "src/services/**",
        "src/hooks/**",
        "src/components/**",
      ],
      exclude: ["src/test/**", "**/*.d.ts"],
    },
  },
});
