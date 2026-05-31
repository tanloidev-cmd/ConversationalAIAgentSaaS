"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

type StreamEvent =
  | { type: "token"; content: string }
  | { type: "tool_start"; toolName: string }
  | { type: "tool_end"; toolName: string; status: string }
  | { type: "error"; message: string }
  | { type: "done"; sessionId: string };

export default function ChatPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const ensureSession = useCallback(async () => {
    if (sessionId) return sessionId;
    const res = await fetch(`${apiUrl}/v1/sessions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Web chat" }),
    });
    if (!res.ok) throw new Error(`Create session failed: ${res.status}`);
    const data = (await res.json()) as { sessionId: string };
    setSessionId(data.sessionId);
    return data.sessionId;
  }, [apiUrl, sessionId]);

  const sendSync = async () => {
    setLoading(true);
    setStatus("sync");
    setOutput("");
    try {
      const sid = await ensureSession();
      const res = await fetch(`${apiUrl}/v1/sessions/${sid}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: input }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOutput(JSON.stringify(data, null, 2));
        return;
      }
      setOutput(data.message?.content ?? JSON.stringify(data));
    } catch (e) {
      setOutput(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  const sendStream = async () => {
    setLoading(true);
    setStatus("streaming");
    setOutput("");
    try {
      const sid = await ensureSession();
      const res = await fetch(`${apiUrl}/v1/sessions/${sid}/messages/stream`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: input }),
      });
      if (!res.ok || !res.body) {
        setOutput(`Stream failed: ${res.status}`);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const ev = JSON.parse(line.slice(6)) as StreamEvent;
            if (ev.type === "token") {
              setOutput((prev) => prev + ev.content);
            } else if (ev.type === "tool_start") {
              setOutput((prev) => prev + `\n[tool start: ${ev.toolName}]\n`);
            } else if (ev.type === "tool_end") {
              setOutput((prev) => prev + `\n[tool end: ${ev.toolName} ${ev.status}]\n`);
            } else if (ev.type === "error") {
              setOutput((prev) => prev + `\n[error: ${ev.message}]\n`);
            }
          } catch {
            /* ignore partial frames */
          }
        }
      }
    } catch (e) {
      setOutput(e instanceof Error ? e.message : "Stream failed");
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  return (
    <main>
      <h1>Chat</h1>
      <p>
        <Link href="/dashboard">Dashboard</Link> · Local API: {apiUrl}
        {sessionId && ` · Session: ${sessionId}`}
      </p>
      <textarea
        rows={4}
        style={{ width: "100%", maxWidth: 640 }}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask something..."
      />
      <p>
        <button type="button" className="button" disabled={loading || !input} onClick={sendSync}>
          Send (sync)
        </button>{" "}
        <button type="button" className="button" disabled={loading || !input} onClick={sendStream}>
          Send (stream)
        </button>
        {status && <span> — {status}</span>}
      </p>
      <div className="card">
        <h2>Response</h2>
        <pre style={{ whiteSpace: "pre-wrap" }}>{output || "(empty)"}</pre>
      </div>
    </main>
  );
}
