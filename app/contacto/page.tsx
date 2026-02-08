import type { Metadata } from "next"
import { ContactForm } from "./contact-form"
import { Phone, Mail, MapPin, Clock } from "lucide-react"

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Contacta a RADIADORES AMG. Envianos tu consulta o visitanos en Buenos Aires.",
}

export default function ContactoPage() {
  return (
    <>
      <section className="bg-secondary">
        <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
          <h1 className="text-3xl font-bold text-secondary-foreground md:text-4xl">
            Contacto
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-secondary-foreground/70">
            Envianos tu consulta y te respondemos a la brevedad. Tambien podes
            escribirnos directamente por WhatsApp.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          <ContactForm />

          <div>
            <h2 className="text-xl font-bold text-foreground">
              Informacion de Contacto
            </h2>
            <div className="mt-6 space-y-5">
              {[
                {
                  icon: Phone,
                  title: "Telefono / WhatsApp",
                  value: "+54 11 0000-0000",
                  href: "https://wa.me/5491100000000",
                },
                {
                  icon: Mail,
                  title: "Email",
                  value: "info@radiadoresamg.com.ar",
                  href: "mailto:info@radiadoresamg.com.ar",
                },
                {
                  icon: MapPin,
                  title: "Direccion",
                  value: "Buenos Aires, Argentina",
                  href: undefined,
                },
                {
                  icon: Clock,
                  title: "Horarios",
                  value: "Lun-Vie 8:00-18:00 | Sab 8:00-13:00",
                  href: undefined,
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {item.title}
                    </p>
                    {item.href ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {item.value}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <a
                href="https://wa.me/5491100000000"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Escribir por WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
