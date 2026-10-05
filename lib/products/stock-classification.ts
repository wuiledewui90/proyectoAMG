export function isServiceProduct(product: {
  stockType?: string | null
  category?: string | null
  stockCategory?: string | null
}) {
  const text = `${product.stockType || ""} ${product.category || ""} ${product.stockCategory || ""}`.toLocaleLowerCase("es")
  return text.includes("servicio") || text.includes("mano de obra")
}
