import type { Metadata } from "next"
import { CatalogClient } from "./catalog-client"
import { getPublicCatalogProducts } from "@/lib/catalog/public-products"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata: Metadata = {
  title: "Catalogo",
  description:
    "Catalogo completo de radiadores, electroventiladores, mangueras y accesorios para el sistema de enfriamiento de tu vehiculo.",
}

export default async function CatalogoPage() {
  const products = await getPublicCatalogProducts()

  return <CatalogClient products={products} />
}
