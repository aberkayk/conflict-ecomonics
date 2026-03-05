"use client";

import { useState, useCallback } from "react";
import type { AnalysisRequest, StreamingAnalysisState } from "@/types";

export function useAnalysis() {
  const [state, setState] = useState<StreamingAnalysisState>({
    content: "",
    isStreaming: false,
    error: null,
    startedAt: null,
  });

  const startAnalysis = useCallback(async (request: AnalysisRequest) => {
    setState({ content: "", isStreaming: true, error: null, startedAt: new Date().toISOString() });

    try {
      const res = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Analysis failed");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") {
            setState((s) => ({ ...s, isStreaming: false }));
            return;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.content) {
              setState((s) => ({ ...s, content: parsed.content }));
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      setState((s) => ({ ...s, isStreaming: false }));
    } catch (error) {
      setState((s) => ({
        ...s,
        isStreaming: false,
        error: error instanceof Error ? error.message : "Analysis failed",
      }));
    }
  }, []);

  return { ...state, startAnalysis };
}
