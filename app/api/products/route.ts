import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const active = searchParams.get("active"); // "true" | "false" | null

  const where: any = {};
  if (q) where.OR = [{ name: { contains: q } }, { sku: { contains: q } }];
  if (active === "true") where.isActive = true;
  if (active === "false") where.isActive = false;

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products.map((p) => ({ ...p, price: Number(p.price) })));
}

export async function POST(req: Request) {
  const body = await req.json();

  const name = String(body.name ?? "").trim();
  const sku = body.sku ? String(body.sku).trim() : null;
  const description = body.description ? String(body.description) : null;
  const imageUrl = body.imageUrl ? String(body.imageUrl).trim() : null;

  const price = Number(body.price);
  const stock = Number(body.stock ?? 0);

  if (!name) return NextResponse.json({ error: "name requerido" }, { status: 400 });
  if (!Number.isFinite(price) || price < 0) return NextResponse.json({ error: "price inválido" }, { status: 400 });
  if (!Number.isInteger(stock) || stock < 0) return NextResponse.json({ error: "stock inválido" }, { status: 400 });

  const created = await prisma.product.create({
    data: { name, sku, description, imageUrl, price, stock, isActive: true },
  });

  return NextResponse.json({ ...created, price: Number(created.price) }, { status: 201 });
}
