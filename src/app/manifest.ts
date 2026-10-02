import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Lembaran',
    short_name: 'Lembaran',
    description: 'Membaca, menghitung, dan mencatat amalan atau bacaan dalam satu tempat.',
    start_url: '/',
    display: 'standalone',
    background_color: '#faf9f6',
    theme_color: '#0f172a',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
