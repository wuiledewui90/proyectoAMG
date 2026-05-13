// lib/data.ts
// ✅ Este archivo queda SOLO para contenido estático (por ahora).
// 🚫 IMPORTANTE: Los PRODUCTOS YA NO VAN ACÁ. Los productos ahora vienen de la DB (Prisma) vía /api/products.

// ============================================================
// ❌ BORRADO: interface Product y export const products: Product[]
// ------------------------------------------------------------
// Antes tenías:
//  - export interface Product { ... }
//  - export const products: Product[] = [ ... ]   <-- MOCK
//
// Eso generaba 2 fuentes distintas:
//  - Catálogo/Admin usando data.ts (mock)
//  - API usando Prisma (DB)
// Resultado: “no se guardan cambios” y listados distintos.
// ============================================================

export interface Service {
  id: string
  slug: string
  title: string
  description: string
  icon: string
}

export interface Order {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  items: OrderItem[]
  total: number
  status: "pendiente" | "confirmado" | "enviado" | "entregado"
  createdAt: string
}

export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  price: number
}

export interface ContactMessage {
  id: string
  name: string
  email: string
  phone: string
  message: string
  createdAt: string
  read: boolean
}

// ✅ Servicios (pueden quedarse estáticos hasta que los pases a DB)
export const services: Service[] = [
  {
    id: "1",
    slug: "reparacion-radiadores",
    title: "Reparacion de Radiadores",
    description:
      "Reparamos todo tipo de radiadores de aluminio, cobre y plastico. Soldaduras especiales, cambio de nucleo y tanques. Garantia en todos nuestros trabajos.",
    icon: "Wrench",
  },
  {
    id: "2",
    slug: "limpieza-sistema-enfriamiento",
    title: "Limpieza del Sistema de Enfriamiento",
    description:
      "Servicio completo de limpieza y flush del sistema de refrigeracion. Eliminamos sedimentos, oxido y contaminantes que reducen la eficiencia de enfriamiento.",
    icon: "Droplets",
  },
  {
    id: "3",
    slug: "prueba-presion",
    title: "Prueba de Presion",
    description:
      "Diagnostico preciso de fugas en el sistema de refrigeracion mediante prueba de presion certificada. Detectamos micro-fugas invisibles al ojo.",
    icon: "Gauge",
  },
  {
    id: "4",
    slug: "instalacion-radiadores",
    title: "Instalacion de Radiadores",
    description:
      "Instalacion profesional de radiadores nuevos o reparados. Incluye cambio de liquido refrigerante, purgado del sistema y verificacion de funcionamiento.",
    icon: "Settings",
  },
]

// ✅ Categorías/marcas (si en tu UI las usás para filtros estáticos, ok)
// ⚠️ Si querés que sean “reales”, lo ideal es derivarlas desde DB o tener tablas Category/Brand.
export const categories = [
  "Radiadores",
  "Radiadores de Calefaccion",
  "Kits de Distribución",
  "Bombas de Agua",
  "Electroventiladores",
  "Mangueras",
  "Termostatos",
  "Tapas",
  "Correas",
  "Tensores",
  "Accesorios",
]

export const brands = [
  "Chevrolet",
  "Volkswagen",
  "Ford",
  "Fiat",
  "Renault",
  "Toyota",
  "Peugeot",
  "Citroen",
  "Honda",
  "Nissan",
  "Hyundai",
  "Kia",
  "Mercedes-Benz",
  "BMW",
  "Audi",
  "Jeep",
  "Ram",
  "Mitsubishi",
  "Suzuki",
  "Subaru",
  "Chery",
  "Caoa Chery",
  "JAC",
  "BYD",
  "Iveco",
  "Scania",
  "Volvo",
  "Land Rover",
  "Mini",
  "Mazda",
  "Dodge",
  "Chrysler",
  "Great Wall",
  "GWM",
  "Haval",
  "Universal",
]

// ✅ Datos simulados (si todavía no implementaste órdenes/mensajes en DB)
export const sampleOrders: Order[] = [
  {
    id: "ORD-001",
    customerName: "Carlos Martinez",
    customerEmail: "carlos@email.com",
    customerPhone: "1155667788",
    items: [
      {
        productId: "1",
        productName: "Radiador de Aluminio Chevrolet Corsa",
        quantity: 1,
        price: 85000,
      },
    ],
    total: 85000,
    status: "pendiente",
    createdAt: "2026-02-05T14:30:00Z",
  },
  {
    id: "ORD-002",
    customerName: "Laura Gomez",
    customerEmail: "laura@email.com",
    customerPhone: "1144332211",
    items: [
      {
        productId: "4",
        productName: "Electroventilador Fiat Palio",
        quantity: 1,
        price: 45000,
      },
      {
        productId: "5",
        productName: "Tapa de Radiador Universal 1 Bar",
        quantity: 2,
        price: 5500,
      },
    ],
    total: 56000,
    status: "confirmado",
    createdAt: "2026-02-04T10:15:00Z",
  },
]

export const sampleMessages: ContactMessage[] = [
  {
    id: "MSG-001",
    name: "Roberto Sanchez",
    email: "roberto@email.com",
    phone: "1122334455",
    message:
      "Hola, necesito un presupuesto para un radiador de Peugeot 307 2008 1.6. Gracias.",
    createdAt: "2026-02-06T09:00:00Z",
    read: false,
  },
  {
    id: "MSG-002",
    name: "Maria Fernandez",
    email: "maria@email.com",
    phone: "1199887766",
    message:
      "Buenos dias, quisiera saber si hacen envios al interior. Necesito un radiador para Toyota Corolla 2015.",
    createdAt: "2026-02-05T16:45:00Z",
    read: true,
  },
]

// ✅ Esto sí puede quedarse (es una utilidad, no datos mock)
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(price)
}
