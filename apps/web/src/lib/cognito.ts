const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN ?? "";
const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? "";
const redirectUri =
  process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI ?? "http://localhost:3000/callback";

export function getCognitoLoginUrl(): string {
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    scope: "openid email profile",
    redirect_uri: redirectUri,
  });
  return `https://${domain}/login?${params.toString()}`;
}

export function getCognitoLogoutUrl(): string {
  const params = new URLSearchParams({
    client_id: clientId,
    logout_uri: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  });
  return `https://${domain}/logout?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  id_token: string;
  refresh_token?: string;
}> {
  const tokenUrl = `https://${domain}/oauth2/token`;
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    code,
    redirect_uri: redirectUri,
  });
  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status}`);
  }
  return res.json() as Promise<{
    access_token: string;
    id_token: string;
    refresh_token?: string;
  }>;
}
