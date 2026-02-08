export interface Product {
  id: string
  slug: string
  name: string
  description: string
  price: number
  stock: number
  images: string[]
  brand: string
  model: string
  category: string
  compatibility: string
  active: boolean
}

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

export const products: Product[] = [
  {
    id: "1",
    slug: "radiador-aluminio-chevrolet-corsa",
    name: "Radiador de Aluminio Chevrolet Corsa",
    description:
      "Radiador de aluminio de alta eficiencia para Chevrolet Corsa. Fabricado con materiales de primera calidad que garantizan una excelente disipacion termica y mayor durabilidad. Compatible con modelos 2002-2012.",
    price: 85000,
    stock: 15,
    images: ["/images/radiador-1.jpg"],
    brand: "Chevrolet",
    model: "Corsa",
    category: "Radiadores",
    compatibility: "Chevrolet Corsa 2002-2012 1.4/1.6/1.8",
    active: true,
  },
  {
    id: "2",
    slug: "radiador-volkswagen-gol-trend",
    name: "Radiador Volkswagen Gol Trend",
    description:
      "Radiador completo para Volkswagen Gol Trend. Construccion robusta con nucleo de aluminio y tanques de plastico reforzado. Optima capacidad de refrigeracion para uso urbano y ruta.",
    price: 92000,
    stock: 8,
    images: ["/images/radiador-2.jpg"],
    brand: "Volkswagen",
    model: "Gol Trend",
    category: "Radiadores",
    compatibility: "VW Gol Trend 2008-2020 1.6",
    active: true,
  },
  {
    id: "3",
    slug: "radiador-ford-focus-aluminio",
    name: "Radiador Ford Focus Aluminio",
    description:
      "Radiador de alta performance para Ford Focus. Nucleo completamente de aluminio para maxima eficiencia de enfriamiento. Ideal para reemplazo directo sin modificaciones.",
    price: 110000,
    stock: 5,
    images: ["/images/radiador-3.jpg"],
    brand: "Ford",
    model: "Focus",
    category: "Radiadores",
    compatibility: "Ford Focus 2008-2019 1.6/2.0",
    active: true,
  },
  {
    id: "4",
    slug: "electroventilador-fiat-palio",
    name: "Electroventilador Fiat Palio",
    description:
      "Electroventilador completo con motor y aspa para Fiat Palio. Motor de alta durabilidad con rodamientos sellados. Incluye ficha de conexion original.",
    price: 45000,
    stock: 20,
    images: ["/images/electro-1.jpg"],
    brand: "Fiat",
    model: "Palio",
    category: "Electroventiladores",
    compatibility: "Fiat Palio/Siena 2004-2017 1.4/1.6/1.8",
    active: true,
  },
  {
    id: "5",
    slug: "tapa-radiador-universal-1bar",
    name: "Tapa de Radiador Universal 1 Bar",
    description:
      "Tapa de radiador universal de 1 bar de presion. Fabricada en acero inoxidable con junta de silicona de alta temperatura. Compatible con la mayoria de los radiadores del mercado.",
    price: 5500,
    stock: 50,
    images: ["/images/tapa-1.jpg"],
    brand: "Universal",
    model: "Universal",
    category: "Accesorios",
    compatibility: "Universal - Verificar diametro de boca",
    active: true,
  },
  {
    id: "6",
    slug: "manguera-superior-renault-clio",
    name: "Manguera Superior Renault Clio",
    description:
      "Manguera superior de refrigeracion para Renault Clio. Material EPDM de alta resistencia a temperaturas extremas. Abrazaderas incluidas.",
    price: 12000,
    stock: 30,
    images: ["/images/manguera-1.jpg"],
    brand: "Renault",
    model: "Clio",
    category: "Mangueras",
    compatibility: "Renault Clio 2001-2016 1.2/1.6",
    active: true,
  },
  {
    id: "7",
    slug: "radiador-toyota-hilux-diesel",
    name: "Radiador Toyota Hilux Diesel",
    description:
      "Radiador de alto rendimiento para Toyota Hilux Diesel. Diseñado para soportar las exigencias del motor diesel con mayor capacidad de intercambio termico.",
    price: 165000,
    stock: 3,
    images: ["/images/radiador-4.jpg"],
    brand: "Toyota",
    model: "Hilux",
    category: "Radiadores",
    compatibility: "Toyota Hilux 2005-2015 2.5/3.0 Diesel",
    active: true,
  },
  {
    id: "8",
    slug: "deposito-agua-peugeot-208",
    name: "Deposito de Agua Peugeot 208",
    description:
      "Deposito de expansion de agua para Peugeot 208. Plastico de ingenieria resistente a alta temperatura y presion. Incluye tapa y sensor de nivel.",
    price: 18000,
    stock: 12,
    images: ["/images/deposito-1.jpg"],
    brand: "Peugeot",
    model: "208",
    category: "Accesorios",
    compatibility: "Peugeot 208 2013-2023 1.2/1.6",
    active: true,
  },
]

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

export const categories = [
  "Radiadores",
  "Electroventiladores",
  "Mangueras",
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
  "Universal",
]

// Simulated orders for admin
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

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(price)
}
