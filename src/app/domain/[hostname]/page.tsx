"use client";

import { useState, useEffect, use } from "react";
import { Search, Info, ShoppingCart, Loader2, Star, X, Tag } from "lucide-react";
import { db, getProductsRef, getStoreByDomain, Store, Coupon } from "@/lib/firebase/firestore";
import { onSnapshot } from "firebase/firestore";
import { notFound } from "next/navigation";

// Mismas categorías
const DEFAULT_CATEGORIES = [
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

export interface ProductVariant {
  name: string;
  price: number;
}

interface Product {
  id: string;
  name: string;
  category: string;
  substance: string;
  image: string;
  stock: boolean;
  featured: boolean;
  basePrice?: number;
  variants?: ProductVariant[];
}

export default function DomainCatalogPage({ params }: { params: Promise<{ hostname: string }> }) {
  const resolvedParams = use(params);
  const [store, setStore] = useState<Store | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeLoading, setStoreLoading] = useState(true);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string>("");

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");

  const handleApplyCoupon = () => {
    setCouponError("");
    if (!couponCode.trim()) return;
    const found = store?.coupons?.find(c => c.code.toUpperCase() === couponCode.trim().toUpperCase() && c.active);
    if (found) {
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

  useEffect(() => {
    getStoreByDomain(resolvedParams.hostname).then(s => {
      if (!s) {
         notFound();
      } else {
         setStore(s);
      }
      setStoreLoading(false);
    }).catch(err => {
      console.error("Error cargando dominio:", err);
      setStoreLoading(false);
      notFound();
    });
  }, [resolvedParams.hostname]);

  useEffect(() => {
    if (!store) return;
    const unsub = onSnapshot(getProductsRef(store.id), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(data);
      setLoading(false);
    });
    return () => unsub();
  }, [store]);

  const categoriesList = store?.categories?.length ? ["Todos", ...store.categories] : DEFAULT_CATEGORIES;

  if (storeLoading) {
     return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-[#156d5e]" /></div>;
  }

  if (!store) return null;

  // Filtrar y ordenar productos
  const filteredProducts = products.filter((product) => {
    const matchesCategory = activeCategory === "Todos" || product.category === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.substance.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return 0;
  });

  const isClosed = store.businessHours ? !store.businessHours.isOpen : false;

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="text-white py-16 px-4 text-center transition-colors" style={{ backgroundColor: store.themeColor || '#0b3d32' }}>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Catálogo de {store.name}</h1>
          <p className="text-white/80 md:text-lg">
            Explora nuestra selección premium de insumos y soluciones agrícolas.
          </p>
          {store.socialLinks && (
            <div className="flex justify-center gap-4 mt-6">
              {store.socialLinks.facebook && <a href={store.socialLinks.facebook} target="_blank" rel="noreferrer" className="bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition"><img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" className="w-5 h-5 invert" /></a>}
              {store.socialLinks.instagram && <a href={store.socialLinks.instagram} target="_blank" rel="noreferrer" className="bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition"><img src="https://cdn-icons-png.flaticon.com/512/1384/1384063.png" alt="Instagram" className="w-5 h-5 invert" /></a>}
              {store.socialLinks.tiktok && <a href={store.socialLinks.tiktok} target="_blank" rel="noreferrer" className="bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition"><img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" alt="TikTok" className="w-5 h-5 invert" /></a>}
            </div>
          )}
        </div>
      </section>

      {/* Promociones / Banners */}
      {store.banners && store.banners.length > 0 && (
         <div className="w-full bg-gray-50 pt-8 pb-4 border-b border-gray-100">
           <div className="container mx-auto px-4">
             <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4" style={{ scrollbarWidth: 'none' }}>
                {store.banners.map((img, i) => (
                  <div key={i} className="min-w-[85vw] md:min-w-[600px] xl:min-w-[800px] h-48 md:h-64 xl:h-80 flex-shrink-0 snap-center rounded-2xl overflow-hidden shadow-md border border-gray-200">
                    <img src={img} alt={`Promoción ${i}`} className="w-full h-full object-cover" />
                  </div>
                ))}
             </div>
           </div>
         </div>
      )}

      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 flex-shrink-0">
          {/* Info Tienda */}
          {(store.businessHours || store.deliveryMethods) && (
            <div className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-100 shadow-sm">
               <h3 className="font-bold text-gray-800 text-sm mb-4 border-b border-gray-200 pb-2">📦 Info de la Tienda</h3>
               
               {store.businessHours && (
                  <div className="mb-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Horarios</p>
                    <p className="text-xs text-gray-700 font-medium">
                       {store.businessHours.isOpen ? (
                          <span className="text-green-600 font-bold flex items-center gap-1">🟢 Abierto Ahora</span>
                       ) : (
                          <span className="text-red-500 font-bold flex items-center gap-1">🔴 Cerrado</span>
                       )}
                       {store.businessHours.schedule && <span className="block mt-1 text-gray-500">{store.businessHours.schedule}</span>}
                    </p>
                  </div>
               )}

               {store.deliveryMethods && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Envíos</p>
                    <ul className="text-xs text-gray-600 space-y-1.5 font-medium">
                       {store.deliveryMethods.pickup && <li className="flex items-center gap-1.5">✓ Retiro en local</li>}
                       {store.deliveryMethods.shipping && <li className="flex flex-col gap-0.5"><span>✓ Envío a domicilio {store.deliveryMethods.shippingCost ? <span className="text-[#156d5e]">(Desde S/ {store.deliveryMethods.shippingCost})</span> : ''}</span></li>}
                    </ul>
                    {store.deliveryMethods.shipping && store.deliveryMethods.shippingZones && (
                       <p className="text-[10px] text-gray-500 mt-1.5 italic leading-relaxed">{store.deliveryMethods.shippingZones}</p>
                    )}
                  </div>
               )}
            </div>
          )}

          <h2 className="font-bold text-gray-800 mb-4 text-lg">Filtros de Búsqueda</h2>
          <div className="space-y-1">
            <h3 className="text-[10px] font-bold text-[#156d5e] uppercase tracking-wider mb-3 px-3">🏷 Categorías</h3>
            <ul className="space-y-1">
              {categoriesList.map((cat) => (
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
                     {/* Category & Badges */}
                     <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 items-start">
                       <span className="bg-[#e8ecea] text-[#0b3d32] text-[9px] font-bold px-2 py-1 tracking-wider rounded-sm uppercase shadow-sm">
                          {product.category}
                       </span>
                       {product.featured && (
                         <span className="bg-yellow-400 text-yellow-900 text-[9px] font-bold px-2 py-1 tracking-wider rounded-sm uppercase flex items-center gap-1 shadow-sm"><Star className="w-2.5 h-2.5" fill="currentColor" /> Destacado</span>
                       )}
                       {product.stock === false && (
                         <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-1 tracking-wider rounded-sm uppercase shadow-sm">Agotado</span>
                       )}
                     </div>
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
                    <p className="text-[11px] text-gray-500 mb-2 flex-1 line-clamp-2">{product.substance}</p>
                    
                    <div className="mb-3">
                       {product.basePrice != null && <span className="font-bold text-[#156d5e] text-sm">S/ {product.basePrice.toFixed(2)}</span>}
                       {product.variants && product.variants.length > 0 && <span className="block text-[10px] text-gray-400 mt-0.5">{product.variants.length} variante(s) disponibles</span>}
                    </div>

                    <div className="flex gap-2 mt-auto">
                       <button 
                         onClick={() => {
                            setSelectedProduct(product);
                            setSelectedVariant(product.variants?.[0]?.name || "");
                         }}
                         className="flex-1 flex items-center justify-center gap-1 bg-gray-50 border border-gray-100 hover:bg-gray-100 text-gray-700 font-semibold py-2 rounded-lg text-[11px] transition">
                         <Info className="w-3 h-3" /> Detalles
                       </button>
                       <button 
                         onClick={() => {
                           if (product.variants && product.variants.length > 0) {
                             setSelectedProduct(product);
                             setSelectedVariant(product.variants[0].name);
                           } else {
                             handleWhatsAppClick(product);
                           }
                         }}
                         disabled={product.stock === false || isClosed}
                         className={`flex-1 flex items-center justify-center gap-1 font-semibold py-2 rounded-lg text-[11px] transition shadow-md ${product.stock === false || isClosed ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' : 'text-white'}`}
                         style={(product.stock !== false && !isClosed) ? { backgroundColor: store.themeColor || '#13594a' } : {}}
                       >
                         <ShoppingCart className="w-3 h-3" /> {product.stock === false ? 'Agotado' : (isClosed ? 'Cerrado' : 'Añadir')}
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
                   <h4 className="text-[11px] font-bold text-[#156d5e] mb-1.5 uppercase tracking-wider">Sustancia Activa / Detalles</h4>
                   <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{selectedProduct.substance}</p>
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

    </div>
  );
}
