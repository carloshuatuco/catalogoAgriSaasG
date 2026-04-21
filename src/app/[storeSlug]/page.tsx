"use client";

import { useState, useEffect, use, useRef, useMemo } from "react";
import { Search, Filter, ShoppingBag, ShoppingCart, MapPin, ChevronLeft, ChevronRight, X, User, Phone, Info, Loader2, Star, Tag, Award, LayoutGrid, List, ZoomIn } from "lucide-react";
import toast from "react-hot-toast";
import { db, getProductsRef, getStoreBySlug, Store, Product } from "@/lib/firebase/firestore";
import { onSnapshot } from "firebase/firestore";
import { notFound } from "next/navigation";


const DEFAULT_PRIORITY_CATEGORIES = ['FOLIARES', 'HERBICIDAS', 'FUNGICIDAS'];

// Borramos la interfaz local de Product porque ya está en firestore.ts

export default function StoreCatalogPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const resolvedParams = use(params);
  const [store, setStore] = useState<Store | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeLoading, setStoreLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(20);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string>("");

  // Carrusel Hero
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Popup Promocional
  const [showPromo, setShowPromo] = useState(false);

  // Modal Info Tienda
  const [isStoreInfoOpen, setIsStoreInfoOpen] = useState(false);

  // Opciones de visualización (Grid = 2 columnas en movil / List = 1 columna estilo UberEats)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Visor de Imágenes con Zoom
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const handleWhatsAppClick = (product: Product, variantName?: string) => {
    if (store?.businessHours && !store.businessHours.isOpen) {
       toast.error(store.businessHours.closedMessage || "La tienda se encuentra cerrada en este momento.");
       return;
    }
    if (!store?.whatsappNumber) {
      toast.error("Lo sentimos, esta tienda no tiene un número de WhatsApp configurado para recibir pedidos.");
      return;
    }
    const baseMsg = store.whatsappMessage || "Hola, me interesa el producto [Producto] que vi en tu catálogo.";
    
    let productName = product.name;
    if (variantName) {
      productName += ` (${variantName})`;
    }
    
    let msg = baseMsg.replace("[Producto]", productName);

    const url = `https://wa.me/${store.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  const [storeNotFound, setStoreNotFound] = useState(false);

  useEffect(() => {
    getStoreBySlug(resolvedParams.storeSlug).then(s => {
      if (!s) {
         setStoreNotFound(true);
      } else {
         setStore(s);
         if (s.banners && s.banners.length > 0) {
           const hasSeen = sessionStorage.getItem(`promo_${s.id}`);
           if (!hasSeen) {
             setTimeout(() => setShowPromo(true), 1500);
           }
         }
      }
      setStoreLoading(false);
    }).catch(err => {
      console.error("Error cargando la tienda:", err);
      setStoreNotFound(true);
      setStoreLoading(false);
    });
  }, [resolvedParams.storeSlug]);

  // Autoplay del carrusel
  useEffect(() => {
    if (!store?.carouselImages || store.carouselImages.length <= 1) return;
    const interval = setInterval(() => {
       setCurrentSlide(prev => (prev + 1) % store.carouselImages!.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [store?.carouselImages]);

  useEffect(() => {
    if (!store) return;
    const unsub = onSnapshot(getProductsRef(store.id), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(data);
      setLoading(false);
    });
    return () => unsub();
  }, [store]);

  const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))].sort();
  const categoriesList = ["Todos", ...uniqueCategories];

  // Reset visible count cuando cambia el filtro o búsqueda
  useEffect(() => { setVisibleCount(20); }, [activeCategory, searchTerm]);

  // Infinite scroll con IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => prev + 20);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinelRef.current]);

  // ———————————————————————————————————————
  // Ordenamiento de productos con jerarquía + aleatorio en prioritarias
  // Reglas:
  //   1. Destacado + Oferta (con imagen)
  //   2. Solo Destacado   (con imagen)
  //   3. Solo Oferta      (con imagen)
  //   4. 3 Categorías prioritarias mezcladas al azar (con imagen)
  //   5. Resto            (con imagen)
  //   6. TODO producto sin imagen — siempre últimos
  // ———————————————————————————————————————
  const filteredProducts = useMemo(() => {
    const priorities = (store?.priorityCategories && store.priorityCategories.length > 0)
      ? store.priorityCategories.map(c => c.toUpperCase())
      : DEFAULT_PRIORITY_CATEGORIES.map(c => c.toUpperCase());

    const base = products.filter(p => {
      const matchesCategory = activeCategory === "Todos" || p.category === activeCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description || p.substance || "").toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    const hasImg  = (p: { image: string }) => Boolean(p.image);
    const isPriority = (p: { category?: string }) => priorities.includes((p.category || '').toUpperCase());

    // Grupos con imagen
    const featBoth   = base.filter(p =>  hasImg(p) &&  p.featured &&  p.onSale);
    const featOnly   = base.filter(p =>  hasImg(p) &&  p.featured && !p.onSale);
    const saleOnly   = base.filter(p =>  hasImg(p) && !p.featured &&  p.onSale);
    const priority   = base.filter(p =>  hasImg(p) && !p.featured && !p.onSale && isPriority(p));
    const rest       = base.filter(p =>  hasImg(p) && !p.featured && !p.onSale && !isPriority(p));

    // Sin imagen — TODOS van al final, sin excepción
    const noImage    = base.filter(p => !hasImg(p));

    // Mezcla aleatoria de las 3 categorías prioritarias
    const shuffledPriority = [...priority].sort(() => Math.random() - 0.5);

    return [...featBoth, ...featOnly, ...saleOnly, ...shuffledPriority, ...rest, ...noImage];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, activeCategory, searchTerm, store?.priorityCategories]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  if (storeLoading) {
     return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-[#156d5e]" /></div>;
  }

  if (storeNotFound) {
     return (
       <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
         <h2 className="text-2xl font-bold text-gray-800 mb-2">Catálogo no encontrado</h2>
         <p className="text-gray-500 max-w-md">No pudimos encontrar la tienda que buscas o actualmente no está disponible.</p>
         <a href="/" className="mt-6 bg-[#156d5e] text-white px-6 py-2.5 rounded-xl font-bold transition hover:bg-[#0b3d32] shadow-sm">Ir a la página principal</a>
       </div>
     );
  }

  if (!store) return null;


  const isClosed = store.businessHours ? !store.businessHours.isOpen : false;


  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section Premium */}
      <section className="relative w-full h-[60vh] md:h-[70vh] bg-gray-900 overflow-hidden shadow-sm">
        {store.carouselImages && store.carouselImages.length > 0 ? (
           <>
             {store.carouselImages.map((img, idx) => (
               <div 
                 key={idx} 
                 className={`absolute inset-0 transition-all duration-1000 ease-in-out ${idx === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
               >
                 <img src={img} alt={`Portada ${idx}`} className="w-full h-full object-cover" />
                 {/* Ligero degradado solo abajo para que resalten los íconos sociales */}
                 <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent"></div>
               </div>
             ))}
             
             {store.carouselImages.length > 1 && (
               <>
                 <button onClick={() => setCurrentSlide(prev => (prev - 1 + store.carouselImages!.length) % store.carouselImages!.length)} className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 border border-white/20 hover:bg-white/30 text-white transition-all backdrop-blur-md hover:scale-110 shadow-lg z-30">
                   <ChevronLeft className="w-6 h-6" />
                 </button>
                 <button onClick={() => setCurrentSlide(prev => (prev + 1) % store.carouselImages!.length)} className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 border border-white/20 hover:bg-white/30 text-white transition-all backdrop-blur-md hover:scale-110 shadow-lg z-30">
                   <ChevronRight className="w-6 h-6" />
                 </button>
                 <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-30">
                    {store.carouselImages.map((_, i) => (
                      <button key={i} onClick={() => setCurrentSlide(i)} className={`h-2 rounded-full transition-all duration-500 ${i === currentSlide ? 'bg-white w-8 shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'bg-white/40 w-2 hover:bg-white/60'}`} />
                    ))}
                 </div>
               </>
             )}
           </>
        ) : (
           <div className="w-full h-full flex items-center justify-center relative" style={{ backgroundColor: store.themeColor || '#0b3d32' }}>
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
           </div>
        )}

        {/* Branding Overlay (Simplified) */}
        <div className="absolute inset-0 flex flex-col items-center justify-end p-6 text-center z-20 pb-12 md:pb-20">
           {store.socialLinks && (
            <div className="flex justify-center gap-5 mt-4 animate-in slide-in-from-bottom-8 duration-700 delay-200">
              {store.socialLinks.facebook && <a href={store.socialLinks.facebook} target="_blank" rel="noreferrer" title="Facebook" className="bg-white/90 backdrop-blur-md hover:bg-white p-4 rounded-full transition-all duration-300 shadow-lg transform hover:-translate-y-1.5"><svg className="w-6 h-6 text-[#1877F2] fill-current" viewBox="0 0 24 24"><path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z"/></svg></a>}
              {store.socialLinks.instagram && <a href={store.socialLinks.instagram} target="_blank" rel="noreferrer" title="Instagram" className="bg-white/90 backdrop-blur-md hover:bg-white p-4 rounded-full transition-all duration-300 shadow-lg transform hover:-translate-y-1.5"><img src="https://cdn-icons-png.flaticon.com/512/1384/1384063.png" alt="Instagram" className="w-6 h-6" /></a>}
              {store.socialLinks.tiktok && <a href={store.socialLinks.tiktok} target="_blank" rel="noreferrer" title="TikTok" className="bg-white/90 backdrop-blur-md hover:bg-white p-4 rounded-full transition-all duration-300 shadow-lg transform hover:-translate-y-1.5"><img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" alt="TikTok" className="w-6 h-6" /></a>}
            </div>
           )}
        </div>
      </section>

      {/* Cabecera de Controles: Búsqueda e Info Tienda de forma compacta */}
      <div className="container mx-auto px-4 mt-5 mb-2">
        {/* Botón Ver Información de Tienda */}
        {(store.businessHours || store.deliveryMethods || store.locationMapUrl) && (
           <div className="flex justify-center mb-3">
             <button 
               onClick={() => setIsStoreInfoOpen(true)}
               className="bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 px-5 py-2 rounded-full shadow-[0_2px_10px_rgb(0,0,0,0.04)] hover:shadow-md transition-all font-bold text-[13px] sm:text-[14px] flex items-center gap-2 group"
             >
               <Info className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" style={{ color: store.themeColor || '#156d5e' }} /> 
               <span>Información del Negocio</span>
             </button>
           </div>
        )}

        {/* Search Bar */}
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar en el catálogo..."
            className="block w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3.5 border border-gray-200 rounded-xl bg-white shadow-sm focus:bg-white text-[14px] sm:text-[15px] focus:outline-none focus:ring-2 focus:border-transparent transition-all"
            style={{ '--tw-ring-color': store.themeColor ? `${store.themeColor}33` : '#156d5e33' } as any}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Filtros de categoría en MÓVIL — horizontal scrollable chips */}
      <div className="lg:hidden pl-4 pr-0 mb-2">
        <div className="flex gap-2.5 overflow-x-auto pb-3 pr-4 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
          {categoriesList.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[12px] sm:text-[13px] font-bold transition-all border ${
                activeCategory === cat
                  ? 'text-white border-transparent shadow-md'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              style={activeCategory === cat ? { backgroundColor: store.themeColor || '#156d5e', boxShadow: `0 4px 14px 0 ${store.themeColor ? store.themeColor+'40' : '#156d5e40'}` } : {}}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-2 sm:py-6 flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters — solo visible en desktop */}
        <aside className="hidden lg:block w-full lg:w-72 flex-shrink-0 space-y-8">
          {/* Se eliminó la info tienda duplicada, ahora es un modal */}

          {/* Filtros */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-gray-900/5 sticky top-24">
            <h3 className="font-bold text-gray-900 text-[15px] mb-5 flex items-center gap-2">
              <span className="bg-gray-50 border border-gray-100 shadow-sm p-2 rounded-xl text-gray-500"><Search className="w-4 h-4" /></span>
              Filtros
            </h3>
            
            <div className="space-y-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Categorías</p>
              <ul className="space-y-1.5">
                {categoriesList.map((cat) => (
                  <li key={cat}>
                    <button
                      onClick={() => setActiveCategory(cat)}
                      className={`w-full text-left px-4 py-3 text-[13px] font-bold rounded-2xl transition-all flex items-center justify-between ${
                        activeCategory === cat
                          ? "bg-[#156d5e] text-white shadow-lg shadow-[#156d5e]/20"
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 border border-transparent hover:border-gray-100"
                      }`}
                    >
                      {cat}
                      {activeCategory === cat && <ChevronRight className="w-4 h-4 opacity-70" />}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 w-full max-w-full">
          {/* Se movió el Search Bar a la parte superior junto al Info Button para ahorrar espacio */}
          
          {/* Product Grid Header & Toggler */}
          <div className="flex items-center justify-between mb-5">
             <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
               {searchTerm ? 'Resultados' : (activeCategory === 'Todos' ? 'Catálogo' : activeCategory)}
               <span className="ml-2 text-sm text-gray-400 font-normal">({filteredProducts.length})</span>
             </h2>
             <div className="flex items-center bg-gray-100/80 rounded-xl p-1 border border-gray-200/50">
                <button 
                   onClick={() => setViewMode('grid')} 
                   className={`p-1.5 sm:py-1.5 sm:px-3 rounded-lg transition-colors flex items-center gap-1.5 ${viewMode === 'grid' ? 'bg-white text-[#156d5e] shadow-sm font-bold' : 'text-gray-400 hover:text-gray-600'}`}
                   style={viewMode === 'grid' ? { color: store.themeColor || '#156d5e' } : {}}
                >
                  <LayoutGrid className="w-4 h-4" /> <span className="text-[11px] uppercase tracking-wider hidden sm:inline">Cuadrícula</span>
                </button>
                <button 
                   onClick={() => setViewMode('list')} 
                   className={`p-1.5 sm:py-1.5 sm:px-3 rounded-lg transition-colors flex items-center gap-1.5 ${viewMode === 'list' ? 'bg-white text-[#156d5e] shadow-sm font-bold' : 'text-gray-400 hover:text-gray-600'}`}
                   style={viewMode === 'list' ? { color: store.themeColor || '#156d5e' } : {}}
                >
                   <List className="w-4 h-4" /> <span className="text-[11px] uppercase tracking-wider hidden sm:inline">Lista</span>
                </button>
             </div>
          </div>

          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-[#156d5e]" />
                <p className="font-medium text-sm">Cargando productos...</p>
             </div>
          ) : filteredProducts.length > 0 ? (
            <>
              <div className={viewMode === 'grid' ? "grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6" : "flex flex-col gap-3 sm:gap-4"}>
                {visibleProducts.map((product) => (
                  <div key={product.id} className={`bg-white rounded-[20px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-gray-100/60 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 flex group relative overflow-hidden ${viewMode === 'grid' ? 'flex-col' : 'flex-row p-3 gap-3 items-center'}`}>

                  {/* Badges Flotantes (En móvil solo iconos) */}
                  <div className={`absolute z-10 flex flex-col gap-1 items-start ${viewMode === 'grid' ? 'top-2.5 left-2.5' : 'top-2 left-2'}`}>
                     {product.featured && (
                        <span className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white text-[9px] font-black p-1.5 sm:px-2 sm:py-1 tracking-widest rounded-md flex items-center gap-1 shadow-sm opacity-95">
                          <Award className="w-3.5 h-3.5 sm:w-3 sm:h-3 shrink-0" /> 
                          <span className="hidden sm:inline">DESTACADO</span>
                        </span>
                     )}
                     {product.onSale && (
                        <span className="bg-gradient-to-r from-red-500 to-rose-600 text-white text-[9px] font-black p-1.5 sm:px-2 sm:py-1 tracking-widest rounded-md flex items-center gap-1 shadow-sm opacity-95">
                          <Tag className="w-3.5 h-3.5 sm:w-3 sm:h-3 shrink-0 fill-current" /> 
                          <span className="hidden sm:inline">OFERTA</span>
                        </span>
                     )}
                     {product.stock === false && (
                        <span className="bg-gray-800 text-white text-[9px] font-black px-2 py-1 tracking-widest rounded-md uppercase shadow-sm">
                           Agotado
                        </span>
                     )}
                  </div>

                  {/* Imagen (clicable para ZoomModal) */}
                  <div 
                    onClick={() => {
                        if (product.image) setZoomedImage(product.image);
                    }}
                    className={`relative bg-gradient-to-b from-gray-50 to-white flex items-center justify-center transition-colors shrink-0 cursor-zoom-in ${
                      viewMode === 'grid' 
                        ? 'w-full h-32 sm:h-44 p-4' 
                        : 'w-24 h-24 sm:w-32 sm:h-32 p-2 rounded-xl border border-gray-100/80 bg-white'
                    }`}
                  >
                     {product.image ? (
                       <img src={product.image} alt={product.name} className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 ease-in-out drop-shadow-sm group-hover:scale-105" />
                     ) : (
                       <div className="text-gray-300 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest border-2 border-dashed border-gray-200 w-full h-full flex items-center justify-center rounded-xl bg-white/50">Sin imagen</div>
                     )}
                     <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  
                  {/* Detalles y Acciones muy limpios */}
                  <div className={`flex flex-col bg-white flex-1 ${viewMode === 'grid' ? 'p-3 sm:p-5' : 'py-1 pr-1'}`}>
                    <h3 className={`font-extrabold text-gray-900 leading-snug line-clamp-2 mb-1 ${viewMode === 'grid' ? 'text-[13px] sm:text-[15px]' : 'text-[14px] sm:text-[16px]'}`}>{product.name}</h3>
                    
                    {/* Precio alineado */}
                    <div className="flex items-end justify-between mt-1 mb-3 sm:mb-4">
                       <div className="flex flex-col">
                          {product.basePrice != null && (
                             <>
                               {viewMode === 'grid' ? null : <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Precio</span>}
                               <span className="font-black text-base sm:text-xl text-gray-900 tracking-tighter leading-none">S/ {product.basePrice.toFixed(2)}</span>
                             </>
                          )}
                       </div>
                       {product.variants && product.variants.length > 0 && (
                          <span className="text-[9px] sm:text-[10px] text-[#156d5e] font-black bg-[#156d5e]/10 px-2 py-0.5 rounded-md border border-[#156d5e]/10">
                             +{product.variants.length} OPCS
                          </span>
                       )}
                    </div>

                    {/* Acciones compactas (Menos Altura) */}
                    <div className="flex gap-1.5 sm:gap-2 mt-auto">
                       <button 
                         onClick={() => {
                            setSelectedProduct(product);
                            setSelectedVariant(product.variants?.[0]?.name || "");
                         }}
                         className="flex-1 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-2 sm:py-2.5 rounded-lg text-[11px] sm:text-[12px] transition-colors border border-gray-200/80 shadow-sm"
                       >
                         <Info className="w-3.5 h-3.5 sm:mr-1" /> <span className={`${viewMode === 'grid' ? 'hidden sm:inline' : 'inline'}`}>Info</span>
                       </button>
                       <button 
                         onClick={() => {
                           setSelectedProduct(product);
                           if (product.variants && product.variants.length > 0) {
                             setSelectedVariant(product.variants[0].name);
                           } else {
                             setSelectedVariant("");
                           }
                         }}
                         disabled={product.stock === false || isClosed}
                         className={`flex-[1.5] sm:flex-[2] flex items-center justify-center font-bold py-2 sm:py-2.5 rounded-lg text-[11px] sm:text-[12px] transition-all shadow-sm ${product.stock === false || isClosed ? 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none' : 'text-white hover:opacity-90'}`}
                         style={(product.stock !== false && !isClosed) ? { backgroundColor: store.themeColor || '#13594a' } : {}}
                       >
                         <ShoppingCart className="w-3.5 h-3.5 sm:mr-1" /> <span className="hidden sm:inline">{product.stock === false ? 'Agotado' : (isClosed ? 'Cerrado' : 'Añadir')}</span><span className="sm:hidden">{product.stock === false ? 'Agot.' : (isClosed ? 'Cerr.' : 'Añadir')}</span>
                       </button>
                    </div>
                  </div>
                </div>
              ))}
              </div>
              {/* Centinela de Infinite Scroll */}
              {hasMore && (
                <div ref={sentinelRef} className="flex justify-center items-center py-10 mt-4">
                  <Loader2 className="w-8 h-8 animate-spin text-[#156d5e]/50" />
                </div>
              )}
              {!hasMore && filteredProducts.length > 20 && (
                <p className="text-center text-xs text-gray-400 font-medium py-8 uppercase tracking-widest">
                  Has visto todos los productos ({filteredProducts.length})
                </p>
              )}
            </>
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
        </main>
      </div>

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
             <div className="flex justify-between items-center p-4 border-b border-gray-100 shrink-0">
               <h3 className="font-bold text-lg text-gray-800 tracking-wide uppercase">{selectedProduct.name}</h3>
               <button onClick={() => setSelectedProduct(null)} className="text-gray-400 hover:text-gray-700 transition"><X className="w-5 h-5"/></button>
             </div>
             
             <div className="p-6 overflow-y-auto">
                <div className="flex justify-center mb-6">
                   {selectedProduct.image ? (
                      <img src={selectedProduct.image} alt={selectedProduct.name} className="h-48 object-contain mix-blend-multiply drop-shadow-sm" />
                   ) : (
                      <div className="h-48 w-full bg-gray-50 border border-dashed border-gray-200 rounded-xl flex items-center justify-center text-xs text-gray-400 font-bold uppercase tracking-wider">Sin imagen</div>
                   )}
                </div>

                <div className="mb-4">
                   <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-[11px] font-bold text-[#156d5e] uppercase tracking-wider">Descripción / Detalles</h4>
                      {selectedProduct.category && (
                         <span className="inline-block bg-gray-100/80 text-gray-600 text-[10px] font-black px-2 py-0.5 tracking-widest rounded-md uppercase border border-gray-200/50">
                            {selectedProduct.category}
                         </span>
                      )}
                   </div>
                   <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{selectedProduct.description || selectedProduct.substance}</p>
                </div>

                {selectedProduct.variants && selectedProduct.variants.length > 0 ? (
                   <div className="mb-6">
                      <h4 className="text-[11px] font-bold text-[#156d5e] mb-2 uppercase tracking-wider">Presentaciones Disponibles</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                         {selectedProduct.variants.map((v) => (
                           <label key={v.name} className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all ${selectedVariant === v.name ? 'border-[#156d5e] bg-[#f0f9f6]/40 ring-1 ring-[#156d5e]' : 'border-gray-200 hover:border-gray-300 bg-gray-50'}`}>
                              <div className="flex items-center gap-2">
                                <input type="radio" name="variant" value={v.name} checked={selectedVariant === v.name} onChange={() => setSelectedVariant(v.name)} className="text-[#156d5e] focus:ring-[#156d5e] mt-0.5" />
                                <span className="text-xs font-bold text-gray-700">{v.name}</span>
                              </div>
                              <span className="text-sm font-bold text-[#156d5e]">S/ {v.price.toFixed(2)}</span>
                           </label>
                         ))}
                      </div>
                   </div>
                ) : (
                   <div className="mb-6">
                      {selectedProduct.basePrice != null ? (
                        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
                           <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Precio</span>
                           <span className="text-xl font-bold text-[#156d5e]">S/ {selectedProduct.basePrice.toFixed(2)}</span>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 italic">Precio a consultar al coordinar la compra.</p>
                      )}
                   </div>
                )}

                {/* Removed Coupon Code Section */}
             </div>
             
             <div className="p-4 border-t border-gray-100 shrink-0">
               <button 
                 onClick={() => {
                   handleWhatsAppClick(selectedProduct, selectedVariant);
                   setSelectedProduct(null);
                 }}
                 disabled={selectedProduct.stock === false || isClosed || (selectedProduct.variants != null && selectedProduct.variants.length > 0 && !selectedVariant)}
                 className={`w-full flex items-center justify-center gap-2 font-bold py-3.5 rounded-xl text-sm transition shadow-md ${selectedProduct.stock === false || isClosed || (selectedProduct.variants != null && selectedProduct.variants.length > 0 && !selectedVariant) ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' : 'text-white'}`}
                 style={(selectedProduct.stock !== false && !isClosed && !(selectedProduct.variants != null && selectedProduct.variants.length > 0 && !selectedVariant)) ? { backgroundColor: store.themeColor || '#13594a' } : {}}
               >
                 <ShoppingCart className="w-4 h-4" /> 
                 {selectedProduct.stock === false ? 'Agotado' : (isClosed ? 'Cerrado' : 'Continuar por WhatsApp')}
               </button>
             </div>
          </div>
        </div>
      )}

    {/* Promo Banner Popup */}
    {showPromo && store.banners && store.banners.length > 0 && (
      <div 
        className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-3 sm:p-6 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={() => {
          setShowPromo(false);
          sessionStorage.setItem(`promo_${store.id}`, 'true');
        }}
      >
         <div 
           className="relative w-full animate-in zoom-in-95 duration-300"
           style={{ maxWidth: '480px' }}
           onClick={(e) => e.stopPropagation()}
         >
            <button 
              onClick={() => {
                setShowPromo(false);
                sessionStorage.setItem(`promo_${store.id}`, 'true');
              }} 
              className="absolute -top-3 -right-3 z-20 bg-white text-gray-900 p-2 rounded-full transition shadow-xl border-2 border-gray-100 hover:scale-110"
            >
              <X className="w-5 h-5"/>
            </button>
            <img 
              src={store.banners[0]} 
              alt="Promoción Especial" 
              className="w-full h-auto rounded-3xl shadow-2xl block"
              style={{ maxHeight: '90vh', objectFit: 'contain' }}
            />
         </div>
      </div>
    )}

    {/* Modal Info Tienda */}
    {isStoreInfoOpen && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
         <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-all" onClick={() => setIsStoreInfoOpen(false)}></div>
         <div className="bg-white rounded-[32px] p-6 lg:p-8 w-full max-w-lg shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
           
           <button onClick={() => setIsStoreInfoOpen(false)} className="absolute top-5 right-5 p-2 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-900 rounded-full transition-colors z-20">
             <X className="w-5 h-5" />
           </button>
           
           <h3 className="font-bold text-gray-900 text-xl md:text-2xl mb-8 flex items-center gap-3 pr-8">
             <span className="p-3 shadow-sm rounded-2xl" style={{ backgroundColor: store.themeColor ? `${store.themeColor}15` : '#156d5e15', color: store.themeColor || '#156d5e' }}>
               <Info className="w-6 h-6" />
             </span>
             Sobre Nosotros
           </h3>

           <div className="space-y-8">
             {store.businessHours && (
                <div>
                  <p className="text-[11px] font-black tracking-[0.2em] text-gray-400 mb-3 mx-1">HORARIOS DE ATENCIÓN</p>
                  <div className="flex items-start gap-4 bg-gray-50 p-5 rounded-[24px] border border-gray-100/80 shadow-sm relative overflow-hidden">
                     <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-green-100/50 to-transparent rounded-full blur-2xl"></div>
                     {store.businessHours.isOpen ? (
                        <div className="w-3 h-3 mt-1.5 rounded-full bg-green-500 animate-pulse shrink-0 shadow-[0_0_12px_rgba(34,197,94,0.6)]"></div>
                     ) : (
                        <div className="w-3 h-3 mt-1.5 rounded-full bg-red-400 shrink-0"></div>
                     )}
                     <div className="relative z-10">
                        <p className={`text-[17px] font-extrabold ${store.businessHours.isOpen ? 'text-green-700' : 'text-red-500'}`}>
                           {store.businessHours.isOpen ? 'Abierto Ahora' : 'Cerrado'}
                        </p>
                        {store.businessHours.schedule && <p className="text-[14px] text-gray-600 mt-1 leading-relaxed font-semibold">{store.businessHours.schedule}</p>}
                     </div>
                  </div>
                </div>
             )}

             {store.deliveryMethods && (
                <div>
                  <p className="text-[11px] font-black tracking-[0.2em] text-gray-400 mb-3 mx-1">OPCIONES DE ENTREGA</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                     {store.deliveryMethods.pickup && (
                       <div className="flex flex-col gap-3 bg-gray-50 p-5 rounded-[24px] border border-gray-100/80 shadow-sm items-start justify-center">
                         <div className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-100/50">
                           <MapPin className="w-5 h-5 text-gray-400" />
                         </div>
                         <span className="font-extrabold text-gray-800 text-[15px]">Retiro en local</span>
                       </div>
                     )}
                     {store.deliveryMethods.shipping && (
                       <div className="flex flex-col gap-3 p-5 rounded-[24px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] border" style={{ backgroundColor: store.themeColor ? `${store.themeColor}05` : '#156d5e05', borderColor: store.themeColor ? `${store.themeColor}20` : '#156d5e20' }}>
                         <div className="bg-white p-2.5 rounded-xl shadow-sm border" style={{ borderColor: store.themeColor ? `${store.themeColor}20` : '#156d5e20' }}>
                           <svg className="w-5 h-5" style={{ color: store.themeColor || '#156d5e' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                         </div>
                         <span className="font-extrabold text-[15px]" style={{ color: store.themeColor || '#156d5e' }}>Envío a domicilio</span>
                         {(store.deliveryMethods.shippingCost || store.deliveryMethods.shippingZones) && (
                            <div className="mt-1 flex flex-col gap-2">
                              {store.deliveryMethods.shippingCost && <span className="text-[12px] font-black tracking-wide bg-white/80 w-max px-3 py-1.5 rounded-lg shadow-sm text-gray-900 border border-black/5">Desde S/ {store.deliveryMethods.shippingCost}</span>}
                              {store.deliveryMethods.shippingZones && <span className="text-[13px] leading-relaxed font-semibold opacity-90" style={{ color: store.themeColor || '#156d5e' }}>{store.deliveryMethods.shippingZones}</span>}
                            </div>
                         )}
                       </div>
                     )}
                  </div>
                </div>
             )}

             {store.locationMapUrl && (
                <div>
                  <p className="text-[11px] font-black tracking-[0.2em] text-gray-400 mb-3 mx-1">UBICACIÓN GEOGRÁFICA</p>
                  <div className="rounded-[24px] overflow-hidden h-56 border-2 border-gray-100 shadow-md relative group bg-gray-50 transform transition-transform hover:scale-[1.01]">
                    <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-gray-900/10 to-transparent pointer-events-none z-10"></div>
                    <iframe 
                      src={store.locationMapUrl} 
                      width="100%" 
                      height="100%" 
                      style={{ border: 0 }} 
                      allowFullScreen 
                      loading="lazy"
                      className="absolute inset-0 transition-opacity duration-500"
                    />
                  </div>
                </div>
             )}
           </div>

           {/* Call to action */}
           <div className="mt-8 pt-6 border-t border-gray-100">
             <button onClick={() => setIsStoreInfoOpen(false)} className="w-full py-4 rounded-[20px] font-bold text-white shadow-lg transition-transform hover:-translate-y-1 block text-center" style={{ backgroundColor: store.themeColor || '#156d5e', boxShadow: store.themeColor ? `0 10px 25px -5px ${store.themeColor}50` : '0 10px 25px -5px rgba(21, 109, 94, 0.5)' }}>
               Entendido, ver productos
             </button>
           </div>
         </div>
      </div>
    )}
    {/* Visor de Imágenes (Zoom) */}
    {zoomedImage && (
      <div 
        className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-2 sm:p-6 backdrop-blur-md animate-in fade-in duration-300 cursor-zoom-out"
        onClick={() => setZoomedImage(null)}
      >
        <button 
          onClick={() => setZoomedImage(null)} 
          className="absolute top-4 right-4 z-20 bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full transition-colors backdrop-blur-md"
        >
          <X className="w-6 h-6"/>
        </button>
        <img 
          src={zoomedImage} 
          alt="Zoom" 
          className="max-w-full max-h-full object-contain animate-in zoom-in-95 duration-300 drop-shadow-2xl rounded-sm"
        />
      </div>
    )}

    </div>
  );
}
