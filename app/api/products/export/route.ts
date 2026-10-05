import { NextResponse } from "next/server"
import ExcelJS from "exceljs"
import { getRequestAdminSession } from "@/lib/admin-request"
import { prisma } from "@/lib/db/prisma"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const runtime = "nodejs"

const stockHeaders = [
  "Código",
  "Descripción",
  "Tipo",
  "Categoría",
  "Marca",
  "Marcas",
  "Aplicación",
  "Medidas",
  "Ubicación",
  "Stock",
  "Mínimo",
  "Costo",
  "Contado",
  "6 cuotas de",
  "Margen",
  "Valor a costo",
  "Valor de venta",
]

function formulaCell(formula: string): ExcelJS.CellFormulaValue {
  return { formula, result: 0 }
}

export async function GET(req: Request) {
  if ((await getRequestAdminSession(req))?.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo un administrador puede exportar costos." }, { status: 403 })
  }

  const products = await prisma.product.findMany({
    orderBy: [{ stockType: "asc" }, { stockCategory: "asc" }, { name: "asc" }],
  })

  const stockRows: unknown[][] = [stockHeaders]

  products.forEach((product, index) => {
    const excelRow = index + 2
    const type = product.stockType || (product.category === "Radiadores" ? "radiador" : "repuesto")

    stockRows.push([
      product.sku ?? "",
      product.name,
      type,
      product.stockCategory ?? product.category ?? "",
      product.brand ?? "",
      product.brands ?? product.brand ?? "",
      product.application ?? product.model ?? "",
      product.dimensions ?? "",
      product.location ?? "",
      product.stock,
      product.minimumStock,
      Number(product.cost),
      Number(product.price),
      formulaCell(`ROUND(M${excelRow}*1.3/6,0)`),
      formulaCell(`IFERROR(M${excelRow}/L${excelRow}-1,"")`),
      formulaCell(`J${excelRow}*L${excelRow}`),
      formulaCell(`J${excelRow}*M${excelRow}`),
    ])
  })

  const totalsRow = products.length + 2
  const lastProductRow = Math.max(2, totalsRow - 1)
  stockRows.push([
    "TOTALES",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    formulaCell(`SUM(J2:J${lastProductRow})`),
    "",
    "",
    "",
    "",
    "",
    formulaCell(`SUM(P2:P${lastProductRow})`),
    formulaCell(`SUM(Q2:Q${lastProductRow})`),
  ])

  const workbook = new ExcelJS.Workbook()
  workbook.creator = "Radiadores AMG"
  workbook.created = new Date()
  workbook.calcProperties.fullCalcOnLoad = true
  const stockSheet = workbook.addWorksheet("Stock", {
    views: [{ state: "frozen", ySplit: 1 }],
  })
  stockSheet.addRows(stockRows)
  ;[22, 52, 13, 23, 16, 25, 28, 18, 18, 10, 10, 15, 15, 15, 12, 18, 18]
    .forEach((width, index) => {
      stockSheet.getColumn(index + 1).width = width
    })
  stockSheet.autoFilter = { from: "A1", to: `Q${lastProductRow}` }
  stockSheet.getRow(1).font = { bold: true }

  for (let row = 2; row <= totalsRow; row += 1) {
    for (const column of ["L", "M", "N", "P", "Q"]) {
      stockSheet.getCell(`${column}${row}`).numFmt = '"$"#,##0'
    }
    stockSheet.getCell(`O${row}`).numFmt = "0%"
  }

  const categoryNames = Array.from(
    new Set(products.map((product) => product.stockCategory).filter((value): value is string => Boolean(value)))
  ).sort((a, b) => a.localeCompare(b, "es"))

  const summaryRows: unknown[][] = [
    ["Categoría", "Productos", "Unidades", "Valor de venta"],
    [
      "Radiadores",
      formulaCell(`COUNTIF(Stock!C2:C${lastProductRow},"radiador")`),
      formulaCell(`SUMIF(Stock!C2:C${lastProductRow},"radiador",Stock!J2:J${lastProductRow})`),
      formulaCell(`SUMIF(Stock!C2:C${lastProductRow},"radiador",Stock!Q2:Q${lastProductRow})`),
    ],
    [
      "Repuestos (total)",
      formulaCell(`COUNTIF(Stock!C2:C${lastProductRow},"repuesto")`),
      formulaCell(`SUMIF(Stock!C2:C${lastProductRow},"repuesto",Stock!J2:J${lastProductRow})`),
      formulaCell(`SUMIF(Stock!C2:C${lastProductRow},"repuesto",Stock!Q2:Q${lastProductRow})`),
    ],
    ...categoryNames.map((category) => [
      `    ${category}`,
      formulaCell(`COUNTIF(Stock!D2:D${lastProductRow},${JSON.stringify(category)})`),
      formulaCell(`SUMIF(Stock!D2:D${lastProductRow},${JSON.stringify(category)},Stock!J2:J${lastProductRow})`),
      formulaCell(`SUMIF(Stock!D2:D${lastProductRow},${JSON.stringify(category)},Stock!Q2:Q${lastProductRow})`),
    ]),
    [
      "Servicios",
      formulaCell(`COUNTIF(Stock!C2:C${lastProductRow},"servicio")`),
      formulaCell(`SUMIF(Stock!C2:C${lastProductRow},"servicio",Stock!J2:J${lastProductRow})`),
      formulaCell(`SUMIF(Stock!C2:C${lastProductRow},"servicio",Stock!Q2:Q${lastProductRow})`),
    ],
    [
      "TOTAL",
      formulaCell(`COUNTA(Stock!A2:A${lastProductRow})`),
      formulaCell(`SUM(Stock!J2:J${lastProductRow})`),
      formulaCell(`SUM(Stock!Q2:Q${lastProductRow})`),
    ],
  ]

  const summarySheet = workbook.addWorksheet("Resumen")
  summarySheet.addRows(summaryRows)
  ;[30, 14, 14, 20].forEach((width, index) => {
    summarySheet.getColumn(index + 1).width = width
  })
  summarySheet.getRow(1).font = { bold: true }
  for (let row = 2; row <= summaryRows.length; row += 1) {
    summarySheet.getCell(`D${row}`).numFmt = '"$"#,##0'
  }

  const bytes = await workbook.xlsx.writeBuffer()
  const date = new Date().toISOString().slice(0, 10)

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="AMG_Stock_${date}.xlsx"`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  })
}
