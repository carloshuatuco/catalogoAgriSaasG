"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { db } from "@/lib/firebase/firestore";
import { doc, updateDoc } from "firebase/firestore";
import { Loader2, Save, UploadCloud, X, QrCode, Ticket, Plus, Copy } from "lucide-react";
import { storage, uploadImage } from "@/lib/firebase/storage";
import { Coupon } from "@/lib/firebase/firestore";
import { QRCodeCanvas } from 'qrcode.react';

export default function ConfigPage() {
  const { store } = useAuthStore();
  const [saving, setSaving] = useState(false);
  
  const [themeColor, setThemeColor] = useState("#0b3d32");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("Hola, me interesa el producto [Producto] que vi en tu catálogo.");
  const [socialLinks, setSocialLinks] = useState({ facebook: "", instagram: "", tiktok: "" });
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");
  
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

  // Cupones
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({ code: '', discountType: 'percentage', discountValue: 0, active: true });



  const handleAddCoupon = () => {
     if (!newCoupon.code || !newCoupon.discountValue) {
       alert("Ingresa un código y un valor de descuento.");
       return;
     }
     if (coupons.some(c => c.code.toUpperCase() === newCoupon.code?.toUpperCase())) {
       alert("Este código de cupón ya existe.");
       return;
     }
     
     const coupon: Coupon = {
       id: Date.now().toString(),
       code: newCoupon.code.toUpperCase().replace(/\s+/g, ''),
       discountType: newCoupon.discountType as 'percentage' | 'fixed',
       discountValue: Number(newCoupon.discountValue),
       active: newCoupon.active ?? true
     };

     setCoupons([...coupons, coupon]);
     setNewCoupon({ code: '', discountType: 'percentage', discountValue: 0, active: true });
  };

  const removeCoupon = (id: string) => {
     setCoupons(coupons.filter(c => c.id !== id));
  };
  
  const toggleCoupon = (id: string) => {
     setCoupons(coupons.map(c => c.id === id ? { ...c, active: !c.active } : c));
  };

  const downloadQR = () => {
    const canvas = document.getElementById("store-qr") as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `QR_${store?.name || 'catalogo'}.png`;
      a.click();
    }
  };

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
      if (store.coupons) setCoupons(store.coupons);

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
      alert("Error subiendo logo");
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
      alert("Error subiendo imagen al carrusel");
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
      alert("Error subiendo banner");
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
        coupons
      });
      alert("Configuración guardada correctamente");
    } catch (error) {
      console.error(error);
      alert("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  if (!store) return <div className="p-8 text-center text-gray-500">Cargando contexto de tienda...</div>;

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 border-l-4 border-[#156d5e] pl-3">Configuración de Tienda</h2>
        <p className="text-sm text-gray-500 mt-1 pl-4">Personaliza los colores, redes sociales y mensajes de WhatsApp de <b>{store.name}</b>.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 xl:p-8 flex-1">
        <form onSubmit={handleSave} className="space-y-8">
          
          {/* Información Básica */}
          <section className="bg-white border-b pb-8">
             <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
               📝 Información del Negocio
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <label className="block text-[11px] font-bold text-[#156d5e] mb-1.5 uppercase tracking-wider">Logotipo de la Tienda</label>
                  <div className="flex items-center gap-4">
                     <div className="w-16 h-16 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                        {logo ? <img src={logo} alt="Logo" className="w-full h-full object-contain" /> : <UploadCloud className="w-6 h-6 text-gray-300" />}
                     </div>
                     <div className="flex-1 relative">
                        <button type="button" className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold border-2 border-dashed transition-colors ${logoUploading ? 'bg-gray-50 border-gray-200' : 'border-[#156d5e]/30 hover:bg-[#f0f9f6]'}`}>
                           {logoUploading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (logo ? 'Cambiar Logotipo' : 'Subir Logotipo')}
                        </button>
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                     </div>
                  </div>
                </div>
                 
                 <div className="md:col-span-2 pt-4">
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
                             alert("Enlace copiado al portapapeles");
                         }} className="bg-white px-4 py-3 border-l border-gray-200 text-gray-500 hover:text-[#156d5e] hover:bg-gray-50 transition-colors shrink-0" title="Copiar Enlace">
                          <Copy className="w-5 h-5" />
                       </button>
                    </div>
                    <p className="text-xs text-red-500 mt-2 font-medium">⚠️ Cambiar este enlace hará que los códigos QR anteriores y banners impresos dejen de funcionar y dirijan a un lugar equivocado.</p>
                 </div>
              </div>
           </section>
          


          {/* QR Integrations */}
          <section className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1 text-center md:text-left">
               <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center justify-center md:justify-start gap-2">
                 <QrCode className="w-5 h-5 text-[#156d5e]" /> Código QR del Catálogo
               </h3>
               <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                 Genera e imprime el código QR para que tus clientes accedan directamente a tu catálogo escrutando desde cualquier celular. Ideal para vitrinas, folletos o tarjetas de presentación.
               </p>
               <button type="button" onClick={downloadQR} className="bg-[#156d5e] hover:bg-[#0b3d32] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition shadow-sm inline-flex items-center gap-2">
                  ⬇️ Descargar Código QR
               </button>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-center border border-gray-100 shrink-0">
               <QRCodeCanvas 
                 id="store-qr" 
                 value={`https://catalogo.magistral.pe/${store.slug}`} 
                 size={160} 
                 fgColor={themeColor || "#000000"} 
                 level={"M"}
                 includeMargin={true}
               />
            </div>
          </section>
          
          {/* Categories Settings */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Categorías del Catálogo</h3>
            <div>
               <label className="block text-[11px] font-bold text-[#156d5e] mb-1.5 uppercase tracking-wider">Tus Categorías</label>
               <div className="flex gap-2 mb-3">
                 <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)} onKeyDown={e => { if(e.key==='Enter'){ e.preventDefault(); if(newCategory.trim() && !categories.includes(newCategory.trim())) { setCategories([...categories, newCategory.trim()]); setNewCategory(''); } } }} className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#156d5e]" placeholder="Nueva categoría (Presiona Enter)" />
                 <button type="button" onClick={() => { if(newCategory.trim() && !categories.includes(newCategory.trim())) { setCategories([...categories, newCategory.trim()]); setNewCategory(''); } }} className="bg-[#156d5e] hover:bg-[#0b3d32] text-white px-4 py-2 rounded-lg text-sm font-bold transition">Agregar</button>
               </div>
               <div className="flex flex-wrap gap-2">
                 {categories.map((cat, i) => (
                   <span key={i} className="bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm border border-gray-200">
                     {cat}
                     <button type="button" onClick={() => setCategories(categories.filter(c => c !== cat))} className="text-red-500 hover:text-red-700 font-bold text-base leading-none">×</button>
                   </span>
                 ))}
                 {categories.length === 0 && <span className="text-xs text-gray-400">Sin categorías personalizadas (se usarán las por defecto).</span>}
               </div>
            </div>
          </section>

          {/* Cupones de Descuento */}
          <section>
             <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
               <Ticket className="w-5 h-5 text-[#156d5e]" /> Cupones de Descuento
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-gray-50 border border-gray-100 p-4 rounded-xl mb-4">
                <div className="md:col-span-1">
                   <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Código (Ej. BLACK20)</label>
                   <input type="text" value={newCoupon.code} onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold uppercase transition focus:ring-2 focus:ring-[#156d5e]" placeholder="CÓDIGO" />
                </div>
                <div className="md:col-span-1">
                   <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Tipo</label>
                   <select value={newCoupon.discountType} onChange={e => setNewCoupon({...newCoupon, discountType: e.target.value as 'percentage' | 'fixed'})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm transition focus:ring-2 focus:ring-[#156d5e]">
                      <option value="percentage">% Porcentaje</option>
                      <option value="fixed">S/ Monto Fijo</option>
                   </select>
                </div>
                <div className="md:col-span-1">
                   <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Valor</label>
                   <input type="number" step="0.01" value={newCoupon.discountValue || ''} onChange={e => setNewCoupon({...newCoupon, discountValue: e.target.value ? Number(e.target.value) : 0})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm transition focus:ring-2 focus:ring-[#156d5e]" placeholder="Ej. 10" />
                </div>
                <div className="md:col-span-1 flex items-end">
                  <button type="button" onClick={handleAddCoupon} className="w-full bg-[#156d5e] hover:bg-[#0b3d32] text-white my-auto px-4 py-2.5 rounded-lg text-sm font-bold transition flex justify-center items-center gap-1">
                    <Plus className="w-4 h-4"/> Añadir Cupón
                  </button>
                </div>
             </div>

             <div className="space-y-2">
                {coupons.length === 0 ? (
                   <p className="text-xs text-gray-400 italic">No tienes cupones creados aún.</p>
                ) : (
                   coupons.map((coupon) => (
                      <div key={coupon.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${coupon.active ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                         <div className="flex items-center gap-4">
                            <span className="font-mono bg-gray-100 text-gray-800 font-bold px-3 py-1 rounded text-sm tracking-widest">{coupon.code}</span>
                            <span className="text-sm font-bold text-[#156d5e]">
                               {coupon.discountType === 'percentage' ? `${coupon.discountValue}% DCTO` : `S/ ${coupon.discountValue.toFixed(2)} DCTO`}
                            </span>
                         </div>
                         <div className="flex items-center gap-3">
                            <label className="flex items-center cursor-pointer">
                              <div className="relative">
                                <input type="checkbox" className="sr-only" checked={coupon.active} onChange={() => toggleCoupon(coupon.id)} />
                                <div className={`block w-10 h-6 rounded-full transition-colors ${coupon.active ? 'bg-[#156d5e]' : 'bg-gray-300'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${coupon.active ? 'transform translate-x-4' : ''}`}></div>
                              </div>
                            </label>
                            <button type="button" onClick={() => removeCoupon(coupon.id)} className="text-gray-400 hover:text-red-500 font-bold text-sm bg-white border border-gray-200 rounded px-2 hover:bg-red-50 transition">Borrar</button>
                         </div>
                      </div>
                   ))
                )}
             </div>
          </section>

          {/* Branding */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Personalización de Marca</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                 <label className="block text-[11px] font-bold text-[#156d5e] mb-1.5 uppercase tracking-wider">Color Principal del Tema</label>
                 <div className="flex items-center gap-3">
                   <input type="color" value={themeColor} onChange={e => setThemeColor(e.target.value)} className="w-12 h-12 rounded cursor-pointer border-0 p-0" />
                   <input type="text" value={themeColor} onChange={e => setThemeColor(e.target.value)} className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#156d5e] transition-all" placeholder="#0b3d32" />
                 </div>
                 <p className="text-xs text-gray-500 mt-2">Este color se usará en botones, cabeceras y acentos del catálogo público.</p>
                 <p className="text-[10px] text-blue-600 bg-blue-50 px-3 py-2 border border-blue-100 rounded-lg inline-block mt-3 shadow-sm">
                    💡 ¿No sabes qué color elegir? Explora e inspírate en <a href="https://paletadecolores.com.mx/" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-blue-800">paletadecolores.com.mx</a> y copia el código HEX.
                 </p>
              </div>
            </div>
          </section>

          {/* Social Links */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Redes Sociales</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                 <label className="block text-[11px] font-bold text-[#156d5e] mb-1.5 uppercase tracking-wider">Facebook URL</label>
                 <input type="url" value={socialLinks.facebook} onChange={e => setSocialLinks({...socialLinks, facebook: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#156d5e] transition-all" placeholder="https://facebook.com/..." />
              </div>
              <div>
                 <label className="block text-[11px] font-bold text-[#156d5e] mb-1.5 uppercase tracking-wider">Instagram URL</label>
                 <input type="url" value={socialLinks.instagram} onChange={e => setSocialLinks({...socialLinks, instagram: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#156d5e] transition-all" placeholder="https://instagram.com/..." />
              </div>
              <div>
                 <label className="block text-[11px] font-bold text-[#156d5e] mb-1.5 uppercase tracking-wider">TikTok URL</label>
                 <input type="url" value={socialLinks.tiktok} onChange={e => setSocialLinks({...socialLinks, tiktok: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#156d5e] transition-all" placeholder="https://tiktok.com/@..." />
              </div>
            </div>
          </section>

          {/* WhatsApp Settings */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">WhatsApp y Ventas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
               <div>
                  <label className="block text-[11px] font-bold text-[#156d5e] mb-1.5 uppercase tracking-wider">Número de WhatsApp</label>
                  <input type="tel" value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#156d5e] transition-all" placeholder="+51 999 888 777" />
                  <p className="text-xs text-gray-500 mt-2">Para recibir los pedidos. Usa código de país (ej. +51).</p>
               </div>
            </div>
            <div>
               <label className="block text-[11px] font-bold text-[#156d5e] mb-1.5 uppercase tracking-wider">Mensaje Predeterminado de Compra</label>
               <textarea rows={3} value={whatsappMessage} onChange={e => setWhatsappMessage(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#156d5e] resize-none transition-all" placeholder="Usa [Producto] para que se reemplace por el nombre del producto." />
               <p className="text-xs text-gray-500 mt-2">Variables disponibles: <code className="bg-gray-200 px-1 py-0.5 rounded text-gray-800">[Producto]</code>. Este mensaje le aparecerá al cliente cuando haga clic en "Añadir / Comprar".</p>
            </div>
          </section>

          {/* Operations & Delivery */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Horarios y Envíos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
               {/* Horarios */}
               <div className="space-y-4">
                 <h4 className="text-[13px] font-bold text-gray-700">Horarios de Atención</h4>
                 <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-4 py-3 rounded-xl border border-gray-200">
                   <input type="checkbox" checked={businessHours.isOpen} onChange={e => setBusinessHours({...businessHours, isOpen: e.target.checked})} className="w-4 h-4 text-[#156d5e] focus:ring-[#156d5e]" />
                   <span className="text-sm font-bold text-gray-700">Tienda Abierta (Recibiendo pedidos)</span>
                 </label>
                 <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase">Horario Visible</label>
                    <input type="text" value={businessHours.schedule} onChange={e => setBusinessHours({...businessHours, schedule: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#156d5e]" placeholder="Ej. Lunes a Sábado de 9am a 6pm" />
                 </div>
                 {!businessHours.isOpen && (
                   <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase">Mensaje de Tienda Cerrada</label>
                      <input type="text" value={businessHours.closedMessage} onChange={e => setBusinessHours({...businessHours, closedMessage: e.target.value})} className="w-full px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm focus:outline-none" placeholder="Ej. Volvemos el lunes" />
                   </div>
                 )}
               </div>

               {/* Envíos */}
               <div className="space-y-4">
                 <h4 className="text-[13px] font-bold text-gray-700">Métodos de Entrega</h4>
                 <div className="flex gap-4">
                   <label className="flex items-center gap-2 cursor-pointer">
                     <input type="checkbox" checked={deliveryMethods.pickup} onChange={e => setDeliveryMethods({...deliveryMethods, pickup: e.target.checked})} className="w-4 h-4 text-[#156d5e]" />
                     <span className="text-sm font-semibold text-gray-700">Retiro en Local</span>
                   </label>
                   <label className="flex items-center gap-2 cursor-pointer">
                     <input type="checkbox" checked={deliveryMethods.shipping} onChange={e => setDeliveryMethods({...deliveryMethods, shipping: e.target.checked})} className="w-4 h-4 text-[#156d5e]" />
                     <span className="text-sm font-semibold text-gray-700">Envío a Domicilio</span>
                   </label>
                 </div>
                 {deliveryMethods.shipping && (
                   <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                     <div className="flex items-center gap-2">
                        <label className="text-[11px] font-bold text-gray-500 uppercase w-24">Costo Ref. (S/)</label>
                        <input type="number" value={deliveryMethods.shippingCost} onChange={e => setDeliveryMethods({...deliveryMethods, shippingCost: Number(e.target.value)})} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="0" />
                     </div>
                     <div>
                        <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase">Zonas de Reparto</label>
                        <textarea rows={2} value={deliveryMethods.shippingZones} onChange={e => setDeliveryMethods({...deliveryMethods, shippingZones: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none" placeholder="Ej. Todo Lima Metropolitana..." />
                     </div>
                   </div>
                 )}
               </div>
            </div>
          </section>

          {/* Carrusel de Portada (Hero) */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Carrusel de Portada (Hero)</h3>
            <p className="text-xs text-gray-500 mb-4">Estas imágenes aparecerán en la parte superior de tu catálogo. Se recomienda formato horizontal (ej. 1200x600).</p>
            <div className="space-y-4">
               <div className="flex gap-4 overflow-x-auto pb-4">
                  {carouselImages.map((url, i) => (
                    <div key={i} className="relative w-64 h-32 flex-shrink-0 rounded-xl overflow-hidden border border-gray-200 group">
                       <img src={url} alt={`Carousel ${i}`} className="w-full h-full object-cover" />
                       <button type="button" onClick={() => removeCarouselImage(url)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                  {carouselImages.length < 5 && (
                    <div className="w-64 h-32 flex-shrink-0 rounded-xl border-2 border-dashed border-[#156d5e]/30 bg-[#f0f9f6]/30 flex flex-col items-center justify-center relative cursor-pointer hover:bg-[#f0f9f6] transition-colors">
                       {carouselUploading ? (
                          <div className="flex flex-col items-center text-[#156d5e]"><Loader2 className="w-6 h-6 animate-spin mb-2" /><span className="text-[10px] font-bold uppercase tracking-wider">Subiendo...</span></div>
                       ) : (
                          <>
                            <UploadCloud className="w-6 h-6 text-[#156d5e]/60 mb-2" />
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider px-4 text-center">Añadir a Portada (Max 5)</span>
                            <input type="file" accept="image/*" onChange={handleCarouselUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                          </>
                       )}
                    </div>
                  )}
               </div>
            </div>
          </section>

          {/* Banners Promocionales (Popup) */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Banners Promocionales (Popup)</h3>
            <p className="text-xs text-gray-500 mb-4">Estas imágenes aparecerán como un aviso publicitario (ventana emergente) cuando alguien visite tu catálogo.</p>
            <div className="space-y-4">
               <div className="flex gap-4 overflow-x-auto pb-4">
                  {banners.map((url, i) => (
                    <div key={i} className="relative w-64 h-32 flex-shrink-0 rounded-xl overflow-hidden border border-gray-200 group">
                       <img src={url} alt={`Banner ${i}`} className="w-full h-full object-cover" />
                       <button type="button" onClick={() => removeBanner(url)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                  {banners.length < 5 && (
                    <div className="w-64 h-32 flex-shrink-0 rounded-xl border-2 border-dashed border-[#156d5e]/30 bg-[#f0f9f6]/30 flex flex-col items-center justify-center relative cursor-pointer hover:bg-[#f0f9f6] transition-colors">
                       {bannerUploading ? (
                          <div className="flex flex-col items-center text-[#156d5e]"><Loader2 className="w-6 h-6 animate-spin mb-2" /><span className="text-[10px] font-bold uppercase tracking-wider">Subiendo...</span></div>
                       ) : (
                          <>
                            <UploadCloud className="w-6 h-6 text-[#156d5e]/60 mb-2" />
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider px-4 text-center">Subir Banner (Max 5)</span>
                            <input type="file" accept="image/*" onChange={handleBannerUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                          </>
                       )}
                    </div>
                  )}
               </div>
            </div>
          </section>

          {/* Ubicación Map */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Ubicación de la Tienda</h3>
            <div>
               <label className="block text-[11px] font-bold text-[#156d5e] mb-1.5 uppercase tracking-wider">URL de Google Maps (Iframe)</label>
               <input 
                 type="text" 
                 value={locationMapUrl} 
                 onChange={e => setLocationMapUrl(e.target.value)} 
                 className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#156d5e] transition-all" 
                 placeholder="Pega el link de insertar mapa (src) de Google Maps" 
               />
               <p className="text-xs text-gray-500 mt-2">Ve a Google Maps, dale a "Compartir" {'>'} "Insertar un mapa" y copia solo el contenido de <b>src="..."</b>.</p>
            </div>
          </section>

          <div className="pt-6 border-t border-gray-100 flex justify-end">
             <button type="submit" disabled={saving} className="px-8 py-3 bg-[#156d5e] hover:bg-[#0b3d32] text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center min-w-[200px]">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Guardar Configuración</>}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
