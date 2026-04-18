"use client";

// ═══════════════════════════════════════════════════════════════
// RadarTemplate — Plantilla de página del radar tecnológico.
// Fase 7: orquesta hooks de Fase 4 y componentes de Fase 5/6.
// Sin lógica de negocio propia — todo delegado a hooks especializados.
// ═══════════════════════════════════════════════════════════════

import { useState, useRef } from "react";
import { Header } from "@/components/organisms/Header";
import { Footer } from "@/components/organisms/Footer";
import { RadarChart } from "@/components/organisms/RadarChart";
import { TechDetail } from "@/components/organisms/TechDetail";
import { NomenclatureTable } from "@/components/organisms/NomenclatureTable";
import { RadarLegend } from "@/components/organisms/RadarLegend";
import { FilterPanel } from "@/components/molecules/FilterPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Radar,
  List,
  BarChart3,
  Filter,
  ZoomIn,
  ZoomOut,
  Maximize,
  FileImage,
  FileText,
  ChevronDown,
} from "lucide-react";
import { useRadarData } from "@/hooks/useRadarData";
import { useLayout } from "@/hooks/useLayout";
import { useFilters } from "@/hooks/useFilters";
import { useZoomPan } from "@/hooks/useZoomPan";
import { useExport } from "@/hooks/useExport";

export interface RadarTemplateProps {
  /** Identificador del dominio, ej: "telecomunicaciones" */
  domain: string;
}

/**
 * Plantilla de página del radar tecnológico.
 *
 * Orquesta los 5 hooks especializados de la Fase 4:
 *  - useRadarData  → carga y valida el JSON del dominio
 *  - useLayout     → calcula posiciones SVG
 *  - useFilters    → filtrado por sector y anillo
 *  - useZoomPan    → zoom y paneo interactivo
 *  - useExport     → exportación PNG / PDF
 *
 * Responsive:
 *  - Móvil: Tabs (Radar | Tabla | Detalle | Leyenda)
 *  - Desktop: sidebar izquierdo + radar central + sidebar derecho
 */
