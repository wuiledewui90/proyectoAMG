"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowRight, Eye, EyeOff, KeyRound, LockKeyhole, UserRound } from "lucide-react"
import { AdminInstallButton } from "@/components/admin-app-install"
import {
  MOBILE_WELCOME_DOCUMENT_CLASS,
  MOBILE_WELCOME_STORAGE_KEY,
} from "@/components/mobile-welcome-overlay"

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
  const [showPassword, setShowPassword] = useState(false)

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
        name?: string
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

      if (
        mode === "login" &&
        window.matchMedia("(max-width: 768px)").matches
      ) {
        document.documentElement.classList.add(MOBILE_WELCOME_DOCUMENT_CLASS)
        window.sessionStorage.setItem(
          MOBILE_WELCOME_STORAGE_KEY,
          JSON.stringify({
            name: data.name || username,
            createdAt: Date.now(),
          })
        )
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
    <div className="admin-login-page relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <div className="admin-login-mobile-layer absolute inset-0 hidden" aria-hidden="true">
        <Image
          src="/images/login/amg-login-mobile.png"
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 100vw, 1px"
          className="object-cover object-center"
        />
      </div>
      <div className="admin-login-mobile-overlay absolute inset-0 hidden" aria-hidden="true" />

      <div className="admin-login-card relative z-10 w-full max-w-md space-y-4 rounded-xl border bg-background p-6">
        <div className="admin-login-heading space-y-1">
          <p className="admin-login-welcome hidden text-sm font-medium text-white/70">Bienvenido</p>
          <h1 className="text-xl font-semibold">
            {mode === "login" ? (
              <span className="admin-login-desktop-title">Acceso al sistema</span>
            ) : "Recuperar acceso"}
          </h1>
          <p className="text-sm opacity-70">
            {mode === "login"
              ? "Ingresá con tu usuario y contraseña."
              : "Usá tu PIN para elegir una contraseña nueva."}
          </p>
        </div>

        <form onSubmit={onSubmit} className="admin-login-form space-y-3">
          <div className="admin-login-field space-y-1">
            <UserRound className="admin-login-field-icon hidden h-5 w-5" aria-hidden="true" />
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
            <div className="admin-login-field space-y-1">
              <LockKeyhole className="admin-login-field-icon hidden h-5 w-5" aria-hidden="true" />
              <label className="text-sm">Contraseña</label>
              <input
                className="w-full rounded border p-2"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="admin-login-password-toggle hidden"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          ) : (
            <>
              <div className="admin-login-field space-y-1">
                <KeyRound className="admin-login-field-icon hidden h-5 w-5" aria-hidden="true" />
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
              <div className="admin-login-field space-y-1">
                <LockKeyhole className="admin-login-field-icon hidden h-5 w-5" aria-hidden="true" />
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
              <div className="admin-login-field space-y-1">
                <LockKeyhole className="admin-login-field-icon hidden h-5 w-5" aria-hidden="true" />
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

          {mode === "login" && (
            <label className="admin-login-remember hidden items-center gap-2 text-sm text-white/75">
              <input type="checkbox" className="h-4 w-4 rounded border-white/30 bg-white/10 accent-blue-500" />
              Recordarme
            </label>
          )}

          <button className="admin-login-submit flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2" type="submit" disabled={loading}>
            <span>{loading
              ? mode === "login"
                ? "Ingresando..."
                : "Restableciendo..."
              : mode === "login"
                ? "Ingresar"
                : "Crear contraseña nueva"}</span>
            {!loading && <ArrowRight className="admin-login-submit-arrow hidden h-4 w-4" aria-hidden="true" />}
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
