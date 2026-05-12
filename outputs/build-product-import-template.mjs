import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "D:/proyectoAMG/outputs";
const outputPath = `${outputDir}/plantilla-importacion-productos-amg.xlsx`;

const workbook = Workbook.create();
const products = workbook.worksheets.add("Productos");
const guide = workbook.worksheets.add("Guia");

products.showGridLines = false;
guide.showGridLines = false;

products.getRange("A1:L1").values = [[
  "nombre",
  "slug",
  "sku",
  "precio",
  "stock",
  "marca",
  "modelo",
  "categoria",
  "descripcion",
  "compatibilidad",
  "imagen",
  "activo",
]];

products.getRange("A2:L2").values = [[
  "Radiador VW Golf VII",
  "radiador-vw-golf-vii",
  "RM4678FA",
  190000,
  5,
  "Volkswagen",
  "Golf VII",
  "Radiadores",
  "Radiador para VW Golf VII, Vento, Virtus, Polo y TT.",
  "VW Golf VII / Vento / Virtus / Polo / TT",
  "https://ejemplo.com/imagen-producto.jpg",
  "si",
]];

products.getRange("A1:L1").format = {
  fill: "#111827",
  font: { bold: true, color: "#FFFFFF" },
  horizontalAlignment: "center",
};
products.getRange("A2:L2").format = {
  fill: "#F9FAFB",
  wrapText: true,
};
products.getRange("D2:D200").format.numberFormat = "$ #,##0";
products.getRange("E2:E200").format.numberFormat = "0";
products.getRange("A:L").format.columnWidthPx = 150;
products.getRange("I:J").format.columnWidthPx = 260;
products.getRange("K:K").format.columnWidthPx = 280;
products.getRange("A1:L200").format.wrapText = true;
products.freezePanes.freezeRows(1);
products.tables.add("A1:L2", true, "ProductosImportar");

guide.getRange("A1:D1").values = [["Campo", "Obligatorio", "Ejemplo", "Notas"]];
guide.getRange("A2:D13").values = [
  ["nombre", "Si", "Radiador VW Golf VII", "Nombre visible del producto. Si slug esta vacio, se genera desde este nombre."],
  ["slug", "No", "radiador-vw-golf-vii", "Identificador para la URL. Debe ser unico si lo completas."],
  ["sku", "Recomendado", "RM4678FA", "Codigo interno. Si ya existe, el importador actualiza ese producto."],
  ["precio", "Si", "190000", "Usar numeros. Acepta 190000, 190000.50 o 190.000,50."],
  ["stock", "Si", "5", "Cantidad disponible en inventario."],
  ["marca", "No", "Volkswagen", "Marca del vehiculo o producto."],
  ["modelo", "No", "Golf VII", "Modelo asociado."],
  ["categoria", "No", "Radiadores", "Categoria para ordenar y filtrar."],
  ["descripcion", "No", "Radiador para VW Golf VII...", "Texto descriptivo del producto."],
  ["compatibilidad", "No", "VW Golf VII / Vento", "Vehiculos o referencias compatibles."],
  ["imagen", "No", "https://ejemplo.com/imagen.jpg", "URL http/https o ruta relativa que empiece con /."],
  ["activo", "No", "si", "Usar si/no. Si queda vacio, se importa como activo."],
];
guide.getRange("A1:D1").format = {
  fill: "#0F766E",
  font: { bold: true, color: "#FFFFFF" },
};
guide.getRange("A2:D13").format = {
  fill: "#F9FAFB",
  wrapText: true,
};
guide.getRange("A:A").format.columnWidthPx = 140;
guide.getRange("B:B").format.columnWidthPx = 120;
guide.getRange("C:C").format.columnWidthPx = 210;
guide.getRange("D:D").format.columnWidthPx = 430;
guide.freezePanes.freezeRows(1);
guide.tables.add("A1:D13", true, "GuiaCampos");

await fs.mkdir(outputDir, { recursive: true });

const preview = await workbook.render({
  sheetName: "Productos",
  range: "A1:L2",
  scale: 1,
  format: "png",
});
await fs.writeFile(
  `${outputDir}/plantilla-importacion-productos-amg-preview.png`,
  new Uint8Array(await preview.arrayBuffer())
);

const exported = await SpreadsheetFile.exportXlsx(workbook);
await exported.save(outputPath);

console.log(outputPath);
