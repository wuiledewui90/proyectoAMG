import type { Metadata } from "next"
import { Shield, Clock, Users, Award } from "lucide-react"

export const metadata: Metadata = {
  title: "Sobre Nosotros",
  description:
    "Conoce la historia de RADIADORES AMG. Mas de 20 anos de experiencia en radiadores y sistemas de enfriamiento automotor en Buenos Aires.",
}

export default function SobreNosotrosPage() {
  return (
    <>
      <section className="bg-secondary">
        <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
          <h1 className="text-3xl font-bold text-secondary-foreground md:text-4xl">
            Sobre Nosotros
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-secondary-foreground/70">
            Mas de dos decadas de experiencia nos respaldan como especialistas en
            sistemas de refrigeracion automotor.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Nuestra Historia
            </h2>
            <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">
              <p>
                RADIADORES AMG nacio en Buenos Aires con una mision clara:
                ofrecer soluciones de calidad para el sistema de enfriamiento de
                todo tipo de vehiculos. Desde nuestros inicios, nos enfocamos en
                brindar productos de primera linea y un servicio tecnico
                profesional.
              </p>
              <p>
                Con mas de 20 anos en el mercado, hemos construido una
                reputacion basada en la confianza, la honestidad y el
                conocimiento tecnico. Trabajamos con las mejores marcas del
                mercado y contamos con un equipo de tecnicos altamente
                capacitados.
              </p>
              <p>
                Hoy, seguimos creciendo y evolucionando, incorporando nuevas
                tecnologias y ampliando nuestro catalogo para satisfacer las
                necesidades de cada cliente.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {[
              {
                icon: Clock,
                title: "+20 Anos",
                desc: "De experiencia en el rubro automotor",
              },
              {
                icon: Users,
                title: "+5000 Clientes",
                desc: "Satisfechos en todo el pais",
              },
              {
                icon: Shield,
                title: "Garantia",
                desc: "En todos nuestros productos y servicios",
              },
              {
                icon: Award,
                title: "Calidad",
                desc: "Primeras marcas nacionales e importadas",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-border bg-card p-6 text-center"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-primary/10">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-3 text-lg font-bold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted">
        <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground">
            {"Por que elegirnos?"}
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Asesoramiento Tecnico",
                desc: "Nuestro equipo te ayuda a encontrar el producto exacto para tu vehiculo. No vendemos por vender, asesoramos para que elijas bien.",
              },
              {
                title: "Precios Competitivos",
                desc: "Trabajamos directo con fabricantes y distribuidores para ofrecerte los mejores precios del mercado sin resignar calidad.",
              },
              {
                title: "Envios a Todo el Pais",
                desc: "Realizamos envios a todas las provincias de Argentina. Tu pedido llega rapido y seguro a donde estes.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-border bg-card p-6"
              >
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
