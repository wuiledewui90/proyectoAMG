import type { Metadata } from "next"
import { CatalogClient } from "./catalog-client"

export const metadata: Metadata = {
  title: "Catalogo",
  description:
    "Catalogo completo de radiadores, electroventiladores, mangueras y accesorios para el sistema de enfriamiento de tu vehiculo.",
}

export default function CatalogoPage() {
  return <CatalogClient />
}
