"use client";

// ═══════════════════════════════════════════════════════════════
// useExport — Exportación del radar a PNG y PDF.
// Extraído de RadarTemplate.tsx (líneas 34-100 + 341-362).
// Responsabilidad única: lógica de renderizado SVG → canvas → archivo.
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback, type RefObject } from "react";
import type { RadarMeta } from "@/types/radar-data.types";

export interface UseExportResult {
  exporting: boolean;
  exportPNG: () => Promise<void>;
  exportPDF: () => Promise<void>;
}

// ── Helpers puros (no hooks) ─────────────────────────────────

/**
 * Convierte un SVGSVGElement a HTMLCanvasElement.
 * @param svgEl - Elemento SVG a rasterizar
 * @param scale - Factor de escala para alta resolución (default: 3 → 3x DPI)
 */
function svgToCanvas(
  svgEl: SVGSVGElement,
  scale = 3,
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = svgEl.viewBox.baseVal.width * scale;
      canvas.height = svgEl.viewBox.baseVal.height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("No se pudo obtener el contexto 2D del canvas"));
        return;
      }
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Error al cargar el SVG como imagen"));
    };

    img.src = url;
  });
}

/**
 * Descarga el radar como archivo PNG de alta resolución (3x).
 */
async function downloadPNG(
  svgEl: SVGSVGElement,
  filename: string,
): Promise<void> {
  const canvas = await svgToCanvas(svgEl, 3);
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

/**
 * Descarga el radar como archivo PDF en formato A4 horizontal.
 * El SVG ya embebe título y fuente; jsPDF solo encuadra la imagen.
 */
async function downloadPDF(
  svgEl: SVGSVGElement,
  filename: string,
): Promise<void> {
  const canvas = await svgToCanvas(svgEl, 3);
  const imgData = canvas.toDataURL("image/png");

  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  // El SVG ya renderiza meta.title y meta.source embebidos: no se duplican aquí.
  // Preservar aspect ratio del canvas (viewBox del SVG) para no deformar los anillos.
  const marginX = 10;
  const marginY = 5;
  const maxW = pageW - marginX * 2;
  const maxH = pageH - marginY * 2;
  const aspect = canvas.width / canvas.height;
  let drawW = maxW;
  let drawH = drawW / aspect;
  if (drawH > maxH) {
    drawH = maxH;
    drawW = drawH * aspect;
  }
  const xOff = (pageW - drawW) / 2;
  const yOff = (pageH - drawH) / 2;
  pdf.addImage(imgData, "PNG", xOff, yOff, drawW, drawH);

  pdf.save(filename);
}

// ── Hook ─────────────────────────────────────────────────────

/**
 * Gestiona la exportación del radar a PNG y PDF.
 *
 * @param svgRef   - Ref al elemento SVG del radar
 * @param meta     - Metadata del dominio (title, source para el PDF)
 * @param filename - Nombre base del archivo sin extensión (default: "Radar_Tecnologico")
 *
 * @example
 * const { exportPNG, exportPDF, exporting } = useExport(svgRef, config.meta)
 */
export function useExport(
  svgRef: RefObject<SVGSVGElement | null>,
  meta: Pick<RadarMeta, "title" | "source"> | null,
  filename = "Radar_Tecnologico_CEET_2626-2036",
): UseExportResult {
  const [exporting, setExporting] = useState(false);

  const exportPNG = useCallback(async () => {
    if (!svgRef.current || exporting) return;
    setExporting(true);
    try {
      await downloadPNG(svgRef.current, `${filename}.png`);
    } catch (err) {
      console.error("[useExport] Error al exportar PNG:", err);
    } finally {
      setExporting(false);
    }
  }, [svgRef, exporting, filename]);

  const exportPDF = useCallback(async () => {
    if (!svgRef.current || exporting || !meta) return;
    setExporting(true);
    try {
      await downloadPDF(svgRef.current, `${filename}.pdf`);
    } catch (err) {
      console.error("[useExport] Error al exportar PDF:", err);
    } finally {
      setExporting(false);
    }
  }, [svgRef, exporting, meta, filename]);

  return { exporting, exportPNG, exportPDF };
}
