import { copyFile, mkdir, readdir, writeFile } from "node:fs/promises"
import path from "node:path"

const sourceRoot = path.resolve(
  process.argv[2] ??
    "C:/Users/LAPASYSTEMS/Downloads/amg-stock-netlify/fotos",
)
const projectRoot = process.cwd()
const destinationRoot = path.join(projectRoot, "public", "images", "catalog-products")
const destinationThumbs = path.join(destinationRoot, "t")
const manifestPath = path.join(projectRoot, "lib", "catalog", "product-image-manifest.ts")

async function jpgNames(directory) {
  return (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && /\.jpe?g$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }))
}

const fullImages = await jpgNames(sourceRoot)
const thumbsRoot = path.join(sourceRoot, "t")
const thumbnailImages = await jpgNames(thumbsRoot)

await mkdir(destinationRoot, { recursive: true })
await mkdir(destinationThumbs, { recursive: true })
await mkdir(path.dirname(manifestPath), { recursive: true })

for (const name of fullImages) {
  await copyFile(path.join(sourceRoot, name), path.join(destinationRoot, name.toLowerCase()))
}

for (const name of thumbnailImages) {
  await copyFile(path.join(thumbsRoot, name), path.join(destinationThumbs, name.toLowerCase()))
}

const stems = fullImages.map((name) => path.parse(name).name.toLowerCase())
const manifest = `// Archivo generado por scripts/import-amg-catalog-images.mjs.\n` +
  `// No editar manualmente: contiene los nombres disponibles en el catálogo original.\n` +
  `export const PRODUCT_IMAGE_STEMS = ${JSON.stringify(stems, null, 2)} as const\n` +
  `export const PRODUCT_IMAGE_STEM_SET: ReadonlySet<string> = new Set(PRODUCT_IMAGE_STEMS)\n`

await writeFile(manifestPath, manifest, "utf8")

console.log(`Imported ${fullImages.length} full images and ${thumbnailImages.length} thumbnails.`)
