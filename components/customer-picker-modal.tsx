"use client"

import { useEffect, useMemo, useState } from "react"
import { BadgeDollarSign, CarFront, Check, ContactRound, Search, UserRound, X } from "lucide-react"

export type CustomerPickerItem = {
  id: number
  name: string
  phone: string | null
  email: string | null
  taxId: string | null
  address: string | null
  vehiclePlate: string | null
  vehicleBrand: string | null
  vehicleModel: string | null
  vehicleYear: number | null
  hasCurrentAccount?: boolean
}

type CustomerPickerModalProps = {
  customers: CustomerPickerItem[]
  selectedId: string
  onSelect: (id: string) => void
}

export function CustomerPickerModal({ customers, selectedId, onSelect }: CustomerPickerModalProps) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<"ALL" | "CURRENT_ACCOUNT">("ALL")
  const [query, setQuery] = useState("")
  const selected = customers.find((customer) => String(customer.id) === selectedId)

  const visibleCustomers = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es")
    return customers.filter((customer) => {
      if (tab === "CURRENT_ACCOUNT" && !customer.hasCurrentAccount) return false
      if (!normalized) return true
      return `${customer.name} ${customer.phone || ""} ${customer.email || ""} ${customer.taxId || ""} ${customer.vehiclePlate || ""}`
        .toLocaleLowerCase("es")
        .includes(normalized)
    })
  }, [customers, query, tab])

  const currentAccountCount = customers.filter((customer) => customer.hasCurrentAccount).length

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }

    window.addEventListener("keydown", closeWithEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", closeWithEscape)
    }
  }, [open])

  function chooseCustomer(id: string) {
    onSelect(id)
    setOpen(false)
    setQuery("")
  }

  return (
    <>
      <button
        type="button"
        className="customer-picker-trigger mt-1"
        onClick={() => setOpen(true)}
      >
        <span className="customer-picker-trigger-icon">
          <ContactRound className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="block truncate font-semibold text-slate-900">
            {selected?.name || "Buscar cliente agendado"}
          </span>
          <span className="block truncate text-[0.68rem] font-normal text-slate-500">
            {selected
              ? [selected.vehiclePlate, selected.phone].filter(Boolean).join(" · ") || "Cliente seleccionado"
              : `${customers.length} clientes disponibles`}
          </span>
        </span>
        {selected && <Check className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />}
      </button>

      {open && (
        <div className="customer-picker-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <section
            className="customer-picker-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-picker-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="customer-picker-header">
              <div className="flex min-w-0 items-center gap-3">
                <span className="customer-picker-title-icon">
                  <UserRound className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 id="customer-picker-title" className="text-lg font-semibold text-slate-950">
                    Seleccionar cliente
                  </h2>
                  <p className="text-xs text-slate-500">Agenda y cuentas corrientes del taller</p>
                </div>
              </div>
              <button type="button" className="customer-picker-close" onClick={() => setOpen(false)} aria-label="Cerrar">
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="customer-picker-tabs" role="tablist" aria-label="Tipo de cliente">
              <button
                type="button"
                role="tab"
                aria-selected={tab === "ALL"}
                className={tab === "ALL" ? "is-active" : ""}
                onClick={() => setTab("ALL")}
              >
                <ContactRound className="h-4 w-4" /> Agendados <span>{customers.length}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "CURRENT_ACCOUNT"}
                className={tab === "CURRENT_ACCOUNT" ? "is-active" : ""}
                onClick={() => setTab("CURRENT_ACCOUNT")}
              >
                <BadgeDollarSign className="h-4 w-4" /> Cuenta corriente <span>{currentAccountCount}</span>
              </button>
            </div>

            <label className="customer-picker-search">
              <Search className="h-4 w-4" aria-hidden="true" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nombre, teléfono, CUIT o patente"
              />
            </label>

            <div className="customer-picker-list">
              <button type="button" className="customer-picker-manual" onClick={() => chooseCustomer("")}>
                <span className="customer-picker-avatar"><UserRound className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1 text-left">
                  <strong>Completar manualmente</strong>
                  <small>Consumidor final o cliente nuevo</small>
                </span>
                {!selectedId && <Check className="h-4 w-4 text-emerald-600" />}
              </button>

              {visibleCustomers.map((customer) => {
                const vehicle = [customer.vehicleBrand, customer.vehicleModel, customer.vehicleYear].filter(Boolean).join(" · ")
                const isSelected = String(customer.id) === selectedId
                return (
                  <button
                    type="button"
                    key={customer.id}
                    className={`customer-picker-row${isSelected ? " is-selected" : ""}`}
                    onClick={() => chooseCustomer(String(customer.id))}
                  >
                    <span className="customer-picker-avatar">{customer.name.slice(0, 1).toUpperCase()}</span>
                    <span className="min-w-0 flex-1 text-left">
                      <span className="flex flex-wrap items-center gap-2">
                        <strong className="truncate text-sm text-slate-950">{customer.name}</strong>
                        {customer.hasCurrentAccount && <em>Cuenta corriente</em>}
                      </span>
                      <small>{[customer.phone, customer.taxId].filter(Boolean).join(" · ") || "Sin datos de contacto"}</small>
                      {(vehicle || customer.vehiclePlate) && (
                        <span className="customer-picker-vehicle">
                          <CarFront className="h-3 w-3" />
                          {[customer.vehiclePlate, vehicle].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </span>
                    {isSelected && <Check className="h-4 w-4 shrink-0 text-emerald-600" />}
                  </button>
                )
              })}

              {!visibleCustomers.length && (
                <div className="customer-picker-empty">
                  <Search className="h-6 w-6" />
                  <strong>No encontramos clientes</strong>
                  <span>{tab === "CURRENT_ACCOUNT" ? "Todavía no hay clientes con cuenta corriente." : "Probá con otro término."}</span>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  )
}
