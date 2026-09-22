import Image from "next/image"
import type { HTMLAttributes } from "react"

type CartIconProps = HTMLAttributes<HTMLSpanElement>

export function CartIcon3D({ className = "", ...props }: CartIconProps) {
  return (
    <span
      {...props}
      className={`relative inline-block shrink-0 ${className}`}
      aria-hidden="true"
    >
      <Image
        src="/images/cart-ls-digital.webp"
        alt=""
        fill
        sizes="64px"
        className="object-contain"
      />
    </span>
  )
}
