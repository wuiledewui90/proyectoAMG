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
            href="https://wa.me/5491100000000"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-5 right-5 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105"
            aria-label="Contactar por WhatsApp"
          >
            <svg
            viewBox="0 0 32 32"
            className="h-20 w-20"
            aria-hidden="true"
            focusable="false"
>
            <path
              fill="currentColor"
              d="M19.11 17.94c-.29-.15-1.71-.84-1.97-.94-.26-.1-.45-.15-.64.15-.19.29-.73.94-.9 1.13-.17.19-.33.22-.62.07-.29-.15-1.23-.45-2.34-1.43-.86-.77-1.44-1.72-1.61-2.01-.17-.29-.02-.45.13-.6.13-.13.29-.33.44-.5.15-.17.2-.29.3-.48.1-.19.05-.36-.02-.5-.07-.15-.64-1.55-.88-2.12-.23-.56-.47-.49-.64-.5-.17-.01-.36-.01-.55-.01-.19 0-.5.07-.76.36-.26.29-1 1-1 2.43s1.02 2.81 1.16 3c.15.19 2.01 3.07 4.87 4.3.68.29 1.21.46 1.62.59.68.22 1.3.19 1.79.12.55-.08 1.71-.7 1.95-1.37.24-.67.24-1.25.17-1.37-.07-.12-.26-.19-.55-.33z"
            />
            <path
              fill="currentColor"
              d="M16.01 5.33c-5.89 0-10.67 4.78-10.67 10.67 0 1.88.5 3.71 1.45 5.32L5.33 26.67l5.45-1.43c1.54.84 3.27 1.28 5.23 1.28 5.89 0 10.67-4.78 10.67-10.67 0-5.89-4.78-10.67-10.67-10.67zm0 19.46c-1.74 0-3.45-.46-4.94-1.33l-.35-.2-3.23.85.86-3.14-.22-.36a8.28 8.28 0 0 1-1.3-4.45c0-4.58 3.73-8.31 8.31-8.31 4.58 0 8.31 3.73 8.31 8.31 0 4.58-3.73 8.31-8.31 8.31z"
            />
</svg>

          </a>
        </CartProvider>
      </body>
    </html>
  )
}
