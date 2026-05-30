import { cookies } from "next/headers";

export const SESSION_COOKIE = "cai_session";

export interface SessionTokens {
  accessToken: string;
  idToken: string;
}

export async function getSession(): Promise<SessionTokens | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionTokens;
  } catch {
    return null;
  }
}
