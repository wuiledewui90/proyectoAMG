"use client"

import { useEffect, useState } from "react"
import { Download, Share2, Smartphone } from "lucide-react"

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function AdminAppSetup() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    void navigator.serviceWorker
      .register("/management-sw.js", {
        scope: "/admin/",
        updateViaCache: "none",
      })
      .then((registration) => registration.update())
      .catch(() => undefined)
  }, [])

  return null
}

export function AdminInstallButton() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [isAppleMobile] = useState(
    () => typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent)
  )

  useEffect(() => {
    const displayMode = window.matchMedia("(display-mode: standalone)")

    function handleInstallPrompt(event: Event) {
      event.preventDefault()
      setInstallPrompt(event as InstallPromptEvent)
      setShowGuide(false)
    }

    function handleInstalled() {
      setInstalled(true)
      setInstallPrompt(null)
    }

    window.addEventListener("beforeinstallprompt", handleInstallPrompt)
    window.addEventListener("appinstalled", handleInstalled)

    function handleDisplayModeChange(event: MediaQueryListEvent) {
      if (event.matches) setInstalled(true)
    }

    displayMode.addEventListener("change", handleDisplayModeChange)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt)
      window.removeEventListener("appinstalled", handleInstalled)
      displayMode.removeEventListener("change", handleDisplayModeChange)
    }
  }, [])

  if (installed) return null

  async function installApp() {
    if (!installPrompt) {
      setShowGuide((current) => !current)
      return
    }

    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    if (choice.outcome === "accepted") {
      setInstalled(true)
    } else {
      setShowGuide(true)
    }
    setInstallPrompt(null)
  }

  return (
    <div className="admin-install-only-browser space-y-2 border-t border-white/15 pt-4">
      <button
        type="button"
        onClick={() => void installApp()}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/15"
        aria-expanded={showGuide}
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        Instalar aplicación
      </button>

      {showGuide && (
        <div className="rounded-lg border border-white/15 bg-black/20 p-3 text-xs leading-relaxed text-white/80" role="status">
          <p className="flex gap-2">
            {isAppleMobile ? (
              <Share2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <Smartphone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span>
              {isAppleMobile
                ? "En Safari, tocá Compartir y después Agregar a pantalla de inicio."
                : "Abrí el menú del navegador y elegí Instalar aplicación o Agregar a pantalla principal."}
            </span>
          </p>
        </div>
      )}
    </div>
  )
}
