import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeCallbackUrl, getAppOrigin } from "@/lib/url-utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = getAppOrigin(request);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const errorParam = searchParams.get("error");
  const errorDescParam = searchParams.get("error_description");

  const safeNext = sanitizeCallbackUrl(next, "/riwayat");

  if (errorParam || errorDescParam) {
    const message = errorDescParam || errorParam || "OAuthError";
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(message)}`
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  // Return user to login with error state if exchange fails or code is missing
  return NextResponse.redirect(`${origin}/login?error=InvalidVerificationCode`);
}
