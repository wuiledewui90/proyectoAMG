"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, FileCheck2, Pencil, Printer, Trash2 } from "lucide-react"

export function DocumentActions({ id, canConvert, canEdit, canDelete }: { id: number; canConvert: boolean; canEdit: boolean; canDelete: boolean }) {
  const router = useRouter()
  const [converting, setConverting] = useState(false)
  const [deleting, setDeleting] = useState(false)

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

  async function remove() {
    const confirmed = window.confirm(
      "¿Eliminar definitivamente este comprobante?\n\nSe eliminarán también todos sus ítems. Esta acción no se puede deshacer."
    )
    if (!confirmed) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/documents/${id}`, { method: "DELETE" })
      const data = (await response.json().catch(() => null)) as { error?: string } | null
      if (!response.ok) {
        window.alert(data?.error || "No se pudo eliminar el comprobante.")
        return
      }
      router.push("/admin/documentos")
      router.refresh()
    } catch {
      window.alert("No se pudo conectar con el servidor para eliminar el comprobante.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
      <button onClick={() => router.push("/admin/documentos")} className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-semibold hover:bg-muted">
        <ArrowLeft className="h-4 w-4" /> Volver al módulo
      </button>
      <div className="flex gap-2">
        {canDelete ? (
          <button
            disabled={deleting}
            onClick={() => void remove()}
            className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-background px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" /> {deleting ? "Eliminando…" : "Eliminar borrador"}
          </button>
        ) : (
          <span className="inline-flex items-center rounded-md bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
            Documento contable: conservar o anular
          </span>
        )}
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
