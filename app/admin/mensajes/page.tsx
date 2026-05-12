"use client"

import { useState } from "react"
import { Eye, X, Mail, MailOpen } from "lucide-react"
import { sampleMessages } from "@/lib/data"
import type { ContactMessage } from "@/lib/data"

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>(sampleMessages)
  const [selected, setSelected] = useState<ContactMessage | null>(null)

  function handleView(msg: ContactMessage) {
    setSelected(msg)
    if (!msg.read) {
      setMessages(
        messages.map((m) => (m.id === msg.id ? { ...m, read: true } : m))
      )
    }
  }

  return (
        <div className="mx-auto w-full max-w-7xl overflow-auto">
          <div className="border-b border-border bg-card px-6 py-4">
            <h1 className="text-xl font-bold text-foreground">
              Mensajes de Contacto
            </h1>
            <p className="text-sm text-muted-foreground">
              {messages.filter((m) => !m.read).length} sin leer de{" "}
              {messages.length} total
            </p>
          </div>

          <div className="p-6">
            {/* Detail */}
            {selected && (
              <div className="mb-6 rounded-lg border border-border bg-card p-6">
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
            <div className="rounded-lg border border-border bg-card">
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
          </div>
        </div>
  )
}
