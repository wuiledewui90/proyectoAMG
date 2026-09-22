"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AdminInstallButton } from "@/components/admin-app-install"

export default function AdminLoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<"login" | "recover">("login")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [pin, setPin] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === "recover" && newPassword !== confirmPassword) {
        setError("Las contraseñas no coinciden.")
        return
      }

      const res = await fetch(
        mode === "login" ? "/api/admin/login" : "/api/admin/recover",
        {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
          body: JSON.stringify(
            mode === "login"
              ? { username, password }
              : { username, pin, newPassword }
          ),
        }
      )

      const data = (await res.json().catch(() => ({}))) as {
        error?: string
        role?: string
      }

      if (!res.ok) {
        setError(
          data.error ||
            (mode === "login"
              ? "Usuario o contraseña incorrectos."
              : "No se pudo restablecer la contraseña.")
        )
        return
      }

      router.replace(
        mode === "login" && data.role === "TECHNICIAN"
          ? "/admin/mis-tareas"
          : "/admin"
      )
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border bg-background p-6 space-y-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">
            {mode === "login" ? "Acceso al sistema" : "Recuperar acceso"}
          </h1>
          <p className="text-sm opacity-70">
            {mode === "login"
              ? "Ingresá con tu usuario y contraseña."
              : "Usá tu PIN para elegir una contraseña nueva."}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm">Usuario</label>
            <input
              className="w-full rounded border p-2"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          {mode === "login" ? (
            <div className="space-y-1">
              <label className="text-sm">Contraseña</label>
              <input
                className="w-full rounded border p-2"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <label className="text-sm">PIN de recuperación</label>
                <input
                  className="w-full rounded border p-2"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  minLength={4}
                  maxLength={8}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  autoComplete="one-time-code"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm">Nueva contraseña</label>
                <input
                  className="w-full rounded border p-2"
                  type="password"
                  minLength={8}
                  maxLength={128}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm">Repetir nueva contraseña</label>
                <input
                  className="w-full rounded border p-2"
                  type="password"
                  minLength={8}
                  maxLength={128}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
            </>
          )}

          {error && <div className="text-sm text-red-600">{error}</div>}

          <button className="w-full rounded-lg border px-4 py-2" type="submit" disabled={loading}>
            {loading
              ? mode === "login"
                ? "Ingresando..."
                : "Restableciendo..."
              : mode === "login"
                ? "Ingresar"
                : "Crear contraseña nueva"}
          </button>
        </form>

        <button
          type="button"
          className="w-full text-sm text-primary underline-offset-4 hover:underline"
          onClick={() => {
            setMode((current) => (current === "login" ? "recover" : "login"))
            setError(null)
          }}
        >
          {mode === "login" ? "Olvidé mi contraseña" : "Volver al inicio de sesión"}
        </button>

        <AdminInstallButton />
      </div>
    </div>
  )
}
