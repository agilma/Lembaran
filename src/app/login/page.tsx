import { getCurrentUser, sanitizeCallbackUrl } from "@/lib/auth-utils";
import LoginClient from "./login-client";

export const metadata = {
  title: "Masuk - Lembaran",
  description: "Halaman masuk akun Lembaran",
};

interface LoginPageProps {
  searchParams?: Promise<{ callbackUrl?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : {};
  const callbackUrl = sanitizeCallbackUrl(params.callbackUrl, "/");
  const user = await getCurrentUser();

  const sessionInfo = user
    ? {
        id: user.id,
        email: user.email || "",
        name: user.name || null,
        role: user.role || "VIEWER",
      }
    : null;

  return <LoginClient initialUser={sessionInfo} callbackUrl={callbackUrl} />;
}
