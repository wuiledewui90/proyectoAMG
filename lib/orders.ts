export const ORDERS_STORAGE_KEY = "amg-orders"

export type StoredOrderStatus = "pendiente" | "confirmado" | "enviado" | "entregado"

export type StoredOrderItem = {
  productId: number
  productName: string
  quantity: number
  price: number
  sku?: string | null
  brand?: string | null
  model?: string | null
  category?: string | null
  compatibility?: string | null
}

export type StoredOrder = {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  address: string
  notes: string
  items: StoredOrderItem[]
  total: number
  status: StoredOrderStatus
  createdAt: string
  confirmedAt?: string
}
