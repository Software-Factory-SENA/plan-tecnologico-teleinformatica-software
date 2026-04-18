# Radar Tecnológico — Teleinformática CEET 2026–2036

![SENA](https://img.shields.io/badge/SENA-CEET-39A900?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7_Strict-3178C6?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2-38BDF8?style=flat-square&logo=tailwindcss)
![Vitest](https://img.shields.io/badge/Vitest-4.1-6E9F18?style=flat-square&logo=vitest)
![Tests](https://img.shields.io/badge/tests-143%20passing-brightgreen?style=flat-square)

Aplicación web interactiva de **vigilancia científico-tecnológica** para el área de **teleinformática** del Centro de Electricidad, Electrónica y Telecomunicaciones (CEET) — SENA, alineada con la visión CEET 2036 de formar talento humano especializado en IA aplicada, ingeniería de datos, software inteligente, ciberseguridad y sistemas ciberfísicos.

Elaboración propia del **Grupo de Investigación GICS — CEET** basada en ejercicio de Vigilancia Científico-Tecnológica (2025), metodología tipo Gartner Technology Radar.

## URL por defecto

```
http://localhost:3000/radar/teleinformatica
```

La raíz `/` redirige automáticamente a este dominio.

## Contenido del Radar

| Elemento | Cantidad |
| --- | ---: |
| Direccionadores estratégicos (D1–D5) | 5 |
| Áreas tecnológicas (A1–A5) | 5 |
| Líneas tecnológicas (L01–L25) — puntos del radar | **25** |
| Sublíneas (SL…) | 100 |
| Anillos de adopción | 4 |
| Escala TRL | 1–9 |

### Direccionadores del desarrollo

| ID | Direccionador | Líneas |
| --- | --- | ---: |
| D1 | Aceleración de la Inteligencia Artificial (Superciclo IA) | 5 |
| D2 | Dato como Infraestructura Estratégica | 5 |
| D3 | Ingeniería de Software Aumentada por IA | 5 |
| D4 | Convergencia Ciberfísica y Aumento Humano | 5 |
| D5 | Confianza Digital, Soberanía y Gobernanza | 5 |

### Anillos de adopción

| Anillo | Líneas | Acción CEET |
| --- | ---: | --- |
| **ADOPTAR** (TRL 8–9) | 5 | Implementación inmediata en formación y proyectos |
| **PROBAR** (TRL 6–8) | 12 | Pilotos controlados y capacitación focalizada |
| **EVALUAR** (TRL 5–7) | 6 | Investigación aplicada y exploración curricular |
| **MONITOREAR** (TRL 3–6) | 2 | Vigilancia tecnológica de largo plazo |

### Marcos metodológicos

- UNE 166006:2018 (Vigilancia Tecnológica)
- ISO 56006:2021 (Gestión de Inteligencia Estratégica)
- TRL ISO 16290:2013
- Marco PESTEL/STEEP
- Taxonomías: IPC/CPC (patentes), Scopus ASJC / WoS (literatura), 3GPP/IEEE/NIST/ISO (estándares)

## Stack tecnológico

- **Next.js 16** (App Router + Turbopack) · **React 19.2** (Server/Client Components)
- **TypeScript 5.7** strict
- **Tailwind CSS 4.2** con configuración CSS-based (`@theme`) — paleta institucional SENA
- **Radix UI** + **shadcn/ui** · **CVA** para variantes
- **Lucide React** para iconografía · **Work Sans** (Google Fonts) como tipografía institucional
- **jsPDF 4.2** para exportación PDF · rasterización SVG → Canvas a 3× para PNG
- **Vitest 4.1** + **React Testing Library** + **jsdom** — 143 tests en 11 archivos

## Comandos clave

```bash
npm run dev            # Servidor de desarrollo (Turbopack) en http://localhost:3000
npm run build          # Build de producción
npm start              # Servidor de producción
npm run lint           # ESLint 9 flat config
npm test               # Vitest (143/143)
npm run test:watch     # Vitest en modo watch
npm run test:coverage  # Cobertura
npx tsc --noEmit       # Type check estricto
```

## Arquitectura

Refactor **SOLID** completo (Fases 1–10) con **Atomic Design** + hooks especializados + servicios + capa de tipos de 3 niveles.

### Árbol de código fuente

```
src/
├── app/
│   ├── globals.css                 # @theme Tailwind v4 + paleta SENA
│   ├── layout.tsx                  # Root layout (Work Sans, metadata)
│   ├── page.tsx                    # Redirect → /radar/teleinformatica
│   └── radar/[domain]/page.tsx     # Ruta dinámica por dominio
│
├── config/radars/
│   └── database.json               # Datos del dominio (25 líneas, 5 áreas,
│                                   #   5 direccionadores, 100 sublíneas)
│
├── services/
│   ├── radarConfigLoader.ts        # Carga lazy por dominio + mapa estático
│   ├── radarConfigValidator.ts     # Validación sin Zod (errores tipados)
│   └── databaseAdapter.ts          # Adapta schema "database.json" (anillos/
│                                   #   direccionadores/lineas) → RadarConfig
│
├── types/                          # Sistema de tipos (3 capas)
│   ├── radar-data.types.ts         # Capa 1 — JSON config (RingData,
│   │                               #   SectorData, AreaData, TechnologyData)
│   ├── radar-layout.types.ts       # Capa 2 — geometría calculada
│   ├── radar-render.types.ts       # Capa 3 — props de componentes SVG
│   └── radar-config.schema.ts      # Schema validator (sin dependencias)
│
├── lib/
│   ├── utils.ts                    # cn() helper (tailwind-merge + clsx)
│   ├── geometry/                   # Funciones puras: polares, rings,
│   │                               #   sectors, areas
│   ├── layout/                     # autoLayout (orquestador) +
│   │                               #   collisionDetection (dots + labels)
│   └── text/                       # textWrapper (word-wrap SVG) +
│                                   #   titleCase (Title Case es-ES)
│
├── hooks/
│   ├── useRadarData.ts             # Carga y valida el JSON del dominio
│   ├── useLayout.ts                # Memoiza computeAutoLayout
│   ├── useFilters.ts               # Filtros por sector y anillo
│   ├── useZoomPan.ts               # Zoom y paneo (mouse + touch)
│   ├── useExport.ts                # PNG (3×) y PDF (A4 landscape)
│   └── useRadarAnimations.ts       # Transiciones de filtrado (opacity)
│
├── components/
│   ├── atoms/                      # RadarRing, RingLabel, RadarDot,
│   │                               #   TechLabel, SectorDivider,
│   │                               #   AreaDivider, AreaLabel
│   ├── molecules/                  # TechMarker, SectorLabel, FilterPanel,
│   │                               #   AboutModal, HelpModal
│   ├── organisms/                  # Header, Footer, RadarSVG (forwardRef),
│   │                               #   RadarChart, RadarLegend, TechDetail,
│   │                               #   NomenclatureTable
│   ├── templates/
│   │   └── RadarTemplate.tsx       # Orquesta 5 hooks + layout móvil/desktop
│   └── ui/                         # shadcn/ui primitives (no modificar)
│
└── test/
    └── fixtures/                   # minimalConfig para tests
```

### Flujo de datos

```
database.json           (schema en español: anillos/direccionadores/lineas)
     │
     ▼
databaseAdapter.ts      adaptDatabaseToRadarConfig() → RadarConfig
     │
     ▼
radarConfigValidator    valida estructura, refs cruzadas, TRL ∈ [1,9]
     │
     ▼
useRadarData            IO asíncrono con tipado
     │
     ▼
useLayout               computeAutoLayout → RadarLayout
  ├─ computeRingGeometries
  ├─ computeSectorGeometries (angular offset −126° centra D1 arriba)
  ├─ computeAreaGeometries (proporcional al conteo de techs)
  ├─ distributePositions (grid arc-aware, rows≥2 si count≥3)
  ├─ resolveOverlaps (dots, MIN_DIST=40)
  └─ resolveLabelOverlaps (bboxes multi-línea +
                           obstáculos: ring labels + area labels)
     │
     ▼
RadarSVG + átomos       renderizado puro, forwardRef para export
```

### Regla de dependencia de tipos

```
radar-data.types.ts  ←  radar-layout.types.ts  ←  radar-render.types.ts
```

Las capas superiores **no importan** de capas inferiores.

## Características

- **Visualización SVG vectorial** responsiva (viewBox escala en web y móvil).
- **Zoom / pan** con mouse (rueda + drag) y táctil (pinch + pan).
- **Filtros dinámicos** por direccionador (con íconos y nombre completo) y por anillo (con swatch de color y rango TRL).
- **Colisión consciente de etiquetas**: dos pasadas iterativas mueven los puntos para que ningún texto multilínea se solape — ni con otras líneas tecnológicas, ni con etiquetas de anillo, ni con etiquetas de área curvadas.
- **Tipografía con Title Case** en español (SectorLabel, AreaLabel, FilterPanel): preserva acrónimos cortos (IA, ML, XR, PQC…) y minimiza conectores (de, la, y, por, con…).
- **Exportación** PNG (3× resolución) y PDF (A4 landscape) — el `viewBox` incluye todas las etiquetas periféricas para que ninguna se recorte.
- **Layout responsivo**: sidebar desktop con filtros + detalle + nomenclatura; en móvil, pestañas (Radar · Tabla · Detalle · Leyenda).
- **Accesibilidad**: `aria-pressed`, `DialogDescription`, `dominantBaseline` consistente, `suppressHydrationWarning` donde aplica.

## Añadir un nuevo dominio

1. Crear `src/config/radars/<dominio>.json` con el schema de `RadarConfig` **o** con el schema "database" (en español: `anillos` / `direccionadores` / `areas` / `lineas`).
2. Registrar en `DOMAIN_LOADERS` dentro de `src/services/radarConfigLoader.ts`.
3. La ruta `/radar/<dominio>` funciona automáticamente.

El adapter detecta por estructura si el JSON es schema antiguo (en español) y lo transforma; de lo contrario valida el RadarConfig directamente.

## Paleta institucional SENA

| Color | Hex | Uso |
| --- | --- | --- |
| Verde SENA | `#39A900` | Primario / Header / Footer |
| Azul SENA | `#00324D` | Títulos / Bordes |
| Gris claro | `#F2F2F2` | Fondos secundarios |
| Gris oscuro | `#333333` | Texto general |
| Amarillo | `#FDC300` | Alertas / TRL bajo |
| Cian | `#50E5F9` | Acentos |

## Reglas de calidad

- **TypeScript estricto**: 0 errores antes de cualquier commit (`npx tsc --noEmit`).
- **ESLint**: 0 errores (warnings permitidos solo si están justificados).
- **Vitest**: 143/143 tests deben pasar antes de merge.
- **Convenciones**: Conventional Commits (feat/fix/docs/chore/test/refactor), PascalCase para componentes, funciones puras en `src/lib/` sin efectos secundarios.
- **No hardcodear datos de dominio** en TypeScript — siempre en JSON bajo `src/config/radars/`.

## Changelog

### v2.0.0 — Radar Teleinformática CEET 2026–2036

- Migración a **Next.js 16** + **React 19.2** + **Tailwind CSS v4** (config CSS-based).
- **Refactor SOLID** completo en 10 fases: Atomic Design, hooks especializados, servicios, tipos en 3 capas.
- Nuevo **dominio Teleinformática** (URL `/radar/teleinformatica`) con 25 líneas tecnológicas y 100 sublíneas derivadas de la visión CEET 2036.
- Adapter automático para JSON en español (`anillos` / `direccionadores` / `lineas`).
- Geometría arc-aware: distribución automática de puntos por área × anillo con grid proporcional al espacio.
- **Colisión consciente de etiquetas** con obstáculos estáticos (ring labels) y arcos curvos (area labels).
- Exportación PNG / PDF incluye todas las etiquetas perimetrales.
- 143 tests en 11 archivos (0 errores TS, 0 lint).

## Autores
**Ing. Víctor Claudio Vladimir Cortés Arévalo**, Esp., Mg.
*Instructor G20 — Área de Teleinformática — Centro de Electricidad, Electrónica y Telecomunicaciones.*

**Ing. Mauricio Alexander Vargas Rodríguez**, MSc, MBA Esp. PM
*Instructor G14 — Centro de Electricidad, Electrónica y Telecomunicaciones.*



SENA, Regional Distrito Capital — Colombia.

**Grupo de Investigación GICS — CEET**

## Fuente

Elaboración propia basada en ejercicio de Vigilancia Científico-Tecnológica CEET-GICS (2026).
Metodología tipo Gartner Technology Radar + UNE 166006:2018 + ISO 56006:2021 + TRL ISO 16290:2013.

---

© 2026 SENA — Servicio Nacional de Aprendizaje
