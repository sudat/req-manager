"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

interface MermaidRendererProps {
  code: string;
  className?: string;
}

/**
 * Mermaid図を描画するコンポーネント
 *
 * @param code - Mermaidのコード文字列（erDiagram, flowchart等）
 * @param className - コンテナに適用するCSSクラス
 */
export function MermaidRenderer({ code, className = "" }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Mermaidの初期化（一度だけ実行）
    if (!isInitialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: "default",
        securityLevel: "loose",
        er: {
          useMaxWidth: true,
        },
      });
      setIsInitialized(true);
    }
  }, [isInitialized]);

  useEffect(() => {
    if (!containerRef.current || !isInitialized || !code) return;

    const renderDiagram = async () => {
      try {
        setError(null);

        // コンテナをクリア
        containerRef.current!.innerHTML = "";

        // ユニークなIDを生成
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Mermaid図を描画
        const { svg } = await mermaid.render(id, code);

        // SVGをコンテナに挿入
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (err) {
        console.error("Mermaid rendering error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "ER図の描画中にエラーが発生しました"
        );
      }
    };

    renderDiagram();
  }, [code, isInitialized]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h3 className="text-sm font-semibold text-red-800 mb-2">
          ER図の描画エラー
        </h3>
        <p className="text-sm text-red-700 font-mono whitespace-pre-wrap">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`mermaid-container ${className}`}
      style={{ minHeight: "200px" }}
    />
  );
}
