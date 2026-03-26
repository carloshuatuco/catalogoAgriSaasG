"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { createStore } from "@/lib/firebase/firestore";
import { Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const { user, store, refreshStore, loading: authLoading } = useAuthStore();
  const router = useRouter();
  
  const [storeName, setStoreName] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && store) {
      router.push("/admin");
    }
  }, [store, authLoading, router]);

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStoreName(e.target.value);
    setSlug(generateSlug(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      await createStore(user.uid, slug, storeName);
      await refreshStore();
      router.push("/admin");
    } catch (err: any) {
      setError(err.message || "Error al crear la tienda");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || store) return <div className="h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-[#156d5e]" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#0b3d32] rounded-full mx-auto flex items-center justify-center text-white text-2xl mb-4">🚀</div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">¡Bienvenido a Magistral!</h1>
          <p className="text-gray-500 text-sm mt-2 leading-relaxed">Para comenzar, configura el nombre de tu tienda y tu enlace para tus clientes.</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-[11px] font-bold tracking-wide uppercase mb-4 text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-[#156d5e] uppercase tracking-wider mb-2">Nombre de la Tienda</label>
            <input 
              required 
              value={storeName} 
              onChange={handleNameChange}
              placeholder="Ej. Agrícola San José"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#156d5e] focus:bg-white focus:ring-1 focus:ring-[#156d5e] transition-all font-medium text-sm"
            />
          </div>
          <div>
             <label className="block text-[11px] font-bold text-[#156d5e] uppercase tracking-wider mb-2">Tu Enlace Personalizado</label>
             <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#156d5e] focus-within:ring-1 focus-within:ring-[#156d5e] focus-within:bg-white transition-all shadow-sm">
               <span className="pl-4 py-3 text-xs text-gray-400 bg-gray-100/50 border-r border-gray-200 font-medium whitespace-nowrap">catalogo.magistral.pe/</span>
               <input 
                 required 
                 value={slug}
                 onChange={(e) => setSlug(generateSlug(e.target.value))}
                 className="w-full px-3 py-3 bg-transparent text-sm text-[#0b3d32] font-bold focus:outline-none"
               />
             </div>
             <p className="text-[10px] text-gray-400 mt-2 font-medium">Este será el enlace que compartirás con tus clientes en redes sociales y WhatsApp.</p>
          </div>

          <button 
            type="submit" 
            disabled={loading || !slug}
            className="w-full bg-[#156d5e] hover:bg-[#0b3d32] text-white font-bold text-sm py-3.5 mt-6 rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar mi Catálogo e Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
