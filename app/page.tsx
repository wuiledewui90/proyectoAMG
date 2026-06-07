import Image from "next/image"
import Link from "next/link"
import { ArrowDown, ArrowRight, Package } from "lucide-react"
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
      <section className="relative flex min-h-svh items-center overflow-hidden bg-secondary">
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
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[160px] bg-gradient-to-b from-transparent via-[#050505]/38 to-[#050505] sm:h-[190px] lg:h-[220px]"
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center px-4 pb-28 pt-32 sm:pb-32 sm:pt-28 lg:px-8">
          <div className="flex w-full justify-center sm:justify-end">
          <div className="flex w-full max-w-xl flex-col items-center text-center sm:items-end sm:text-right">
            <h1 className="text-balance text-3xl font-bold leading-tight text-secondary-foreground sm:text-4xl lg:text-5xl">
              Evitá el Recalentamiento y Protegé el Motor de tu Vehículo
            </h1>
            <p className="mt-5 max-w-[34rem] text-base leading-relaxed text-secondary-foreground/75 sm:text-lg">
            Venta, reparación y mantenimiento de radiadores para autos, camionetas y maquinaria. Más de 30 años brindando soluciones confiables para mantener tu vehículo siempre en marcha.
            </p>
            <div className="mt-8 flex w-full flex-col items-stretch gap-3 min-[420px]:w-auto min-[420px]:flex-row min-[420px]:items-end sm:gap-4">
              <Link
                href="/catalogo"
                className="group inline-flex items-center justify-center gap-2 rounded-md border border-primary bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg active:translate-y-0"
              >
                Ver Catalogo
                <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="https://maps.app.goo.gl/Pji5UPnbmQHGQKJ99" target="blank"
                className="group inline-flex items-center justify-center gap-2 rounded-md border border-primary bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg active:translate-y-0"
              >
                Como LLlegar
                <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
          </div>

          {featuredProducts.length > 0 && (
            <div className="mt-8 w-full sm:mt-10">
              <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-4 lg:gap-4 [&::-webkit-scrollbar]:hidden">
                {featuredProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/catalogo/${product.slug}`}
                    className="group flex min-w-[230px] items-center gap-3 rounded-lg border border-white/15 !bg-transparent p-2.5 text-left text-white transition-all duration-300 hover:-translate-y-1 hover:border-primary/70 hover:shadow-[0_16px_36px_rgba(0,127,128,0.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:min-w-0"
                  >
                    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/15 !bg-transparent text-primary">
                      {product.images?.[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          sizes="64px"
                          className="object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      ) : (
                        <Package className="h-7 w-7 transition-transform duration-300 group-hover:scale-110" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[10px] font-bold uppercase tracking-widest text-white/55">
                        {[product.brand, product.model].filter(Boolean).join(" ")}
                      </p>
                      <h3 className="mt-1 line-clamp-2 text-xs font-bold leading-snug text-white">
                        {product.name}
                      </h3>
                      <p className="mt-1 text-sm font-black text-primary">
                        {formatPriceARS(product.price)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
        <a
          href="#servicios"
          aria-label="Ver servicios"
          className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/75 transition-colors hover:text-primary sm:bottom-7 sm:text-xs"
        >
          <span>Servicios</span>
          <span className="flex h-9 w-9 animate-bounce items-center justify-center rounded-full border border-primary/50 bg-black/35 text-primary shadow-[0_10px_28px_rgba(0,127,128,0.22)] backdrop-blur-md sm:h-10 sm:w-10">
            <ArrowDown className="h-4 w-4 sm:h-5 sm:w-5" />
          </span>
        </a>
      </section>

      <ServicesCarousel services={services} />

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
