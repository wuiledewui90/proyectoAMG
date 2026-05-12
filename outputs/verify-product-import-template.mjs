import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const workbook = await SpreadsheetFile.importXlsx(
  await FileBlob.load("D:/proyectoAMG/outputs/plantilla-importacion-productos-amg.xlsx")
);

const products = await workbook.inspect({
  kind: "table",
  range: "Productos!A1:L2",
  include: "values",
  tableMaxRows: 4,
  tableMaxCols: 12,
});
console.log(products.ndjson);

const guide = await workbook.inspect({
  kind: "table",
  range: "Guia!A1:D13",
  include: "values",
  tableMaxRows: 14,
  tableMaxCols: 4,
});
console.log(guide.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 50 },
});
console.log(errors.ndjson);

await workbook.render({ sheetName: "Productos", range: "A1:L2", scale: 1, format: "png" });
await workbook.render({ sheetName: "Guia", range: "A1:D13", scale: 1, format: "png" });
