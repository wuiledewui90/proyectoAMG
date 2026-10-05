import { cpSync, existsSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"

const projectRoot = process.cwd()
const standaloneRoot = join(projectRoot, ".next", "standalone")

if (!existsSync(join(standaloneRoot, "server.js"))) {
  throw new Error("No se encontró el servidor standalone generado por Next.js.")
}

const runtimeFiles = [
  {
    source: join(projectRoot, "node_modules", "@swc", "helpers"),
    destination: join(standaloneRoot, "node_modules", "@swc", "helpers"),
  },
  {
    source: join(projectRoot, "public"),
    destination: join(standaloneRoot, "public"),
  },
  {
    source: join(projectRoot, ".next", "static"),
    destination: join(standaloneRoot, ".next", "static"),
  },
]

for (const { source, destination } of runtimeFiles) {
  if (!existsSync(source)) {
    throw new Error(`No se encontró el recurso requerido: ${source}`)
  }

  mkdirSync(dirname(destination), { recursive: true })
  cpSync(source, destination, {
    recursive: true,
    force: true,
    dereference: true,
  })
}

console.log("Servidor standalone preparado con dependencias y recursos públicos.")
