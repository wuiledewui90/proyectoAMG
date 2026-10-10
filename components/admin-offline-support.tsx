"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { CheckCircle2, CloudOff, FileClock, X } from "lucide-react"

type DraftField = {
  checked?: boolean
  value?: string
}

type StoredDraft = {
  fields: Record<string, DraftField>
  savedAt: number
}

type Notice = {
  id: number
  kind: "offline" | "online" | "draft" | "blocked"
  message: string
}

const DRAFT_PREFIX = "amg-admin-draft:"
const MAX_DRAFT_AGE = 7 * 24 * 60 * 60 * 1000
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"])

export function clearAdminOfflineDrafts() {
  if (typeof window === "undefined") return
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(DRAFT_PREFIX))
      .forEach((key) => localStorage.removeItem(key))
  } catch {
    // El almacenamiento puede no estar disponible en navegación privada.
  }
}

function isDraftControl(element: Element): element is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
  if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)) {
    return false
  }

  if (element.closest("[data-offline-draft='false']")) return false
  if (element instanceof HTMLInputElement) {
    return !["button", "file", "hidden", "password", "reset", "submit"].includes(element.type)
  }

  return true
}

function controlKey(
  control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  controls: Array<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
) {
  const identity =
    control.dataset.offlineKey ||
    control.name ||
    control.id ||
    control.getAttribute("aria-label") ||
    control.getAttribute("placeholder") ||
    control.tagName.toLowerCase()

  return `${controls.indexOf(control)}:${identity}`
}

function currentControls() {
  const root = document.querySelector("main")
  if (!root) return []
  return Array.from(root.querySelectorAll("input, textarea, select")).filter(isDraftControl)
}

function readStoredDraft(storageKey: string) {
  try {
    const stored = localStorage.getItem(storageKey)
    if (!stored) return null
    const draft = JSON.parse(stored) as StoredDraft
    if (!draft?.fields || Date.now() - draft.savedAt > MAX_DRAFT_AGE) {
      localStorage.removeItem(storageKey)
      return null
    }
    return draft
  } catch {
    try {
      localStorage.removeItem(storageKey)
    } catch {
      // El almacenamiento puede estar deshabilitado.
    }
    return null
  }
}

function writeControlValue(
  control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  field: DraftField
) {
  if (control instanceof HTMLInputElement && ["checkbox", "radio"].includes(control.type)) {
    if (typeof field.checked !== "boolean" || control.checked === field.checked) return false
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "checked")?.set
    setter?.call(control, field.checked)
  } else {
    if (typeof field.value !== "string" || control.value === field.value) return false
    const prototype = control instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : control instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype
    const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set
    setter?.call(control, field.value)
  }

  control.dispatchEvent(new Event("input", { bubbles: true }))
  control.dispatchEvent(new Event("change", { bubbles: true }))
  return true
}

