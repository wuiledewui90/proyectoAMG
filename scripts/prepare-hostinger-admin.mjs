import { randomBytes } from "node:crypto"
import { readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import bcrypt from "bcryptjs"
import { parse } from "dotenv"

const source = resolve(process.cwd(), ".env.local")
const destination = resolve(process.cwd(), ".env.hostinger-admin.local")

const variables = parse(await readFile(source, "utf8"))
const password = variables.ADMIN_PASS_HASH?.trim()

if (!password || /^\$2[aby]\$\d{2}\$/.test(password)) {
  throw new Error(".env.local debe contener la contraseña anterior en ADMIN_PASS_HASH para convertirla una sola vez.")
}

const hash = await bcrypt.hash(password, 12)
const secret = randomBytes(48).toString("base64url")
const content = `ADMIN_PASS_HASH=${hash}\nADMIN_SECRET=${secret}\n`

await writeFile(destination, content, { flag: "wx", mode: 0o600 })
console.log("Se preparó .env.hostinger-admin.local (ignorado por Git). Contiene solo las dos variables de acceso; no se mostraron sus valores.")
