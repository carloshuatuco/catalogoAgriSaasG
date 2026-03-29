import Link from "next/link";
import { CheckCircle, Store, Zap, Smartphone } from "lucide-react";

export default function HomeSaaS() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans selection:bg-[#156d5e] selection:text-white w-full">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="https://firebasestorage.googleapis.com/v0/b/studio-899372303-46a10.firebasestorage.app/o/MAGISTRAL_GREEN_LOGOTIPO.webp?alt=media&token=ad47cd24-3f33-47a8-a46d-f9b5931ffbed"
              alt="Logo Magistral"
              className="h-18 w-auto object-contain"
            />
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/admin/login" className="text-sm font-bold text-gray-600 hover:text-[#156d5e] transition-colors">
              Iniciar Sesión
            </Link>
            <Link href="/admin/login" className="text-sm font-bold bg-[#156d5e] text-white px-5 py-2.5 rounded-full shadow-md hover:bg-[#0b3d32] hover:shadow-lg transition-all hidden sm:block">
              Crear mi catálogo
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center">
        <section className="w-full pt-16 pb-20 md:pt-24 md:pb-28 px-4 text-center">
          <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 text-[#156d5e] text-xs font-bold uppercase tracking-wider mb-8 border border-green-100 shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              Plataforma Agrícola Inteligente
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tighter leading-[1.05] mb-6">
              Lleva tus ventas de insumos <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0b3d32] to-[#20a38c]">al siguiente nivel</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
              MAGISTRAL te permite crear un catálogo virtual personalizado, dinámico y muy atractivo en minutos. Organiza todos tus productos y comparte tu enlace especial corporativo.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
              <Link href="/admin/login" className="w-full sm:w-auto bg-[#156d5e] hover:bg-[#0b3d32] text-white font-bold text-lg px-8 py-4 rounded-full shadow-xl shadow-[#156d5e]/20 transition-all transform hover:-translate-y-1">
                Comenzar gratis ahora
              </Link>
              <a href="#features" className="w-full sm:w-auto bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-lg px-8 py-4 rounded-full shadow-sm transition-colors">
                Descubrir ventajas
              </a>
            </div>

            <p className="text-xs text-gray-400 mt-6 font-semibold uppercase tracking-widest bg-gray-100/50 py-1.5 px-4 rounded-full border border-gray-100">Sin tarjetas • Configuración inicial en 3 minutos</p>
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

        {/* Simple CTA */}
        <section className="w-full bg-[#0b3d32] border-y-8 border-[#156d5e] text-white py-24 px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">¿Listo para modernizarte?</h2>
            <p className="text-[#a4ccbb] text-lg mb-10 max-w-xl mx-auto leading-relaxed">Asegura tu lugar en Magistral SaaS, escala como distribuidor, impacta e incrementa tus ventas de inmediato.</p>
            <Link href="/admin/login" className="bg-white text-[#0b3d32] font-bold text-lg px-10 py-5 rounded-full shadow-2xl hover:shadow-3xl hover:bg-gray-50 transition-all transform hover:-translate-y-1 inline-block">
              Crear mi cuenta gratis ahora
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 text-center">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-6">
            <img
              src="https://firebasestorage.googleapis.com/v0/b/studio-899372303-46a10.firebasestorage.app/o/MAGISTRAL_GREEN_LOGOTIPO.webp?alt=media&token=ad47cd24-3f33-47a8-a46d-f9b5931ffbed"
              alt="Logo Magistral"
              className="h-18 w-auto object-contain"
            />
          </div>
          <p className="text-sm mb-2 font-medium">&copy; {new Date().getFullYear()} Plataforma Magistral. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
