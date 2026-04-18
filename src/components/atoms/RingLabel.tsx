// ═══════════════════════════════════════════════════════════════
// RingLabel — Átomo SVG: etiqueta de texto en el borde superior
// de cada anillo concéntrico. Sin estado, sin lógica.
// ═══════════════════════════════════════════════════════════════

import type { RingLabelProps } from "@/types/radar-render.types";

/**
 * Renderiza la etiqueta de texto de un anillo (ej: "ADOPTAR", "PROBAR").
 * Se posiciona 18px por debajo del borde superior interior del anillo,
 * centrada horizontalmente sobre el centro del radar.
 */
export function RingLabel({ ring, geometry, cx, cy, isActive }: RingLabelProps) {
  return (
    <text
      x={cx}
      y={cy - geometry.outerRadius + 14}
      textAnchor="middle"
      dominantBaseline="middle"
      fill={ring.labelColor}
      fontSize={11}
      fontWeight={700}
      opacity={isActive ? 0.5 : 0.15}
      letterSpacing="2"
      style={{ pointerEvents: "none", userSelect: "none" }}
    >
      {ring.label}
    </text>
  );
}
