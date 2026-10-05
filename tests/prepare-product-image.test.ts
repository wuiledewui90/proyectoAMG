import assert from "node:assert/strict"
import { test } from "node:test"
import sharp from "sharp"
import { InvalidProductImageError, prepareProductImage } from "../lib/products/prepare-product-image"

test("convierte una imagen grande a WebP y limita sus dimensiones", async () => {
  const source = await sharp({
    create: { width: 2400, height: 1200, channels: 3, background: "#a0b0c0" },
  }).png().toBuffer()

  const optimized = await prepareProductImage(source, "image/png")
  const metadata = await sharp(optimized).metadata()

  assert.equal(metadata.format, "webp")
  assert.equal(metadata.width, 1800)
  assert.equal(metadata.height, 900)
})

test("rechaza archivos cuyo contenido no coincide con el tipo declarado", async () => {
  const png = await sharp({
    create: { width: 10, height: 10, channels: 3, background: "#ffffff" },
  }).png().toBuffer()

  await assert.rejects(() => prepareProductImage(png, "image/jpeg"), InvalidProductImageError)
  await assert.rejects(() => prepareProductImage(Buffer.from("no es una imagen"), "image/png"), InvalidProductImageError)
})
