"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

interface HomeIntroProps {
  onComplete: () => void
}

export function HomeIntro({ onComplete }: HomeIntroProps) {
  const [phase, setPhase] = useState<"logo-visible" | "logo-leaving" | "hidden">(
    "logo-visible"
  )

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const logoLeaveDelay = reduceMotion ? 450 : 1800
    const hideDelay = reduceMotion ? 550 : 3150

    document.body.style.overflow = "hidden"

    const logoLeaveTimer = window.setTimeout(
      () => setPhase("logo-leaving"),
      logoLeaveDelay
    )
    const hideTimer = window.setTimeout(() => {
      setPhase("hidden")
      onComplete()
    }, hideDelay)

    return () => {
      window.clearTimeout(logoLeaveTimer)
      window.clearTimeout(hideTimer)
      document.body.style.overflow = ""
    }
  }, [onComplete])

  useEffect(() => {
    if (phase === "hidden") {
      document.body.style.overflow = ""
    }
  }, [phase])

  if (phase === "hidden") return null

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
    >
      <Image
        src="/images/logo-amg-presentacion.webp"
        alt=""
        width={900}
        height={356}
        priority
        sizes="(max-width: 640px) 43.4vw, 269px"
        className={`amg-intro-logo h-auto w-[min(43.4vw,16.8rem)] object-contain ${
          phase === "logo-leaving" ? "amg-intro-logo-leaving" : ""
        }`}
      />
    </div>
  )
}
