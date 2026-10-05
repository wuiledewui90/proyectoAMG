"use client"

import { useEffect, useState } from "react"
import { CalendarDays, ChevronRight, Eye, X, Mail, MailCheck, MailOpen, MailWarning, MessagesSquare, Phone, PhoneCall, UserRound } from "lucide-react"
import { sampleMessages } from "@/lib/data"
import type { ContactMessage } from "@/lib/data"
import { AdminMobileMetrics } from "@/components/admin-mobile-metrics"

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>(sampleMessages)
  const [selected, setSelected] = useState<ContactMessage | null>(null)
  const unreadCount = messages.filter((message) => !message.read).length
  const readCount = messages.length - unreadCount
  const readRate = messages.length ? Math.round((readCount / messages.length) * 100) : 0
  const contactableCount = messages.filter((message) => Boolean(message.phone)).length

  function handleView(msg: ContactMessage) {
    setSelected(msg)
    if (!msg.read) {
      setMessages(
        messages.map((m) => (m.id === msg.id ? { ...m, read: true } : m))
      )
    }
  }

  useEffect(() => {
    if (!selected) return

    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null)
    }
    const isMobile = window.matchMedia("(max-width: 1023px)").matches
    const previousOverflow = document.body.style.overflow

    if (isMobile) document.body.style.overflow = "hidden"
    window.addEventListener("keydown", closeWithEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", closeWithEscape)
    }
  }, [selected])

  return (
        <div className="mx-auto w-full max-w-7xl overflow-auto">
          <div className="border-b border-border bg-card px-6 py-4">
            <h1 className="text-xl font-bold text-foreground">
              Mensajes de Contacto
            </h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount} sin leer de{" "}
              {messages.length} total
            </p>
          </div>

          <div className="p-6">
            <div className="mb-4">
              <AdminMobileMetrics items={[
                { label: "Mensajes", value: messages.length, detail: "Total recibido", icon: MessagesSquare, tone: "blue" },
                { label: "Sin leer", value: unreadCount, detail: "Requieren revisión", icon: MailWarning, tone: "amber" },
                { label: "Leídos", value: `${readRate}%`, detail: `${readCount} revisados`, icon: MailCheck, tone: "emerald" },
                { label: "Con teléfono", value: contactableCount, detail: "Contacto directo", icon: PhoneCall, tone: "violet" },
              ]} />
            </div>
            {/* Detail */}
            {selected && (
              <div className="mb-6 hidden rounded-lg border border-border bg-card p-6 lg:block">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">
                    Mensaje de {selected.name}
                  </h2>
                  <button
                    onClick={() => setSelected(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
                    aria-label="Cerrar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium text-foreground">
                      {selected.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Telefono</p>
                    <p className="text-sm font-medium text-foreground">
                      {selected.phone || "No proporcionado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fecha</p>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(selected.createdAt).toLocaleDateString(
                        "es-AR",
                        {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                </div>
                <div className="mt-4 rounded-md bg-muted/50 p-4">
                  <p className="text-sm leading-relaxed text-foreground">
                    {selected.message}
                  </p>
                </div>
              </div>
            )}

            {/* Messages list */}
            <div className="hidden rounded-lg border border-border bg-card lg:block">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="w-10 px-4 py-3" />
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Nombre
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Mensaje
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages.map((msg) => (
                      <tr
                        key={msg.id}
                        className={`border-b border-border last:border-0 ${
                          !msg.read ? "bg-primary/5" : ""
                        }`}
                      >
                        <td className="px-4 py-3 text-center">
                          {msg.read ? (
                            <MailOpen className="mx-auto h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Mail className="mx-auto h-4 w-4 text-primary" />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              msg.read
                                ? "text-muted-foreground"
                                : "font-semibold text-foreground"
                            }
                          >
                            {msg.name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {msg.email}
                        </td>
                        <td className="max-w-xs truncate px-4 py-3 text-muted-foreground">
                          {msg.message}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(msg.createdAt).toLocaleDateString("es-AR")}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleView(msg)}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                            aria-label={`Ver mensaje de ${msg.name}`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-3 lg:hidden">
              {messages.map((msg) => (
                <button
                  key={msg.id}
                  type="button"
                  onClick={() => handleView(msg)}
                  className={`admin-mobile-message-card w-full rounded-[22px] border p-4 text-left shadow-[0_12px_34px_rgba(15,23,42,.07)] transition active:scale-[.985] ${
                    msg.read
                      ? "border-slate-200/80 bg-white/90"
                      : "border-blue-200 bg-blue-50/90"
                  }`}
                  aria-label={`Ver información completa del mensaje de ${msg.name}`}
                >
                  <span className="flex items-start gap-3">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${msg.read ? "bg-slate-100 text-slate-500" : "bg-blue-600 text-white"}`}>
                      {msg.read ? <MailOpen className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block break-words text-[15px] font-semibold leading-snug text-slate-900">
                        {msg.name}
                      </span>
                      <span className="mt-0.5 block break-all text-xs text-slate-500">
                        {msg.email}
                      </span>
                    </span>
                    <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                  </span>
                  <span className="mt-3 line-clamp-2 block text-sm leading-relaxed text-slate-600">
                    {msg.message}
                  </span>
                  <span className="mt-3 flex items-center justify-between gap-3 border-t border-slate-200/70 pt-3">
                    <span className="text-[11px] font-medium text-slate-400">
                      {new Date(msg.createdAt).toLocaleDateString("es-AR")}
                    </span>
                    <span className="text-[11px] font-semibold text-blue-600">Ver mensaje completo</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {selected && (
            <div
              className="admin-mobile-message-backdrop fixed inset-0 z-[80] hidden items-end bg-slate-950/55 p-3 backdrop-blur-sm lg:hidden"
              role="presentation"
              onClick={() => setSelected(null)}
            >
              <section
                className="admin-mobile-message-modal max-h-[min(82dvh,720px)] w-full overflow-y-auto rounded-[28px] border border-white/80 bg-white p-5 text-slate-900 shadow-[0_28px_80px_rgba(2,8,23,.36)]"
                role="dialog"
                aria-modal="true"
                aria-labelledby="mobile-message-title"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-200" aria-hidden="true" />
                <header className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600">Mensaje recibido</p>
                    <h2 id="mobile-message-title" className="mt-1 break-words text-xl font-semibold tracking-[-0.025em] text-slate-950">
                      {selected.name}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition active:scale-95"
                    aria-label="Cerrar detalle del mensaje"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </header>

                <div className="mt-5 grid gap-2.5">
                  <MessageDetail icon={UserRound} label="Nombre" value={selected.name} />
                  <MessageDetail icon={Mail} label="Correo electrónico" value={selected.email} breakAll />
                  <MessageDetail icon={Phone} label="Teléfono" value={selected.phone || "No proporcionado"} />
                  <MessageDetail
                    icon={CalendarDays}
                    label="Fecha"
                    value={new Date(selected.createdAt).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  />
                </div>

                <div className="mt-4 rounded-[20px] bg-slate-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Mensaje completo</p>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                    {selected.message}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="mt-5 min-h-12 w-full rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition active:scale-[.985]"
                >
                  Cerrar
                </button>
              </section>
            </div>
          )}
        </div>
  )
}

function MessageDetail({
  icon: Icon,
  label,
  value,
  breakAll = false,
}: {
  icon: typeof Mail
  label: string
  value: string
  breakAll?: boolean
}) {
  return (
    <div className="flex items-start gap-3 rounded-[18px] border border-slate-200/80 bg-white p-3.5 shadow-sm">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
        <p className={`mt-0.5 text-sm font-semibold leading-snug text-slate-800 ${breakAll ? "break-all" : "break-words"}`}>
          {value}
        </p>
      </div>
    </div>
  )
}
