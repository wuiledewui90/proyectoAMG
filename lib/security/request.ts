const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"])

export function getRequestIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  const realIp = req.headers.get("x-real-ip")?.trim()
  const value = forwarded || realIp || "local"
  return /^[a-f0-9:.]{2,64}$/i.test(value) ? value : "unknown"
}

function configuredOrigins() {
  const value = process.env.APP_URL?.trim()
  if (!value) return new Set<string>()

  try {
    const url = new URL(value)
    const origins = new Set([url.origin])

    // Hostinger sirve tanto el dominio raíz como www. El proxy puede entregar
    // req.url con el host interno, por eso ambas variantes se validan contra
    // APP_URL en lugar de confiar en cabeceras reenviadas por el cliente.
    if (url.protocol === "https:" && url.hostname.includes(".")) {
      const alias = new URL(url.origin)
      alias.hostname = url.hostname.startsWith("www.")
        ? url.hostname.slice(4)
        : `www.${url.hostname}`
      origins.add(alias.origin)
    }

    return origins
  } catch {
    return new Set<string>()
  }
}

export function isTrustedMutationOrigin(req: Request) {
  if (!MUTATION_METHODS.has(req.method.toUpperCase())) return true

  if (req.headers.get("sec-fetch-site") === "cross-site") return false

  const source = req.headers.get("origin") || req.headers.get("referer")
  if (!source) return true

  try {
    const sourceOrigin = new URL(source).origin
    const requestOrigin = new URL(req.url).origin
    return sourceOrigin === requestOrigin || configuredOrigins().has(sourceOrigin)
  } catch {
    return false
  }
}
