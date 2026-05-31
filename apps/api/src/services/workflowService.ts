import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";
import { AppError } from "@conversational-ai/shared";

export async function startAgentWorkflow(input: {
  tenantId: string;
  userId: string;
  sessionId: string;
  content: string;
}): Promise<string> {
  const stateMachineArn = process.env.AGENT_STATE_MACHINE_ARN;
  if (!stateMachineArn) {
    throw new AppError("WORKFLOW_UNAVAILABLE", "Workflow orchestration is not configured", {
      statusCode: 503,
    });
  }

  const client = new SFNClient({
    region: process.env.AWS_REGION ?? "ap-southeast-1",
  });

  const name = `agent-${input.sessionId.slice(0, 8)}-${Date.now()}`;
  const result = await client.send(
    new StartExecutionCommand({
      stateMachineArn,
      name: name.slice(0, 80),
      input: JSON.stringify(input),
    }),
  );

  if (!result.executionArn) {
    throw new AppError("WORKFLOW_START_FAILED", "Failed to start workflow", {
      statusCode: 500,
    });
  }
  return result.executionArn;
}
