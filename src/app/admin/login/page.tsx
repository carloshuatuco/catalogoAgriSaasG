"use client";

import Image from "next/image";
import { loginWithGoogle } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      await loginWithGoogle();
      router.push("/admin");
    } catch (err: any) {
      console.error(err);
      setError("No pudimos iniciar sesión. " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col px-4 text-sans">
      <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center">
        <div className="flex flex-col items-center justify-center mt-12 md:mt-2">
          <div className="flex items-center justify-center group-hover:scale-110 transition-transform">
            <div className="w-20 h-20  mx-auto flex items-center justify-center mb-4 overflow-hidden ">
              <Image
                src="/MAGISTRAl_GREEN_IMAGOTIPO.webp"
                alt="Magistral Logo"
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <p className="text-[11px] font-black uppercase text-[#156d5e] mt-6 mb-10 tracking-[0.2em] opacity-80">
            Acceso Administrativo
          </p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-medium mb-4">{error}</div>}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed group"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
          ) : (
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          <span className="text-sm">{loading ? "Conectando..." : "Ingresar con cuenta de Google"}</span>
        </button>

        <p className="text-[10px] text-gray-400 mt-6 text-center leading-relaxed">
          Usa tu cuenta autorizada para gestionar el catálogo y las propiedades del sistema SaaS.
        </p>
      </div>
    </div>
  );
}
