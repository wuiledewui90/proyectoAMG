import "server-only"

const SUPABASE_BASE_URL_PATTERN = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i
const SUPABASE_RESOURCE_NAME_PATTERN = /^[a-z][a-z0-9_]*$/i

function requireServerEnvironmentVariable(name: "SUPABASE_URL" | "SUPABASE_SECRET_KEY") {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`Falta configurar la variable de servidor ${name}.`)
  }

  return value
}

export function validateSupabaseServerEnvironment() {
  const url = requireServerEnvironmentVariable("SUPABASE_URL")
  requireServerEnvironmentVariable("SUPABASE_SECRET_KEY")

  if (!SUPABASE_BASE_URL_PATTERN.test(url)) {
    throw new Error(
      "SUPABASE_URL debe contener únicamente la URL base del proyecto, sin rutas /rest/v1, /auth/v1 ni /storage/v1.",
    )
  }
}

function optionalResourceName(name: "SUPABASE_PRODUCTS_TABLE" | "SUPABASE_STORAGE_BUCKET") {
  const value = process.env[name]?.trim()

  if (!value) return undefined
  if (!SUPABASE_RESOURCE_NAME_PATTERN.test(value)) {
    throw new Error(`${name} contiene un nombre de recurso inválido.`)
  }

  return value
}

export function getSupabaseServerConfig() {
  validateSupabaseServerEnvironment()

  return Object.freeze({
    url: process.env.SUPABASE_URL!,
    productsTable: optionalResourceName("SUPABASE_PRODUCTS_TABLE") ?? "productos",
    storageBucket: optionalResourceName("SUPABASE_STORAGE_BUCKET") ?? "fotos",
  })
}
