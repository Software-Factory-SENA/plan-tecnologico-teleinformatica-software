"use client";

// ═══════════════════════════════════════════════════════════════
// HelpModal — Molécula React: modal de ayuda/referencia.
// Fase 9: eliminada dependencia de @/lib/radar-data (legacy).
// Acepta rings: RingData[] para renderizar fases de adopción
// desde el JSON de configuración, sin datos hardcodeados.
// ═══════════════════════════════════════════════════════════════

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { HelpCircle } from "lucide-react";
import type { RingData } from "@/types/radar-data.types";

interface HelpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rings: RingData[];
}

const TRL_LEVELS = [
  {
    range: "TRL 1-2",
    title: "Investigación Básica",
    desc: "Principios observados y formulación del concepto tecnológico.",
    color: "#4FC3F7",
  },
  {
    range: "TRL 3-4",
    title: "Prueba de Concepto",
    desc: "Validación analítica y experimental en laboratorio.",
    color: "#FDC300",
  },
  {
    range: "TRL 5-6",
    title: "Validación de Prototipo",
    desc: "Componentes validados en entorno relevante y simulación de alta fidelidad.",
    color: "#E65100",
  },
  {
    range: "TRL 7-9",
    title: "Sistema Probado",
    desc: "Sistema completo cualificado y probado en entorno operativo real.",
    color: "#C62828",
  },
];

export function HelpModal({ open, onOpenChange, rings }: HelpModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="fixed inset-0 top-0 left-0 translate-x-0 translate-y-0 w-full h-[100dvh] max-w-none border-none rounded-none sm:bottom-auto sm:top-[50%] sm:left-[50%] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg sm:h-auto sm:max-h-[85vh] sm:border-solid sm:border sm:rounded-lg flex flex-col p-0 gap-0 overflow-hidden z-50"
      >
        {/* Header */}
        <DialogHeader className="px-5 py-4 border-b bg-muted/20 flex-none m-0">
          <DialogTitle className="flex items-center gap-2 text-xl text-sena-blue">
            <HelpCircle className="w-6 h-6 text-sena-green" />
            Guía de Referencia
          </DialogTitle>
          <DialogDescription className="text-sena-gray-dark/80 mt-1">
            Conceptos clave del Radar Tecnológico de Telecomunicaciones
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 md:p-5 flex flex-col gap-6 text-sm text-sena-gray-dark">
          {/* TRL Section */}
          <section className="space-y-3">
            <h3 className="font-bold text-base text-sena-blue flex items-center gap-2">
              <span className="bg-sena-green text-white rounded-sm w-7 h-7 font-bold text-xs flex items-center justify-center shrink-0">
                TRL
              </span>
              Niveles de Madurez Tecnológica
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              El <strong>Technology Readiness Level (TRL)</strong> es una escala
              estandarizada que mide el grado de madurez de una tecnología, desde su
              concepción hasta su despliegue operativo.
            </p>

            <div className="grid gap-2 text-sm border border-sena-gray-light rounded-lg p-3 bg-sena-gray-light/20">
              {TRL_LEVELS.map((item) => (
                <div
                  key={item.range}
                  className="grid grid-cols-[80px_1fr] gap-2 items-start"
                >
                  <Badge
                    variant="outline"
                    className="justify-center"
                    style={{ borderColor: item.color, color: item.color }}
                  >
                    {item.range}
                  </Badge>
                  <div>
                    <span
                      className="font-semibold block text-sm"
                      style={{ color: item.color }}
                    >
                      {item.title}
                    </span>
                    <span className="text-xs text-muted-foreground">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="h-px bg-sena-gray-light" />

          {/* Fases de Adopción — desde config JSON */}
          <section className="space-y-3">
            <h3 className="font-bold text-base text-sena-blue flex items-center gap-2">
              <span className="bg-sena-green text-white rounded-sm w-7 h-7 font-bold text-xs flex items-center justify-center shrink-0">
                ◎
              </span>
              Fases de Adopción (Anillos)
            </h3>
            <p className="text-sm text-muted-foreground">
              Los anillos del radar indican la postura recomendada frente a cada
              tecnología según su madurez y aplicabilidad en el contexto CEET.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {[...rings].reverse().map((ring) => (
                <div key={ring.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-3.5 rounded-sm border"
                      style={{
                        backgroundColor: ring.fillColor,
                        borderColor: ring.borderColor,
                      }}
                    />
                    <span
                      className="font-bold text-sm"
                      style={{ color: ring.labelColor }}
                    >
                      {ring.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {ring.desc}. {ring.trlLabel}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Botón Cerrar — solo visible en mobile */}
        <div className="flex-none p-4 border-t bg-muted/20 sm:hidden">
          <button
            onClick={() => onOpenChange(false)}
            className="w-full h-10 rounded-md border border-sena-gray-dark/20 text-sena-blue font-medium text-sm flex items-center justify-center"
          >
            Cerrar Guía
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
