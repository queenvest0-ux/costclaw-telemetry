import type {
  TelemetryEvent,
  LlmUsageEvent,
  ToolStartEvent,
  ToolEndEvent,
  AgentEvent,
  MessageEvent,
} from "../types.js";

export function parseLine(raw: string): TelemetryEvent | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const obj = JSON.parse(trimmed);
    if (typeof obj.type !== "string" || typeof obj.ts !== "number" || typeof obj.seq !== "number") {
      return null;
    }
    return obj as TelemetryEvent;
  } catch {
    return null;
  }
}

export function isLlmUsageEvent(e: TelemetryEvent): e is LlmUsageEvent {
  return e.type === "llm.usage" && typeof (e as LlmUsageEvent).model === "string";
}

export function isToolEvent(e: TelemetryEvent): e is ToolStartEvent | ToolEndEvent {
  return e.type === "tool.start" || e.type === "tool.end";
}

export function isAgentEvent(e: TelemetryEvent): e is AgentEvent {
  return e.type === "agent.start" || e.type === "agent.end";
}

export function isMessageEvent(e: TelemetryEvent): e is MessageEvent {
  return e.type === "message.in" || e.type === "message.out";
}
