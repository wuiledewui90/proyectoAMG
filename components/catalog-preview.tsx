import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ShoppingBag } from "lucide-react"
import type { SerializedProduct } from "@/lib/products/product-serialize"

function formatPrice(value: number) {
  return value.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  })
}

export function CatalogPreview({ products }: { products: SerializedProduct[] }) {
  return (
    <section id="catalogo" className="relative overflow-hidden bg-[#0a0c0f] py-24 text-white sm:py-28 lg:py-32">
      <div className="technical-grid absolute inset-0 opacity-20" aria-hidden="true" />
      <div className="absolute left-0 top-0 h-full w-1 bg-primary" aria-hidden="true" />

      <div className="relative mx-auto max-w-[90rem] px-5 sm:px-8 lg:px-12 xl:px-16">
        <div className="mb-10 flex flex-col gap-6 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-5 text-xs font-extrabold uppercase tracking-[0.22em] text-primary">
              Catálogo
            </p>
            <h2 className="font-display text-4xl font-black uppercase leading-[0.95] tracking-[-0.035em] sm:text-5xl lg:text-6xl">
              El repuesto correcto para cada vehículo.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/62">
              Explorá radiadores, electroventiladores, mangueras y accesorios para el sistema de enfriamiento.
            </p>
          </div>
          <Link
            href="/catalogo"
            className="group inline-flex min-h-12 shrink-0 items-center justify-center gap-3 border-b-2 border-primary text-sm font-extrabold uppercase tracking-[0.1em] text-white transition hover:text-primary"
          >
            Ver todo el catálogo
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="grid gap-px bg-white/12 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/catalogo/${product.slug}`}
                className="group relative min-h-[340px] overflow-hidden bg-[#11151a] p-5 transition-colors duration-300 hover:bg-[#171d24]"
              >
                <div className="relative aspect-square overflow-hidden bg-white/5">
                  <Image
                    src={product.images[0] || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                  {product.category}
                </p>
                <h3 className="mt-2 line-clamp-2 font-display text-xl font-black uppercase leading-tight tracking-[-0.02em] text-white">
                  {product.name}
                </h3>
                <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                  <span className="font-bold text-white">{formatPrice(product.price)}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex min-h-56 flex-col items-center justify-center border border-white/12 bg-white/[0.03] px-6 text-center">
            <ShoppingBag className="h-8 w-8 text-primary" />
            <p className="mt-4 font-display text-xl font-black uppercase">Próximamente, productos en catálogo</p>
            <Link href="/catalogo" className="mt-5 text-sm font-bold text-primary underline underline-offset-4">
              Ir al catálogo
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
