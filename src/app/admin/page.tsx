"use client";

import { Plus, Edit2, Trash2, List, Loader2, X, UploadCloud, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { db, getProductsRef } from "@/lib/firebase/firestore";
import { storage, uploadImage } from "@/lib/firebase/storage";
import { onSnapshot, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { useAuthStore } from "@/lib/store/useAuthStore";

interface Product {
  id: string;
  name: string;
  category: string;
  substance: string;
  image: string;
}

const CATEGORIES = [
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

export default function AdminProductsPage() {
  const { store } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", category: "ADYUVANTES", substance: "", image: "" });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!store) return;
    const productsRef = getProductsRef(store.id);
    const unsub = onSnapshot(productsRef, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      setProducts(data);
      setLoading(false);
    });
    return () => unsub();
  }, [store]);

  const openModal = (product?: Product) => {
    if (product) {
      setEditingId(product.id);
      setFormData({ name: product.name, category: product.category, substance: product.substance, image: product.image });
    } else {
      setEditingId(null);
      setFormData({ name: "", category: "ADYUVANTES", substance: "", image: "" });
    }
    setFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFile(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;
    setSaving(true);
    try {
      let imageUrl = formData.image;
      
      if (file) {
        const path = `stores/${store.id}/products/${Date.now()}_${file.name}`;
        imageUrl = await uploadImage(file, path);
      }

      const productData = { ...formData, image: imageUrl };
      const productsRef = getProductsRef(store.id);

      if (editingId) {
        await updateDoc(doc(productsRef, editingId), productData);
      } else {
        await addDoc(productsRef, productData);
      }
      closeModal();
    } catch (error) {
       console.error("Error saving product:", error);
       alert("Error al guardar el producto");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!store) return;
    if (confirm("¿Estás seguro de eliminar este producto?")) {
      const productsRef = getProductsRef(store.id);
      await deleteDoc(doc(productsRef, id));
    }
  };

  if (!store) return <div className="p-8 text-center text-gray-500">Cargando contexto de tienda...</div>;

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col relative">
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 border-l-4 border-[#156d5e] pl-3">Panel de Productos</h2>
          <p className="text-sm text-gray-500 mt-1 pl-4">Catálogo de insumos agrícolas para <b>{store.name}</b>.</p>
        </div>
        <button onClick={() => openModal()} className="bg-[#156d5e] hover:bg-[#0b3d32] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all flex items-center gap-2 whitespace-nowrap">
          <Plus className="w-4 h-4" /> Añadir Producto
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2">
         <List className="w-5 h-5 text-[#156d5e]" />
         <h3 className="font-semibold text-gray-800">Listado de Productos de tu Tienda {loading && <Loader2 className="inline w-4 h-4 animate-spin ml-2 text-green-600"/>}</h3>
      </div>
      
      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap md:whitespace-normal">
            <thead className="text-[11px] text-gray-500 font-bold uppercase tracking-wider bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 w-24 text-center">Imagen</th>
                <th className="px-6 py-4 min-w-[150px]">Nombre</th>
                <th className="px-6 py-4 w-48">Categoría</th>
                <th className="px-6 py-4 min-w-[300px]">Sustancia Activa</th>
                <th className="px-6 py-4 text-center w-32">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-gray-600 text-xs">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 flex justify-center">
                    {product.image ? (
                        <img src={product.image} alt={product.name} className="w-8 h-10 object-contain mix-blend-multiply" />
                    ) : (
                        <div className="w-8 h-10 bg-gray-100 rounded flex items-center justify-center text-[9px] text-gray-400 font-medium">Sin img</div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">{product.name}</td>
                  <td className="px-6 py-4">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[11px] text-gray-500 leading-relaxed max-w-sm font-medium">
                    {product.substance}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => openModal(product)} className="text-gray-400 hover:text-[#156d5e] transition-colors flex items-center gap-1 bg-white border border-gray-100 shadow-sm p-1.5 rounded-md">
                        <Edit2 className="w-4 h-4" /> 
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 bg-white border border-gray-100 shadow-sm p-1.5 rounded-md">
                        <Trash2 className="w-4 h-4" /> 
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && products.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-16 text-center text-gray-400 font-medium">No hay productos registrados en tu catálogo. Añade uno.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#0b3d32] text-white p-5 flex justify-between items-center shrink-0">
               <h3 className="font-bold text-lg tracking-wide">{editingId ? "Editar Producto" : "Nuevo Producto"}</h3>
               <button type="button" onClick={closeModal} className="text-white/70 hover:text-white transition-colors "><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5">
               <div>
                 <label className="block text-[11px] font-bold text-[#156d5e] mb-1.5 uppercase tracking-wider">Nombre del Producto</label>
                 <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#156d5e] focus:bg-white transition-all shadow-sm" placeholder="Ej. 20-20-20" />
               </div>

               <div>
                 <label className="block text-[11px] font-bold text-[#156d5e] mb-1.5 uppercase tracking-wider">Categoría</label>
                 <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#156d5e] focus:bg-white transition-all shadow-sm">
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                 </select>
               </div>

               <div>
                 <label className="block text-[11px] font-bold text-[#156d5e] mb-1.5 uppercase tracking-wider">Sustancia Activa</label>
                 <textarea required value={formData.substance} onChange={e => setFormData({...formData, substance: e.target.value})} rows={3} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#156d5e] focus:bg-white resize-none transition-all shadow-sm" placeholder="Detalle los nutrientes o componentes activos..." />
               </div>

               <div>
                 <label className="block text-[11px] font-bold text-[#156d5e] mb-1.5 uppercase tracking-wider">Imagen del Producto</label>
                 <div className="border-2 border-dashed border-[#156d5e]/30 rounded-xl p-5 text-center bg-[#f0f9f6]/30 relative group cursor-pointer hover:bg-[#f0f9f6] hover:border-[#156d5e]/50 transition-colors">
                    <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="flex flex-col items-center justify-center gap-2 pointer-events-none min-h-[80px]">
                       {file ? (
                          <div className="text-[#156d5e] flex flex-col items-center gap-1">
                             <Check className="w-8 h-8" />
                             <span className="text-xs font-bold">{file.name}</span>
                          </div>
                       ) : formData.image ? (
                          <div className="flex flex-col items-center gap-2">
                            <img src={formData.image} alt="current" className="h-20 object-contain mix-blend-multiply drop-shadow-sm" />
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Click para cambiar imagen</span>
                          </div>
                       ) : (
                          <>
                            <UploadCloud className="w-10 h-10 text-[#156d5e]/60 group-hover:text-[#156d5e] transition-colors" />
                            <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Arrastra o haz click para explorar</span>
                          </>
                       )}
                    </div>
                 </div>
               </div>

               <div className="pt-6 border-t border-gray-100 flex justify-end gap-3 mt-4">
                  <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 hover:text-gray-800 rounded-xl transition-colors">Cancelar</button>
                  <button type="submit" disabled={saving} className="px-6 py-2.5 bg-[#156d5e] hover:bg-[#0b3d32] text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center min-w-[140px]">
                     {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar Registro"}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
