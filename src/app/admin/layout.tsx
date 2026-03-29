"use client";

import { Settings, Package, LogOut, ArrowLeft, Loader2, Megaphone, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useEffect, useState } from "react";
import { logout } from "@/lib/firebase/auth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, store, loading, initializeAuth } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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

  // Si no está autenticado y está en la página de login, no mostrar layout
  if (pathname === "/admin/login" || pathname === "/admin/onboarding") {
     return <>{children}</>;
  }

  // Si no está loading, no es user y no estamos en login, useEffect hará el redirect
  if (!user) return null;

  const navLinks = [
    { href: "/admin", icon: <Package className="w-5 h-5" />, label: "Productos" },
    { href: "/admin/marketing", icon: <Megaphone className="w-5 h-5" />, label: "Marketing" },
    { href: "/admin/configuracion", icon: <Settings className="w-5 h-5" />, label: "Configuración" },
  ];

  const SidebarContent = () => (
    <>
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
          {navLinks.map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${pathname === href ? 'bg-[#13594a] shadow-md text-white border-l-2 border-green-400' : 'text-gray-300 hover:bg-[#13594a]/50 hover:text-white'}`}
            >
              {icon}
              {label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="p-4 space-y-2 mb-4 border-t border-[#13594a] pt-4">
         <div className="mb-3 px-2">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Administrador</p>
            <p className="text-xs text-green-300 truncate" title={user.email || ""}>{user.email || ""}</p>
         </div>
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
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans w-full">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-[#0b3d32] text-white flex-col justify-between hidden md:flex shrink-0 shadow-lg relative z-20">
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar (slide-in) */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-[#0b3d32] text-white flex flex-col justify-between z-40 md:hidden shadow-2xl transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close button */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="absolute top-4 right-4 text-white/70 hover:text-white p-1 transition-colors"
          aria-label="Cerrar menú"
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden w-full relative z-10">
        {/* Mobile Header */}
        <header className="md:hidden bg-[#0b3d32] text-white px-4 py-3 flex justify-between items-center shrink-0 shadow-md">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="text-white p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center">
            <span className="font-bold text-sm tracking-wider">MAGISTRAL</span>
            <span className="text-[9px] text-green-300 opacity-80">
              {store?.name || "Panel de Admin"}
            </span>
          </div>
          <button onClick={handleLogout} className="text-white hover:text-red-300 p-2 hover:bg-white/10 rounded-lg transition-colors">
            <LogOut className="w-5 h-5"/>
          </button>
        </header>
        
        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-white m-3 md:m-8 rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 xl:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
