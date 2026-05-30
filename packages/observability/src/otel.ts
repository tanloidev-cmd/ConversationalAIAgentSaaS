import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

let sdk: NodeSDK | undefined;

export function initOtel(serviceName: string): void {
  if (process.env.OTEL_ENABLED !== "true") {
    return;
  }
  if (sdk) {
    return;
  }
  sdk = new NodeSDK({
    serviceName,
    instrumentations: [getNodeAutoInstrumentations()],
  });
  sdk.start();
}

export async function shutdownOtel(): Promise<void> {
  if (sdk) {
    await sdk.shutdown();
    sdk = undefined;
  }
}
