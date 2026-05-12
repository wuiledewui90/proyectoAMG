import { PrismaClient } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime/library"

const prisma = new PrismaClient()

async function main() {
  const items = [
    {
      slug: "radiador-peugeot-206",
      name: "Radiador Peugeot 206",
      description: "Radiador compatible con Peugeot 206 (varios modelos).",
      sku: "RAD-PEU-206",
      price: new Decimal("145000.00"),
      stock: 8,
      isActive: true,
      brand: "Peugeot",
      model: "206",
      category: "Radiadores",
      compatibility: "Peugeot 206",
      images: ["/images/radiador-1.jpg"],
      imageUrl: "/images/radiador-1.jpg",
    },
    {
      slug: "radiador-volkswagen-gol",
      name: "Radiador Volkswagen Gol",
      description: "Radiador para VW Gol. Calidad OEM.",
      sku: "RAD-VW-GOL",
      price: new Decimal("152000.00"),
      stock: 5,
      isActive: true,
      brand: "Volkswagen",
      model: "Gol",
      category: "Radiadores",
      compatibility: "Volkswagen Gol",
      images: ["/images/radiador-1.jpg"],
      imageUrl: "/images/radiador-1.jpg",
    },
    {
      slug: "radiador-fiat-palio",
      name: "Radiador Fiat Palio",
      description: "Radiador para Fiat Palio. Alto rendimiento.",
      sku: "RAD-FIAT-PALIO",
      price: new Decimal("139900.00"),
      stock: 12,
      isActive: true,
      brand: "Fiat",
      model: "Palio",
      category: "Radiadores",
      compatibility: "Fiat Palio",
      images: ["/images/radiador-1.jpg"],
      imageUrl: "/images/radiador-1.jpg",
    },
    {
      slug: "radiador-renault-clio",
      name: "Radiador Renault Clio",
      description: "Radiador para Renault Clio. Ensamble reforzado.",
      sku: "RAD-REN-CLIO",
      price: new Decimal("149500.00"),
      stock: 10,
      isActive: true,
      brand: "Renault",
      model: "Clio",
      category: "Radiadores",
      compatibility: "Renault Clio",
      images: ["/images/radiador-1.jpg"],
      imageUrl: "/images/radiador-1.jpg",
    },
    {
      slug: "radiador-chevrolet-corsa",
      name: "Radiador Chevrolet Corsa",
      description: "Radiador para Corsa. Excelente disipación.",
      sku: "RAD-CHE-CORSA",
      price: new Decimal("141000.00"),
      stock: 7,
      isActive: true,
      brand: "Chevrolet",
      model: "Corsa",
      category: "Radiadores",
      compatibility: "Chevrolet Corsa",
      images: ["/images/radiador-1.jpg"],
      imageUrl: "/images/radiador-1.jpg",
    },
    {
      slug: "radiador-toyota-corolla",
      name: "Radiador Toyota Corolla",
      description: "Radiador para Corolla. Durabilidad premium.",
      sku: "RAD-TOY-COROLLA",
      price: new Decimal("189000.00"),
      stock: 4,
      isActive: true,
      brand: "Toyota",
      model: "Corolla",
      category: "Radiadores",
      compatibility: "Toyota Corolla",
      images: ["/images/radiador-1.jpg"],
      imageUrl: "/images/radiador-1.jpg",
    },
    {
      slug: "radiador-ford-fiesta",
      name: "Radiador Ford Fiesta",
      description: "Radiador para Ford Fiesta. Compatibilidad amplia.",
      sku: "RAD-FORD-FIESTA",
      price: new Decimal("158000.00"),
      stock: 6,
      isActive: true,
      brand: "Ford",
      model: "Fiesta",
      category: "Radiadores",
      compatibility: "Ford Fiesta",
      images: ["/images/radiador-1.jpg"],
      imageUrl: "/images/radiador-1.jpg",
    },
    {
      slug: "radiador-honda-civic",
      name: "Radiador Honda Civic",
      description: "Radiador para Honda Civic. Alto flujo.",
      sku: "RAD-HON-CIVIC",
      price: new Decimal("205000.00"),
      stock: 3,
      isActive: true,
      brand: "Honda",
      model: "Civic",
      category: "Radiadores",
      compatibility: "Honda Civic",
      images: ["/images/radiador-1.jpg"],
      imageUrl: "/images/radiador-1.jpg",
    },
    {
      slug: "radiador-nissan-tiida",
      name: "Radiador Nissan Tiida",
      description: "Radiador para Nissan Tiida. Excelente performance.",
      sku: "RAD-NIS-TIIDA",
      price: new Decimal("173000.00"),
      stock: 5,
      isActive: true,
      brand: "Nissan",
      model: "Tiida",
      category: "Radiadores",
      compatibility: "Nissan Tiida",
      images: ["/images/radiador-1.jpg"],
      imageUrl: "/images/radiador-1.jpg",
    },
    {
      slug: "radiador-citroen-c3",
      name: "Radiador Citroen C3",
      description: "Radiador para Citroen C3. Ajuste perfecto.",
      sku: "RAD-CIT-C3",
      price: new Decimal("147900.00"),
      stock: 9,
      isActive: true,
      brand: "Citroen",
      model: "C3",
      category: "Radiadores",
      compatibility: "Citroen C3",
      images: ["/images/radiador-1.jpg"],
      imageUrl: "/images/radiador-1.jpg",
    },
  ]

  for (const p of items) {
    const now = new Date()

    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        slug: p.slug,
        name: p.name,
        description: p.description,
        sku: p.sku,
        price: p.price,
        stock: p.stock,
        isActive: p.isActive,
        brand: p.brand,
        model: p.model,
        category: p.category,
        compatibility: p.compatibility,
        images: JSON.stringify(p.images),
        imageUrl: p.imageUrl,
        updatedAt: now,
      },
      create: {
        ...p,
        images: JSON.stringify(p.images),
        updatedAt: now,
      },
    })
  }

  const count = await prisma.product.count()
  console.log(`Seed completo. Productos en DB: ${count}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
