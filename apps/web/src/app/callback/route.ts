import { NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/cognito";
import { SESSION_COOKIE } from "@/lib/session";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error)}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/?error=missing_code", request.url));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    response.cookies.set(
      SESSION_COOKIE,
      JSON.stringify({
        accessToken: tokens.access_token,
        idToken: tokens.id_token,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60,
      },
    );
    return response;
  } catch {
    return NextResponse.redirect(new URL("/?error=token_exchange", request.url));
  }
}
