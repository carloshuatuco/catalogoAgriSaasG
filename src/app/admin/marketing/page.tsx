"use client";

import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { Loader2, QrCode, Copy, Check, ImageDown } from "lucide-react";
import toast from "react-hot-toast";
import { QRCodeCanvas } from "qrcode.react";


export default function MarketingPage() {
  const { store } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadingCard, setDownloadingCard] = useState(false);

  const qrCardRef = useRef<HTMLDivElement>(null);
  
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const publicStoreUrl = store ? `${baseUrl}/${store.slug}` : "";
  // URL limpia para mostrar en la tarjeta (sin https://)
  const displayUrl = publicStoreUrl.replace(/^https?:\/\//, "");

  const themeColor = store?.themeColor || "#0b3d32";

  // Helper: draw rounded rect path
  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // Helper: try to draw an image, returns false if it fails (CORS etc.)
  async function tryDrawImage(ctx: CanvasRenderingContext2D, src: string, x: number, y: number, w: number, h: number): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          ctx.drawImage(img, x, y, w, h);
          resolve(true);
        } catch {
          resolve(false);
        }
      };
      img.onerror = () => resolve(false);
      // cache-buster to avoid stale cached response without CORS headers
      img.src = src.includes('?') ? `${src}&_cb=${Date.now()}` : `${src}?_cb=${Date.now()}`;
    });
  }

  const handleDownloadCard = async () => {
    if (!store) return;
    setDownloadingCard(true);
    try {
      const qrCanvasEl = qrCardRef.current?.querySelector("canvas") as HTMLCanvasElement | null;

      const SCALE = 3;
      const W = 320 * SCALE;
      const LOGO_SIZE = 80 * SCALE;
      const QR_BOX = 210 * SCALE;
      const QR_SIZE = 180 * SCALE;
      const PADDING = 28 * SCALE;
      const GAP = 20 * SCALE;
      const TEXT_NAME_H = 28 * SCALE;
      const FOOTER_H = 36 * SCALE;
      const H = PADDING + LOGO_SIZE + GAP + TEXT_NAME_H + GAP + QR_BOX + GAP + FOOTER_H + PADDING;

      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;

      // Background
      ctx.fillStyle = themeColor;
      roundRect(ctx, 0, 0, W, H, 36 * SCALE);
      ctx.fill();

      let y = PADDING;

      // Logo Box
      const logoX = (W - LOGO_SIZE) / 2;
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0,0,0,0.18)";
      ctx.shadowBlur = 12 * SCALE;
      roundRect(ctx, logoX, y, LOGO_SIZE, LOGO_SIZE, 16 * SCALE);
      ctx.fill();
      ctx.shadowBlur = 0;

      const logoLoaded = store.logo
        ? await tryDrawImage(ctx, store.logo, logoX + 8 * SCALE, y + 8 * SCALE, LOGO_SIZE - 16 * SCALE, LOGO_SIZE - 16 * SCALE)
        : false;
      if (!logoLoaded) {
        const initials = (store.name || "??").substring(0, 2).toUpperCase();
        ctx.fillStyle = themeColor;
        ctx.font = `900 ${32 * SCALE}px system-ui,sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(initials, logoX + LOGO_SIZE / 2, y + LOGO_SIZE / 2);
      }
      y += LOGO_SIZE + GAP;

      // Store Name
      ctx.fillStyle = "#ffffff";
      ctx.font = `900 ${16 * SCALE}px system-ui,sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(store.name || "", W / 2, y + TEXT_NAME_H / 2);
      y += TEXT_NAME_H + GAP;

      // QR White Box
      const qrBoxX = (W - QR_BOX) / 2;
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0,0,0,0.15)";
      ctx.shadowBlur = 16 * SCALE;
      roundRect(ctx, qrBoxX, y, QR_BOX, QR_BOX, 18 * SCALE);
      ctx.fill();
      ctx.shadowBlur = 0;

      const qrPad = (QR_BOX - QR_SIZE) / 2;
      if (qrCanvasEl) {
        ctx.drawImage(qrCanvasEl, qrBoxX + qrPad, y + qrPad, QR_SIZE, QR_SIZE);
      }
      y += QR_BOX + GAP;

      // Footer
      ctx.fillStyle = "rgba(255,255,255,0.60)";
      ctx.font = `700 ${9 * SCALE}px system-ui,sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("CAT\u00c1LOGO DIGITAL", W / 2, y + FOOTER_H * 0.28);
      ctx.fillStyle = "#ffffff";
      ctx.font = `800 ${11 * SCALE}px system-ui,sans-serif`;
      ctx.fillText(displayUrl, W / 2, y + FOOTER_H * 0.72);

      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `qr-catalogo-${store.slug || "tienda"}.png`;
      link.href = url;
      link.click();
    } catch (err) {
      console.error("Error al generar la tarjeta:", err);
      toast.error("No se pudo generar la tarjeta. Intenta de nuevo.");
    } finally {
      setDownloadingCard(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicStoreUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!store) return <div className="p-8 text-center text-gray-500">Cargando contexto de tienda...</div>;

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col relative space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 border-l-4 border-[#156d5e] pl-3">Marketing y Promociones</h2>
        <p className="text-sm text-gray-500 mt-1 pl-4">Atrae clientes e impulsa ventas con códigos QR.</p>
      </div>

      <div className="flex justify-center">
        
        {/* Generador QR */}
        <div className="w-full max-w-xl">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
             <div className="bg-gray-50 p-4 border-b border-gray-100 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#156d5e]" />
                <h3 className="font-bold text-gray-800">Código QR del Catálogo</h3>
             </div>
             
             <div className="p-6 flex flex-col items-center text-center">
                <p className="text-xs text-gray-500 mb-5 font-medium">
                  Vista previa de tu tarjeta QR. Descárgala e imprímela para compartir tu catálogo de manera rápida.
                </p>
                
                {/* ── TARJETA QR VISUAL (se captura con html2canvas) ── */}
                <div
                  ref={qrCardRef}
                  style={{ backgroundColor: themeColor }}
                  className="w-[320px] rounded-3xl p-7 flex flex-col items-center gap-5 shadow-xl mx-auto"
                >
                  {/* Logo o Iniciales */}
                  {store?.logo ? (
                    <div className="bg-white rounded-2xl p-3 shadow-md w-20 h-20 flex items-center justify-center overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={store.logo}
                        alt="Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl w-20 h-20 flex items-center justify-center shadow-md">
                      <span className="text-3xl font-black" style={{ color: themeColor }}>
                        {store?.name?.substring(0, 2).toUpperCase() || "??"}
                      </span>
                    </div>
                  )}

                  {/* Nombre de la empresa */}
                  <p className="text-white font-black text-lg tracking-wide text-center leading-tight drop-shadow">
                    {store.name}
                  </p>

                  {/* QR sobre tarjeta blanca */}
                  <div className="bg-white rounded-2xl p-5 shadow-lg">
                    <QRCodeCanvas
                      value={publicStoreUrl}
                      size={180}
                      bgColor="#ffffff"
                      fgColor={themeColor}
                      level="H"
                      includeMargin={false}
                    />
                  </div>

                  {/* Pie de página */}
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-white/70 text-[11px] font-semibold uppercase tracking-widest">
                      Catálogo digital
                    </p>
                    <p className="text-white font-bold text-[13px] tracking-wide">
                      {displayUrl}
                    </p>
                  </div>
                </div>
                {/* ── FIN TARJETA ── */}

                <div className="w-full max-w-[320px] space-y-3 mt-5 mx-auto">
                   {/* Botón descargar tarjeta completa */}
                   <button 
                     onClick={handleDownloadCard}
                     disabled={downloadingCard}
                     className="w-full flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-md text-white disabled:opacity-60"
                     style={{ backgroundColor: themeColor }}
                   >
                     {downloadingCard
                       ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
                       : <><ImageDown className="w-4 h-4" /> Descargar tarjeta QR</>
                     }
                   </button>

                   {/* Copiar enlace */}
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

      </div>

    </div>
  );
}
