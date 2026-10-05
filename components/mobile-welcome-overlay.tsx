"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

export const MOBILE_WELCOME_STORAGE_KEY = "amg-mobile-login-welcome"
export const MOBILE_WELCOME_DOCUMENT_CLASS = "amg-mobile-welcome-active"

type WelcomePayload = {
  name?: string
  createdAt?: number
}

function getWelcomeName(value?: string) {
  const fullName = value?.trim()

  if (!fullName || /^administrador$/i.test(fullName)) return "Marcelo"

  return fullName.split(/\s+/)[0]
}

export function MobileWelcomeOverlay() {
  const [name, setName] = useState("")
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)")
    const stored = window.sessionStorage.getItem(MOBILE_WELCOME_STORAGE_KEY)

    if (!stored) return
    if (!media.matches) {
      window.sessionStorage.removeItem(MOBILE_WELCOME_STORAGE_KEY)
      document.documentElement.classList.remove(MOBILE_WELCOME_DOCUMENT_CLASS)
      return
    }

    try {
      const payload = JSON.parse(stored) as WelcomePayload
      const isRecent =
        typeof payload.createdAt === "number" &&
        Date.now() - payload.createdAt < 30_000

      if (!isRecent) {
        window.sessionStorage.removeItem(MOBILE_WELCOME_STORAGE_KEY)
        document.documentElement.classList.remove(MOBILE_WELCOME_DOCUMENT_CLASS)
        return
      }

      let cancelled = false
      let exitTimer: number | undefined
      let removeTimer: number | undefined

      // Se activa después del efecto para convivir con el doble montaje de Strict Mode.
      queueMicrotask(() => {
        if (cancelled) return

        window.sessionStorage.removeItem(MOBILE_WELCOME_STORAGE_KEY)
        document.documentElement.classList.add(MOBILE_WELCOME_DOCUMENT_CLASS)

        const reducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches

        setName(getWelcomeName(payload.name))
        setVisible(true)

        exitTimer = window.setTimeout(
          () => setExiting(true),
          reducedMotion ? 3_600 : 3_400
        )
        removeTimer = window.setTimeout(() => {
          setVisible(false)
          document.documentElement.classList.remove(MOBILE_WELCOME_DOCUMENT_CLASS)
        }, 4_000)
      })

      return () => {
        cancelled = true
        if (exitTimer !== undefined) window.clearTimeout(exitTimer)
        if (removeTimer !== undefined) window.clearTimeout(removeTimer)
      }
    } catch {
      window.sessionStorage.removeItem(MOBILE_WELCOME_STORAGE_KEY)
      document.documentElement.classList.remove(MOBILE_WELCOME_DOCUMENT_CLASS)
      return
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className={`mobile-welcome-overlay${exiting ? " is-exiting" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={`Bienvenido ${name}`}
    >
      <section className="mobile-welcome-card">
        <Image
          src="/images/documents/amg-logo-document.png"
          alt="AMG Radiadores"
          width={1768}
          height={768}
          priority
          sizes="190px"
          className="mobile-welcome-logo"
        />

        <div className="mobile-welcome-check-stage" aria-hidden="true">
          <span className="mobile-welcome-ring mobile-welcome-ring-one" />
          <span className="mobile-welcome-ring mobile-welcome-ring-two" />
          <span className="mobile-welcome-ring mobile-welcome-ring-three" />
          <span className="mobile-welcome-check">
            <svg viewBox="0 0 64 64" className="h-14 w-14">
              <path
                className="mobile-welcome-check-path"
                d="M17 33.5 27.2 43 48 21"
                fill="none"
                stroke="currentColor"
                strokeWidth="5.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>

        <div className="mobile-welcome-copy">
          <p className="mobile-welcome-greeting">¡Bienvenido</p>
          <p className="mobile-welcome-name">{name}!</p>
          <span className="mobile-welcome-line" aria-hidden="true" />
        </div>

      </section>
    </div>
  )
}
