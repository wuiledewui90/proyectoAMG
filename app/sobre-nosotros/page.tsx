import type { Metadata } from "next"
import { Award, Clock, Shield, Users } from "lucide-react"
import { Reveal } from "@/components/reveal"

export const metadata: Metadata = {
  title: "La empresa",
  description:
    "Más de 30 años de experiencia en radiadores y sistemas de enfriamiento automotor en La Rioja.",
}

const metrics = [
  { icon: Clock, title: "+30 años", desc: "de experiencia técnica" },
  { icon: Users, title: "Atención directa", desc: "con especialistas" },
  { icon: Shield, title: "Garantía", desc: "en productos y servicios" },
  { icon: Award, title: "Primeras marcas", desc: "nacionales e importadas" },
]

const reasons = [
  {
    title: "Asesoramiento técnico",
    desc: "Identificamos la aplicación correcta según vehículo, motorización y uso. No vendemos por vender.",
  },
  {
    title: "Soluciones comprobadas",
    desc: "Diagnosticamos antes de intervenir y verificamos presión y temperatura antes de entregar.",
  },
  {
    title: "Cobertura nacional",
    desc: "Enviamos repuestos a todo el país con la información necesaria para una compra segura.",
  },
]

export default function SobreNosotrosPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-[#090b0e] pb-20 pt-32 text-white sm:pb-24 sm:pt-40 lg:pb-28">
        <div className="technical-grid absolute inset-0 opacity-25" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-[90rem] items-end gap-10 px-5 sm:px-8 lg:grid-cols-12 lg:px-12 xl:px-16">
          <Reveal className="lg:col-span-8">
            <p className="mb-5 text-xs font-extrabold uppercase tracking-[0.22em] text-primary">Nuestra historia</p>
            <h1 className="font-display text-[clamp(1.8rem,4.2vw,4.2rem)] font-black uppercase leading-[0.9] tracking-[-0.055em]">
              Tres décadas cuidando motores.
            </h1>
          </Reveal>
          <Reveal delay={160} className="border-l border-white/18 pl-6 lg:col-span-4 lg:pl-8">
            <p className="text-lg leading-relaxed text-white/62">
              Nacimos en La Rioja con una idea simple: resolver cada problema de
              refrigeración con conocimiento, honestidad y precisión.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-background py-20 sm:py-24 lg:py-32">
        <div className="mx-auto grid max-w-[90rem] gap-14 px-5 sm:px-8 lg:grid-cols-12 lg:px-12 xl:px-16">
          <Reveal className="lg:col-span-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-primary">Experiencia aplicada</p>
            <h2 className="font-display mt-4 text-4xl font-black uppercase leading-[0.95] tracking-[-0.04em] sm:text-5xl">
              Conocemos el calor. Sabemos cómo controlarlo.
            </h2>
          </Reveal>
          <Reveal delay={120} className="space-y-5 text-base leading-relaxed text-muted-foreground lg:col-span-7 lg:text-lg">
            <p>
              Trabajamos con sistemas de enfriamiento de autos, camionetas,
              camiones y maquinaria. La experiencia nos permite reconocer el
              origen del problema y elegir una solución durable.
            </p>
            <p>
              Combinamos oficio con herramientas actuales: prueba de presión,
              limpieza técnica, reparación especializada y selección precisa de
              repuestos.
            </p>
            <p>
              Seguimos incorporando tecnología y ampliando el catálogo, sin perder
              el trato directo que construyó nuestra reputación.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-[#0a0c0f] py-20 text-white sm:py-24">
        <div className="mx-auto grid max-w-[90rem] gap-px bg-white/12 px-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-4 lg:px-12 xl:px-16">
          {metrics.map((item, index) => (
            <Reveal key={item.title} delay={index * 90} className="metal-surface p-7 sm:p-8">
              <item.icon className="h-5 w-5 text-primary" />
              <p className="font-display mt-8 text-2xl font-black uppercase tracking-[-0.025em]">{item.title}</p>
              <p className="mt-2 text-sm text-white/52">{item.desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-white py-20 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-[90rem] px-5 sm:px-8 lg:px-12 xl:px-16">
          <Reveal className="mb-12 border-b border-foreground/15 pb-7">
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-primary">Por qué elegirnos</p>
            <h2 className="font-display mt-4 text-4xl font-black uppercase tracking-[-0.04em] sm:text-5xl">Confianza que se construye trabajando.</h2>
          </Reveal>
          <div className="grid gap-px bg-foreground/12 md:grid-cols-3">
            {reasons.map((item, index) => (
              <Reveal key={item.title} delay={index * 100} className="bg-white p-7 sm:p-9">
                <span className="font-display text-4xl font-black text-primary/22">0{index + 1}</span>
                <h3 className="font-display mt-5 text-xl font-black uppercase">{item.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
