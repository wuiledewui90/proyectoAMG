import type { Metadata } from "next"
import { CheckoutClient } from "./checkout-client"

export const metadata: Metadata = {
  title: "Checkout",
  description: "Finaliza tu compra en RADIADORES AMG.",
}

export default function CheckoutPage() {
  return <CheckoutClient />
}
