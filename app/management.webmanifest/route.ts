import { NextResponse } from "next/server"

export function GET() {
  return NextResponse.json(
    {
      id: "/admin/",
      name: "AMG Gestión",
      short_name: "AMG Gestión",
      description: "Stock, ventas y administración de Radiadores AMG.",
      start_url: "/admin/",
      scope: "/admin/",
      display: "standalone",
      background_color: "#f3f4f6",
      theme_color: "#07152b",
      orientation: "any",
      icons: [
        {
          src: "/images/amg-gestion-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable",
        },
        {
          src: "/images/amg-gestion-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable",
        },
      ],
    },
    {
      headers: {
        "Content-Type": "application/manifest+json",
        "Cache-Control": "public, max-age=3600",
      },
    }
  )
}
