import type { StoredOrderItem } from "@/lib/orders"
import type { SerializedProduct } from "@/lib/products/product-serialize"

function normalized(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
}

export function isServiceProduct(product: Pick<SerializedProduct, "category" | "stockType" | "stockCategory">) {
  const description = normalized(
    `${product.category || ""} ${product.stockType || ""} ${product.stockCategory || ""}`,
  )
  return description.includes("servicio") || description.includes("mano de obra")
}

export function validateCatalogOrderItems(
  items: StoredOrderItem[],
  catalog: SerializedProduct[],
) {
  const byId = new Map(catalog.map((product) => [product.id, product]))
  const bySku = new Map(
    catalog
      .filter((product) => product.sku)
      .map((product) => [normalized(product.sku), product]),
  )
  const verifiedItems = items.map((item) => {
    const byIdProduct = byId.get(item.productId)
    const product = byIdProduct && (!item.sku || normalized(byIdProduct.sku) === normalized(item.sku))
      ? byIdProduct
      : bySku.get(normalized(item.sku))
    return { item, product }
  })

  const invalid = verifiedItems.some(({ product }) => !product || !product.isActive)
  const demand = new Map<number, number>()
  for (const { item, product } of verifiedItems) {
    if (!product || isServiceProduct(product)) continue
    demand.set(product.id, (demand.get(product.id) || 0) + item.quantity)
  }
  const insufficient = [...demand].some(([id, quantity]) => quantity > (byId.get(id)?.stock || 0))

  return { verifiedItems, invalid, insufficient }
}
