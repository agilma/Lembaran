import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeCallbackUrl } from "@/lib/url-utils";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  const safeNext = sanitizeCallbackUrl(next, "/riwayat");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  // Return user to login with error state if exchange fails or code is missing
  return NextResponse.redirect(`${origin}/login?error=InvalidVerificationCode`);
}
