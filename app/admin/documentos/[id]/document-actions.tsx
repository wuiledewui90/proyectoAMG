"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, FileCheck2, Pencil, Printer } from "lucide-react"

export function DocumentActions({ id, canConvert, canEdit }: { id: number; canConvert: boolean; canEdit: boolean }) {
  const router = useRouter()
  const [converting, setConverting] = useState(false)

  async function convert() {
    setConverting(true)
    const response = await fetch(`/api/admin/documents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "convert" }),
    })
    const data = await response.json()
    if (!response.ok) {
      setConverting(false)
      window.alert(data.error || "No se pudo convertir el presupuesto.")
      return
    }
    router.push(`/admin/documentos/${data.id}`)
    router.refresh()
  }

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
      <button onClick={() => router.push("/admin/documentos")} className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-semibold hover:bg-muted">
        <ArrowLeft className="h-4 w-4" /> Volver al módulo
      </button>
      <div className="flex gap-2">
        {canEdit && (
          <button onClick={() => router.push(`/admin/documentos?editar=${id}`)} className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-semibold hover:bg-muted">
            <Pencil className="h-4 w-4" /> Editar
          </button>
        )}
        {canConvert && (
          <button disabled={converting} onClick={() => void convert()} className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50">
            <FileCheck2 className="h-4 w-4" /> {converting ? "Convirtiendo…" : "Convertir a factura"}
          </button>
        )}
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          <Printer className="h-4 w-4" /> Imprimir / guardar PDF
        </button>
      </div>
    </div>
  )
}
