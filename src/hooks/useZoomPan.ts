"use client";

// ═══════════════════════════════════════════════════════════════
// useZoomPan — Gestión de zoom y paneo del radar.
// Responsabilidad única: toda la lógica de interacción espacial.
// Soporta: rueda de ratón, drag, pinch-to-zoom táctil.
// ═══════════════════════════════════════════════════════════════

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type CSSProperties,
  type RefObject,
} from "react";

export interface UseZoomPanResult {
  zoomLevel: number;
  pan: { x: number; y: number };
  /** Estilo CSS listo para aplicar al contenedor del SVG */
  transformStyle: CSSProperties;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleResetZoom: () => void;
  /**
   * Callback ref para un segundo contenedor (ej: vista móvil).
   * Registra y limpia los mismos listeners en cualquier elemento que reciba.
   */
  setSecondaryRef: (node: HTMLDivElement | null) => void;
}

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.25;
const WHEEL_SENSITIVITY = 0.0015;

/**
 * Gestiona zoom y paneo de un contenedor SVG.
 *
 * Comportamiento del cursor:
 * - En reposo: cursor "grab" (manita abierta) en toda el área del radar,
 *   incluyendo sobre los puntos de tecnología.
 * - Al arrastrar: cursor "grabbing" (manita cerrada) aplicado en
 *   document.body para que prevalezca sobre cualquier hijo SVG.
 * - La transición CSS se desactiva durante el arrastre para movimiento 1:1.
 *
 * @param containerRef - ref del contenedor principal (desktop)
 */
export function useZoomPan(
  containerRef: RefObject<HTMLDivElement | null>,
): UseZoomPanResult {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Refs para uso dentro de event handlers (evita closures stale)
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panRef = useRef(pan);
  const zoomRef = useRef(zoomLevel);
  const lastTouchDistanceRef = useRef(0);
  const secondaryRef = useRef<HTMLDivElement | null>(null);

  // Patrón válido: sincronizar refs con state para evitar closures stale en handlers.
  // eslint-disable-next-line react-hooks/refs
  panRef.current = pan;
  // eslint-disable-next-line react-hooks/refs
  zoomRef.current = zoomLevel;

  // ── Helpers de cursor ────────────────────────────────────────

  /** Activa cursor grabbing en body (prevalece sobre hijos SVG) */
  const startDragCursor = useCallback(() => {
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
  }, []);

  /** Restaura cursor normal */
  const stopDragCursor = useCallback(() => {
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  // ── Handlers de eventos ──────────────────────────────────────

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - rect.width / 2;
    const mouseY = e.clientY - rect.top - rect.height / 2;
    const delta = -e.deltaY * WHEEL_SENSITIVITY;

    setZoomLevel((prevZoom) => {
      const newZoom = Math.min(Math.max(prevZoom + delta, ZOOM_MIN), ZOOM_MAX);
      const scaleRatio = newZoom / prevZoom;
      setPan((prevPan) => ({
        x: mouseX - (mouseX - prevPan.x) * scaleRatio,
        y: mouseY - (mouseY - prevPan.y) * scaleRatio,
      }));
      return newZoom;
    });
  }, []);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
    startDragCursor();
    e.preventDefault();
  }, [startDragCursor]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = (e.clientX - dragStartRef.current.x) / zoomRef.current;
    const dy = (e.clientY - dragStartRef.current.y) / zoomRef.current;
    setPan({
      x: panRef.current.x + dx,
      y: panRef.current.y + dy,
    });
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    stopDragCursor();
  }, [stopDragCursor]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      dragStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    } else if (e.touches.length === 2) {
      lastTouchDistanceRef.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.cancelable) e.preventDefault();
    if (e.touches.length === 1 && isDraggingRef.current) {
      const dx =
        (e.touches[0].clientX - dragStartRef.current.x) / zoomRef.current;
      const dy =
        (e.touches[0].clientY - dragStartRef.current.y) / zoomRef.current;
      setPan({ x: panRef.current.x + dx, y: panRef.current.y + dy });
      dragStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    } else if (e.touches.length === 2 && lastTouchDistanceRef.current > 0) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      const scale = dist / lastTouchDistanceRef.current;
      setZoomLevel((prev) =>
        Math.min(Math.max(prev * scale, ZOOM_MIN), ZOOM_MAX),
      );
      lastTouchDistanceRef.current = dist;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDraggingRef.current = false;
    lastTouchDistanceRef.current = 0;
  }, []);

  // ── Helper: registrar/desregistrar listeners en un elemento ──

  const attachListeners = useCallback(
    (el: HTMLElement) => {
      el.style.cursor = "grab";
      el.addEventListener("wheel", handleWheel, { passive: false });
      el.addEventListener("mousedown", handleMouseDown);
      el.addEventListener("touchstart", handleTouchStart, { passive: false });
      el.addEventListener("touchmove", handleTouchMove, { passive: false });
      el.addEventListener("touchend", handleTouchEnd);
    },
    [handleWheel, handleMouseDown, handleTouchStart, handleTouchMove, handleTouchEnd],
  );

  const detachListeners = useCallback(
    (el: HTMLElement) => {
      el.removeEventListener("wheel", handleWheel);
      el.removeEventListener("mousedown", handleMouseDown);
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    },
    [handleWheel, handleMouseDown, handleTouchStart, handleTouchMove, handleTouchEnd],
  );

  // ── Effect: contenedor principal ─────────────────────────────

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    attachListeners(el);
    return () => detachListeners(el);
  }, [containerRef, attachListeners, detachListeners]);

  // ── Effect: listeners globales (mouse move/up fuera del radar) ─

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      // Limpiar cursor si el componente se desmonta durante un arrastre
      stopDragCursor();
    };
  }, [handleMouseMove, handleMouseUp, stopDragCursor]);

  // ── Callback ref para contenedor secundario (móvil) ──────────

  const setSecondaryRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (secondaryRef.current) {
        detachListeners(secondaryRef.current);
      }
      secondaryRef.current = node;
      if (node) {
        attachListeners(node);
      }
    },
    [attachListeners, detachListeners],
  );

  // ── Controles de zoom ────────────────────────────────────────

  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + ZOOM_STEP, ZOOM_MAX));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - ZOOM_STEP, ZOOM_MIN));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // ── Estilo CSS resultante ────────────────────────────────────
  // Sin transición durante el arrastre → movimiento 1:1 con el ratón.
  // Con transición suave para los botones de zoom.

  const transformStyle: CSSProperties = {
    transform: `scale(${zoomLevel}) translate(${pan.x}px, ${pan.y}px)`,
    transition: isDragging ? "none" : "transform 0.15s ease-out",
  };

  return {
    zoomLevel,
    pan,
    transformStyle,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    setSecondaryRef,
  };
}
