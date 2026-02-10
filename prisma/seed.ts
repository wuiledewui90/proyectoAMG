import { PrismaClient, Prisma } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const items = [
    {
      name: "Radiador Peugeot 206",
      description: "Radiador compatible con Peugeot 206",
      sku: "RAD-PEU-206",
      brand: "Peugeot",
      model: "206",
      category: "Radiadores",
      compatibility: "Peugeot 206",
      slug: "radiador-peugeot-206",
      images: ["/images/radiador-1.jpg"],
      price: new Prisma.Decimal("145000"),
      stock: 8,
      isActive: true,
    },
    // agregá acá los demás productos...
  ]

  for (const p of items) {
    await prisma.product.upsert({
      where: { slug: p.slug }, // slug es @unique
      update: {
        name: p.name,
        description: p.description,
        sku: p.sku,
        brand: p.brand,
        model: p.model,
        category: p.category,
        compatibility: p.compatibility,
        images: p.images,
        price: p.price,
        stock: p.stock,
        isActive: p.isActive,
      },
      create: p,
    })
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (err) => {
    console.error(err)
    await prisma.$disconnect()
    process.exit(1)
  })
