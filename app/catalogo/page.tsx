import type { Metadata } from "next"
import { CatalogClient } from "./catalog-client"
import { getCatalogProducts } from "@/lib/products/product-repository"
import { serializeProducts } from "@/lib/products/product-serialize"

export const metadata: Metadata = {
  title: "Catalogo",
  description:
    "Catalogo completo de radiadores, electroventiladores, mangueras y accesorios para el sistema de enfriamiento de tu vehiculo.",
}

export default async function CatalogoPage() {
  const products = await getCatalogProducts()
  const serialized = serializeProducts(products)

  return <CatalogClient products={serialized} />
}
