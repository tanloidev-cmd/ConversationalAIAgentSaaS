import type { StreamEvent } from "@conversational-ai/shared";

export function encodeSseEvent(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export function encodeSseHeartbeat(): string {
  return `: heartbeat\n\n`;
}
