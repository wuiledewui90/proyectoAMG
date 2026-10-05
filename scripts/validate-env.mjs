import "dotenv/config"

const errors = []

function required(name) {
  const value = process.env[name]?.trim()
  if (!value) errors.push(`${name}: falta configurar`)
  return value || ""
}

const databaseUrl = required("DATABASE_URL")
const appUrl = required("APP_URL")
const adminUser = required("ADMIN_USER")
const adminHash = required("ADMIN_PASS_HASH")
const adminSecret = required("ADMIN_SECRET")
const supabaseUrl = required("SUPABASE_URL")
required("SUPABASE_SECRET_KEY")
const productsTable = required("SUPABASE_PRODUCTS_TABLE")
const storageBucket = required("SUPABASE_STORAGE_BUCKET")

try {
  const url = new URL(databaseUrl)
  if (url.protocol !== "mysql:") errors.push("DATABASE_URL: debe usar el protocolo mysql://")
} catch {
  errors.push("DATABASE_URL: formato inválido")
}

try {
  const url = new URL(appUrl)
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    errors.push("APP_URL: debe utilizar https:// en producción")
  }
  if (url.pathname !== "/" || url.search || url.hash) {
    errors.push("APP_URL: debe contener únicamente el origen, sin rutas ni parámetros")
  }
} catch {
  errors.push("APP_URL: formato inválido")
}

if (!/^[a-zA-Z0-9._-]{3,40}$/.test(adminUser)) {
  errors.push("ADMIN_USER: debe tener entre 3 y 40 caracteres válidos")
}
if (!/^\$2[aby]\$\d{2}\$.{53}$/.test(adminHash)) {
  errors.push("ADMIN_PASS_HASH: debe ser un hash bcrypt válido")
}
if (adminSecret.length < 32 || /reemplazar|changeme|secret/i.test(adminSecret)) {
  errors.push("ADMIN_SECRET: debe ser aleatorio y tener al menos 32 caracteres")
}
if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseUrl)) {
  errors.push("SUPABASE_URL: debe ser la URL base del proyecto, sin /rest/v1")
}
if (process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY) {
  errors.push("NEXT_PUBLIC_SUPABASE_SECRET_KEY: está prohibida; la clave debe ser solo de servidor")
}
if (!/^[a-z][a-z0-9_]*$/i.test(productsTable)) {
  errors.push("SUPABASE_PRODUCTS_TABLE: nombre inválido")
}
if (!/^[a-z][a-z0-9_-]*$/i.test(storageBucket)) {
  errors.push("SUPABASE_STORAGE_BUCKET: nombre inválido")
}

if (errors.length) {
  console.error("Configuración no apta para despliegue:")
  for (const error of [...new Set(errors)]) console.error(`- ${error}`)
  process.exit(1)
}

console.log("Configuración de entorno validada. No se mostraron secretos.")
