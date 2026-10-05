import sharp from "sharp"

const acceptedFormats: Record<string, "jpeg" | "png" | "webp"> = {
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
}

export class InvalidProductImageError extends Error {}

export async function prepareProductImage(input: Buffer, contentType: string) {
  const expectedFormat = acceptedFormats[contentType]
  if (!expectedFormat) {
    throw new InvalidProductImageError("Formato no soportado. Usá JPG, PNG o WebP.")
  }

  try {
    const source = sharp(input, { limitInputPixels: 40_000_000, failOn: "error" })
    const metadata = await source.metadata()
    if (metadata.format !== expectedFormat || !metadata.width || !metadata.height) {
      throw new InvalidProductImageError("La imagen no coincide con el formato declarado.")
    }

    const optimized = await source
      .rotate()
      .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 84, effort: 4 })
      .toBuffer()

    return optimized
  } catch (error) {
    if (error instanceof InvalidProductImageError) throw error
    throw new InvalidProductImageError("El archivo no es una imagen válida o excede el tamaño permitido.")
  }
}
