import React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { CartProvider } from "@/lib/cart-context"
import { SiteChrome } from "@/components/site-chrome"
import { MobileKeyboardDismiss } from "@/components/mobile-keyboard-dismiss"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: {
    default: "RADIADORES AMG - Radiadores y Sistema de Enfriamiento Automotor",
    template: "%s | RADIADORES AMG",
  },
  description:
    "Venta y reparación de radiadores, repuestos y sistemas de enfriamiento automotor en La Rioja, Argentina.",
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
        <MobileKeyboardDismiss />
        <CartProvider>
          <SiteChrome>{children}</SiteChrome>
        </CartProvider>
      </body>
    </html>
  )
}
