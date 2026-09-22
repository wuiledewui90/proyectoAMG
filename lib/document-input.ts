import { prisma } from "@/lib/db/prisma"

type LineInput = {
  productId?: unknown
  description?: unknown
  quantity?: unknown
  unitPrice?: unknown
}

function optionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function inputDate(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const parsed = new Date(`${value}T12:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export async function prepareDocumentInput(body: Record<string, unknown>) {
  const type =
    body.type === "INVOICE"
      ? "INVOICE"
      : body.type === "QUOTATION"
        ? "QUOTATION"
        : body.type === "QUOTE"
          ? "QUOTE"
          : null
  if (!type) return { error: "Seleccioná presupuesto, cotización o factura." } as const

  const rawItems = Array.isArray(body.items) ? (body.items as LineInput[]) : []
  if (!rawItems.length || rawItems.length > 100) {
    return { error: "Agregá entre 1 y 100 ítems." } as const
  }

  const items = rawItems.map((item) => ({
    productId:
      item.productId !== "" && item.productId !== null && item.productId !== undefined && Number.isInteger(Number(item.productId))
        ? Number(item.productId)
        : null,
    description: optionalText(item.description) || "",
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
  }))
  if (
    items.some(
      (item) =>
        !item.description ||
        item.description.length > 255 ||
        !Number.isFinite(item.quantity) ||
        item.quantity <= 0 ||
        !Number.isFinite(item.unitPrice) ||
        item.unitPrice < 0
    )
  ) {
    return { error: "Revisá la descripción, cantidad y precio de los ítems." } as const
  }

  const productIds = items.flatMap((item) => (item.productId ? [item.productId] : []))
  if (productIds.length) {
    const validProductCount = await prisma.product.count({ where: { id: { in: productIds } } })
    if (validProductCount !== new Set(productIds).size) {
      return { error: "Uno de los productos seleccionados ya no existe." } as const
    }
  }

  const customerId =
    body.customerId !== "" && body.customerId !== null && body.customerId !== undefined && Number.isInteger(Number(body.customerId))
      ? Number(body.customerId)
      : null
  const customer = customerId
    ? await prisma.customer.findFirst({ where: { id: customerId, active: true } })
    : null
  if (customerId && !customer) {
    return { error: "El cliente seleccionado ya no está disponible." } as const
  }

  const enteredCustomerName = optionalText(body.customerName)
  const customerName = enteredCustomerName || customer?.name || "Consumidor final"
  if (enteredCustomerName && (enteredCustomerName.length < 2 || enteredCustomerName.length > 160)) {
    return { error: "Ingresá un nombre de cliente válido." } as const
  }

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const requestedDiscount = Number(body.discount || 0)
  const discount = Number.isFinite(requestedDiscount) ? Math.min(Math.max(requestedDiscount, 0), subtotal) : 0
  const requestedTaxRate = Number(body.taxRate || 0)
  const taxRate = Number.isFinite(requestedTaxRate) ? Math.min(Math.max(requestedTaxRate, 0), 100) : 0
  const taxableAmount = subtotal - discount
  const taxAmount = taxableAmount * (taxRate / 100)

  return {
    data: {
      type,
      customerId: customer?.id || null,
      customerName,
      customerTaxId: optionalText(body.customerTaxId) || customer?.taxId || null,
      customerPhone: optionalText(body.customerPhone) || customer?.phone || null,
      customerEmail: optionalText(body.customerEmail) || customer?.email || null,
      customerAddress: optionalText(body.customerAddress) || customer?.address || null,
      vehicleDescription: optionalText(body.vehicleDescription),
      vehiclePlate: optionalText(body.vehiclePlate)?.toUpperCase() || customer?.vehiclePlate || null,
      issueDate: inputDate(body.issueDate) || new Date(),
      validUntil: type !== "INVOICE" ? inputDate(body.validUntil) : null,
      dueDate: type === "INVOICE" ? inputDate(body.dueDate) : null,
      subtotal,
      discount,
      taxRate,
      taxAmount,
      total: taxableAmount + taxAmount,
      notes: optionalText(body.notes),
      terms: optionalText(body.terms),
    },
    items: items.map((item) => ({ ...item, subtotal: item.quantity * item.unitPrice })),
  } as const
}
