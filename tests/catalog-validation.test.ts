import assert from "node:assert/strict"
import { test } from "node:test"
import { isServiceProduct, validateCatalogOrderItems } from "../lib/orders/catalog-validation"
import type { SerializedProduct } from "../lib/products/product-serialize"

function catalogProduct(overrides: Partial<SerializedProduct> = {}): SerializedProduct {
  return {
    id: 12,
    sku: "AMG-12",
    name: "Radiador",
    slug: "supabase-radiador",
    category: "Radiadores",
    stockType: "Radiador",
    stockCategory: null,
    stock: 3,
    price: 100,
    isActive: true,
    ...overrides,
  } as SerializedProduct
}

function requested(productId: number, quantity: number, sku = "AMG-12") {
  return { productId, productName: "Radiador", quantity, price: 100, sku }
}

test("usa el ID real de MySQL para productos actuales", () => {
  const result = validateCatalogOrderItems([requested(12, 1)], [catalogProduct()])
  assert.equal(result.invalid, false)
  assert.equal(result.insufficient, false)
  assert.equal(result.verifiedItems[0].product?.id, 12)
})

test("resuelve carritos anteriores por SKU sin confiar en el precio enviado", () => {
  const result = validateCatalogOrderItems([requested(-884, 1)], [catalogProduct({ price: 120 })])
  assert.equal(result.invalid, false)
  assert.equal(result.verifiedItems[0].product?.id, 12)
  assert.equal(result.verifiedItems[0].product?.price, 120)
})

test("un ID antiguo no puede reemplazar silenciosamente a un SKU distinto", () => {
  const result = validateCatalogOrderItems(
    [requested(12, 1, "AMG-99")],
    [catalogProduct(), catalogProduct({ id: 99, sku: "AMG-99", name: "Otro producto" })],
  )
  assert.equal(result.verifiedItems[0].product?.id, 99)
})

test("suma las cantidades repetidas antes de validar el stock", () => {
  const result = validateCatalogOrderItems(
    [requested(12, 2), requested(12, 2)],
    [catalogProduct({ stock: 3 })],
  )
  assert.equal(result.insufficient, true)
})

test("servicios no requieren stock físico", () => {
  const service = catalogProduct({ category: "Servicios", stock: 0 })
  assert.equal(isServiceProduct(service), true)
  const result = validateCatalogOrderItems([requested(12, 1)], [service])
  assert.equal(result.insufficient, false)
})

test("rechaza productos inexistentes o inactivos", () => {
  assert.equal(validateCatalogOrderItems([requested(999, 1, "desconocido")], [catalogProduct()]).invalid, true)
  assert.equal(validateCatalogOrderItems([requested(12, 1)], [catalogProduct({ isActive: false })]).invalid, true)
})
