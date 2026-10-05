import Image from "next/image"
import Link from "next/link"
import { ArrowRight, MapPin, Package } from "lucide-react"
import { HomeSequence } from "@/components/home-sequence"
import { getPublicFeaturedProducts } from "@/lib/catalog/public-products"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function HomePage() {
  const products = await getPublicFeaturedProducts()

  return (
    <>
      <HomeSequence>
      <section className="home-hero-enter relative min-h-svh overflow-hidden bg-[#060708] text-white">
        <video
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-100 motion-reduce:hidden"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/placeholder.svg"
          aria-hidden="true"
        >
          <source src="/videos/amgvideo-web.mp4" type="video/mp4" />
        </video>

        <div
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,6,8,.7)_0%,rgba(4,6,8,.5)_34%,rgba(4,6,8,.08)_63%,rgba(4,6,8,.18)_100%)]"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,6,8,.08)_0%,transparent_38%,rgba(4,6,8,.42)_100%)]"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_30%_38%,rgba(11,42,105,.32),transparent_36%)]"
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto w-full max-w-[90rem] px-5 pb-10 pt-24 sm:px-8 sm:pb-12 sm:pt-28 lg:px-12 lg:pb-8 lg:pt-24 xl:px-16">
          <div className="max-w-[42rem]">
            <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.22em] text-white/65 sm:text-xs">
              Radiadores y refrigeración
            </p>
            <div className="grid">
              <p
                aria-hidden="true"
                className="hero-message-intro col-start-1 row-start-1 font-display text-balance font-black uppercase leading-[0.9] tracking-[-0.05em]"
              >
                <span className="block text-[clamp(2.15rem,4.2vw,4.2rem)] text-white">
                  Cuidá tu motor
                </span>
                <span className="block text-[clamp(2.15rem,4.2vw,4.2rem)] text-[#b9c1c7]">
                  antes de que
                </span>
                <span className="block text-[clamp(2.15rem,4.2vw,4.2rem)] text-[#b9c1c7]">
                  sea tarde.
                </span>
              </p>

              <h1 className="hero-message-final col-start-1 row-start-1 font-display text-balance font-black uppercase leading-[0.9] tracking-[-0.05em]">
                <span className="block text-[clamp(2.15rem,4.2vw,4.2rem)] text-white">
                  El repuesto
                </span>
                <span className="block text-[clamp(2.15rem,4.2vw,4.2rem)] text-[#b9c1c7]">
                  que tu vehículo
                </span>
                <span className="block text-[clamp(2.15rem,4.2vw,4.2rem)] text-[#b9c1c7]">
                  necesita.
                </span>
              </h1>
            </div>

            <p className="hero-reveal hero-after-message-copy mt-4 max-w-xl border-l border-[#b42232]/80 pl-4 text-sm leading-relaxed text-white/72 sm:pl-5 sm:text-base">
              Venta, diagnóstico y reparación de radiadores para autos,
              camionetas y maquinaria. Soluciones confiables para que sigas en
              movimiento.
            </p>

            <div className="hero-reveal hero-after-message-actions mt-5 flex flex-col gap-2.5 min-[430px]:flex-row">
              <Link
                href="/servicios"
                className="group inline-flex min-h-10 items-center justify-center gap-2.5 rounded-xl bg-[#b42232] px-5 text-[11px] font-extrabold uppercase tracking-[0.1em] text-white transition duration-300 hover:bg-[#c3c8cc] hover:text-[#08090a]"
              >
                Nuestros servicios
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="https://www.google.com/maps/place/RADIADORES+AMG/@-29.4002907,-66.8367486,17z/data=!3m1!4b1!4m6!3m5!1s0x9427da42c30e0433:0x576025b3cc0c6a5b!8m2!3d-29.4002907!4d-66.8341737!16s%2Fg%2F11h9z11xml?entry=ttu"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex min-h-10 items-center justify-center gap-2.5 rounded-xl border border-[#315caf] bg-[#0b2a69]/20 px-5 text-[11px] font-extrabold uppercase tracking-[0.1em] text-white backdrop-blur-sm transition duration-300 hover:border-[#4776d0] hover:bg-[#0b2a69]"
              >
                Cómo llegar
                <MapPin className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
              </a>
            </div>
          </div>

          {products.length > 0 && (
            <section id="destacados" className="mt-7 border-t border-white/15 pt-4 sm:mt-8 sm:pt-5">
              <div className="hero-reveal hero-featured-heading mb-3 flex items-center justify-between gap-4">
                <h2 className="font-display text-base font-black uppercase tracking-[-0.02em] text-white sm:text-lg">
                  Productos destacados
                </h2>
                <Link
                  href="/catalogo"
                  className="catalog-link-pulse group inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.12em] transition hover:text-white"
                >
                  Ver catálogo
                  <ArrowRight className="h-3.5 w-3.5 text-primary transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              <div className="-mx-5 grid touch-auto snap-x snap-mandatory grid-flow-col auto-cols-[66%] gap-2 overflow-x-auto overscroll-x-contain px-5 pb-2 [scrollbar-width:none] sm:-mx-8 sm:auto-cols-[37%] sm:gap-2.5 sm:px-8 lg:mx-0 lg:snap-none lg:grid-flow-row lg:auto-cols-auto lg:grid-cols-4 lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden">
                {products.map((product, index) => (
                  <Link
                    key={product.id}
                    href={`/catalogo/${product.slug}`}
                    className="hero-product-card group snap-start overflow-hidden border border-white/15 bg-[#071019]/75 p-2 backdrop-blur-sm transition-colors duration-500 hover:border-primary/70 hover:bg-[#0d1824] sm:p-2.5"
                    style={{ animationDelay: `${4900 + index * 500}ms` }}
                  >
                    <div className="relative aspect-video overflow-hidden bg-white/5">
                      {product.images[0] ? (
                        <Image
                          src={product.thumbnailUrl ?? product.images[0]}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <Package className="absolute inset-0 m-auto h-7 w-7 text-white/35" />
                      )}
                    </div>
                    <p className="mt-2 truncate text-[8px] font-bold uppercase tracking-[0.13em] text-primary sm:text-[9px]">
                      {product.category}
                    </p>
                    <h3 className="mt-1 line-clamp-2 min-h-[2rem] font-display text-[11px] font-black uppercase leading-tight text-white sm:text-xs">
                      {product.name}
                    </h3>
                    <p className="mt-1.5 text-[10px] font-bold text-white/75 sm:text-[11px]">Ver producto</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

      </section>
      </HomeSequence>

      <section className="bg-secondary text-secondary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-16 text-center lg:px-8">
          <h2 className="text-2xl font-bold md:text-3xl">
            ¿Necesitás ayuda con tu radiador?
          </h2>
          <p className="mt-3 max-w-md text-secondary-foreground/70">
            Escribinos por WhatsApp y te asesoramos sin compromiso.
          </p>
          <a
            href="https://wa.me/5493804524590"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex min-h-10 items-center gap-2 bg-primary px-5 text-xs font-extrabold uppercase tracking-[0.08em] text-primary-foreground transition hover:bg-white hover:text-black"
          >
            Contactar por WhatsApp
          </a>
        </div>
      </section>
    </>
  )
}
