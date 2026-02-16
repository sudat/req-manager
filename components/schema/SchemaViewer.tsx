"use client";

import { useCallback, useEffect, useRef } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { MermaidRenderer } from "./MermaidRenderer";

interface SchemaViewerProps {
  code: string;
  onParticipantClick?: (alias: string) => void;
  ddMapping?: Record<string, string>;
}

export function SchemaViewer({ code, onParticipantClick, ddMapping }: SchemaViewerProps) {
  const MIN_SCALE = 0.05;
  const MAX_SCALE = 16;
  const INITIAL_SCALE_MULTIPLIER = 2;

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const diagramRef = useRef<HTMLDivElement | null>(null);
  const transformApiRef = useRef<{
    setTransform: (positionX: number, positionY: number, scale: number, animationTime?: number) => void;
    resetTransform: (animationTime?: number) => void;
    zoomToElement: (node: HTMLElement | string, scale?: number, animationTime?: number) => void;
  } | null>(null);

  const fitToViewport = useCallback(() => {
    if (!wrapperRef.current || !diagramRef.current || !transformApiRef.current) return;

    transformApiRef.current.resetTransform(0);

    requestAnimationFrame(() => {
      if (!wrapperRef.current || !diagramRef.current || !transformApiRef.current) return;

      const wrapperRect = wrapperRef.current.getBoundingClientRect();
      const diagramRect = diagramRef.current.getBoundingClientRect();
      const diagramWidth = diagramRect.width;
      const diagramHeight = diagramRect.height;

      if (!diagramWidth || !diagramHeight || !wrapperRect.width || !wrapperRect.height) return;

      const padding = 24;
      const availableWidth = Math.max(wrapperRect.width - padding * 2, 1);
      const availableHeight = Math.max(wrapperRect.height - padding * 2, 1);
      const fitScale = Math.min(availableWidth / diagramWidth, availableHeight / diagramHeight);
      const scale = Math.min(
        Math.max(fitScale * INITIAL_SCALE_MULTIPLIER, MIN_SCALE),
        MAX_SCALE
      );

      transformApiRef.current.zoomToElement(diagramRef.current, scale, 0);
    });
  }, []);

  useEffect(() => {
    if (!wrapperRef.current || !diagramRef.current) return;

    const wrapperEl = wrapperRef.current;
    const diagramEl = diagramRef.current;
    const mutationObserver = new MutationObserver(() => {
      requestAnimationFrame(fitToViewport);
    });
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(fitToViewport);
    });

    mutationObserver.observe(diagramEl, { childList: true, subtree: true });
    resizeObserver.observe(wrapperEl);

    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, [fitToViewport]);

  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(fitToViewport);
    });
  }, [code, fitToViewport]);

  return (
    <TransformWrapper
      initialScale={1}
      minScale={MIN_SCALE}
      maxScale={MAX_SCALE}
      wheel={{ step: 0.1 }}
      onInit={(api) => {
        transformApiRef.current = api;
        requestAnimationFrame(fitToViewport);
      }}
    >
      <div ref={wrapperRef} className="h-full w-full">
        <TransformComponent
          wrapperStyle={{ width: "100%", height: "100%" }}
          contentStyle={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}
        >
          <div ref={diagramRef}>
            <MermaidRenderer
              code={code}
              onParticipantClick={onParticipantClick}
              ddMapping={ddMapping}
            />
          </div>
        </TransformComponent>
      </div>
    </TransformWrapper>
  );
}
