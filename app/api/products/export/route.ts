import { NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session"
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

function getAdminTokenFromCookieHeader(req: Request) {
  return req.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_COOKIE_NAME}=`))
    ?.slice(`${ADMIN_COOKIE_NAME}=`.length)
}

function formulaCell(formula: string) {
  return { t: "n", v: 0, f: formula } as XLSX.CellObject
}

export async function GET(req: Request) {
  const token = getAdminTokenFromCookieHeader(req)
  if (!(await verifyAdminSessionToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

  const stockSheet = XLSX.utils.aoa_to_sheet(stockRows)
  stockSheet["!cols"] = [
    { wch: 22 },
    { wch: 52 },
    { wch: 13 },
    { wch: 23 },
    { wch: 16 },
    { wch: 25 },
    { wch: 28 },
    { wch: 18 },
    { wch: 18 },
    { wch: 10 },
    { wch: 10 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
  ]
  stockSheet["!autofilter"] = { ref: `A1:Q${lastProductRow}` }

  for (let row = 2; row <= totalsRow; row += 1) {
    for (const column of ["L", "M", "N", "P", "Q"]) {
      const cell = stockSheet[`${column}${row}`]
      if (cell) cell.z = '"$"#,##0'
    }
    const marginCell = stockSheet[`O${row}`]
    if (marginCell) marginCell.z = "0%"
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

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows)
  summarySheet["!cols"] = [{ wch: 30 }, { wch: 14 }, { wch: 14 }, { wch: 20 }]
  for (let row = 2; row <= summaryRows.length; row += 1) {
    const cell = summarySheet[`D${row}`]
    if (cell) cell.z = '"$"#,##0'
  }

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, stockSheet, "Stock")
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumen")
  workbook.Workbook = {
    CalcPr: { calcMode: "auto", calcOnSave: "1", fullCalcOnLoad: "1" },
  } as NonNullable<XLSX.WorkBook["Workbook"]> & {
    CalcPr: Record<string, string>
  }

  const bytes = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })
  const date = new Date().toISOString().slice(0, 10)

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="AMG_Stock_${date}.xlsx"`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  })
}