export function AdminOfflineSupport() {
  const pathname = usePathname()
  const [online, setOnline] = useState(true)
  const [notice, setNotice] = useState<Notice | null>(null)

  useEffect(() => {
    const storageKey = `${DRAFT_PREFIX}${pathname}`
    let saveTimer = 0
    let noticeTimer = 0
    let postMutationTimer = 0
    let restoreAfterClickTimer = 0
    let observerStopTimer = 0
    let active = true
    const restoredControls = new WeakSet<Element>()

    function showNotice(kind: Notice["kind"], message: string, persistent = false) {
      if (!active) return
      window.clearTimeout(noticeTimer)
      setNotice({ id: Date.now(), kind, message })
      if (!persistent) {
        noticeTimer = window.setTimeout(() => setNotice(null), 4500)
      }
    }

    function persistDraft() {
      const controls = currentControls()
      if (!controls.length) {
        try {
          localStorage.removeItem(storageKey)
        } catch {
          // El almacenamiento puede estar deshabilitado.
        }
        return
      }

      const fields = controls.reduce<Record<string, DraftField>>((result, control) => {
        const key = controlKey(control, controls)
        result[key] = control instanceof HTMLInputElement && ["checkbox", "radio"].includes(control.type)
          ? { checked: control.checked }
          : { value: control.value }
        return result
      }, {})

      try {
        localStorage.setItem(storageKey, JSON.stringify({ fields, savedAt: Date.now() } satisfies StoredDraft))
      } catch {
        // El navegador puede limitar el almacenamiento privado; el ERP sigue funcionando en línea.
      }
    }

    function scheduleDraftSave() {
      window.clearTimeout(saveTimer)
      saveTimer = window.setTimeout(persistDraft, 250)
    }

    function scheduleDraftRestore() {
      window.clearTimeout(restoreAfterClickTimer)
      restoreAfterClickTimer = window.setTimeout(restoreVisibleControls, 100)
    }

    function restoreVisibleControls() {
      const draft = readStoredDraft(storageKey)
      if (!draft) return
      const controls = currentControls()
      let restored = false

      controls.forEach((control) => {
        if (restoredControls.has(control)) return
        restoredControls.add(control)
        const field = draft.fields[controlKey(control, controls)]
        if (field && writeControlValue(control, field)) restored = true
      })

      if (restored) showNotice("draft", "Recuperamos los datos que estabas completando.")
    }

    function handleOffline() {
      setOnline(false)
      persistDraft()
      showNotice("offline", "Sin conexión: podés seguir revisando la pantalla, pero los cambios no se guardarán.", true)
    }

    function handleOnline() {
      setOnline(true)
      showNotice("online", "Conexión recuperada. Ya podés guardar cambios nuevamente.")
    }

    function handleNetworkFailure() {
      setOnline(false)
      persistDraft()
      showNotice("blocked", "No se pudo conectar. Guardamos este formulario como borrador en el dispositivo.", true)
    }

    function handleBlockedAction() {
      persistDraft()
      showNotice("blocked", "Esta operación necesita Internet. El borrador quedó guardado en el dispositivo.", true)
    }

    const originalFetch = window.fetch.bind(window)
    window.fetch = async (...args) => {
      const request = args[0] instanceof Request ? args[0] : null
      const method = String(args[1]?.method || request?.method || "GET").toUpperCase()
      const isMutation = !SAFE_METHODS.has(method)

      if (isMutation && !navigator.onLine) {
        handleBlockedAction()
        throw new TypeError("Sin conexión: la operación no fue enviada.")
      }

      try {
        const response = await originalFetch(...args)
        if (isMutation && response.ok) {
          try {
            localStorage.removeItem(storageKey)
          } catch {
            // Sin almacenamiento local disponible no hay borrador que limpiar.
          }
          window.clearTimeout(postMutationTimer)
          postMutationTimer = window.setTimeout(persistDraft, 500)
        }
        return response
      } catch (error) {
        if (!navigator.onLine || error instanceof TypeError) handleNetworkFailure()
        throw error
      }
    }

    const observer = new MutationObserver(restoreVisibleControls)
    const main = document.querySelector("main")
    if (main) {
      observer.observe(main, { childList: true, subtree: true })
      observerStopTimer = window.setTimeout(() => observer.disconnect(), 5000)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    window.addEventListener("pagehide", persistDraft)
    document.addEventListener("input", scheduleDraftSave, true)
    document.addEventListener("change", scheduleDraftSave, true)
    document.addEventListener("click", scheduleDraftRestore, true)

    const restoreTimer = window.setTimeout(restoreVisibleControls, 150)
    if (!navigator.onLine) handleOffline()

    return () => {
      active = false
      window.fetch = originalFetch
      observer.disconnect()
      window.clearTimeout(saveTimer)
      window.clearTimeout(noticeTimer)
      window.clearTimeout(postMutationTimer)
      window.clearTimeout(restoreAfterClickTimer)
      window.clearTimeout(observerStopTimer)
      window.clearTimeout(restoreTimer)
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("pagehide", persistDraft)
      document.removeEventListener("input", scheduleDraftSave, true)
      document.removeEventListener("change", scheduleDraftSave, true)
      document.removeEventListener("click", scheduleDraftRestore, true)
    }
  }, [pathname])

  const visibleNotice = notice ?? (!online
    ? {
        id: 0,
        kind: "offline" as const,
        message: "Sin conexión: los cambios quedan bloqueados hasta recuperar Internet.",
      }
    : null)

  if (!visibleNotice) return null

  const Icon = visibleNotice.kind === "online"
    ? CheckCircle2
    : visibleNotice.kind === "draft"
      ? FileClock
      : CloudOff
  const colors = visibleNotice.kind === "online"
    ? "border-emerald-200 bg-emerald-600 text-white"
    : visibleNotice.kind === "draft"
      ? "border-blue-200 bg-blue-600 text-white"
      : "border-amber-200 bg-amber-500 text-slate-950"

  return (
    <div
      className={`fixed inset-x-3 top-[calc(.75rem+env(safe-area-inset-top))] z-[110] mx-auto flex max-w-xl items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-[0_18px_50px_rgba(15,23,42,.28)] ${colors}`}
      role="status"
      aria-live="polite"
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span className="flex-1 leading-snug">{visibleNotice.message}</span>
      {online && (
        <button
          type="button"
          onClick={() => setNotice(null)}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black/10"
          aria-label="Cerrar aviso"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
