import assert from "node:assert/strict"
import { after, before, test } from "node:test"
import { isTrustedMutationOrigin } from "../lib/security/request"

const previousAppUrl = process.env.APP_URL

before(() => {
  process.env.APP_URL = "https://radiadoresamg.com"
})

after(() => {
  if (previousAppUrl === undefined) delete process.env.APP_URL
  else process.env.APP_URL = previousAppUrl
})

function mutation(origin: string, fetchSite = "same-origin") {
  return new Request("http://localhost:3000/api/admin/login", {
    method: "POST",
    headers: { origin, "sec-fetch-site": fetchSite },
  })
}

test("acepta el dominio principal detrás del proxy", () => {
  assert.equal(isTrustedMutationOrigin(mutation("https://radiadoresamg.com")), true)
})

test("acepta www del mismo dominio detrás del proxy", () => {
  assert.equal(isTrustedMutationOrigin(mutation("https://www.radiadoresamg.com")), true)
})

test("rechaza otros subdominios y sitios", () => {
  assert.equal(isTrustedMutationOrigin(mutation("https://otro.radiadoresamg.com")), false)
  assert.equal(isTrustedMutationOrigin(mutation("https://ejemplo.com")), false)
})

test("rechaza solicitudes marcadas como cross-site", () => {
  assert.equal(isTrustedMutationOrigin(mutation("https://www.radiadoresamg.com", "cross-site")), false)
})
