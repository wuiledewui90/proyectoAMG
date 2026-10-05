const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"])

export function getRequestIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  const realIp = req.headers.get("x-real-ip")?.trim()
  const value = forwarded || realIp || "local"
  return /^[a-f0-9:.]{2,64}$/i.test(value) ? value : "unknown"
}

function configuredOrigin() {
  const value = process.env.APP_URL?.trim()
  if (!value) return null

  try {
    return new URL(value).origin
  } catch {
    return null
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
    return sourceOrigin === requestOrigin || sourceOrigin === configuredOrigin()
  } catch {
    return false
  }
}
