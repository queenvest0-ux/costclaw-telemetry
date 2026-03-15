import { MODEL_PRICING, MODEL_ALIASES } from "./table.js";

export type CostSource = "telemetry" | "calculated" | "estimated";

export interface CostResult {
  costUsd: number;
  source: CostSource;
}

function resolveModel(raw: string): string | null {
  const lower = raw.toLowerCase().trim();

  // Exact match
  if (MODEL_PRICING[lower]) return lower;

  // Alias match
  for (const [alias, canonical] of MODEL_ALIASES) {
    if (lower.startsWith(alias)) return canonical;
  }

  // Prefix scan (longest matching key wins)
  const keys = Object.keys(MODEL_PRICING).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (lower.startsWith(key) || key.startsWith(lower)) return key;
  }

  return null;
}

export function computeCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  telemetryCostUsd?: number
): CostResult {
  // Trust telemetry cost if it's present and nonzero
  if (telemetryCostUsd != null && telemetryCostUsd > 0) {
    return { costUsd: telemetryCostUsd, source: "telemetry" };
  }

  const resolved = resolveModel(model);
  if (!resolved) {
    return { costUsd: 0, source: "estimated" };
  }

  const price = MODEL_PRICING[resolved];
  const costUsd =
    (inputTokens / 1_000_000) * price.inputPer1M +
    (outputTokens / 1_000_000) * price.outputPer1M;

  return { costUsd, source: "calculated" };
}
