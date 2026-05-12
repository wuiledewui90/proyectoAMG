import type { CartItem } from "@/lib/cart-context"

export const COMPANY_WHATSAPP_NUMBER = "5493804524590"

export function getWhatsAppUrl(message: string) {
  return `https://wa.me/${COMPANY_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}

export function buildCheckoutWhatsAppMessage({
  address,
  email,
  items,
  name,
  notes,
  phone,
  totalPrice,
}: {
  address: string
  email: string
  items: CartItem[]
  name: string
  notes?: string
  phone: string
  totalPrice: number
}) {
  const productLines = items
    .map((item, index) => {
      const { product, quantity } = item
      const details = [
        product.sku ? `SKU: ${product.sku}` : null,
        product.brand ? `Marca: ${product.brand}` : null,
        product.model ? `Modelo: ${product.model}` : null,
        product.category ? `Categoria: ${product.category}` : null,
        product.compatibility ? `Compatibilidad: ${product.compatibility}` : null,
      ]
        .filter(Boolean)
        .join("\n")

      return [
        `${index + 1}. ${product.name}`,
        details,
        `Cantidad: ${quantity}`,
        `Precio unitario: ${formatWhatsAppPrice(product.price)}`,
        `Subtotal: ${formatWhatsAppPrice(product.price * quantity)}`,
      ]
        .filter(Boolean)
        .join("\n")
    })
    .join("\n\n")

  return [
    "Hola, quiero confirmar esta compra:",
    "",
    `Cliente: ${name}`,
    `Telefono: ${phone}`,
    `Email: ${email}`,
    `Direccion: ${address}`,
    notes?.trim() ? `Notas: ${notes.trim()}` : null,
    "",
    "Productos:",
    productLines,
    "",
    `Total: ${formatWhatsAppPrice(totalPrice)}`,
  ]
    .filter(Boolean)
    .join("\n")
}

function formatWhatsAppPrice(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value)
}
