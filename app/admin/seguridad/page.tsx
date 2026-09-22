"use client"

import { useState } from "react"

export default function AdminSecurityPage() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [newPin, setNewPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setMessage(null)
    setError(null)

    if (!newPassword && !newPin) {
      setError("Ingresá una contraseña nueva, un PIN nuevo o ambos.")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden.")
      return
    }

    if (newPin !== confirmPin) {
      setError("Los PIN no coinciden.")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/admin/security", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword, newPin }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }

      if (!res.ok) {
        setError(data.error || "No se pudo actualizar la seguridad.")
        return
      }

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setNewPin("")
      setConfirmPin("")
      setMessage("Contraseña y PIN actualizados correctamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <div className="rounded-lg border bg-card p-4 sm:p-5">
        <h1 className="text-2xl font-bold">Seguridad</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Elegí tu contraseña y configurá el PIN que vas a usar si necesitás
          recuperar el acceso.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5 rounded-lg border bg-card p-4 sm:p-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Contraseña actual</label>
          <input
            className="w-full rounded-md border bg-background px-3 py-2"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <fieldset className="space-y-3 rounded-md border p-4">
          <legend className="px-2 text-sm font-semibold">Cambiar contraseña</legend>
          <p className="text-xs text-muted-foreground">
            Debe tener al menos 8 caracteres. Dejá estos campos vacíos si solo
            querés cambiar el PIN.
          </p>
          <input
            className="w-full rounded-md border bg-background px-3 py-2"
            type="password"
            placeholder="Nueva contraseña"
            minLength={8}
            maxLength={128}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
          />
          <input
            className="w-full rounded-md border bg-background px-3 py-2"
            type="password"
            placeholder="Repetir nueva contraseña"
            minLength={8}
            maxLength={128}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
          />
        </fieldset>

        <fieldset className="space-y-3 rounded-md border p-4">
          <legend className="px-2 text-sm font-semibold">PIN de recuperación</legend>
          <p className="text-xs text-muted-foreground">
            Elegí entre 4 y 8 números que puedas recordar. No uses el mismo PIN
            de una tarjeta bancaria.
          </p>
          <input
            className="w-full rounded-md border bg-background px-3 py-2"
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Nuevo PIN"
            minLength={4}
            maxLength={8}
            value={newPin}
            onChange={(event) => setNewPin(event.target.value.replace(/\D/g, ""))}
            autoComplete="new-password"
          />
          <input
            className="w-full rounded-md border bg-background px-3 py-2"
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Repetir nuevo PIN"
            minLength={4}
            maxLength={8}
            value={confirmPin}
            onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, ""))}
            autoComplete="new-password"
          />
        </fieldset>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-green-600">{message}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60 sm:w-auto"
        >
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  )
}
