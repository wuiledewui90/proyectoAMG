import { mkdir } from "node:fs/promises"
import { basename, dirname, extname, resolve } from "node:path"
import sharp from "sharp"

const [, , inputArgument, outputArgument] = process.argv

if (!inputArgument) {
  console.error("Uso: npm run images:webp -- <imagen-entrada> [imagen-salida.webp]")
  process.exit(1)
}

const inputPath = resolve(inputArgument)
const parsedWidth = Number(process.env.WEBP_WIDTH ?? 1600)
const parsedQuality = Number(process.env.WEBP_QUALITY ?? 82)
const inputExtension = extname(inputPath)
const defaultOutputName = `${basename(inputPath, inputExtension)}.webp`
const outputPath = resolve(outputArgument ?? resolve(dirname(inputPath), defaultOutputName))

if (!Number.isFinite(parsedWidth) || parsedWidth <= 0) {
  throw new Error("WEBP_WIDTH debe ser un número mayor que cero.")
}

if (!Number.isFinite(parsedQuality) || parsedQuality < 1 || parsedQuality > 100) {
  throw new Error("WEBP_QUALITY debe estar entre 1 y 100.")
}

await mkdir(dirname(outputPath), { recursive: true })

const result = await sharp(inputPath)
  .rotate()
  .resize({ width: parsedWidth, withoutEnlargement: true })
  .webp({ quality: parsedQuality, alphaQuality: 90, effort: 6 })
  .toFile(outputPath)

console.log(`WebP creado: ${outputPath} (${result.width}x${result.height}, ${result.size} bytes)`)
