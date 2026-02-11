import React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { CartProvider } from "@/lib/cart-context"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: {
    default: "RADIADORES AMG - Radiadores y Sistema de Enfriamiento Automotor",
    template: "%s | RADIADORES AMG",
  },
  description:
    "Venta y reparacion de radiadores y sistemas de enfriamiento automotor. Calidad, confianza y los mejores precios en Buenos Aires, Argentina.",
  openGraph: {
    title: "RADIADORES AMG",
    description:
      "Especialistas en radiadores y sistemas de enfriamiento automotor.",
    locale: "es_AR",
    type: "website",
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans antialiased`}>
        <CartProvider>
          <SiteHeader />
          <main className="min-h-screen">{children}</main>
          <SiteFooter />
          <a
            href="https://wa.me/5493804524590"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-1 right-10 z-50 inline-flex h-15 w-15 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105"
            aria-label="Contactar por WhatsApp"
          >
            <svg
  width="64"
  height="64"
  viewBox="0 0 64 64"
  xmlns="http://www.w3.org/2000/svg"
  role="img"
  aria-label="WhatsApp"
>
  <defs>
    <linearGradient id="waGradient" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="#61FD7D"/>
      <stop offset="100%" stop-color="#2BB826"/>
    </linearGradient>
  </defs>
  <g fill="none" fill-rule="evenodd">
    <circle cx="32" cy="32" r="30" fill="url(#waGradient)"/>
    <path
      d="M32 16c-7.732 0-14 6.175-14 13.79 0 2.43.67 4.79 1.95 6.86L18 48l11.7-3.66c1.94.64 3.98.96 6.03.96 7.73 0 14-6.18 14-13.79C49.73 22.18 39.73 16 32 16Zm0 3.2c6.02 0 10.9 4.77 10.9 10.63 0 5.86-4.88 10.63-10.9 10.63-1.86 0-3.7-.48-5.32-1.39l-.38-.21-6.93 2.17 2.1-6.52-.25-.4A9.9 9.9 0 0 1 21.1 30c0-5.86 4.88-10.63 10.9-10.63Z"
      fill="#FFFFFF"
      fill-rule="nonzero"
    />
    <path
      d="M28.9 25.1c-.26-.58-.54-.59-.79-.6l-.67-.01c-.23 0-.6.09-.92.43-.32.34-1.21 1.18-1.21 2.88 0 1.7 1.24 3.34 1.42 3.57.18.23 2.39 3.8 5.9 5.17 2.92 1.15 3.52.92 4.15.86.63-.06 2.04-.83 2.33-1.64.29-.81.29-1.51.2-1.64-.09-.13-.32-.21-.67-.37-.35-.16-2.04-1.01-2.36-1.12-.32-.12-.55-.17-.79.17-.24.34-.91 1.12-1.12 1.35-.21.23-.41.26-.76.1-.35-.17-1.47-.54-2.8-1.72-1.03-.92-1.72-2.06-1.92-2.41-.2-.34-.02-.53.15-.7.16-.16.35-.41.52-.61.17-.2.23-.34.35-.58.12-.23.06-.43-.03-.6-.09-.17-.79-1.96-1.09-2.68Z"
      fill="#FFFFFF"
      fill-rule="nonzero"
    />
  </g>
</svg>

          </a>
        </CartProvider>
      </body>
    </html>
  )
}
