import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    "/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)",
  ],
};

export default function middleware(req: NextRequest) {
  const url = req.nextUrl;
  let hostname = req.headers.get("host") || "";

  // En local, limpiamos el puerto
  hostname = hostname.replace(/:\d+$/, "");

  // Dominios que consideramos "nuestros" y no necesitan rewrite de dominio personalizado
  const currentHost = process.env.NODE_ENV === "production" ? "catalogo.magistral.pe" : "localhost";
  const coreDomains = [
    "localhost", 
    "127.0.0.1", 
    currentHost, 
    "catalogo-magistral.vercel.app", 
    "catalogo-magistral.firebaseapp.com",
    "catalogo-magistral.web.app"
  ];

  // Si el host es diferente a los dominios base, asumimos que es un custom domain
  if (!coreDomains.includes(hostname)) {
    // Si están entrando al root, reescribimos al root del custom domain
    // Si entran a /, lo mandamos a /domain/[hostname]
    const path = url.pathname === "/" ? "" : url.pathname;
    
    // Reescribe p.ej. "www.mitienda.com/" -> "/domain/www.mitienda.com/"
    const newUrl = new URL(`/domain/${hostname}${path}`, req.url);
    newUrl.search = url.search;
    return NextResponse.rewrite(newUrl);
  }

  return NextResponse.next();
}
