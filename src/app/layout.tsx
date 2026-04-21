import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Catálogo MAGISTRAL",
  description: "Catálogo unificado de insumos agrícolas",
};

import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} min-h-screen flex flex-col font-sans bg-gray-50 text-gray-900`}>
        {children}
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
