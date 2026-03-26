"use client";

import { useState, useEffect, use } from "react";
import { Search, Info, ShoppingCart, Loader2 } from "lucide-react";
import { db, getProductsRef, getStoreBySlug, Store } from "@/lib/firebase/firestore";
import { onSnapshot } from "firebase/firestore";
import { notFound } from "next/navigation";

// Mismas categorías
const CATEGORIES = [
  "Todos",
  "ADYUVANTES",
  "ADHERENTES",
  "ACONDICIONADOR DE AGUA",
  "BIOESTIMULANTES",
  "COADYUVANTES",
  "FUNGICIDAS",
  "HERBICIDAS",
  "INSECTICIDAS",
  "FERTILIZANTES FOLIARES",
  "REGULADORES DE CRECIMIENTO"
];

interface Product {
  id: string;
  name: string;
  category: string;
  substance: string;
  image: string;
}

export default function StoreCatalogPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const resolvedParams = use(params);
  const [store, setStore] = useState<Store | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeLoading, setStoreLoading] = useState(true);

  useEffect(() => {
    getStoreBySlug(resolvedParams.storeSlug).then(s => {
      if (!s) {
         notFound();
      } else {
         setStore(s);
      }
      setStoreLoading(false);
    });
  }, [resolvedParams.storeSlug]);

  useEffect(() => {
    if (!store) return;
    const unsub = onSnapshot(getProductsRef(store.id), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(data);
      setLoading(false);
    });
    return () => unsub();
  }, [store]);

  if (storeLoading) {
     return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-[#156d5e]" /></div>;
  }

  if (!store) return null;

  // Filtrar de productos
  const filteredProducts = products.filter((product) => {
    const matchesCategory = activeCategory === "Todos" || product.category === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.substance.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="bg-[#0b3d32] text-white py-16 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Catálogo de {store.name}</h1>
          <p className="text-[#a4ccbb] md:text-lg">
            Explora nuestra selección premium de insumos y soluciones agrícolas.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <h2 className="font-bold text-gray-800 mb-4 text-lg">Filtros de Búsqueda</h2>
          <div className="space-y-1">
            <h3 className="text-[10px] font-bold text-[#156d5e] uppercase tracking-wider mb-3 px-3">🏷 Categorías</h3>
            <ul className="space-y-1">
              {CATEGORIES.map((cat) => (
                <li key={cat}>
                  <button
                    onClick={() => setActiveCategory(cat)}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-md transition-all ${
                      activeCategory === cat
                        ? "bg-[#e8ecea] text-[#0b3d32] border-l-4 border-[#0b3d32]"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                    }`}
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Search Bar */}
          <div className="relative mb-8">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Filtrar por producto, categoría o sustancia activa..."
              className="block w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#156d5e] focus:border-transparent transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Product Grid */}
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-[#156d5e]" />
                <p className="font-medium text-sm">Cargando productos...</p>
             </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white border text-center border-gray-100 rounded-xl overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col group">
                  <div className="p-4 relative">
                     {/* Category Badge */}
                     <span className="absolute top-2 left-2 bg-[#e8ecea] text-[#0b3d32] text-[9px] font-bold px-2 py-1 tracking-wider rounded-sm z-10 uppercase">
                        {product.category}
                     </span>
                     <div className="relative w-full h-40 bg-white rounded-lg flex items-center justify-center p-2">
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="object-contain h-32 group-hover:scale-105 transition-transform duration-300 drop-shadow-sm mix-blend-multiply"
                          />
                        ) : (
                          <div className="text-gray-300 text-[10px] font-bold uppercase tracking-widest border border-dashed border-gray-200 w-full h-full flex items-center justify-center rounded-lg">Sin imagen</div>
                        )}
                     </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col pt-0">
                    <h3 className="font-bold text-gray-900 mb-1 text-sm uppercase">{product.name}</h3>
                    <p className="text-[11px] text-gray-500 mb-4 flex-1 line-clamp-2">{product.substance}</p>
                    
                    <div className="flex gap-2 mt-auto">
                       <button className="flex-1 flex items-center justify-center gap-1 bg-gray-50 border border-gray-100 hover:bg-gray-100 text-gray-700 font-semibold py-2 rounded-lg text-[11px] transition">
                         <Info className="w-3 h-3" /> Detalles
                       </button>
                       <button className="flex-1 flex items-center justify-center gap-1 bg-[#13594a] hover:bg-[#0b3d32] text-white font-semibold py-2 rounded-lg text-[11px] transition shadow-md shadow-[#13594a]/30">
                         <ShoppingCart className="w-3 h-3" /> Añadir
                       </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-gray-500 mb-2 font-medium">No se encontraron productos.</p>
              <button 
                onClick={() => { setSearchTerm(""); setActiveCategory("Todos"); }}
                className="text-[#156d5e] hover:underline text-sm font-semibold"
              >
                Resetear filtros
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
