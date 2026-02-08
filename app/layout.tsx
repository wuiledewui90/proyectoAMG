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
        </CartProvider>
      </body>
    </html>
  )
}
