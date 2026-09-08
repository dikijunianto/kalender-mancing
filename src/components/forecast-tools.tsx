"use client";
import { useEffect } from "react";
import { forecastQuery } from "@/lib/validation";
type Tool = {
  name: string;
  title: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean };
  execute: (input: unknown) => Promise<unknown>;
};
export function ForecastTools() {
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (tool: Tool, options: { signal: AbortSignal }) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const controller = new AbortController();
    try {
      void Promise.resolve(
        context.registerTool(
          {
            name: "read_fishing_forecast",
            title: "Read fishing forecast",
            description:
              "Read the same daily fishing score, safety status, hourly marine conditions, and data provenance used by this application's calendar. Does not save a trip or change the page.",
            inputSchema: {
              type: "object",
              properties: {
                area: { type: "string", enum: ["kepulauan-seribu", "bekasi-karawang"] },
                date: { type: "string", format: "date" },
              },
              required: ["area", "date"],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: true },
            async execute(input) {
              const query = forecastQuery.parse(input);
              const response = await fetch(`/api/forecast?${new URLSearchParams(query)}`);
              if (!response.ok) throw new Error("Forecast unavailable");
              return response.json();
            },
          },
          { signal: controller.signal },
        ),
      ).catch(() => {
        /* Optional browser integration; standard UI remains available. */
      });
    } catch {
      /* Unsupported implementations must not affect the app. */
    }
    return () => controller.abort();
  }, []);
  return null;
}
