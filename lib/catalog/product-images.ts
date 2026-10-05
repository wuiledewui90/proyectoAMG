import { PRODUCT_IMAGE_STEM_SET } from "@/lib/catalog/product-image-manifest"

function imageStem(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .replace(/[^A-Za-z0-9._-]/g, "_")
    .toLowerCase()
}

export function resolveCatalogProductImages(
  ...identifiers: Array<string | null | undefined>
) {
  const stem = identifiers
    .map(imageStem)
    .find((candidate) => candidate && PRODUCT_IMAGE_STEM_SET.has(candidate))

  if (!stem) {
    return { images: [] as string[], imageUrl: null, thumbnailUrl: undefined }
  }

  const imageUrl = `/images/catalog-products/${stem}.jpg`
  return {
    images: [imageUrl],
    imageUrl,
    thumbnailUrl: `/images/catalog-products/t/${stem}.jpg`,
  }
}
