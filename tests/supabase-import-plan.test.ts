import assert from "node:assert/strict"
import { test } from "node:test"
import {
  buildSupabaseImportPlan,
  type SupabaseImportProduct,
} from "../lib/products/supabase-import-plan"

function product(overrides: Partial<SupabaseImportProduct> = {}): SupabaseImportProduct {
  return {
    id: "supabase-1",
    clave: "CL-1",
    codigo: "AMG-1",
    descripcion: "Radiador de prueba",
    marca: "AMG",
    aplicacion: "Auto",
    medidas: "30 x 40",
    ubicacion: "A1",
    stock: 4,
    minimo: 1,
    costo: "120",
    venta: "180",
    notas: null,
    serv: false,
    tipo: "radiador",
    categoria: null,
    marcas: ["AMG"],
    imageUrl: "https://example.supabase.co/storage/v1/object/public/fotos/AMG-1.webp",
    ...overrides,
  }
}

test("agrega el producto faltante con SKU, precio, stock e imagen", () => {
  const plan = buildSupabaseImportPlan([product()], [])
  assert.equal(plan.total, 1)
  assert.equal(plan.toCreate, 1)
  assert.equal(plan.withImage, 1)
  assert.equal(plan.conflicts.length, 0)
  assert.equal(plan.candidates[0].sku, "AMG-1")
  assert.equal(plan.candidates[0].price, 180)
  assert.equal(plan.candidates[0].stock, 4)
  assert.equal(plan.candidates[0].imageUrl, product().imageUrl)
})

test("omite los existentes sin alterar sus valores, incluso si coinciden por clave", () => {
  const existing = [{ id: 7, sku: "cl-1", slug: "radiador-antiguo" }]
  const plan = buildSupabaseImportPlan([product()], existing)
  assert.equal(plan.alreadyPresent, 1)
  assert.equal(plan.toCreate, 0)
  assert.deepEqual(existing, [{ id: 7, sku: "cl-1", slug: "radiador-antiguo" }])
})

test("detiene códigos duplicados en Supabase para evitar productos ambiguos", () => {
  const plan = buildSupabaseImportPlan([
    product(),
    product({ id: "supabase-2", codigo: "AMG-2", clave: "CL-1" }),
  ], [])
  assert.equal(plan.toCreate, 1)
  assert.equal(plan.conflicts.length, 1)
  assert.match(plan.conflicts[0].reason, /repetido/)
})

test("no inventa un SKU si faltan los códigos", () => {
  const plan = buildSupabaseImportPlan([product({ codigo: null, clave: null })], [])
  assert.equal(plan.toCreate, 0)
  assert.equal(plan.conflicts.length, 1)
})
