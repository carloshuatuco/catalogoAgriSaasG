import { NextResponse } from 'next/server';
import { getStoreBySlug } from '@/lib/firebase/firestore';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const store = await getStoreBySlug(storeSlug);

    if (!store) {
      return new NextResponse('Store not found', { status: 404 });
    }

    const manifest = {
      name: `Catálogo | ${store.name}`,
      short_name: store.name,
      description: `Catálogo de productos de ${store.name}`,
      start_url: `/${storeSlug}`,
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: store.themeColor || '#0b3d32',
      icons: store.logo ? [
        {
          src: store.logo,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: store.logo,
          sizes: '512x512',
          type: 'image/png'
        }
      ] : [
        {
          src: '/favicon.ico',
          sizes: '64x64',
          type: 'image/x-icon'
        }
      ]
    };

    return NextResponse.json(manifest);
  } catch (error) {
    return new NextResponse('Error generating manifest', { status: 500 });
  }
}
