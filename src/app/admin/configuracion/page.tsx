"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { db, getProductsRef } from "@/lib/firebase/firestore";
import { doc, updateDoc, getDocs } from "firebase/firestore";
import { Loader2, Save, UploadCloud, X, Copy, Store, Palette, Link as LinkIcon, MessageCircle, Truck, MapPin, Image as ImageIcon, LayoutTemplate } from "lucide-react";
import toast from "react-hot-toast";
import { uploadImage } from "@/lib/firebase/storage";

export default function ConfigPage() {
  const { store } = useAuthStore();
  const [saving, setSaving] = useState(false);

  const [themeColor, setThemeColor] = useState("#0b3d32");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("Hola, me interesa el producto [Producto] que vi en tu catálogo.");
  const [socialLinks, setSocialLinks] = useState({ facebook: "", instagram: "", tiktok: "" });
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [priorityCategories, setPriorityCategories] = useState<string[]>(['', '', '']);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  const [businessHours, setBusinessHours] = useState({ isOpen: true, schedule: "", closedMessage: "" });
  const [deliveryMethods, setDeliveryMethods] = useState({ pickup: true, shipping: false, shippingCost: 0, shippingZones: "" });

  const [storeName, setStoreName] = useState("");
  const [slug, setSlug] = useState("");
  const [logo, setLogo] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [carouselImages, setCarouselImages] = useState<string[]>([]);
  const [carouselUploading, setCarouselUploading] = useState(false);
  const [banners, setBanners] = useState<string[]>([]);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [locationMapUrl, setLocationMapUrl] = useState("");

  useEffect(() => {
    if (store) {
      if (store.name) setStoreName(store.name);
      if (store.slug) setSlug(store.slug);
      if (store.logo) setLogo(store.logo);
      if (store.carouselImages) setCarouselImages(store.carouselImages);
      if (store.locationMapUrl) setLocationMapUrl(store.locationMapUrl);
      if (store.themeColor) setThemeColor(store.themeColor);
      if (store.whatsappNumber) setWhatsappNumber(store.whatsappNumber);
      if (store.whatsappMessage) setWhatsappMessage(store.whatsappMessage);
      if (store.socialLinks) setSocialLinks({
        facebook: store.socialLinks.facebook || "",
        instagram: store.socialLinks.instagram || "",
        tiktok: store.socialLinks.tiktok || ""
      });
      if (store.categories) setCategories(store.categories);
      if (store.businessHours) setBusinessHours({
        isOpen: store.businessHours.isOpen ?? true,
        schedule: store.businessHours.schedule || "",
        closedMessage: store.businessHours.closedMessage || ""
      });
      if (store.deliveryMethods) setDeliveryMethods({
        pickup: store.deliveryMethods.pickup ?? true,
        shipping: store.deliveryMethods.shipping ?? false,
        shippingCost: store.deliveryMethods.shippingCost || 0,
        shippingZones: store.deliveryMethods.shippingZones || ""
      });
      if (store.banners) setBanners(store.banners);
      if (store.priorityCategories && store.priorityCategories.length > 0) {
        const padded = [...store.priorityCategories, '', '', ''].slice(0, 3);
        setPriorityCategories(padded);
      }

      // Cargar categorías reales de los productos de esta tienda
      getDocs(getProductsRef(store.id)).then(snap => {
        const cats = [...new Set(snap.docs.map(d => d.data().category as string).filter(Boolean))].sort();
        setAvailableCategories(cats);
      });
    }
  }, [store]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !store) return;
    setLogoUploading(true);
    try {
      const path = `stores/${store.id}/logo/${Date.now()}_${file.name}`;
      const url = await uploadImage(file, path);
      setLogo(url);
    } catch (err) {
      console.error(err);
      toast.error("Error subiendo logo");
    } finally {
      setLogoUploading(false);
      e.target.value = '';
    }
  };

  const handleCarouselUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !store) return;
    setCarouselUploading(true);
    try {
      const path = `stores/${store.id}/carousel/${Date.now()}_${file.name}`;
      const url = await uploadImage(file, path);
      setCarouselImages(prev => [...prev, url]);
    } catch (err) {
      console.error(err);
      toast.error("Error subiendo imagen al carrusel");
    } finally {
      setCarouselUploading(false);
      e.target.value = '';
    }
  };

  const removeCarouselImage = (url: string) => {
    setCarouselImages(prev => prev.filter(img => img !== url));
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !store) return;
    setBannerUploading(true);
    try {
      const path = `stores/${store.id}/banners/${Date.now()}_${file.name}`;
      const url = await uploadImage(file, path);
      setBanners(prev => [...prev, url]);
    } catch (err) {
      console.error(err);
      toast.error("Error subiendo banner");
    } finally {
      setBannerUploading(false);
      e.target.value = '';
    }
  };

  const removeBanner = (url: string) => {
    setBanners(prev => prev.filter(b => b !== url));
  };


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;
    setSaving(true);
    try {
      const storeRef = doc(db, "stores", store.id);
      await updateDoc(storeRef, {
        name: storeName,
        slug: slug,
        logo,
        carouselImages,
        locationMapUrl,
        themeColor,
        whatsappNumber,
        whatsappMessage,
        socialLinks,
        categories,
        businessHours,
        deliveryMethods,
        banners,
        priorityCategories: priorityCategories.filter(c => c !== '')
      });
      toast.success("Configuración guardada correctamente");
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  if (!store) return <div className="p-8 text-center text-gray-500">Cargando contexto de tienda...</div>;

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col pb-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 border-l-4 border-[#156d5e] pl-3">Configuración de Tienda</h2>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* Card: Información Básica */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 transition-all hover:shadow-md">
          <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
            <Store className="w-5 h-5 text-[#156d5e]" /> Información del Negocio
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-bold text-[#156d5e] mb-1.5 uppercase tracking-wider">Nombre de la Tienda</label>
              <input
                type="text"
                value={storeName}
                onChange={e => {
                  const newName = e.target.value;
                  setStoreName(newName);
                  setSlug(newName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''));
                }}
                placeholder="Ej. Mi Agro Tienda"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#156d5e] transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#156d5e] mb-1.5 uppercase tracking-wider">Logotipo</label>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                  {logo ? <img src={logo} alt="Logo" className="w-full h-full object-contain" /> : <UploadCloud className="w-5 h-5 text-gray-300" />}
                </div>
                <div className="flex-1 relative">
                  <button type="button" className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold border-2 border-dashed transition-colors ${logoUploading ? 'bg-gray-50 border-gray-200' : 'border-[#156d5e]/30 hover:bg-[#f0f9f6]'}`}>
                    {logoUploading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (logo ? 'Cambiar Logotipo' : 'Subir Logotipo')}
                  </button>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>
            </div>

            <div className="md:col-span-2 pt-2">
              <label className="block text-[11px] font-bold text-[#156d5e] mb-1.5 uppercase tracking-wider">Enlace del Catálogo Público (Slug)</label>
              <div className="flex bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#156d5e] transition-all">
                <span className="bg-gray-200 text-gray-600 px-4 py-3 text-sm font-medium border-r border-gray-200 select-none hidden sm:inline-block">https://catalogo.magistral.pe/</span>
                <span className="bg-gray-200 text-gray-600 px-3 py-3 text-sm font-medium border-r border-gray-200 select-none sm:hidden">...pe/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  placeholder="mi-tienda"
                  className="w-full px-4 py-3 bg-transparent text-sm focus:outline-none focus:ring-0 font-bold text-gray-800"
                  required
                />
                <button type="button" onClick={() => {
                  navigator.clipboard.writeText(`https://catalogo.magistral.pe/${slug}`);
                  toast.success("Enlace copiado al portapapeles");
                }} className="bg-white px-4 py-3 border-l border-gray-200 text-gray-500 hover:text-[#156d5e] hover:bg-gray-50 transition-colors shrink-0" title="Copiar Enlace">
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Card: Diseño del Catálogo */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 transition-all hover:shadow-md">
           <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
            <Palette className="w-5 h-5 text-[#156d5e]" /> Diseño del Catálogo
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] font-bold text-[#156d5e] mb-1.5 uppercase tracking-wider">Color Principal</label>
              <div className="flex items-center gap-3">
                <input type="color" value={themeColor} onChange={e => setThemeColor(e.target.value)} className="w-12 h-12 rounded cursor-pointer border-0 p-0" />
                <input type="text" value={themeColor} onChange={e => setThemeColor(e.target.value)} className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#156d5e] transition-all" placeholder="#0b3d32" />
              </div>
            </div>

            <div className="md:col-span-2 pt-2">
              <label className="block text-[11px] font-bold text-[#156d5e] mb-3 uppercase tracking-wider">Categorías Destacadas (Aparecen al inicio)</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[0, 1, 2].map((i) => (
                  <div key={i}>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">
                      Lugar {i + 1}
                    </label>
                    <select
                      value={priorityCategories[i] || ''}
                      onChange={e => {
                        const updated = [...priorityCategories];
                        updated[i] = e.target.value;
                        setPriorityCategories(updated);
                      }}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#156d5e] transition-all"
                    >
                      <option value="">(Ninguna)</option>
                      {availableCategories
                        .filter(cat => !priorityCategories.includes(cat) || priorityCategories[i] === cat)
                        .map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Card: Redes Sociales */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 transition-all hover:shadow-md">
           <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-[#156d5e]" /> Redes Sociales
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="flex items-center gap-2 mb-1.5 opacity-80">
                <svg className="w-4 h-4 text-[#1877F2] fill-current" viewBox="0 0 24 24"><path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z"/></svg>
              </label>
              <input type="url" value={socialLinks.facebook} onChange={e => setSocialLinks({ ...socialLinks, facebook: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#156d5e] transition-all" placeholder="Link de Facebook" />
            </div>
            <div>
              <label className="flex items-center gap-2 mb-1.5 opacity-80">
                <img src="https://cdn-icons-png.flaticon.com/512/1384/1384063.png" alt="Instagram" className="w-4 h-4" />
              </label>
              <input type="url" value={socialLinks.instagram} onChange={e => setSocialLinks({ ...socialLinks, instagram: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#156d5e] transition-all" placeholder="Link de Instagram" />
            </div>
            <div>
              <label className="flex items-center gap-2 mb-1.5 opacity-80">
                <img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" alt="TikTok" className="w-4 h-4" />
              </label>
              <input type="url" value={socialLinks.tiktok} onChange={e => setSocialLinks({ ...socialLinks, tiktok: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#156d5e] transition-all" placeholder="Link de TikTok" />
            </div>
          </div>
        </div>

        {/* Card: WhatsApp y Ventas */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 transition-all hover:shadow-md">
           <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#156d5e]" /> WhatsApp y Ventas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-bold text-[#156d5e] mb-1.5 uppercase tracking-wider">Número (+Código País)</label>
              <input type="tel" value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#156d5e] transition-all" placeholder="+51 980 590 842" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-[#156d5e] mb-1.5 uppercase tracking-wider">Mensaje de Compra Automático</label>
              <textarea rows={2} value={whatsappMessage} onChange={e => setWhatsappMessage(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#156d5e] resize-none transition-all" placeholder="Usa [Producto] para que se reemplace por el nombre del producto." />
            </div>
          </div>
        </div>

        {/* Card: Horarios y Envíos */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 transition-all hover:shadow-md">
           <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#156d5e]" /> Atención y Entregas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Horarios */}
            <div className="space-y-4">
              <h4 className="text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-2">Horarios de Atención</h4>
              <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-4 py-3 rounded-xl border border-gray-200">
                <input type="checkbox" checked={businessHours.isOpen} onChange={e => setBusinessHours({ ...businessHours, isOpen: e.target.checked })} className="w-4 h-4 text-[#156d5e] focus:ring-[#156d5e]" />
                <span className="text-sm font-semibold text-gray-700">Tienda Abierta (Recibe pedidos)</span>
              </label>
              <div>
                <input type="text" value={businessHours.schedule} onChange={e => setBusinessHours({ ...businessHours, schedule: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#156d5e]" placeholder="Lunes a Sábado de 9am a 6pm" />
              </div>
              {!businessHours.isOpen && (
                <div>
                  <input type="text" value={businessHours.closedMessage} onChange={e => setBusinessHours({ ...businessHours, closedMessage: e.target.value })} className="w-full px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm focus:outline-none text-red-700" placeholder="Mensaje: Volvemos el lunes" />
                </div>
              )}
            </div>

            {/* Envíos */}
            <div className="space-y-4">
              <h4 className="text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-2">Métodos de Entrega</h4>
              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={deliveryMethods.pickup} onChange={e => setDeliveryMethods({ ...deliveryMethods, pickup: e.target.checked })} className="w-4 h-4 text-[#156d5e]" />
                  <span className="text-sm font-medium text-gray-700">Retiro en Local</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={deliveryMethods.shipping} onChange={e => setDeliveryMethods({ ...deliveryMethods, shipping: e.target.checked })} className="w-4 h-4 text-[#156d5e]" />
                  <span className="text-sm font-medium text-gray-700">Envío a Domicilio</span>
                </label>
              </div>
              
              {deliveryMethods.shipping && (
                <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3">
                    <label className="text-[11px] font-bold text-gray-500 uppercase flex-1">Costo Ref. (S/)</label>
                    <input type="number" value={deliveryMethods.shippingCost} onChange={e => setDeliveryMethods({ ...deliveryMethods, shippingCost: Number(e.target.value) })} className="w-24 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#156d5e]" placeholder="0" />
                  </div>
                  <div>
                    <textarea rows={2} value={deliveryMethods.shippingZones} onChange={e => setDeliveryMethods({ ...deliveryMethods, shippingZones: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#156d5e]" placeholder="Especifique las zonas de reparto..." />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card: Galería Carrusel */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 transition-all hover:shadow-md">
           <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-[#156d5e]" /> Galería Principal (Hero)
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
            {carouselImages.map((url, i) => (
              <div key={i} className="relative w-56 h-28 flex-shrink-0 rounded-xl overflow-hidden border border-gray-200 group">
                <img src={url} alt={`Carousel ${i}`} className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeCarouselImage(url)} className="absolute top-2 right-2 bg-red-500/90 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"><X className="w-3 h-3" /></button>
              </div>
            ))}
            {carouselImages.length < 5 && (
              <div className="w-56 h-28 flex-shrink-0 rounded-xl border-2 border-dashed border-[#156d5e]/30 bg-[#f0f9f6]/30 flex flex-col items-center justify-center relative cursor-pointer hover:bg-[#f0f9f6] transition-colors">
                {carouselUploading ? (
                  <div className="flex flex-col items-center text-[#156d5e]"><Loader2 className="w-5 h-5 animate-spin mb-1" /><span className="text-[10px] font-bold uppercase tracking-wider">Subiendo...</span></div>
                ) : (
                  <>
                    <UploadCloud className="w-5 h-5 text-[#156d5e]/60 mb-1" />
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Añadir (Max 5)</span>
                    <input type="file" accept="image/*" onChange={handleCarouselUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Card: Banners */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 transition-all hover:shadow-md">
           <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#156d5e]" /> Flyers Promocionales
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
            {banners.map((url, i) => (
              <div key={i} className="relative w-56 h-28 flex-shrink-0 rounded-xl overflow-hidden border border-gray-200 group">
                <img src={url} alt={`Banner ${i}`} className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeBanner(url)} className="absolute top-2 right-2 bg-red-500/90 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"><X className="w-3 h-3" /></button>
              </div>
            ))}
            {banners.length < 5 && (
              <div className="w-56 h-28 flex-shrink-0 rounded-xl border-2 border-dashed border-[#156d5e]/30 bg-[#f0f9f6]/30 flex flex-col items-center justify-center relative cursor-pointer hover:bg-[#f0f9f6] transition-colors">
                {bannerUploading ? (
                  <div className="flex flex-col items-center text-[#156d5e]"><Loader2 className="w-5 h-5 animate-spin mb-1" /><span className="text-[10px] font-bold uppercase tracking-wider">Subiendo...</span></div>
                ) : (
                  <>
                    <UploadCloud className="w-5 h-5 text-[#156d5e]/60 mb-1" />
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Añadir (Max 5)</span>
                    <input type="file" accept="image/*" onChange={handleBannerUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Card: Ubicación */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 transition-all hover:shadow-md">
           <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#156d5e]" /> Ubicación
          </h3>
          <div>
            <label className="block text-[11px] font-bold text-[#156d5e] mb-1.5 uppercase tracking-wider">URL (src) de Google Maps</label>
            <input
              type="text"
              value={locationMapUrl}
              onChange={e => setLocationMapUrl(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#156d5e] transition-all"
              placeholder="Pega el link de insertar mapa de Google Maps"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end sticky bottom-6 z-10">
          <button type="submit" disabled={saving} className="px-8 py-3.5 bg-[#156d5e] hover:bg-[#0b3d32] text-white text-sm font-bold rounded-2xl shadow-lg shadow-[#156d5e]/30 transition-all flex items-center justify-center min-w-[200px]">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Guardar Cambios</>}
          </button>
        </div>

      </form>
    </div>
  );
}
