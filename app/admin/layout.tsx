import type { Metadata } from "next"
import { AdminShell } from "./admin-shell"

export const metadata: Metadata = {
  title: "AMG Gestión",
  description: "Stock, ventas y administración de Radiadores AMG.",
  manifest: "/management.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AMG Gestión",
  },
  icons: {
    icon: [
      { url: "/images/amg-gestion-192.png", sizes: "192x192", type: "image/png" },
      { url: "/images/amg-gestion-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/images/amg-gestion-192.png",
  },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
