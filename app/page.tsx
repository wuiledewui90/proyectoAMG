import Image from "next/image"
import Link from "next/link"
import { ArrowRight, MapPin, Package } from "lucide-react"
import { DesktopHeroVideo } from "@/components/desktop-hero-video"
import { HomeSequence } from "@/components/home-sequence"
import { getPublicFeaturedProducts } from "@/lib/catalog/public-products"

export const revalidate = 300

export default async function HomePage() {
  const products = await getPublicFeaturedProducts()

  return (
    <>
      <HomeSequence>
      <section className="home-hero-enter relative min-h-svh overflow-hidden bg-[#060708] text-white">
        <DesktopHeroVideo />

        <div
          className="absolute inset-0 hidden bg-[linear-gradient(90deg,rgba(4,6,8,.7)_0%,rgba(4,6,8,.5)_34%,rgba(4,6,8,.08)_63%,rgba(4,6,8,.18)_100%)] md:block"
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

        <div className="relative z-10 mx-auto w-full max-w-[90rem] px-5 pb-10 pt-[calc(34px+56.25vw)] sm:px-8 sm:pb-12 md:pt-28 lg:px-12 lg:pb-8 lg:pt-24 xl:px-16">
          <div className="max-w-[42rem] translate-y-[calc(60px-56.25vw)] md:translate-y-0">
            <p className="hero-message-final mb-3 text-[10px] font-extrabold uppercase tracking-[0.22em] text-white/65 sm:text-xs">
              Radiadores y refrigeración
            </p>
            <div className="grid">
              <p
                aria-hidden="true"
                className="hero-message-intro col-start-1 row-start-1 font-display text-balance font-black uppercase leading-[0.9] tracking-[-0.05em]"
              >
                <span className="mb-4 block font-sans text-[10px] font-extrabold uppercase tracking-[0.22em] text-white/65 sm:text-xs">
                  Radiadores y refrigeración
                </span>
                <span className="block text-[clamp(2.15rem,4.2vw,4.2rem)] text-white">
                  Cuidá tu motor
                </span>
                <span className="block text-[clamp(2.15rem,4.2vw,4.2rem)] text-[#b9c1c7]">
                  antes de que
                </span>
                <span className="block text-[clamp(2.15rem,4.2vw,4.2rem)] text-[#b9c1c7]">
                  sea <span className="hero-intro-accent">tarde.</span>
                </span>
              </p>

              <h1 className="hero-message-final col-start-1 row-start-1 font-display text-balance font-black uppercase leading-[0.9] tracking-[-0.05em] text-white">
                <span className="block text-2xl text-white md:text-[clamp(2.15rem,4.2vw,4.2rem)]">
                  El repuesto
                </span>
                <span className="block text-2xl text-white md:text-[clamp(2.15rem,4.2vw,4.2rem)]">
                  que tu vehículo
                </span>
                <span className="block text-2xl text-white md:text-[clamp(2.15rem,4.2vw,4.2rem)]">
                  necesita.
                </span>
              </h1>
            </div>

            <p className="hero-reveal hero-after-message-copy mt-4 max-w-xl text-sm leading-relaxed text-white/72 sm:text-base">
              Venta, diagnóstico y reparación de radiadores para autos,
              camionetas y maquinaria.
            </p>

            <div className="hero-reveal hero-after-message-actions mt-5 flex flex-col gap-2.5 min-[430px]:flex-row">
              <Link
                href="/catalogo"
                className="group inline-flex min-h-10 items-center justify-center gap-2.5 rounded-xl bg-[#b42232] px-5 text-[11px] font-extrabold uppercase tracking-[0.1em] text-white transition duration-300 hover:bg-[#c3c8cc] hover:text-[#08090a]"
              >
                Catálogo
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="https://www.google.com/maps/place/RADIADORES+AMG/@-29.4002907,-66.8367486,17z/data=!3m1!4b1!4m6!3m5!1s0x9427da42c30e0433:0x576025b3cc0c6a5b!8m2!3d-29.4002907!4d-66.8341737!16s%2Fg%2F11h9z11xml?entry=ttu"
                target="_blank"
                rel="noopener noreferrer"
                className="directions-soft-pulse group inline-flex min-h-10 items-center justify-center gap-2.5 rounded-xl border border-[#315caf] bg-[#0b2a69]/20 px-5 text-[11px] font-extrabold uppercase tracking-[0.1em] text-white backdrop-blur-sm transition duration-300 hover:border-[#4776d0] hover:bg-[#0b2a69]"
              >
                Cómo llegar
                <MapPin className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
              </a>
            </div>
          </div>

          {products.length > 0 && (
            <section
              id="destacados"
              className="mt-4 translate-y-[calc(60px-56.25vw)] pt-0 sm:mt-8 sm:pt-5 md:translate-y-0"
            >
              <div className="hero-reveal hero-featured-heading mb-3">
                <h2 className="font-display text-base font-black uppercase tracking-[-0.02em] text-white sm:text-lg">
                  Productos destacados
                </h2>
              </div>

              <div className="-mx-5 grid touch-auto snap-x snap-mandatory grid-flow-col auto-cols-[40%] gap-2 overflow-x-auto overscroll-x-contain px-5 pb-2 [scrollbar-width:none] sm:-mx-8 sm:auto-cols-[23%] sm:gap-2.5 sm:px-8 lg:mx-0 lg:snap-none lg:grid-flow-row lg:auto-cols-auto lg:grid-cols-4 lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden">
                {products.map((product, index) => (
                  <Link
                    key={product.id}
                    href={`/catalogo/${product.slug}`}
                    className="hero-product-card featured-product-card group relative snap-start overflow-hidden rounded-[18px] border border-[#335b88]/55 p-2 transition duration-500 hover:-translate-y-1 hover:border-[#5f9fe5]/80 sm:p-2.5"
                    style={{ animationDelay: `${7400 + index * 500}ms` }}
                  >
                    <span className="featured-product-corner" aria-hidden="true" />
                    <div className="featured-product-image relative z-10 aspect-video overflow-hidden rounded-[12px] border border-white/10 bg-[#071426]">
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
                      <span className="absolute inset-0 bg-[linear-gradient(180deg,transparent_42%,rgba(2,9,20,.72)_100%)]" aria-hidden="true" />
                    </div>
                    <div className="relative z-10 px-0.5 pb-0.5 pt-2">
                      <p className="truncate text-[7px] font-black uppercase tracking-[0.16em] text-[#69a8eb] sm:text-[8px]">
                        {product.category}
                      </p>
                      <h3 className="mt-1 line-clamp-2 min-h-[2rem] font-display text-[10px] font-black uppercase leading-tight text-white sm:text-[11px]">
                        {product.name}
                      </h3>
                      <span className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 text-[8px] font-extrabold uppercase tracking-[0.12em] text-white/65 sm:text-[9px]">
                        Explorar
                        <span className="featured-product-arrow grid h-6 w-6 place-items-center rounded-full border border-[#4b82bc]/60 bg-[#0a2848] text-[#8fc5ff] transition duration-300 group-hover:border-[#d32739]/80 group-hover:bg-[#a7192a] group-hover:text-white">
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </span>
                    </div>
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
