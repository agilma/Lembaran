This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Authentication & Google OAuth Setup

Project Lembaran menggunakan **Supabase Auth** untuk autentikasi (Email/Password dan Google OAuth).

### Konfigurasi Google OAuth di Supabase & Google Cloud Console

1. **Google Cloud Console:**
   - Buka [Google Cloud Console](https://console.cloud.google.com/) dan buat project/pilih project yang sesuai.
   - Navigasi ke **APIs & Services** > **OAuth consent screen** dan atur nama aplikasi serta email dukungan.
   - Navigasi ke **Credentials** > **Create Credentials** > **OAuth client ID**.
   - Pilih Application type: **Web application**.
   - Tambahkan **Authorized JavaScript origins**:
     `https://<your-supabase-project-ref>.supabase.co`
   - Tambahkan **Authorized redirect URIs**:
     `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback`
   - Simpan dan dapatkan **Client ID** serta **Client Secret**.

2. **Supabase Dashboard:**
   - Masuk ke [Supabase Dashboard](https://supabase.com/dashboard) > Pilih project.
   - Buka **Authentication** > **Providers** > **Google**.
   - Aktifkan (**Enable**) Google Provider.
   - Masukkan **Client ID** dan **Client Secret** dari Google Cloud Console.
   - Buka **Authentication** > **URL Configuration**:
     - Atur **Site URL** ke domain aplikasi (misal `https://lembaran.id` atau `https://<app>.vercel.app`).
     - Tambahkan **Redirect URLs**:
       - `http://localhost:3000/auth/callback` (untuk Local Development)
       - `https://<your-domain>/auth/callback` (untuk Production)

3. **Environment Variables:**
   Atur variabel lingkungan berikut di file `.env.local` (lokal) atau Vercel Project Settings (produksi):
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SECRET_KEY=your-secret-key
   ```

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
