import type { Metadata } from "next"
import { CatalogClient } from "./catalog-client"
import { getPublicCatalogCards } from "@/lib/catalog/public-products"

// La base de datos sólo está disponible en ejecución, no durante el build.
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Catalogo",
  description:
    "Catalogo completo de radiadores, electroventiladores, mangueras y accesorios para el sistema de enfriamiento de tu vehiculo.",
}

export default async function CatalogoPage() {
  const products = await getPublicCatalogCards()

  return <CatalogClient products={products} />
}
