import "server-only"

import { prisma } from "@/lib/db/prisma"
import { argentinaDate } from "@/lib/cash"
import { isServiceProduct } from "@/lib/products/stock-classification"

function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export async function getInventoryAnalytics() {
  const monthStart = new Date(`${argentinaDate().slice(0, 7)}-01T00:00:00-03:00`)
  const [products, saleItems, recentMovements] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true, name: true, sku: true, category: true,
        stock: true, minimumStock: true, cost: true, price: true,
        stockType: true, stockCategory: true,
      },
    }),
    prisma.erpSaleItem.findMany({
      where: { sale: { status: "COMPLETED", createdAt: { gte: monthStart } } },
      select: {
        productId: true, quantity: true, subtotal: true,
        unitCost: true, isStockItem: true,
        sale: { select: { subtotal: true, discount: true } },
      },
    }),
    prisma.stockMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true, type: true, quantity: true, previousStock: true, newStock: true,
        notes: true, createdAt: true,
        product: { select: { name: true, sku: true } },
      },
    }),
  ])

  let units = 0
  let investment = 0
  let potentialRevenue = 0
  let missingCostUnits = 0
  let lowStock = 0
  let outOfStock = 0
  const missingCost: Array<{ id: number; name: string; sku: string | null; stock: number }> = []
  const byCategory = new Map<string, { investment: number; units: number }>()

  const stockProducts = products.filter((product) => !isServiceProduct(product))
  for (const product of stockProducts) {
    units += product.stock
    if (product.stock === 0) outOfStock += 1
    else if (product.minimumStock > 0 && product.stock <= product.minimumStock) lowStock += 1

    const cost = Number(product.cost)
    if (cost <= 0) {
      missingCost.push({ id: product.id, name: product.name, sku: product.sku, stock: product.stock })
      missingCostUnits += product.stock
      continue
    }

    const category = product.category?.trim() || "Sin categoría"
    const invested = product.stock * cost
    investment += invested
    potentialRevenue += product.stock * Number(product.price)
    const current = byCategory.get(category) || { investment: 0, units: 0 }
    current.investment += invested
    current.units += product.stock
    byCategory.set(category, current)
  }

  let soldProductRevenue = 0
  let soldProductCost = 0
  let uncostedSaleLines = 0
  let legacySaleLines = 0
  for (const item of saleItems) {
    if (item.isStockItem === null) {
      if (item.productId) legacySaleLines += 1
      continue
    }
    if (!item.isStockItem) continue
    if (item.unitCost === null) {
      uncostedSaleLines += 1
      continue
    }

    const subtotal = Number(item.sale.subtotal)
    const discountFactor = subtotal > 0
      ? Math.max(0, 1 - Number(item.sale.discount) / subtotal)
      : 1
    soldProductRevenue += Number(item.subtotal) * discountFactor
    soldProductCost += Number(item.unitCost) * item.quantity
  }

  return {
    activeProducts: stockProducts.length,
    units,
    lowStock,
    outOfStock,
    missingCostProducts: missingCost.length,
    missingCostUnits,
    missingCost: missingCost.slice(0, 8),
    investment: money(investment),
    potentialRevenue: money(potentialRevenue),
    potentialGrossProfit: money(potentialRevenue - investment),
    potentialMarginPercent: potentialRevenue > 0
      ? money((potentialRevenue - investment) / potentialRevenue * 100)
      : 0,
    byCategory: [...byCategory.entries()]
      .map(([name, data]) => ({ name, investment: money(data.investment), units: data.units }))
      .sort((a, b) => b.investment - a.investment)
      .slice(0, 6),
    recentMovements: recentMovements.map((movement) => ({
      ...movement,
      createdAt: movement.createdAt.toISOString(),
    })),
    month: {
      revenueWithKnownCost: money(soldProductRevenue),
      costOfGoodsSold: money(soldProductCost),
      grossProfit: money(soldProductRevenue - soldProductCost),
      uncostedSaleLines,
      legacySaleLines,
    },
  }
}
