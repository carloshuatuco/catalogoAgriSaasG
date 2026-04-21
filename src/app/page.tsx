import Link from "next/link";
import { CheckCircle, Store, Zap, Smartphone } from "lucide-react";

export default function HomeSaaS() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans selection:bg-[#0ba18c] selection:text-white w-full">
      {/* Header */}
      <header className="bg-white sticky top-0 z-50 relative drop-shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-3">
          <div className="flex items-center justify-center flex-shrink-0 w-full md:w-auto">
            <img
              src="https://firebasestorage.googleapis.com/v0/b/magistralc.firebasestorage.app/o/MAGISTRAL_GREEN_LOGOTIPO.webp?alt=media&token=a345fc2b-fc8e-4324-8c5d-db9965a473ba"
              alt="Logo Magistral"
              className="h-12 sm:h-16 md:h-20 w-auto object-contain drop-shadow-[0_0_12px_rgba(34,197,94,0.8)] transition-all mx-auto md:mx-0"
            />
          </div>
        </div>
        {/* Ola del Header (Gota sutil) */}
        <div className="absolute top-full left-0 w-full overflow-hidden leading-[0] pointer-events-none -mt-[1px]">
          <svg className="block w-full h-[15px] sm:h-[25px] transform rotate-180" viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path fill="#ffffff" d="M0,32L120,42.7C240,53,480,75,720,74.7C960,75,1200,53,1320,42.7L1440,32L1440,120L1320,120C1200,120,960,120,720,120C480,120,240,120,120,120L0,120Z"></path>
          </svg>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center">
        <section className="w-full pt-16 pb-20 md:pt-24 md:pb-28 px-4 text-center bg-gradient-to-br from-[#0ba18c] to-[#8dddd8]">
          <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center">



            <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tighter leading-[1.05] mb-6 drop-shadow-sm">
              Muestra tus productos al público<br className="hidden md:block" />
              <span className="text-[#04332c] drop-shadow-sm"> en tiempo real</span>
            </h1>

            <p className="text-lg md:text-xl text-white/95 mb-10 max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
              MAGISTRAL te permite crear un catálogo virtual personalizado, dinámico y muy atractivo en minutos. Organiza todos tus productos y comparte tu enlace especial corporativo.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mt-4">
              <Link href="/admin/login" className="w-full sm:w-auto bg-white hover:bg-gray-50 text-[#0ba18c] font-bold text-lg px-10 py-4 rounded-full shadow-xl shadow-[#04332c]/30 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">
                Ingresar / Crear Catálogo
              </Link>
            </div>


          </div>
        </section>

        {/* Transición Suave de Olas (Hero -> Features) */}
        <div className="w-full relative bg-[#8dddd8] leading-[0]">
          <svg className="block w-full h-[60px] md:h-[120px]" viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path fill="#ffffff" d="M0,32L80,48C160,64,320,96,480,101.3C640,107,800,85,960,80C1120,75,1280,85,1360,90.7L1440,96L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
          </svg>
        </div>

        {/* Features / Benefits */}
        <section id="features" className="w-full bg-white pb-24 pt-4 md:pt-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#0ba18c] mb-4 tracking-tight">Potencia completa para tu agronegocio</h2>
              <p className="text-gray-500 max-w-2xl mx-auto text-lg">Una solución B2B diseñada minuciosamente para distribuidores y fabricantes de insumos agrícolas.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 rounded-3xl bg-gradient-to-b from-[#f2fcfb] to-white border border-[#8dddd8]/40 hover:border-[#0ba18c]/50 hover:shadow-xl transition-all group">
                <div className="w-14 h-14 bg-[#8dddd8]/30 text-[#0ba18c] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Store className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#0ba18c] mb-3">Tu Enlace Personalizado</h3>
                <p className="text-gray-600 text-sm leading-relaxed">Obtén un enlace único (ej. <span className="font-mono font-bold bg-[#8dddd8]/20 border border-[#8dddd8]/50 text-[#0ba18c] px-1 py-0.5 rounded textxs">catalogo.magistral.pe/tu-tienda</span>) para usarlo en marketing de WhatsApp o Redes Sociales.</p>
              </div>

              <div className="p-8 rounded-3xl bg-gradient-to-b from-[#f2fcfb] to-white border border-[#8dddd8]/40 hover:border-[#0ba18c]/50 hover:shadow-xl transition-all group shrink-0">
                <div className="w-14 h-14 bg-[#8dddd8]/30 text-[#0ba18c] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#0ba18c] mb-3">Gestión Predictiva de Datos</h3>
                <p className="text-gray-600 text-sm leading-relaxed">Sube fotos o actualiza precios y formulaciones activas: el catálogo reflejará los datos en tiempo real con latencia de milisegundos.</p>
              </div>

              <div className="p-8 rounded-3xl bg-gradient-to-b from-[#f2fcfb] to-white border border-[#8dddd8]/40 hover:border-[#0ba18c]/50 hover:shadow-xl transition-all group">
                <div className="w-14 h-14 bg-[#8dddd8]/30 text-[#0ba18c] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#0ba18c] mb-3">Diseño 100% Integrado</h3>
                <p className="text-gray-600 text-sm leading-relaxed">El catálogo luce espectacular con estética superior, adaptándose sin esfuerzo tanto a equipos empresariales como a dispositivos móviles de campo.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Transición Suave de Olas (Features -> Footer) */}
        <div className="w-full relative bg-white leading-[0]">
          <svg className="block w-full h-[60px] md:h-[120px]" viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path fill="#042823" d="M0,64L80,74.7C160,85,320,107,480,106.7C640,107,800,85,960,69.3C1120,53,1280,43,1360,37.3L1440,32L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
          </svg>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-[#042823] text-gray-400 py-10 sm:py-12 text-center">
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
