import Link from "next/link";
import { redirect } from "next/navigation";
import { getCognitoLogoutUrl } from "@/lib/cognito";
import { getSession } from "@/lib/session";

interface HealthResponse {
  status: string;
  version: string;
  environment: string;
  timestamp: string;
}

async function fetchHealth(): Promise<{
  ok: boolean;
  data?: HealthResponse;
  correlationId?: string;
  error?: string;
}> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return { ok: false, error: "NEXT_PUBLIC_API_URL not configured" };
  }
  try {
    const res = await fetch(`${apiUrl}/v1/health`, { cache: "no-store" });
    const correlationId = res.headers.get("x-correlation-id") ?? undefined;
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}`, correlationId };
    }
    const data = (await res.json()) as HealthResponse;
    return { ok: true, data, correlationId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Request failed" };
  }
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const health = await fetchHealth();
  const logoutUrl = getCognitoLogoutUrl();

  return (
    <main>
      <h1>Dashboard</h1>
      <p>Signed in (session cookie set).</p>
      <p>
        <a className="button" href={logoutUrl}>
          Sign out
        </a>{" "}
        <Link href="/">Home</Link> · <Link href="/chat">Chat</Link>
      </p>

      <div className="card">
        <h2>API health</h2>
        {health.ok && health.data ? (
          <>
            <p className="status-ok">Status: {health.data.status}</p>
            <p>
              Version: {health.data.version} · Env: {health.data.environment}
            </p>
            <p>Timestamp: {health.data.timestamp}</p>
            {health.correlationId && <p>Correlation ID: {health.correlationId}</p>}
          </>
        ) : (
          <p className="status-error">
            {health.error ?? "Health check failed"}
            {health.correlationId && ` (correlation: ${health.correlationId})`}
          </p>
        )}
      </div>
    </main>
  );
}
