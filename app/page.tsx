import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Shield, Truck, Award, Wrench } from "lucide-react"
import { products, services, formatPrice } from "@/lib/data"

export default function HomePage() {
  const featuredProducts = products.filter((p) => p.active).slice(0, 4)

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
            <h1 className="text-balance text-4xl font-bold leading-tight text-secondary-foreground md:text-5xl lg:text-6xl">
              Especialistas en Radiadores y Enfriamiento Automotor
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-secondary-foreground/70">
              Mas de 20 anos de experiencia en venta, reparacion e instalacion de
              radiadores para todas las marcas. Calidad garantizada.
            </p>
            <div className="mt-8 flex flex-col items-end gap-4">
              <Link
                href="/catalogo"
                className="inline-flex items-center justify-end gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Ver Catalogo
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="https://wa.me/5491100000000"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-end gap-2 rounded-md border border-secondary-foreground/20 bg-transparent px-6 py-3 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary-foreground/10"
              >
                Consultar por WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 md:grid-cols-4 lg:px-8">
          {[
            { icon: Shield, title: "Garantia", desc: "En todos los productos" },
            { icon: Truck, title: "Envios", desc: "A todo el pais" },
            { icon: Award, title: "Calidad", desc: "Primeras marcas" },
            { icon: Wrench, title: "Servicio", desc: "Instalacion profesional" },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

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

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuredProducts.map((product) => (
            <Link
              key={product.id}
              href={`/catalogo/${product.slug}`}
              className="group overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-square overflow-hidden bg-muted">
                <Image
                  src={product.images[0] || "/placeholder.svg"}
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
                  {formatPrice(product.price)}
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

      {/* Services preview */}
      <section className="bg-muted">
        <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">
            Nuestros Servicios
          </h2>
          <p className="mt-2 text-muted-foreground">
            Soluciones completas para el sistema de refrigeracion de tu vehiculo
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <div
                key={service.id}
                className="rounded-lg border border-border bg-card p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                  <Wrench className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">
                  {service.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {service.description.slice(0, 100)}...
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/servicios"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Ver Todos los Servicios
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-secondary">
        <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-16 text-center lg:px-8">
          <h2 className="text-2xl font-bold text-secondary-foreground md:text-3xl">
            {"Necesitas ayuda con tu radiador?"}
          </h2>
          <p className="mt-3 max-w-md text-secondary-foreground/70">
            Escribinos por WhatsApp y te asesoramos sin compromiso. Respuesta
            inmediata.
          </p>
          <a
            href="https://wa.me/5491100000000"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Contactar por WhatsApp
          </a>
        </div>
      </section>
    </>
  )
}
