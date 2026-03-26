import { getStoreBySlug } from "@/lib/firebase/firestore";
import { notFound } from "next/navigation";
import type { Metadata, ResolvingMetadata } from 'next';

type Props = {
  children: React.ReactNode;
  params: Promise<{ storeSlug: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { storeSlug } = await params;
  const store = await getStoreBySlug(storeSlug);

  return {
    title: store ? `Catálogo | ${store.name}` : "Tienda no encontrada",
    description: store ? `Catálogo oficial de ${store.name}` : "",
  }
}

export default async function StoreLayout({
  children,
  params,
}: Props) {
  const { storeSlug } = await params;
  const store = await getStoreBySlug(storeSlug);
  
  if (!store) {
    notFound();
  }

  return (
    <div className="bg-gray-50 text-gray-900 min-h-screen flex flex-col w-full">
      {/* Header Corporativo Personalizado */}
      <header className="bg-[#0b3d32] text-white p-4 sticky top-0 z-50 shadow-md">
        <div className="container mx-auto flex items-center justify-between">
          <div className="font-bold text-2xl tracking-wide flex items-center gap-2">
            <span className="text-green-400">🌲</span> {store.name}
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {children}
      </main>

      {/* Footer Personalizado */}
      <footer className="bg-[#0b3d32] text-white p-8 mt-auto border-t border-[#13594a]">
        <div className="container mx-auto text-center text-sm text-gray-300">
          <p className="mb-2">&copy; {new Date().getFullYear()} {store.name}. Todos los derechos reservados.</p>
          <div className="mt-8 flex flex-col items-center justify-center opacity-60 hover:opacity-100 transition-opacity">
             <span className="text-[10px] tracking-widest uppercase mb-1">Tecnología provista por</span>
             <a href="/" className="font-bold text-white tracking-widest">MAGISTRAL</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
