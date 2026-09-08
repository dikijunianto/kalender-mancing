export type Quality = "HIGH" | "MEDIUM" | "LOW";
export const sceneQuality = {
  HIGH: { segments: 100, wind: 100, rain: 600, dpr: 1.5 },
  MEDIUM: { segments: 60, wind: 50, rain: 220, dpr: 1 },
  LOW: { segments: 24, wind: 16, rain: 70, dpr: 1 },
};
