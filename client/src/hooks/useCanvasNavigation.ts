import { useState, useCallback, useRef } from 'react';
import { CanvasNode } from '../types/graph';
import {
  PanOffset,
  MIN_ZOOM,
  MAX_ZOOM,
  ZOOM_STEP,
  screenToGraph as mathScreenToGraph,
  calculateFitToScreen,
} from '../utils/canvasMath';

export interface UseCanvasNavigationReturn {
  pan: PanOffset;
  zoom: number;
  isPanning: boolean;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  fitToScreen: (nodes: CanvasNode[], viewport: { width: number; height: number }) => void;
  handleWheel: (e: React.WheelEvent<SVGSVGElement>, svgRect: DOMRect) => void;
  startPan: (clientX: number, clientY: number) => void;
  updatePan: (clientX: number, clientY: number) => void;
  endPan: () => void;
  screenToGraph: (clientX: number, clientY: number, svgRect: DOMRect) => { x: number; y: number };
}

export function useCanvasNavigation(): UseCanvasNavigationReturn {
  const [pan, setPan] = useState<PanOffset>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1.0);
  const [isPanning, setIsPanning] = useState<boolean>(false);

  const dragStartRef = useRef<{ clientX: number; clientY: number; panX: number; panY: number } | null>(null);

  const zoomIn = useCallback(() => {
    setZoom((prev) => Math.min(MAX_ZOOM, +(prev + ZOOM_STEP).toFixed(2)));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((prev) => Math.max(MIN_ZOOM, +(prev - ZOOM_STEP).toFixed(2)));
  }, []);

  const resetView = useCallback(() => {
    setPan({ x: 0, y: 0 });
    setZoom(1.0);
  }, []);

  const fitToScreen = useCallback((nodes: CanvasNode[], viewport: { width: number; height: number }) => {
    const fit = calculateFitToScreen(nodes, viewport);
    setPan(fit.pan);
    setZoom(fit.zoom);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>, svgRect: DOMRect) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;

    setZoom((prevZoom) => {
      const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, +(prevZoom * zoomFactor).toFixed(2)));
      if (nextZoom === prevZoom) return prevZoom;

      // Center zoom around the mouse pointer position
      const mouseX = e.clientX - svgRect.left;
      const mouseY = e.clientY - svgRect.top;

      setPan((prevPan) => {
        const scaleChange = nextZoom / prevZoom;
        const newPanX = mouseX - (mouseX - prevPan.x) * scaleChange;
        const newPanY = mouseY - (mouseY - prevPan.y) * scaleChange;
        return {
          x: Math.round(newPanX),
          y: Math.round(newPanY),
        };
      });

      return nextZoom;
    });
  }, []);

  const startPan = useCallback((clientX: number, clientY: number) => {
    setIsPanning(true);
    setPan((currentPan) => {
      dragStartRef.current = {
        clientX,
        clientY,
        panX: currentPan.x,
        panY: currentPan.y,
      };
      return currentPan;
    });
  }, []);

  const updatePan = useCallback((clientX: number, clientY: number) => {
    if (!dragStartRef.current) return;
    const dx = clientX - dragStartRef.current.clientX;
    const dy = clientY - dragStartRef.current.clientY;
    setPan({
      x: Math.round(dragStartRef.current.panX + dx),
      y: Math.round(dragStartRef.current.panY + dy),
    });
  }, []);

  const endPan = useCallback(() => {
    setIsPanning(false);
    dragStartRef.current = null;
  }, []);

  const screenToGraph = useCallback(
    (clientX: number, clientY: number, svgRect: DOMRect) => {
      return mathScreenToGraph(clientX, clientY, svgRect, pan, zoom);
    },
    [pan, zoom]
  );

  return {
    pan,
    zoom,
    isPanning,
    zoomIn,
    zoomOut,
    resetView,
    fitToScreen,
    handleWheel,
    startPan,
    updatePan,
    endPan,
    screenToGraph,
  };
}
