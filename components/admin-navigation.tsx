import type { ElementType } from "react"
import Image from "next/image"

export type AdminNavLink = {
  href: string
  label: string
  icon?: ElementType
  image?: string
}

export type AdminNavGroup = {
  label: string
  links: AdminNavLink[]
}

export const adminLinkGroups: AdminNavGroup[] = [
  {
    label: "Inicio",
    links: [{ href: "/admin", label: "Resumen", image: "/images/admin-icons/resumen.webp" }],
  },
  {
    label: "Operación del taller",
    links: [
      { href: "/admin/taller", label: "Órdenes de taller", image: "/images/admin-icons/taller.webp" },
      { href: "/admin/documentos", label: "Facturas", image: "/images/admin-icons/presupuestos.webp" },
      { href: "/admin/ventas", label: "Ventas", image: "/images/admin-icons/ventas.webp" },
      { href: "/admin/ordenes", label: "Pedidos web", image: "/images/admin-icons/pedidos-web.webp" },
      { href: "/admin/caja", label: "Caja", image: "/images/admin-icons/caja.webp" },
    ],
  },
  {
    label: "Clientes",
    links: [
      { href: "/admin/clientes", label: "Clientes", image: "/images/admin-icons/clientes.webp" },
      { href: "/admin/mensajes", label: "Mensajes", image: "/images/admin-icons/mensajes.webp" },
    ],
  },
  {
    label: "Inventario y compras",
    links: [
      { href: "/admin/productos", label: "Stock", image: "/images/admin-icons/productos.webp" },
      { href: "/admin/gastos", label: "Gastos", image: "/images/admin-icons/gastos.webp" },
    ],
  },
  {
    label: "Análisis y equipo",
    links: [
      { href: "/admin/reportes", label: "Reportes", image: "/images/admin-icons/reportes.webp" },
      { href: "/admin/empleados", label: "Empleados", image: "/images/admin-icons/empleados.webp" },
    ],
  },
  {
    label: "Administración",
    links: [
      { href: "/admin/usuarios", label: "Usuarios", image: "/images/admin-icons/usuarios.webp" },
      { href: "/admin/seguridad", label: "Seguridad", image: "/images/admin-icons/seguridad.webp" },
      { href: "/admin/configuracion", label: "Configuración", image: "/images/admin-icons/configuracion.webp" },
    ],
  },
]

export const mechanicLinkGroups: AdminNavGroup[] = [
  {
    label: "Mi trabajo",
    links: [{ href: "/admin/mis-tareas", label: "Mis tareas", image: "/images/admin-icons/taller.webp" }],
  },
]

export function AdminNavIcon({ link, className }: { link: AdminNavLink; className: string }) {
  const Icon = link.icon

  if (link.image) {
    return (
      <Image
        src={link.image}
        alt=""
        width={192}
        height={192}
        className={className}
        aria-hidden="true"
      />
    )
  }

  return Icon ? <Icon className={className} aria-hidden="true" /> : null
}
