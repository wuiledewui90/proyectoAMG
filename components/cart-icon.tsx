import * as React from "react"

type CartIconProps = React.SVGProps<SVGSVGElement>

export function CartIcon3D({ className, ...props }: CartIconProps) {
  const id = React.useId().replace(/:/g, "")
  const bodyGradient = `cart-body-${id}`
  const rimGradient = `cart-rim-${id}`
  const wheelGradient = `cart-wheel-${id}`
  const shadowGradient = `cart-shadow-${id}`

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <defs>
        <linearGradient id={bodyGradient} x1="7" x2="18" y1="7" y2="16">
          <stop offset="0" stopColor="#ff6b6b" />
          <stop offset="0.48" stopColor="#ef2424" />
          <stop offset="1" stopColor="#991b1b" />
        </linearGradient>
        <linearGradient id={rimGradient} x1="6" x2="19" y1="5" y2="10">
          <stop offset="0" stopColor="#fff5f5" />
          <stop offset="1" stopColor="#fca5a5" />
        </linearGradient>
        <radialGradient id={wheelGradient} cx="42%" cy="35%" r="68%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.38" stopColor="#fecaca" />
          <stop offset="1" stopColor="#b91c1c" />
        </radialGradient>
        <linearGradient id={shadowGradient} x1="6" x2="20" y1="18" y2="18">
          <stop offset="0" stopColor="#000000" stopOpacity="0" />
          <stop offset="0.5" stopColor="#000000" stopOpacity="0.22" />
          <stop offset="1" stopColor="#000000" stopOpacity="0" />
        </linearGradient>
      </defs>

      <ellipse cx="14" cy="20" rx="6.5" ry="1.25" fill={`url(#${shadowGradient})`} />
      <path
        d="M3.6 4.7h2.1c.5 0 .9.34 1.02.82l.55 2.18"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.1 7.2h12.05c.68 0 1.16.66.96 1.31l-1.72 5.52a1.8 1.8 0 0 1-1.72 1.27H9.55a1.8 1.8 0 0 1-1.74-1.35L6.72 9.7"
        fill={`url(#${bodyGradient})`}
        stroke="#8f1717"
        strokeWidth="1.05"
        strokeLinejoin="round"
      />
      <path
        d="M8.05 8.3h10.1l-.33 1.05H8.34z"
        fill={`url(#${rimGradient})`}
        opacity="0.95"
      />
      <path
        d="M9.05 10.35h8.15M9.55 12.35h7.05"
        stroke="#ffffff"
        strokeOpacity="0.35"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
      <path
        d="M9.15 15.25h8.55"
        stroke="currentColor"
        strokeOpacity="0.55"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <circle cx="10.05" cy="18.4" r="1.65" fill={`url(#${wheelGradient})`} />
      <circle cx="17" cy="18.4" r="1.65" fill={`url(#${wheelGradient})`} />
      <circle cx="10.05" cy="18.4" r="0.58" fill="#7f1d1d" opacity="0.65" />
      <circle cx="17" cy="18.4" r="0.58" fill="#7f1d1d" opacity="0.65" />
    </svg>
  )
}
