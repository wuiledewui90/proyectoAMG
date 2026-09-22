"use client"

import React, { useState } from "react"
import { Check, Send } from "lucide-react"

const fieldClassName = "min-h-12 w-full border-2 border-input bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-0"

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [honeypot, setHoneypot] = useState("")
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" })

  function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [event.target.name]: event.target.value })
    setErrors({ ...errors, [event.target.name]: "" })
  }

  function validate() {
    const nextErrors: Record<string, string> = {}
    if (!form.name.trim()) nextErrors.name = "El nombre es obligatorio"
    if (!form.email.trim()) nextErrors.email = "El email es obligatorio"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = "El email no es válido"
    if (!form.message.trim()) nextErrors.message = "El mensaje es obligatorio"
    return nextErrors
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (honeypot) return

    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const message = { id: `MSG-${Date.now()}`, ...form, createdAt: new Date().toISOString(), read: false }
    const existing = JSON.parse(localStorage.getItem("amg-messages") || "[]")
    existing.push(message)
    localStorage.setItem("amg-messages", JSON.stringify(existing))
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="flex min-h-[28rem] flex-col items-start justify-center border-l-4 border-primary bg-muted/55 p-8 sm:p-12">
        <div className="flex h-14 w-14 items-center justify-center bg-primary text-primary-foreground"><Check className="h-7 w-7" /></div>
        <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-primary">Consulta recibida</p>
        <h2 className="font-display mt-2 text-4xl font-black uppercase tracking-[-0.03em] text-foreground">Mensaje enviado.</h2>
        <p className="mt-4 max-w-md leading-7 text-muted-foreground">Gracias por contactarnos. Te responderemos a la brevedad.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border-b border-border pb-7">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Solicitar asesoramiento</p>
        <h2 className="font-display mt-3 text-3xl font-black uppercase tracking-[-0.025em] text-foreground sm:text-4xl">Dejanos tu consulta</h2>
      </div>

      <div className="sr-only" aria-hidden="true">
        <label htmlFor="website">Sitio web</label>
        <input id="website" name="website" type="text" value={honeypot} onChange={(event) => setHoneypot(event.target.value)} tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label htmlFor="contact-name" className="mb-2 block text-[0.7rem] font-black uppercase tracking-[0.16em] text-foreground">Nombre y apellido *</label>
        <input id="contact-name" name="name" type="text" value={form.name} onChange={handleChange} className={fieldClassName} placeholder="Tu nombre" />
        {errors.name && <p className="mt-2 text-xs font-semibold text-destructive">{errors.name}</p>}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="contact-email" className="mb-2 block text-[0.7rem] font-black uppercase tracking-[0.16em] text-foreground">Email *</label>
          <input id="contact-email" name="email" type="email" value={form.email} onChange={handleChange} className={fieldClassName} placeholder="tu@email.com" />
          {errors.email && <p className="mt-2 text-xs font-semibold text-destructive">{errors.email}</p>}
        </div>
        <div>
          <label htmlFor="contact-phone" className="mb-2 block text-[0.7rem] font-black uppercase tracking-[0.16em] text-foreground">Teléfono</label>
          <input id="contact-phone" name="phone" type="tel" value={form.phone} onChange={handleChange} className={fieldClassName} placeholder="380 000-0000" />
        </div>
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-2 block text-[0.7rem] font-black uppercase tracking-[0.16em] text-foreground">¿Qué necesitás? *</label>
        <textarea id="contact-message" name="message" rows={6} value={form.message} onChange={handleChange} className={fieldClassName} placeholder="Indicá vehículo, modelo, año y el problema o repuesto que buscás..." />
        {errors.message && <p className="mt-2 text-xs font-semibold text-destructive">{errors.message}</p>}
      </div>

      <button type="submit" className="group inline-flex min-h-10 items-center gap-2 border border-primary bg-primary px-5 text-xs font-black uppercase tracking-[0.15em] text-primary-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground">
        <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        Enviar consulta
      </button>
    </form>
  )
}
