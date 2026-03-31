"use client";

import { useState, useEffect, use, useRef, useMemo } from "react";
import { Search, Info, ShoppingCart, Loader2, Star, X, Tag, MapPin, ChevronLeft, ChevronRight, Award } from "lucide-react";
import { db, getProductsRef, getStoreBySlug, Store, Coupon, Product } from "@/lib/firebase/firestore";
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

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");

  // Carrusel Hero
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Popup Promocional
  const [showPromo, setShowPromo] = useState(false);

  const handleApplyCoupon = () => {
    setCouponError("");
    if (!couponCode.trim()) return;
    const found = store?.coupons?.find(c => c.code.toUpperCase() === couponCode.trim().toUpperCase() && c.active);
    if (found) {
       // Validar expiración
       if (found.expiresAt && new Date(found.expiresAt) < new Date()) {
          setCouponError("Este cupón ha expirado.");
          setAppliedCoupon(null);
          return;
       }
       // Validar límite de usos
       if (found.usesLimit && (found.currentUses || 0) >= found.usesLimit) {
          setCouponError("Este cupón alcanzó su límite máximo de usos.");
          setAppliedCoupon(null);
          return;
       }
       setAppliedCoupon(found);
    } else {
       setCouponError("Cupón inválido o inactivo");
       setAppliedCoupon(null);
    }
  };

  const handleWhatsAppClick = (product: Product, variantName?: string) => {
    if (store?.businessHours && !store.businessHours.isOpen) {
       alert(store.businessHours.closedMessage || "La tienda se encuentra cerrada en este momento.");
       return;
    }
    if (!store?.whatsappNumber) {
      alert("Lo sentimos, esta tienda no tiene un número de WhatsApp configurado para recibir pedidos.");
      return;
    }
    const baseMsg = store.whatsappMessage || "Hola, me interesa el producto [Producto] que vi en tu catálogo.";
    
    let productName = product.name;
    if (variantName) {
      productName += ` (${variantName})`;
    }
    
    let msg = baseMsg.replace("[Producto]", productName);

    if (appliedCoupon) {
      msg += `\n\n🎟️ *Cupón Aplicado:* ${appliedCoupon.code}`;
      const desc = appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}%` : `S/ ${appliedCoupon.discountValue.toFixed(2)}`;
      msg += `\n*Descuento:* ${desc}`;
      
      // Intentar calcular total si hay un precio definido y es un solo producto (sin lógica de carrito múltiple)
      let productPrice = product.basePrice || 0;
      if (variantName && product.variants) {
         const v = product.variants.find(va => va.name === variantName);
         if (v) productPrice = v.price;
      }
      
      if (productPrice > 0) {
         let subTotal = productPrice;
         let finalTotal = subTotal;
         if (appliedCoupon.discountType === 'percentage') {
            finalTotal = subTotal - (subTotal * (appliedCoupon.discountValue / 100));
         } else {
            finalTotal = subTotal - appliedCoupon.discountValue;
         }
         finalTotal = Math.max(0, finalTotal); // Evitar precios negativos
         msg += `\n*SubTotal:* S/ ${subTotal.toFixed(2)}`;
         msg += `\n*TOTAL NETO:* S/ ${finalTotal.toFixed(2)}`;
      }
    }

    if (store?.deliveryMethods && (store.deliveryMethods.pickup || store.deliveryMethods.shipping)) {
      msg += `\n\n*Métodos de Entrega Disponibles:*`;
      if (store.deliveryMethods.pickup) msg += `\n🛍️ Retiro en Local`;
      if (store.deliveryMethods.shipping) {
        msg += `\n🚚 Envío a Domicilio`;
        if (store.deliveryMethods.shippingCost) msg += ` (Costo Aprox: S/ ${store.deliveryMethods.shippingCost})`;
      }
      msg += `\n\nPor favor indícame tu método de preferencia.`;
    }

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
                 <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-900/40 to-black/20"></div>
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

        {/* Branding Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20">
           {store.logo && (
             <div className="bg-white/5 backdrop-blur-md p-1.5 border border-white/20 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] mb-8 animate-in zoom-in-50 duration-700 ease-out">
               <div className="bg-white rounded-[22px] p-5 shadow-inner">
                 <img src={store.logo} alt="Logo" className="h-20 md:h-28 w-auto object-contain drop-shadow-md" />
               </div>
             </div>
           )}
           <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)] mb-6 tracking-tighter leading-tight px-4 animate-in slide-in-from-bottom-8 duration-700 delay-100 flex-wrap">
              {store.name}
           </h1>
           {store.socialLinks && (
            <div className="flex justify-center gap-5 mt-4 animate-in slide-in-from-bottom-8 duration-700 delay-200">
              {store.socialLinks.facebook && <a href={store.socialLinks.facebook} target="_blank" rel="noreferrer" className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-[#1877F2]/90 hover:border-[#1877F2] p-4 rounded-2xl transition-all duration-300 shadow-xl transform hover:-translate-y-1.5 group"><svg className="w-6 h-6 text-white fill-current transition-colors" viewBox="0 0 24 24"><path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z"/></svg></a>}
              {store.socialLinks.instagram && <a href={store.socialLinks.instagram} target="_blank" rel="noreferrer" className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-pink-500 hover:to-purple-600 hover:border-transparent p-4 rounded-2xl transition-all duration-300 shadow-xl transform hover:-translate-y-1.5 group"><img src="https://cdn-icons-png.flaticon.com/512/1384/1384063.png" alt="Instagram" className="w-6 h-6 invert transition-all" /></a>}
              {store.socialLinks.tiktok && <a href={store.socialLinks.tiktok} target="_blank" rel="noreferrer" className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-black/90 hover:border-black p-4 rounded-2xl transition-all duration-300 shadow-xl transform hover:-translate-y-1.5 group"><img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" alt="TikTok" className="w-6 h-6 invert transition-all" /></a>}
            </div>
           )}
        </div>
      </section>

      {/* Info de Tienda en MÓVIL */}
      {(store.businessHours || store.deliveryMethods || store.locationMapUrl) && (
        <div className="lg:hidden px-4 pt-6">
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-gray-900/5">
            <h3 className="font-bold text-gray-900 text-[14px] mb-4 flex items-center gap-2">
              <span className="bg-[#156d5e]/10 p-2 rounded-xl text-[#156d5e]"><Info className="w-4 h-4" /></span>
              Información
            </h3>
            <div className="space-y-4">
              {store.businessHours && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Horarios de Atención</p>
                  <div className="flex items-start gap-3 bg-gray-50/50 p-3.5 rounded-2xl border border-gray-100/80">
                    {store.businessHours.isOpen ? (
                      <div className="w-2.5 h-2.5 mt-1 rounded-full bg-green-500 animate-pulse shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                    ) : (
                      <div className="w-2.5 h-2.5 mt-1 rounded-full bg-red-400 shrink-0"></div>
                    )}
                    <div>
                      <p className={`text-sm font-extrabold ${store.businessHours.isOpen ? 'text-green-700' : 'text-red-500'}`}>
                        {store.businessHours.isOpen ? 'Abierto Ahora' : 'Cerrado'}
                      </p>
                      {store.businessHours.schedule && <p className="text-[13px] text-gray-500 mt-0.5 leading-relaxed font-medium">{store.businessHours.schedule}</p>}
                    </div>
                  </div>
                </div>
              )}
              {store.deliveryMethods && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Opciones de Entrega</p>
                  <div className="flex flex-col gap-2.5">
                    {store.deliveryMethods.pickup && (
                      <div className="flex items-center gap-3 text-sm text-gray-700 bg-gray-50/50 px-4 py-3 rounded-2xl border border-gray-100/80">
                        <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100/50">
                          <MapPin className="w-4 h-4 text-gray-400" />
                        </div>
                        <span className="font-bold text-gray-800">Retiro en local</span>
                      </div>
                    )}
                    {store.deliveryMethods.shipping && (
                      <div className="flex flex-col gap-2 text-sm text-[#156d5e] bg-[#156d5e]/[0.03] px-4 py-3.5 rounded-2xl border border-[#156d5e]/10">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-lg shadow-sm border border-[#156d5e]/5 text-[#156d5e]">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                          </div>
                          <span className="font-bold">Envío a domicilio</span>
                        </div>
                        {(store.deliveryMethods.shippingCost || store.deliveryMethods.shippingZones) && (
                          <div className="pl-11 pr-2 pb-0.5">
                            {store.deliveryMethods.shippingCost && <p className="text-[11px] font-black tracking-wide text-gray-900 bg-white/60 inline-block px-2.5 py-1 rounded-md mb-1">Desde S/ {store.deliveryMethods.shippingCost}</p>}
                            {store.deliveryMethods.shippingZones && <p className="text-[#156d5e]/80 text-[12px] leading-relaxed font-medium">{store.deliveryMethods.shippingZones}</p>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {store.locationMapUrl && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Ubicación Geográfica</p>
                  <div className="rounded-2xl overflow-hidden h-36 border border-gray-100 relative bg-gray-50/50">
                    <iframe
                      src={store.locationMapUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      className="absolute inset-0"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filtros de categoría en MÓVIL — horizontal scrollable chips */}
      <div className="lg:hidden px-4 pt-4 pb-2">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
          {categoriesList.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-bold transition-all border ${
                activeCategory === cat
                  ? 'text-white border-transparent shadow-md shadow-[#156d5e]/30'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#156d5e]/40 hover:text-[#156d5e]'
              }`}
              style={activeCategory === cat ? { backgroundColor: store.themeColor || '#156d5e' } : {}}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 flex flex-col lg:flex-row gap-10">
        {/* Sidebar Filters — solo visible en desktop */}
        <aside className="hidden lg:block w-full lg:w-72 flex-shrink-0 space-y-8">
          {/* Info Tienda */}
          {(store.businessHours || store.deliveryMethods || store.locationMapUrl) && (
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-gray-900/5">
               <h3 className="font-bold text-gray-900 text-[15px] mb-5 flex items-center gap-2">
                 <span className="bg-[#156d5e]/10 p-2 rounded-xl text-[#156d5e]"><Info className="w-4 h-4" /></span>
                 Información
               </h3>
               
               <div className="space-y-6">
                 {store.businessHours && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 ml-1">Horarios de Atención</p>
                      <div className="flex items-start gap-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100/80">
                         {store.businessHours.isOpen ? (
                            <div className="w-2.5 h-2.5 mt-1 rounded-full bg-green-500 animate-pulse shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                         ) : (
                            <div className="w-2.5 h-2.5 mt-1 rounded-full bg-red-400 shrink-0"></div>
                         )}
                         <div>
                            <p className={`text-sm font-extrabold ${store.businessHours.isOpen ? 'text-green-700' : 'text-red-500'}`}>
                               {store.businessHours.isOpen ? 'Abierto Ahora' : 'Cerrado'}
                            </p>
                            {store.businessHours.schedule && <p className="text-[13px] text-gray-500 mt-1 leading-relaxed font-medium">{store.businessHours.schedule}</p>}
                         </div>
                      </div>
                    </div>
                 )}

                 {store.deliveryMethods && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 ml-1">Opciones de Entrega</p>
                      <div className="flex flex-col gap-3">
                         {store.deliveryMethods.pickup && (
                           <div className="flex items-center gap-3 text-sm text-gray-700 bg-gray-50/50 px-4 py-3.5 rounded-2xl border border-gray-100/80">
                             <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100/50">
                               <MapPin className="w-4 h-4 text-gray-400" />
                             </div>
                             <span className="font-bold text-gray-800">Retiro en local</span>
                           </div>
                         )}
                         {store.deliveryMethods.shipping && (
                           <div className="flex flex-col gap-2 text-sm text-[#156d5e] bg-[#156d5e]/[0.03] px-4 py-4 rounded-2xl border border-[#156d5e]/10">
                             <div className="flex items-center gap-3">
                               <div className="bg-white p-2 rounded-lg shadow-sm border border-[#156d5e]/5 text-[#156d5e]">
                                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                               </div>
                               <span className="font-bold">Envío a domicilio</span>
                             </div>
                             {(store.deliveryMethods.shippingCost || store.deliveryMethods.shippingZones) && (
                                <div className="pl-11 pr-2 pb-1">
                                  {store.deliveryMethods.shippingCost && <p className="text-[11px] font-black tracking-wide text-gray-900 bg-white/60 inline-block px-2.5 py-1 rounded-md mb-1.5">Desde S/ {store.deliveryMethods.shippingCost}</p>}
                                  {store.deliveryMethods.shippingZones && <p className="text-[#156d5e]/80 text-[12px] leading-relaxed font-medium">{store.deliveryMethods.shippingZones}</p>}
                                </div>
                             )}
                           </div>
                         )}
                      </div>
                    </div>
                 )}

                 {store.locationMapUrl && (
                    <div className="pt-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 ml-1">Ubicación Geográfica</p>
                      <div className="rounded-2xl overflow-hidden h-36 border border-gray-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] relative group bg-gray-50/50">
                        <iframe 
                          src={store.locationMapUrl} 
                          width="100%" 
                          height="100%" 
                          style={{ border: 0 }} 
                          allowFullScreen 
                          loading="lazy"
                          className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-90"
                        />
                      </div>
                    </div>
                 )}
               </div>
            </div>
          )}

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
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {visibleProducts.map((product) => (
                  <div key={product.id} className="bg-white rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-gray-100/60 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col group relative overflow-hidden">

                  {/* Badges Flotantes */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 items-start">
                     {product.featured && (
                        <span className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white text-[10px] font-black px-3 py-1.5 tracking-widest rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/20"><Award className="w-3 h-3" /> DESTACADO</span>
                     )}
                     {product.onSale && (
                        <span className="bg-gradient-to-r from-red-500 to-rose-600 text-white text-[10px] font-black px-3 py-1.5 tracking-widest rounded-xl flex items-center gap-1.5 shadow-md shadow-rose-500/20"><Tag className="w-3 h-3 fill-current" /> OFERTA</span>
                     )}
                     {product.stock === false && (
                        <span className="bg-gray-800 text-white text-[10px] font-black px-3 py-1.5 tracking-widest rounded-xl uppercase shadow-md shadow-gray-800/20">Agotado</span>
                     )}
                  </div>

                  {/* Imagen */}
                  <div className="relative w-full h-56 bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-6 group-hover:from-gray-100/50 transition-colors">
                     {product.image ? (
                       <img src={product.image} alt={product.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500 ease-in-out drop-shadow-lg" />
                     ) : (
                       <div className="text-gray-300 text-[10px] font-bold uppercase tracking-widest border-2 border-dashed border-gray-200 w-full h-full flex items-center justify-center rounded-2xl bg-white/50">Sin imagen</div>
                     )}
                  </div>
                  
                  {/* Detalles */}
                  <div className="p-6 flex-1 flex flex-col bg-white">
                    <h3 className="font-extrabold text-gray-900 text-[15px] uppercase leading-tight line-clamp-2 mb-1.5">{product.name}</h3>
                    
                    <span className="inline-block bg-[#156d5e]/10 text-[#156d5e] w-fit text-[9px] font-black px-2 py-1 tracking-widest rounded-md uppercase mb-3 border border-[#156d5e]/10">
                       {product.category}
                    </span>

                    <p className="text-[13px] text-gray-500 mb-5 flex-1 line-clamp-2 leading-relaxed font-medium">{product.description || product.substance}</p>
                    
                    <div className="flex items-end justify-between mb-5">
                       <div className="flex flex-col">
                          {product.basePrice != null && (
                             <>
                               <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Precio</span>
                               <span className="font-black text-2xl text-gray-900 tracking-tighter">S/ {product.basePrice.toFixed(2)}</span>
                             </>
                          )}
                       </div>
                       {product.variants && product.variants.length > 0 && (
                          <span className="text-[10px] text-[#156d5e] font-bold bg-[#156d5e]/10 px-2.5 py-1.5 rounded-lg border border-[#156d5e]/10">
                             +{product.variants.length} OPCS
                          </span>
                       )}
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2.5 mt-auto pt-5 border-t border-gray-100/80">
                       <button 
                         onClick={() => {
                            setSelectedProduct(product);
                            setSelectedVariant(product.variants?.[0]?.name || "");
                         }}
                         className="flex-1 flex items-center justify-center gap-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-3.5 rounded-xl text-[12px] transition-colors border border-gray-200/80 shadow-[inset_0_1px_2px_rgba(255,255,255,1)]">
                         <Info className="w-4 h-4" /> Info
                       </button>
                       <button 
                         onClick={() => {
                           // Siempre abrir modal para permitir ingreso de cupones
                           setSelectedProduct(product);
                           if (product.variants && product.variants.length > 0) {
                             setSelectedVariant(product.variants[0].name);
                           } else {
                             setSelectedVariant("");
                           }
                         }}
                         disabled={product.stock === false || isClosed}
                         className={`flex-[1.5] flex items-center justify-center gap-1.5 font-bold py-3.5 rounded-xl text-[12px] transition-all shadow-md ${product.stock === false || isClosed ? 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none' : 'text-white hover:scale-[1.02] hover:shadow-lg'}`}
                         style={(product.stock !== false && !isClosed) ? { backgroundColor: store.themeColor || '#13594a' } : {}}
                       >
                         <ShoppingCart className="w-4 h-4" /> {product.stock === false ? 'Agotado' : (isClosed ? 'Cerrado' : 'Añadir')}
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
                   <h4 className="text-[11px] font-bold text-[#156d5e] mb-1.5 uppercase tracking-wider">Descripción / Detalles</h4>
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

                {/* Coupon Code Section */}
                <div className="mb-2">
                   <h4 className="text-[11px] font-bold text-[#156d5e] mb-2 uppercase tracking-wider flex items-center gap-1"><Tag className="w-3 h-3"/> ¿Tienes un cupón?</h4>
                   <div className="flex gap-2">
                     <input type="text" value={couponCode} onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); setAppliedCoupon(null); }} className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm uppercase transition focus:ring-2 focus:ring-[#156d5e] focus:bg-white font-bold tracking-widest" placeholder="EJ. VERANO20" disabled={!!appliedCoupon} />
                     {!appliedCoupon ? (
                       <button type="button" onClick={handleApplyCoupon} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold transition">Aplicar</button>
                     ) : (
                       <button type="button" onClick={() => { setAppliedCoupon(null); setCouponCode(""); }} className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg text-xs font-bold transition">Quitar</button>
                     )}
                   </div>
                   {couponError && <p className="text-red-500 text-[10px] font-bold mt-1">{couponError}</p>}
                   {appliedCoupon && (
                      <p className="text-[#156d5e] font-bold text-xs mt-1.5 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current"/> ¡Cupón activo! {appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}% descuento` : `S/ ${appliedCoupon.discountValue.toFixed(2)} descuento`}
                      </p>
                   )}
                </div>
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

    </div>
  );
}
