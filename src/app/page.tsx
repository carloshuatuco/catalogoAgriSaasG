import Link from "next/link";
import { CheckCircle, Store, Zap, Smartphone } from "lucide-react";

export default function HomeSaaS() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans selection:bg-[#156d5e] selection:text-white w-full">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-3">
          <div className="flex items-center justify-center flex-shrink-0 w-full md:w-auto">
            <img
              src="https://firebasestorage.googleapis.com/v0/b/magistralc.firebasestorage.app/o/MAGISTRAL_GREEN_LOGOTIPO.webp?alt=media&token=a345fc2b-fc8e-4324-8c5d-db9965a473ba"
              alt="Logo Magistral"
              className="h-12 sm:h-16 md:h-20 w-auto object-contain drop-shadow-[0_0_12px_rgba(34,197,94,0.8)] transition-all mx-auto md:mx-0"
            />
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center">
        <section className="w-full pt-16 pb-20 md:pt-24 md:pb-28 px-4 text-center">
          <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center">



            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tighter leading-[1.05] mb-6">
              Muestra tus productos al público<br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0b3d32] to-[#20a38c]"> en tiempo real</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
              MAGISTRAL te permite crear un catálogo virtual personalizado, dinámico y muy atractivo en minutos. Organiza todos tus productos y comparte tu enlace especial corporativo.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mt-4">
              <Link href="/admin/login" className="w-full sm:w-auto bg-[#156d5e] hover:bg-[#0b3d32] text-white font-bold text-lg px-10 py-4 rounded-full shadow-xl shadow-[#156d5e]/20 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">
                Ingresar / Crear Catálogo
              </Link>
            </div>


          </div>
        </section>

        {/* Features / Benefits */}
        <section id="features" className="w-full bg-white py-24 px-4 border-t border-gray-100">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Potencia completa para tu agronegocio</h2>
              <p className="text-gray-500 max-w-2xl mx-auto text-lg">Una solución B2B diseñada minuciosamente para distribuidores y fabricantes de insumos agrícolas.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:shadow-xl transition-shadow group">
                <div className="w-14 h-14 bg-green-100 text-[#156d5e] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Store className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Tu Enlace Personalizado</h3>
                <p className="text-gray-600 text-sm leading-relaxed">Obtén un enlace único (ej. <span className="font-mono font-bold bg-white border border-gray-200 px-1 py-0.5 rounded textxs">catalogo.magistral.pe/tu-agro</span>) para usarlo en marketing de WhatsApp o Redes Sociales.</p>
              </div>

              <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:shadow-xl transition-shadow group shrink-0">
                <div className="w-14 h-14 bg-green-100 text-[#156d5e] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Gestión Predictiva de Datos</h3>
                <p className="text-gray-600 text-sm leading-relaxed">Sube fotos o actualiza precios y formulaciones activas: el catálogo reflejará los datos en tiempo real con latencia de milisegundos.</p>
              </div>

              <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:shadow-xl transition-shadow group">
                <div className="w-14 h-14 bg-green-100 text-[#156d5e] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Diseño 100% Integrado</h3>
                <p className="text-gray-600 text-sm leading-relaxed">El catálogo luce espectacular con estética superior, adaptándose sin esfuerzo tanto a equipos empresariales como a dispositivos móviles de campo.</p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 sm:py-12 text-center">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-6">
            <img
              src="https://firebasestorage.googleapis.com/v0/b/magistralc.firebasestorage.app/o/MAGISTRAL_GREEN_LOGOTIPO.webp?alt=media&token=a345fc2b-fc8e-4324-8c5d-db9965a473ba"
              alt="Logo Magistral"
              className="h-12 sm:h-16 md:h-20 w-auto object-contain drop-shadow-[0_0_12px_rgba(34,197,94,0.8)] transition-all"
            />
          </div>
          <p className="text-xs sm:text-sm mb-2 font-medium">&copy; {new Date().getFullYear()} Plataforma Magistral. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
