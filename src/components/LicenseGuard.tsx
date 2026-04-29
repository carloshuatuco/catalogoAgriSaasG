"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/auth";
import { verificarLicencia } from "@/lib/firebase/licencias";
import { Loader2, ShieldAlert } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export function LicenseGuard({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [hasLicense, setHasLicense] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Rutas públicas o de auth que no requieren bloqueo
  const isPublicRoute = ["/", "/login", "/acceso", "/admin/login"].includes(pathname);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setIsUserLoading(false);

      if (isPublicRoute) {
        setIsVerifying(false);
        setHasLicense(true);
        return;
      }

      if (firebaseUser?.email) {
        try {
          const isValid = await verificarLicencia(firebaseUser.email);
          setHasLicense(isValid);
        } catch (error) {
          setHasLicense(false);
        } finally {
          setIsVerifying(false);
        }
      } else {
        setIsVerifying(false);
      }
    });

    return () => unsub();
  }, [pathname, isPublicRoute]);

  useEffect(() => {
    if (!isUserLoading && !isVerifying && !isPublicRoute && !user) {
      router.replace("/login");
    }
  }, [isUserLoading, isVerifying, isPublicRoute, user, router]);

  if (isUserLoading || isVerifying) {
    if (isPublicRoute) return <>{children}</>;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#14a0a0]" />
        <p className="text-gray-400 font-medium tracking-wider">Sincronizando licencia...</p>
      </div>
    );
  }

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (!user) {
    return null;
  }

  if (hasLicense === false) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
        <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl p-10 text-center border border-slate-100 animate-in zoom-in duration-300">
          <div className="mx-auto w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-8">
            <ShieldAlert className="h-10 w-10 text-emerald-600" />
          </div>
          
          <h1 className="text-3xl font-black text-slate-900 mb-4">Acceso Denegado</h1>
          <p className="text-slate-500 leading-relaxed mb-10">
            La cuenta (<span className="font-bold text-slate-700">{user.email}</span>) no tiene una licencia activa para <span className="font-bold text-[#14a0a0]">Catálogos Magistral</span>.
          </p>

          <div className="space-y-4">
            <button 
              onClick={() => window.open('https://divi.magistral.pe/dashboard/comprar', '_blank')}
              className="w-full h-16 bg-[#14a0a0] hover:bg-[#108585] text-white font-black text-lg rounded-2xl shadow-xl shadow-[#14a0a0]/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              Adquirir Licencia
            </button>
            
            <button 
              onClick={async () => {
                await signOut(auth);
                router.push("/login");
              }}
              className="w-full h-14 bg-slate-50 hover:bg-slate-100 text-slate-400 font-bold rounded-2xl transition-all"
            >
              Cerrar Sesión
            </button>
          </div>

          <div className="mt-12 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
            Powered by Divi Magistral
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
