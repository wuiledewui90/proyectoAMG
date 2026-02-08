import type { Metadata } from "next"
import { CartClient } from "./cart-client"

export const metadata: Metadata = {
  title: "Carrito",
  description: "Tu carrito de compras en RADIADORES AMG.",
}

export default function CarritoPage() {
  return <CartClient />
}
