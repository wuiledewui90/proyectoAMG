import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getPublicProductBySlug } from "@/lib/catalog/public-products"
import { ProductDetail } from "./product-detail"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getPublicProductBySlug(slug)

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
  const product = await getPublicProductBySlug(slug)

  if (!product || !product.isActive) notFound()

  return <ProductDetail product={product} />
}