export function RadarTemplate({ domain }: RadarTemplateProps) {
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);
  const [hoveredTechId, setHoveredTechId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState("radar");

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // ── Hooks ────────────────────────────────────────────────────
  const { config, loading, error } = useRadarData(domain);
  const layout = useLayout(config);
  const {
    filters,
    filteredTechIds,
    filteredCount,
    toggleSector,
    toggleRing,
    resetFilters,
  } = useFilters(config, layout);
  const {
    zoomLevel,
    transformStyle,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    setSecondaryRef,
  } = useZoomPan(containerRef);
  const { exporting, exportPNG, exportPDF } = useExport(
    svgRef,
    config?.meta ?? null,
  );

  // ── Estados de carga / error ─────────────────────────────────
  if (loading) return <RadarLoader />;
  if (error || !config || !layout) {
    return <RadarError message={error?.message ?? "Error desconocido"} />;
  }

  // ── Layout de la tecnología activa ───────────────────────────
  const activeLayout =
    layout.technologies.find(
      (tl) => tl.tech.id === (selectedTechId ?? hoveredTechId),
    ) ?? null;

  // ── Props compartidos ────────────────────────────────────────
  const radarProps = {
    layout,
    filteredTechIds,
    selectedTechId,
    hoveredTechId,
    activeSectors: filters.sectors,
    activeRings: filters.rings,
    meta: config.meta,
    onSelectTech: setSelectedTechId,
    onHoverTech: setHoveredTechId,
  };

  const filterProps = {
    sectors: config.sectors,
    rings: config.rings,
    filters,
    filteredCount,
    totalCount: layout.technologies.length,
    onToggleSector: toggleSector,
    onToggleRing: toggleRing,
    onReset: resetFilters,
  };

  const nomenclatureProps = {
    layout,
    filteredTechIds,
    selectedTechId,
    excludedTechnologies: config.excludedTechnologies,
    onSelect: setSelectedTechId,
  };

  const detailProps = {
    layout: activeLayout,
    rings: config.rings,
    sectors: config.sectors,
    onClose: () => setSelectedTechId(null),
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Header meta={config.meta} rings={config.rings} />

      {/* ═══════ MOBILE LAYOUT ═══════ */}
      <main className="flex-1 container-sena py-3 md:hidden overflow-y-auto">
        <Tabs
          value={mobileTab}
          onValueChange={setMobileTab}
          className="flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-4 mb-3">
            <TabsTrigger value="radar" className="gap-1.5 text-xs">
              <Radar className="w-3.5 h-3.5" />
              Radar
            </TabsTrigger>
            <TabsTrigger value="table" className="gap-1.5 text-xs">
              <List className="w-3.5 h-3.5" />
              Tabla
            </TabsTrigger>
            <TabsTrigger value="detail" className="gap-1.5 text-xs">
              <BarChart3 className="w-3.5 h-3.5" />
              Detalle
            </TabsTrigger>
            <TabsTrigger value="legend" className="gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5" />
              Leyenda
            </TabsTrigger>
          </TabsList>

          {/* Tab: Radar */}
          <TabsContent value="radar">
            <Card>
              <CardContent className="p-2">
                <div
                  ref={setSecondaryRef}
                  className="relative overflow-hidden aspect-[17/14] flex items-center justify-center bg-sena-gray-light/40 rounded-lg border touch-none"
                >
                  <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-10">
                    <Button
                      size="icon-sm"
                      onClick={handleZoomIn}
                      className="h-8 w-8 bg-sena-green/80 text-white border border-sena-green/30 hover:bg-sena-green shadow-sm"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon-sm"
                      onClick={handleZoomOut}
                      className="h-8 w-8 bg-sena-green/80 text-white border border-sena-green/30 hover:bg-sena-green shadow-sm"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon-sm"
                      onClick={handleResetZoom}
                      className="h-8 w-8 bg-sena-green/80 text-white border border-sena-green/30 hover:bg-sena-green shadow-sm"
                    >
                      <Maximize className="w-4 h-4" />
                    </Button>
                  </div>

                  <div
                    style={transformStyle}
                    className="w-full h-full flex items-center justify-center"
                  >
                    <RadarChart
                      ref={svgRef}
                      {...radarProps}
                      onSelectTech={(id) => {
                        setSelectedTechId(id);
                        if (id) setMobileTab("detail");
                      }}
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportPNG}
                    disabled={exporting}
                    className="text-xs"
                  >
                    <FileImage className="w-3.5 h-3.5 mr-1.5" /> Exportar PNG
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportPDF}
                    disabled={exporting}
                    className="text-xs"
                  >
                    <FileText className="w-3.5 h-3.5 mr-1.5" /> Exportar PDF
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="mt-4 space-y-4">
              <FilterPanel {...filterProps} />
            </div>
          </TabsContent>

          {/* Tab: Tabla */}
          <TabsContent value="table">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-sena-blue">
                  <List className="w-4 h-4 text-sena-green" />
                  Nomenclaturas — {filteredCount} tecnologías
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <NomenclatureTable
                  {...nomenclatureProps}
                  onSelect={(id) => {
                    setSelectedTechId(id);
                    if (id) setMobileTab("detail");
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Detalle */}
          <TabsContent value="detail">
            <Card>
              <CardContent className="p-0">
                <TechDetail {...detailProps} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Leyenda */}
          <TabsContent value="legend">
            <RadarLegend rings={config.rings} sectors={config.sectors} />
          </TabsContent>
        </Tabs>
      </main>

      {/* ═══════ DESKTOP LAYOUT ═══════ */}
      <main className="hidden md:flex flex-1 min-h-0 overflow-hidden">
        {/* LEFT SIDEBAR — Filtros + Exportar */}
        <aside className="w-[220px] flex-shrink-0 border-r bg-card/50 p-3 space-y-4 overflow-y-auto">
          <div className="text-[10px] text-muted-foreground leading-relaxed italic">
            {config.meta.description}
          </div>

          <Separator />

          <div className="text-[11px] text-muted-foreground bg-accent/20 p-2.5 rounded-md border border-accent/30 leading-snug">
            <p className="font-bold text-foreground mb-1.5 text-xs">
              Guía de Navegación
            </p>
            <ul className="list-disc list-inside space-y-1 opacity-80">
              <li>
                <span className="font-medium">Zoom:</span> Rueda del mouse
              </li>
              <li>
                <span className="font-medium">Mover:</span> Arrastra el lienzo
              </li>
              <li>
                <span className="font-medium">Detalles:</span> Clic en los puntos
              </li>
            </ul>
          </div>

          <Separator />

          <FilterPanel {...filterProps} />

          <Separator />

          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">
              Exportar
            </span>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 text-xs"
              onClick={exportPNG}
              disabled={exporting}
            >
              <FileImage className="w-3.5 h-3.5" />
              Guardar como PNG
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 text-xs"
              onClick={exportPDF}
              disabled={exporting}
            >
              <FileText className="w-3.5 h-3.5" />
              Guardar como PDF
            </Button>
          </div>
        </aside>

        {/* CENTER — Radar */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div
            ref={containerRef}
            className="flex-1 flex items-center justify-center p-4 overflow-hidden relative"
          >
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
              <Button
                size="icon"
                onClick={handleZoomIn}
                title="Zoom In"
                className="bg-sena-green/80 text-white border border-sena-green/30 hover:bg-sena-green"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                onClick={handleZoomOut}
                title="Zoom Out"
                className="bg-sena-green/80 text-white border border-sena-green/30 hover:bg-sena-green"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                onClick={handleResetZoom}
                title="Reset View"
                className="bg-sena-green/80 text-white border border-sena-green/30 hover:bg-sena-green"
              >
                <Maximize className="w-4 h-4" />
              </Button>
              {zoomLevel !== 1 && (
                <span className="text-[10px] text-center text-muted-foreground font-mono">
                  {Math.round(zoomLevel * 100)}%
                </span>
              )}
            </div>

            <div
              style={transformStyle}
              className="w-full h-full flex items-center justify-center"
            >
              <RadarChart ref={svgRef} {...radarProps} />
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR — Detalle + Leyenda + Nomenclaturas */}
        <aside className="w-[350px] min-w-[350px] max-w-[350px] flex-shrink-0 border-l bg-card/50 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <TechDetail {...detailProps} />

            <Separator />

            <div className="p-3">
              <RadarLegend rings={config.rings} sectors={config.sectors} />
            </div>

            <Separator />

            <details className="p-3 group">
              <summary className="flex items-center gap-2 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                <List className="w-3.5 h-3.5 text-sena-green" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Nomenclaturas
                </span>
                <Badge variant="outline" className="text-[9px] ml-auto mr-1">
                  {filteredCount} tecn.
                </Badge>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground transition-transform details-chevron" />
              </summary>
              <div className="mt-2">
                <NomenclatureTable {...nomenclatureProps} />
              </div>
            </details>
          </div>
        </aside>
      </main>

      <Footer />
    </div>
  );
}

// ── Sub-componentes de estado ─────────────────────────────────

function RadarLoader() {
  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-full border-4 border-sena-green border-t-transparent animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">Cargando radar...</p>
      </div>
    </div>
  );
}

function RadarError({ message }: { message: string }) {
  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3 max-w-md px-4">
        <p className="text-base font-semibold text-destructive">
          Error al cargar el radar
        </p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
