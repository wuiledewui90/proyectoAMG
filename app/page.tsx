import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ServicesCarousel } from "@/components/services-carousel"

// ✅ ahora SOLO services (por ahora) queda desde data
import { services } from "@/lib/data"

// ✅ productos desde DB (Prisma)
import { getFeaturedProducts } from "@/lib/products/product-repository"
import { serializeProducts } from "@/lib/products/product-serialize"

// helper para precio (evita depender de formatPrice hardcodeado)
function formatPriceARS(value: unknown) {
  const n = typeof value === "number" ? value : Number(value)
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS" })
}

export default async function HomePage() {
  // ✅ trae 4 productos activos desde la base de datos
  const featuredProducts = serializeProducts(await getFeaturedProducts(4))

  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[520px] items-center overflow-hidden bg-secondary lg:min-h-[600px]">
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-80 pointer-events-none motion-reduce:hidden"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/placeholder.svg"
          aria-hidden="true"
        >
          <source src="/videos/amgvideo.mp4" type="video/mp4" />
        </video>
        <div
          className="absolute inset-0 bg-gradient-to-b from-secondary/10 via-secondary/40 to-secondary/80"
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto flex w-full max-w-7xl justify-end px-4 py-20 lg:px-8">
          <div className="flex max-w-xl flex-col items-end text-right">
            <h1 className="text-balance text-4xl font-bold leading-tight text-secondary-foreground md:text-3xl lg:text-4xl">
              Evitá el Recalentamiento y Protegé el Motor de tu Vehículo
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-secondary-foreground/70">
            Venta, reparación y mantenimiento de radiadores para autos, camionetas y maquinaria. Más de 30 años brindando soluciones confiables para mantener tu vehículo siempre en marcha.
            </p>
            <div className="mt-8 flex items-end gap-4">
              <Link
                href="/catalogo"
                className="group inline-flex items-center justify-end gap-2 rounded-md border border-primary bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg active:translate-y-0"
              >
                Ver Catalogo
                <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="https://maps.app.goo.gl/Pji5UPnbmQHGQKJ99" target="blank"
                className="group inline-flex items-center justify-end gap-2 rounded-md border border-primary bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg active:translate-y-0"
              >
                Como LLlegar
                <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <ServicesCarousel services={services} />

      {/* Featured Products */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              Productos Destacados
            </h2>
            <p className="mt-2 text-muted-foreground">
              Los mas pedidos por nuestros clientes
            </p>
          </div>
          <Link
            href="/catalogo"
            className="hidden items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80 md:flex"
          >
            Ver todos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
          {featuredProducts.map((product) => (
            <Link
              key={product.id}
              href={`/catalogo/${product.slug}`}
              className="group overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
            >
              <div className="relative aspect-square overflow-hidden bg-muted">
                <Image
                  src={product.images?.[0] || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {product.brand} {product.model}
                </p>
                <h3 className="mt-1 text-sm font-semibold leading-snug text-foreground">
                  {product.name}
                </h3>
                <p className="mt-2 text-lg font-bold text-primary">
                  {formatPriceARS(product.price)}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 text-center md:hidden">
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary"
          >
            Ver todos los productos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-secondary">
        <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-16 text-center lg:px-8">
          <h2 className="text-2xl font-bold text-secondary-foreground md:text-3xl">
            {"¿Necesitas ayuda con tu radiador?"}
          </h2>
          <p className="mt-3 max-w-md text-secondary-foreground/70">
            Escribinos por WhatsApp y te asesoramos sin compromiso. Respuesta
            inmediata.
          </p>
          <a
            href="https://wa.me/5493804524590"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-md border border-primary bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg active:translate-y-0"
          >
            Contactar por WhatsApp
          </a>
        </div>
      </section>
    </>
  )
}
