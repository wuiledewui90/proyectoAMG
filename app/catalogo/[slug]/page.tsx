import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { products } from "@/lib/data"
import { ProductDetail } from "./product-detail"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = products.find((p) => p.slug === slug)
  if (!product) return { title: "Producto no encontrado" }
  return {
    title: product.name,
    description: product.description,
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = products.find((p) => p.slug === slug && p.active)
  if (!product) notFound()

  return <ProductDetail product={product} />
}
