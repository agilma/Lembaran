import type { Metadata, Viewport } from 'next';
import { Inter, Amiri } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const amiri = Amiri({
  weight: ['400', '700'],
  subsets: ['arabic'],
  variable: '--font-arabic',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: '%s | Lembaran',
    default: 'Lembaran - Aplikasi Bacaan & Amalan',
  },
  description: 'Lembaran membantu membaca, menghitung, dan mencatat bacaan atau amalan dalam satu tempat.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Lembaran',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} ${amiri.variable}`}>
      <body className="min-h-screen bg-[#faf9f6] text-slate-800 font-sans antialiased flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
        <Header />
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
          {children}
        </main>
        <footer className="border-t border-slate-200/60 py-6 text-center text-xs text-slate-500">
          <div className="max-w-3xl mx-auto px-4">
            <p>© {new Date().getFullYear()} Lembaran. Wadah tenang membaca & mengamalkan bacaan.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
