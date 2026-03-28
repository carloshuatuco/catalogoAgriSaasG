"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { db, Coupon } from "@/lib/firebase/firestore";
import { doc, updateDoc } from "firebase/firestore";
import { Loader2, QrCode, Ticket, Plus, Edit2, Trash2, X, Download, Copy, Check } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

export default function MarketingPage() {
  const { store } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Coupon>({
    id: "",
    code: "",
    discountType: "percentage",
    discountValue: 10,
    active: true,
    usesLimit: undefined,
    currentUses: 0,
    expiresAt: ""
  });

  const qrRef = useRef<HTMLCanvasElement>(null);
  
  // Si está en localhost usa localhost, sino usa origin
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const publicStoreUrl = store ? `${baseUrl}/${store.slug}` : "";

  const handleDownloadQR = () => {
    if (!qrRef.current) return;
    const canvas = qrRef.current;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement('a');
    link.download = `codigo-qr-${store?.slug || 'tienda'}.png`;
    link.href = url;
    link.click();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicStoreUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const openNewModal = () => {
    setFormData({
      id: Date.now().toString(),
      code: "",
      discountType: "percentage",
      discountValue: 10,
      active: true,
      usesLimit: undefined,
      currentUses: 0,
      expiresAt: ""
    });
    setEditingIndex(null);
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: Coupon, index: number) => {
    setFormData({ 
      ...coupon, 
      expiresAt: coupon.expiresAt || "", 
      usesLimit: coupon.usesLimit || undefined 
    });
    setEditingIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingIndex(null);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;
    
    setLoading(true);
    try {
      const currentCoupons = store.coupons || [];
      const updatedCoupons = [...currentCoupons];
      
      const newCoupon = {
        ...formData,
        code: formData.code.toUpperCase().trim(),
        // Limpiar undefined si están vacíos
        usesLimit: formData.usesLimit ? Number(formData.usesLimit) : undefined,
        expiresAt: formData.expiresAt || undefined
      };

      if (editingIndex !== null) {
        updatedCoupons[editingIndex] = newCoupon;
      } else {
        // Verificar duplicados
        if (updatedCoupons.some(c => c.code === newCoupon.code)) {
           alert("Ya existe un cupón con este código.");
           setLoading(false);
           return;
        }
        updatedCoupons.push(newCoupon);
      }

      await updateDoc(doc(db, "stores", store.id), {
        coupons: updatedCoupons
      });

      // Update store state manually for immediate feedback (though useAuthStore snapshot config should handle this, let's keep it safe)
      store.coupons = updatedCoupons;
      closeModal();
    } catch(err) {
      console.error("Error guardando cupón:", err);
      alert("Hubo un error al guardar el cupón");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCoupon = async (index: number) => {
    if (!store || !window.confirm("¿Seguro que deseas eliminar este cupón?")) return;
    
    setLoading(true);
    try {
      const updatedCoupons = (store.coupons || []).filter((_, i) => i !== index);
      await updateDoc(doc(db, "stores", store.id), {
        coupons: updatedCoupons
      });
      store.coupons = updatedCoupons;
    } catch(err) {
      console.error(err);
      alert("No se pudo eliminar el cupón");
    } finally {
      setLoading(false);
    }
  };

  if (!store) return <div className="p-8 text-center text-gray-500">Cargando contexto de tienda...</div>;

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col relative space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 border-l-4 border-rose-500 pl-3">Marketing y Promociones</h2>
        <p className="text-sm text-gray-500 mt-1 pl-4">Atrae clientes e impulsa ventas con códigos QR y Cupones.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LADO IZQUIERDO: Generador QR */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-8">
             <div className="bg-gray-50 p-4 border-b border-gray-100 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-gray-800">Código QR del Catálogo</h3>
             </div>
             
             <div className="p-6 flex flex-col items-center text-center">
                <p className="text-xs text-gray-500 mb-6 font-medium">Imprime este código y pégalo en tu tienda física o tarjetas de presentación.</p>
                
                <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100 mb-6">
                   <QRCodeCanvas 
                     id="qrCode" 
                     value={publicStoreUrl}
                     size={200}
                     bgColor={"#ffffff"}
                     fgColor={"#0b3d32"}
                     level={"H"}
                     includeMargin={false}
                     ref={qrRef}
                   />
                </div>

                <div className="w-full space-y-3">
                   <button 
                     onClick={handleDownloadQR} 
                     className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors shadow-sm"
                   >
                     <Download className="w-4 h-4" /> Descargar PNG
                   </button>

                   <div className="flex bg-gray-50 border border-gray-200 rounded-xl overflow-hidden shadow-inner">
                      <input type="text" readOnly value={publicStoreUrl} className="flex-1 bg-transparent text-xs text-gray-600 font-medium px-3 py-2 outline-none" />
                      <button onClick={handleCopyLink} className="bg-gray-200 hover:bg-gray-300 px-3 flex items-center justify-center transition-colors text-gray-700" title="Copiar Enlace">
                         {copiedLink ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* LADO DERECHO: Cupones */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
             <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                   <Ticket className="w-5 h-5 text-rose-500" />
                   <h3 className="font-bold text-gray-800">Cupones de Descuento {loading && <Loader2 className="inline w-4 h-4 animate-spin ml-2 text-rose-500"/>}</h3>
                </div>
                <button onClick={openNewModal} className="text-[11px] font-bold bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm">
                   <Plus className="w-3 h-3" /> Crear Cupón
                </button>
             </div>

             <div className="overflow-x-auto p-0">
               <table className="w-full text-left text-sm whitespace-nowrap">
                 <thead className="text-[10px] text-gray-400 font-bold uppercase tracking-wider bg-white border-b border-gray-100">
                   <tr>
                     <th className="px-6 py-4">Código</th>
                     <th className="px-6 py-4">Descuento</th>
                     <th className="px-6 py-4 text-center">Usos</th>
                     <th className="px-6 py-4 text-center">Estado</th>
                     <th className="px-6 py-4 text-center">Acciones</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50 text-gray-600 text-xs font-medium">
                   {(store.coupons || []).length > 0 ? (store.coupons || []).map((coupon, idx) => (
                     <tr key={idx} className="hover:bg-gray-50 group transition-colors">
                       <td className="px-6 py-4">
                         <span className="font-black text-gray-900 tracking-wider bg-gray-100 px-2 py-1.5 rounded-lg border border-gray-200">{coupon.code}</span>
                       </td>
                       <td className="px-6 py-4">
                         {coupon.discountType === 'percentage' ? (
                            <span className="text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded-md">-{coupon.discountValue}%</span>
                         ) : (
                            <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md">-S/ {coupon.discountValue.toFixed(2)}</span>
                         )}
                       </td>
                       <td className="px-6 py-4 text-center">
                         <span className="text-gray-500">
                           {coupon.currentUses || 0} {coupon.usesLimit ? `/ ${coupon.usesLimit}` : ''}
                         </span>
                       </td>
                       <td className="px-6 py-4 flex justify-center">
                          {coupon.active ? (
                            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" title="Activo"></span>
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-gray-400" title="Inactivo"></span>
                          )}
                       </td>
                       <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => openEditModal(coupon, idx)} className="text-gray-400 hover:text-indigo-600 bg-white shadow-sm border border-gray-100 p-1.5 rounded-md"><Edit2 className="w-3.5 h-3.5"/></button>
                             <button onClick={() => handleDeleteCoupon(idx)} className="text-gray-400 hover:text-red-500 bg-white shadow-sm border border-gray-100 p-1.5 rounded-md"><Trash2 className="w-3.5 h-3.5"/></button>
                          </div>
                       </td>
                     </tr>
                   )) : (
                     <tr><td colSpan={5} className="text-center py-12 text-gray-400 text-sm font-medium">No has creado ningún cupón aún. ¡Lanza una promoción hoy!</td></tr>
                   )}
                 </tbody>
               </table>
             </div>
          </div>
        </div>

      </div>

      {/* Modal Crear/Editar Cupón */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-rose-500 text-white p-5 flex justify-between items-center">
               <h3 className="font-bold tracking-wide flex items-center gap-2"><Ticket className="w-4 h-4" /> {editingIndex !== null ? "Editar Cupón" : "Nuevo Cupón"}</h3>
               <button type="button" onClick={closeModal} className="text-white/70 hover:text-white transition-colors "><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleSaveCoupon} className="p-6 overflow-y-auto space-y-4">
               <div>
                 <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Código del Cupón</label>
                 <input required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-black tracking-widest text-center text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white uppercase placeholder:text-sm placeholder:font-medium placeholder:tracking-normal placeholder:lowercase placeholder:text-gray-400" placeholder="Ej. INVIERNO20" />
               </div>

               <div className="grid grid-cols-2 gap-3">
                  <div>
                     <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Tipo</label>
                     <select value={formData.discountType} onChange={e => setFormData({...formData, discountType: e.target.value as any})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-rose-500">
                        <option value="percentage">Porcentaje (%)</option>
                        <option value="fixed">Monto Fijo (S/)</option>
                     </select>
                  </div>
                  <div>
                     <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Valor</label>
                     <input required type="number" step="1" min="1" value={formData.discountValue} onChange={e => setFormData({...formData, discountValue: Number(e.target.value)})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-rose-500 text-center" placeholder="10" />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-3">
                  <div>
                     <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Límite de usos</label>
                     <input type="number" min="1" value={formData.usesLimit || ''} onChange={e => setFormData({...formData, usesLimit: e.target.value ? Number(e.target.value) : undefined})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-rose-500" placeholder="Ilimitado" />
                  </div>
                  <div>
                     <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Expiración</label>
                     <input type="date" value={formData.expiresAt || ''} onChange={e => setFormData({...formData, expiresAt: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none text-gray-600 focus:ring-2 focus:ring-rose-500" />
                  </div>
               </div>

               <div className="pt-2">
                 <label className="flex items-center justify-center gap-2 cursor-pointer bg-gray-50 p-3 rounded-xl border border-gray-200">
                   <input type="checkbox" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} className="w-4 h-4 text-green-500 bg-white border-gray-300 rounded focus:ring-green-500 cursor-pointer" />
                   <span className="text-[12px] font-bold text-gray-700">Cupón Activo</span>
                 </label>
               </div>

               <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                  <button type="button" onClick={closeModal} className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
                  <button type="submit" disabled={loading} className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center min-w-[100px]">
                     {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar Cupón"}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
