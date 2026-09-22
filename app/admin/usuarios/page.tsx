/* eslint-disable react-hooks/set-state-in-effect */
"use client"
import { useEffect, useState } from "react"

type User = { id: string; name: string; username: string; role: string; active: boolean; lastLoginAt: string | null }
const MAX_USERS = 6
const roleLabels: Record<string, string> = { ADMIN: "Administrador", SALES: "Ventas", TECHNICIAN: "Mecánico", VIEWER: "Solo lectura" }

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [form, setForm] = useState({ name: "", username: "", password: "", role: "SALES" })
  const [message, setMessage] = useState("")
  const reachedLimit = users.length >= MAX_USERS

  async function load() {
    const response = await fetch("/api/admin/users", { cache: "no-store" })
    if (response.ok) setUsers(await response.json())
  }
  useEffect(() => { void load() }, [])

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setMessage("")
    const response = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    const data = await response.json()
    if (!response.ok) return setMessage(data.error || "No se pudo crear el usuario.")
    setForm({ name: "", username: "", password: "", role: "SALES" }); setMessage("Usuario creado correctamente."); void load()
  }

  async function toggle(user: User) {
    await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: user.id, active: !user.active }) })
    void load()
  }

  return <div className="mx-auto max-w-7xl space-y-5">
    <header className="rounded-xl border bg-card p-5"><p className="text-xs font-bold uppercase tracking-widest text-primary">Equipo</p><h1 className="mt-1 text-2xl font-bold">Usuarios y permisos</h1><p className="mt-1 text-sm text-muted-foreground">Cada integrante puede ingresar con su propio usuario y rol.</p></header>
    <form onSubmit={submit} className="grid gap-3 rounded-xl border bg-card p-5 md:grid-cols-2 xl:grid-cols-5">
      <input className="rounded-md border px-3 py-2" placeholder="Nombre completo" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
      <input className="rounded-md border px-3 py-2" placeholder="Usuario" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} required />
      <input className="rounded-md border px-3 py-2" type="password" minLength={8} placeholder="Contraseña" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required />
      <select className="rounded-md border px-3 py-2" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}><option value="ADMIN">Administrador</option><option value="SALES">Ventas</option><option value="TECHNICIAN">Mecánico</option><option value="VIEWER">Solo lectura</option></select>
      <button disabled={reachedLimit} className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">Agregar usuario</button>
      {reachedLimit && <p className="text-sm text-muted-foreground md:col-span-2 xl:col-span-5">Ya están creados los {MAX_USERS} usuarios permitidos. Podés bloquear o eliminar una cuenta antes de agregar otra.</p>}
      {message && <p className="text-sm md:col-span-2 xl:col-span-5">{message}</p>}
    </form>
    <section className="overflow-hidden rounded-xl border bg-card"><div className="border-b px-5 py-3 font-semibold">Personal ({users.length} de {MAX_USERS})</div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-muted/50 text-left"><tr><th className="p-3">Nombre</th><th className="p-3">Usuario</th><th className="p-3">Rol</th><th className="p-3">Último acceso</th><th className="p-3">Estado</th></tr></thead><tbody>{users.map(user=><tr key={user.id} className="border-t"><td className="p-3 font-medium">{user.name}</td><td className="p-3">{user.username}</td><td className="p-3">{roleLabels[user.role]}</td><td className="p-3 text-muted-foreground">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("es-AR") : "Nunca"}</td><td className="p-3"><button onClick={()=>toggle(user)} className={`rounded-full px-3 py-1 text-xs font-semibold ${user.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{user.active ? "Activo" : "Bloqueado"}</button></td></tr>)}</tbody></table></div></section>
  </div>
}
