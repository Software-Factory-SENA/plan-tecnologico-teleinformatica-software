"use client";

// ═══════════════════════════════════════════════════════════════
// Header — Organismo React: barra de navegación superior.
// Acepta meta: RadarMeta para parametrizar título, subtítulo
// y versión sin hardcodear valores del dominio CEET/SENA.
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { HelpCircle, Info, Menu, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HelpModal } from "@/components/molecules/HelpModal";
import { AboutModal } from "@/components/molecules/AboutModal";
import type { HeaderProps } from "@/types/radar-render.types";

/**
 * Barra superior con logo, título del radar y acciones de ayuda.
 *
 * Los textos del encabezado (title, subtitle, version) provienen de
 * `meta: RadarMeta` — no hay strings hardcodeados del dominio.
 * Los modales de ayuda y "acerca de" son independientes del dominio.
 */
export function Header({ meta, rings }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  return (
    <header className="w-full bg-sena-green text-white py-3 px-4 md:px-8 border-b-4 border-sena-blue shadow-sm sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-4">

        {/* Logo + Título */}
        <div className="flex items-center gap-3 md:gap-4 flex-shrink min-w-0">
          <Link href="/" className="flex items-center shrink-0">
            <div className="h-10 w-10 md:h-12 md:w-12 relative bg-white rounded-full p-0.5 shadow-sm flex items-center justify-center">
              <Image
                src="/assets/logos/escudo-semilleros.svg"
                alt="Escudo Semilleros SENA"
                width={50}
                height={50}
                className="w-auto h-full object-contain"
                priority
              />
            </div>
          </Link>

          <div className="hidden sm:block w-px h-8 bg-white/30 shrink-0" />

          <div className="flex flex-col truncate min-w-0">
            <h1
              className="text-sm md:text-lg font-bold leading-tight tracking-tight truncate"
              style={{ color: "white" }}
            >
              {meta.title}
            </h1>
            <p className="text-[10px] sm:text-xs text-white/80 hidden md:block mt-0.5 font-medium truncate">
              {meta.subtitle}
            </p>
          </div>
        </div>

        {/* Acciones — Desktop */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <Badge className="bg-white/10 text-white/90 border-white/20 hover:bg-white/10 mr-1 select-none text-[10px]">
            {meta.version}
          </Badge>

          <button
            onClick={() => setShowHelp(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-white/90 hover:text-white hover:bg-white/10 transition-colors font-medium"
          >
            <HelpCircle size={16} />
            <span>Ayuda</span>
          </button>

          <button
            onClick={() => setShowAbout(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-white/90 hover:text-white hover:bg-white/10 transition-colors font-medium"
          >
            <Info size={16} />
            <span>Acerca de</span>
          </button>
        </div>

        {/* Hamburger — Móvil */}
        <div className="md:hidden flex items-center shrink-0">
          <button
            className="p-2 text-white/90 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menú"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Menú móvil desplegable */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-sena-green border-t border-white/20 mt-3 pt-2 animate-in slide-in-from-top-2">
          <div className="space-y-1">
            <button
              onClick={() => { setShowHelp(true); setMobileMenuOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/90 hover:bg-white/10 transition-colors"
            >
              <HelpCircle size={18} className="text-white/70" /> Ayuda
            </button>
            <button
              onClick={() => { setShowAbout(true); setMobileMenuOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/90 hover:bg-white/10 transition-colors"
            >
              <Info size={18} className="text-white/70" /> Acerca de
            </button>
            <div className="flex items-center justify-between pt-3 pb-1 px-3 border-t border-white/20 mt-2">
              <span className="text-xs text-white/70 font-medium">{meta.title}</span>
              <Badge className="bg-white/10 text-white/80 border-white/20 hover:bg-white/10 select-none text-[10px]">
                {meta.version}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Modales */}
      <HelpModal open={showHelp} onOpenChange={setShowHelp} rings={rings} />
      <AboutModal open={showAbout} onOpenChange={setShowAbout} />
    </header>
  );
}
