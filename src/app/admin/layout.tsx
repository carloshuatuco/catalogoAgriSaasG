"use client";

import { Settings, Package, LogOut, ArrowLeft, Loader2, Megaphone } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useEffect } from "react";
import { logout } from "@/lib/firebase/auth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, store, loading, initializeAuth } = useAuthStore();

  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => unsubscribe();
  }, [initializeAuth]);

  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== "/admin/login") {
        router.push("/admin/login");
      } else if (user && !store && pathname !== "/admin/onboarding") {
        router.push("/admin/onboarding");
      } else if (user && store && (pathname === "/admin/login" || pathname === "/admin/onboarding")) {
        router.push("/admin");
      }
    }
  }, [user, store, loading, router, pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch(err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 w-full">
         <div className="flex flex-col items-center gap-4">
             <Loader2 className="w-10 h-10 animate-spin text-[#156d5e]" />
             <p className="text-sm text-gray-500 font-medium animate-pulse">Cargando perfil...</p>
         </div>
      </div>
    );
  }

  // Si no está autenticado y está en la página de login, no mostrar layout (lo renderiza page.tsx en pantalla completa)
  if (pathname === "/admin/login" || pathname === "/admin/onboarding") {
     return <>{children}</>;
  }

  // Si no está loading, no es user y no estamos en login, useEffect hará el redirect (mientras tanto null)
  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans w-full">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-[#0b3d32] text-white flex-col justify-between hidden md:flex shrink-0 shadow-lg relative z-20">
        <div>
          <div className="p-6 border-b border-[#13594a] flex flex-col items-center text-center">
             {store?.logo ? (
                <img src={store.logo} alt="Logo de Tienda" className="w-16 h-16 object-contain bg-white rounded-xl shadow-sm mb-3 p-1" />
             ) : (
                <div className="w-16 h-16 rounded-xl bg-[#13594a] flex items-center justify-center mb-3">
                   <span className="text-2xl font-bold text-white uppercase">{store?.name?.substring(0,2) || 'TI'}</span>
                </div>
             )}
            <h1 className="text-xl font-bold tracking-wider relative group cursor-default leading-tight">
               {store?.name || 'Mi Tienda'}
               <span title="Conectado a Firebase" className="absolute -top-1 -right-2 bg-green-500 w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
            </h1>
            <p className="text-[10px] text-green-300 uppercase tracking-widest mt-1.5 font-medium truncate w-full">
               Plataforma Magistral
            </p>
          </div>
          
          <nav className="p-4 space-y-2 mt-4">
            <Link href="/admin" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${pathname === '/admin' ? 'bg-[#13594a] shadow-md text-white border-l-2 border-green-400' : 'text-gray-300 hover:bg-[#13594a]/50 hover:text-white'}`}>
              <Package className="w-5 h-5" />
              Productos
            </Link>
            <Link href="/admin/marketing" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${pathname === '/admin/marketing' ? 'bg-[#13594a] shadow-md text-white border-l-2 border-green-400' : 'text-gray-300 hover:bg-[#13594a]/50 hover:text-white'}`}>
              <Megaphone className="w-5 h-5" />
              Marketing
            </Link>
            <Link href="/admin/configuracion" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${pathname === '/admin/configuracion' ? 'bg-[#13594a] shadow-md text-white border-l-2 border-green-400' : 'text-gray-300 hover:bg-[#13594a]/50 hover:text-white'}`}>
              <Settings className="w-5 h-5" />
              Configuración
            </Link>
          </nav>
        </div>

        <div className="p-4 space-y-2 mb-4 border-t border-[#13594a] pt-4">
           <div className="mb-3 px-2">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Administrador</p>
              <p className="text-xs text-green-300 truncate" title={user.email || ""}>{user.email || ""}</p>
           </div>
           {/* Firebase Logout */}
           <button 
             onClick={handleLogout}
             className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
           >
             <LogOut className="w-4 h-4" /> Finalizar Sesión
           </button>
           {store && (
             <Link href={`/${store.slug}`} target="_blank" className="w-full flex items-center justify-center gap-2 px-4 py-2 text-[11px] font-semibold text-[#156d5e] bg-white hover:bg-green-50 rounded-lg transition-colors mt-2">
               <ArrowLeft className="w-3 h-3" /> Catálogo Público
             </Link>
           )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden w-full relative z-10">
        {/* Mobile Header */}
        <header className="md:hidden bg-[#0b3d32] text-white p-4 flex justify-between items-center shrink-0">
          <div className="flex flex-col">
             <span className="font-bold text-sm">MAGISTRAL</span>
             <span className="text-[9px] text-green-300 opacity-80">{user.email || 'Admin Panel'}</span>
          </div>
          <button onClick={handleLogout} className="text-white hover:text-red-300 p-2"><LogOut className="w-5 h-5"/></button>
        </header>
        
        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-white m-4 md:m-8 rounded-2xl shadow-sm border border-gray-100 p-6 xl:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
