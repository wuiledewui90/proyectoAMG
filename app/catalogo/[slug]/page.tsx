import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getProductBySlug } from "@/lib/products/product-repository"
import { serializeProduct } from "@/lib/products/product-serialize"
import { ProductDetail } from "./product-detail"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product || !product.isActive) {
    return { title: "Producto no encontrado" }
  }

  return {
    title: product.name,
    description: product.description ?? undefined,
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product || !product.isActive) notFound()

  const serialized = serializeProduct(product)

  return <ProductDetail product={serialized} />
}
