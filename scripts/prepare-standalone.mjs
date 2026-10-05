import { cpSync, existsSync, mkdirSync, readdirSync, realpathSync } from "node:fs"
import { createRequire } from "node:module"
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

// Fail the build if the published server would depend on links outside its tree.
function verifyPortableTree(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isSymbolicLink()) {
      throw new Error(`El paquete standalone contiene un enlace no portable: ${path}. Instalá con nodeLinker: hoisted.`)
    }
    if (entry.isDirectory()) verifyPortableTree(path)
  }
}

verifyPortableTree(join(standaloneRoot, "node_modules"))
process.env.NODE_ENV = "production"
const runtimeRequire = createRequire(join(standaloneRoot, "server.js"))
const nextRequire = createRequire(runtimeRequire.resolve("next/package.json"))
for (const name of ["react", "react-dom", "@swc/helpers/_/_interop_require_default"]) {
  const resolved = realpathSync(nextRequire.resolve(name))
  if (!resolved.startsWith(realpathSync(standaloneRoot) + "/") &&
      !resolved.startsWith(realpathSync(standaloneRoot) + "\\")) {
    throw new Error(`La dependencia ${name} se resuelve fuera del paquete standalone.`)
  }
  nextRequire(name)
}

console.log("Servidor standalone verificado: dependencias sin enlaces externos y recursos públicos incluidos.")
