/* eslint-disable @typescript-eslint/no-explicit-any */

export const documentTypeLabels = {
  QUOTE: "Presupuesto",
  QUOTATION: "Cotización",
  INVOICE: "Factura",
} as const

export const documentStatusLabels = {
  DRAFT: "Borrador",
  SENT: "Enviado",
  ACCEPTED: "Aceptado",
  REJECTED: "Rechazado",
  EXPIRED: "Vencido",
  ISSUED: "Emitida",
  PAID: "Pagada",
  VOID: "Anulada",
} as const

export const quoteStatuses = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"] as const
export const invoiceStatuses = ["DRAFT", "ISSUED", "PAID", "VOID"] as const

export function documentCode(type: keyof typeof documentTypeLabels, id: number) {
  const prefix = type === "QUOTE" ? "PRES" : type === "QUOTATION" ? "COT" : "FACT"
  return `${prefix}-${String(id).padStart(6, "0")}`
}

export function serializeDocument(document: any) {
  return {
    ...document,
    subtotal: Number(document.subtotal),
    discount: Number(document.discount),
    taxRate: Number(document.taxRate),
    taxAmount: Number(document.taxAmount),
    total: Number(document.total),
    items: (document.items || []).map((item: any) => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
    })),
  }
}
