import { z } from "zod"

const imageUrlSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || value.startsWith("/") || /^https?:\/\//i.test(value),
    "imageUrl debe ser URL o ruta relativa"
  )

export const productCreateSchema = z.object({
  slug: z.string().trim().min(1, "slug requerido"),
  name: z.string().trim().min(1, "name requerido"),
  description: z.string().trim().min(1).optional().or(z.literal("")),
  sku: z.string().trim().min(1).optional().or(z.literal("")),
  price: z.coerce.number().min(0, "price debe ser >= 0"),
  stock: z.coerce.number().int().min(0, "stock debe ser >= 0").default(0),
  isActive: z.coerce.boolean().default(true),
  brand: z.string().trim().min(1).optional().or(z.literal("")),
  model: z.string().trim().min(1).optional().or(z.literal("")),
  category: z.string().trim().min(1).optional().or(z.literal("")),
  compatibility: z.string().trim().min(1).optional().or(z.literal("")),
  images: z.array(z.string().trim().min(1)).optional(),
  imageUrl: imageUrlSchema.optional(),
})

export const productUpdateSchema = productCreateSchema.partial().extend({
  name: z.string().trim().min(1, "name requerido").optional(),
  slug: z.string().trim().min(1, "slug requerido").optional(),
})

export type ProductCreateInput = z.infer<typeof productCreateSchema>
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>

export const productListQuerySchema = z.object({
  search: z.string().trim().optional(),
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type ProductListQuery = z.infer<typeof productListQuerySchema>
