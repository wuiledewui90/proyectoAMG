"use client"

import { useEffect, useState } from "react"
import { Download } from "lucide-react"

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function AdminAppSetup() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    void navigator.serviceWorker.register("/management-sw.js", {
      scope: "/admin/",
    })
  }, [])

  return null
}

export function AdminInstallButton() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    function handleInstallPrompt(event: Event) {
      event.preventDefault()
      setInstallPrompt(event as InstallPromptEvent)
    }

    function handleInstalled() {
      setInstalled(true)
      setInstallPrompt(null)
    }

    window.addEventListener("beforeinstallprompt", handleInstallPrompt)
    window.addEventListener("appinstalled", handleInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt)
      window.removeEventListener("appinstalled", handleInstalled)
    }
  }, [])

  if (installed) return null

  if (!installPrompt) {
    return (
      <p className="admin-install-only-browser border-t pt-4 text-center text-xs text-muted-foreground">
        Este acceso puede instalarse como una aplicación en el escritorio o el teléfono.
      </p>
    )
  }

  async function installApp() {
    if (!installPrompt) return

    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    if (choice.outcome === "accepted") {
      setInstalled(true)
    }
    setInstallPrompt(null)
  }

  return (
    <button
      type="button"
      onClick={() => void installApp()}
      className="admin-install-only-browser flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-secondary px-4 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary/90"
    >
      <Download className="h-4 w-4" />
      Instalar AMG Gestión
    </button>
  )
}
