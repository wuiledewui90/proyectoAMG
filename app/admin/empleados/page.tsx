"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { BadgeDollarSign, Clock3, ContactRound, Gift, Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react"
import { formatPrice } from "@/lib/data"
import { AdminMobileExpandableText } from "@/components/admin-mobile-expandable-text"
import { EmployeePayrollAnalytics } from "@/components/employee-payroll-analytics"

type Overtime = { id: number; calculationType: string; workDate: string; hours: number; multiplier: number; hourlyRate: number; amount: number; description: string | null; settled: boolean }
type Adjustment = { id: number; type: string; impact: string; eventDate: string; endDate: string | null; quantity: number; unit: string; unitValue: number; amount: number; description: string | null; settled: boolean }
type Payroll = { id: number; period: string; baseSalary: number; overtimeHours: number; overtimeAmount: number; bonuses: number; deductions: number; adjustmentAdditions: number; adjustmentDeductions: number; aguinaldoAmount: number; grossSalary: number; netSalary: number; status: string; paymentMethod: string | null; cashMovementId: number | null; paidAt: string | null; notes: string | null }
type Employee = { id: number; employeeNumber: string; firstName: string; lastName: string; dni: string; cuil: string | null; birthDate: string | null; phone: string | null; email: string | null; address: string | null; city: string | null; position: string; department: string | null; contractType: string; startDate: string; endDate: string | null; baseSalary: number; hourlyRate: number; paymentFrequency: string; hoursPerDay: number; workDaysPerWeek: number; aguinaldoEnabled: boolean; aguinaldoMonths: string; aguinaldoMethod: string; aguinaldoPercent: number; aguinaldoAmount: number; bank: string | null; cbu: string | null; emergencyContact: string | null; emergencyPhone: string | null; healthInsurance: string | null; healthInsuranceMemberNumber: string | null; companyPaysHealthInsurance: boolean; healthInsuranceAmount: number; active: boolean; notes: string | null; overtimeEntries: Overtime[]; adjustments: Adjustment[]; payrolls: Payroll[] }

const today = () => new Date().toISOString().slice(0, 10)
const currentPeriod = () => new Date().toISOString().slice(0, 7)
const emptyEmployee = { employeeNumber: "", firstName: "", lastName: "", dni: "", cuil: "", birthDate: "", phone: "", email: "", address: "", city: "", position: "", department: "", contractType: "PERMANENT", startDate: today(), endDate: "", baseSalary: "0", paymentFrequency: "MONTHLY", hoursPerDay: "8", workDaysPerWeek: "5", aguinaldoEnabled: false, aguinaldoMonths: ["06", "12"], aguinaldoMethod: "HALF", aguinaldoPercent: "50", aguinaldoAmount: "0", bank: "", cbu: "", emergencyContact: "", emergencyPhone: "", healthInsurance: "", healthInsuranceMemberNumber: "", companyPaysHealthInsurance: false, healthInsuranceAmount: "0", active: true, notes: "" }
const emptyOvertime = { calculationType: "MULTIPLIER", workDate: today(), hours: "", multiplier: "1.5", fixedAmount: "", description: "" }
const emptyAdjustment = { type: "ABSENCE", impact: "DEDUCTION", eventDate: today(), endDate: "", quantity: "1", unit: "DAYS", amount: "0", description: "" }
const inputClass = "h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
const payrollInputClass = "h-11 w-full rounded-2xl border border-slate-200 bg-white/90 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
const statusLabels: Record<string, string> = { DRAFT: "Borrador", APPROVED: "Aprobada", PAID: "Pagada" }
const contractLabels: Record<string, string> = { PERMANENT: "Permanente", TEMPORARY: "Temporal", CONTRACTOR: "Contratado", PART_TIME: "Media jornada" }
const paymentLabels: Record<string, string> = { DAILY: "Diario", WEEKLY: "Semanal", BIWEEKLY: "Quincenal", MONTHLY: "Mensual" }
const cashPaymentLabels: Record<string, string> = { CASH: "Efectivo", TRANSFER: "Transferencia" }
const adjustmentLabels: Record<string, string> = { ABSENCE: "Ausencia", VACATION: "Vacaciones", BREAKAGE: "Rotura o daño", SUSPENSION: "Suspensión", BONUS: "Premio / adicional", OTHER_DEDUCTION: "Otro descuento", OTHER_ADDITION: "Otro adicional" }
const impactLabels: Record<string, string> = { ADDITION: "Suma al sueldo", DEDUCTION: "Descuenta", INFORMATIVE: "Solo informativo" }
const unitLabels: Record<string, string> = { HOURS: "Horas", DAYS: "Días", AMOUNT: "Importe fijo" }
const monthOptions = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((label, index) => ({ value: String(index + 1).padStart(2, "0"), label }))

function calculateHourlyRate(baseSalary: number, frequency: string, hoursPerDay: number, workDaysPerWeek: number) {
  if (!baseSalary || !hoursPerDay || !workDaysPerWeek) return 0
  if (frequency === "DAILY") return baseSalary / hoursPerDay
  if (frequency === "WEEKLY") return baseSalary / (hoursPerDay * workDaysPerWeek)
  if (frequency === "BIWEEKLY") return baseSalary / (hoursPerDay * workDaysPerWeek * 2)
  return baseSalary / (hoursPerDay * workDaysPerWeek * (52 / 12))
}

function monthlyEquivalent(baseSalary: number, frequency: string, workDaysPerWeek: number) {
  if (frequency === "DAILY") return baseSalary * workDaysPerWeek * (52 / 12)
  if (frequency === "WEEKLY") return baseSalary * (52 / 12)
  if (frequency === "BIWEEKLY") return baseSalary * (26 / 12)
  return baseSalary
}

function calculateAguinaldo(employee: Pick<Employee, "aguinaldoEnabled" | "aguinaldoMonths" | "aguinaldoMethod" | "aguinaldoPercent" | "aguinaldoAmount">, period: string, monthlySalary: number) {
  if (!employee.aguinaldoEnabled || !employee.aguinaldoMonths.split(",").includes(period.slice(5, 7))) return 0
  if (employee.aguinaldoMethod === "FIXED") return employee.aguinaldoAmount
  if (employee.aguinaldoMethod === "PERCENTAGE") return monthlySalary * (employee.aguinaldoPercent / 100)
  return monthlySalary / 2
}

function aguinaldoDescription(employee: Employee) {
  if (!employee.aguinaldoEnabled) return "No configurado"
  const months = employee.aguinaldoMonths.split(",").map((value) => monthOptions.find((month) => month.value === value)?.label).filter(Boolean).join(" y ")
  const calculation = employee.aguinaldoMethod === "FIXED" ? formatPrice(employee.aguinaldoAmount) : employee.aguinaldoMethod === "PERCENTAGE" ? `${employee.aguinaldoPercent}% del sueldo` : "50% del sueldo"
  return `${months} · ${calculation}`
}

function payrollPreview(employee: Employee, period: string) {
  const baseSalary = monthlyEquivalent(employee.baseSalary, employee.paymentFrequency, employee.workDaysPerWeek)
  const overtimeAmount = employee.overtimeEntries.filter((entry) => !entry.settled && entry.workDate.slice(0, 7) === period).reduce((sum, entry) => sum + entry.amount, 0)
  const adjustments = employee.adjustments.filter((entry) => !entry.settled && entry.eventDate.slice(0, 7) === period)
  const additions = adjustments.filter((entry) => entry.impact === "ADDITION").reduce((sum, entry) => sum + entry.amount, 0)
  const deductions = adjustments.filter((entry) => entry.impact === "DEDUCTION").reduce((sum, entry) => sum + entry.amount, 0)
  const aguinaldo = calculateAguinaldo(employee, period, baseSalary)
  return { baseSalary, overtimeAmount, additions, deductions, aguinaldo, netSalary: Math.max(0, baseSalary + overtimeAmount + additions + aguinaldo - deductions) }
}

function localDate(value: string) { return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString("es-AR") }

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false)
  const [employeeView, setEmployeeView] = useState<"PROFILE" | "OVERTIME" | "ADJUSTMENT" | "PAYROLL">("PROFILE")
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [editorOpen, setEditorOpen] = useState(false)
  const [form, setForm] = useState(emptyEmployee)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [overtime, setOvertime] = useState(emptyOvertime)
  const [adjustment, setAdjustment] = useState(emptyAdjustment)
  const [payroll, setPayroll] = useState({ period: currentPeriod(), bonuses: "0", deductions: "0", notes: "" })
  const [payingPayroll, setPayingPayroll] = useState<Payroll | null>(null)
  const [payrollPaymentMethod, setPayrollPaymentMethod] = useState("CASH")
  const [bulkPayOpen, setBulkPayOpen] = useState(false)
  const [bulkPeriod, setBulkPeriod] = useState(currentPeriod())
  const [bulkSelectedIds, setBulkSelectedIds] = useState<number[]>([])
  const [bulkPaymentMethods, setBulkPaymentMethods] = useState<Record<number, string>>({})
  const [bulkLiquidateOpen, setBulkLiquidateOpen] = useState(false)
  const [bulkLiquidatePeriod, setBulkLiquidatePeriod] = useState(currentPeriod())
  const [bulkLiquidateSelectedIds, setBulkLiquidateSelectedIds] = useState<number[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    const response = await fetch("/api/admin/employees", { cache: "no-store" })
    const data = await response.json().catch(() => null)
    if (response.ok) {
      setEmployees(data)
      setSelectedId((current) => current && data.some((item: Employee) => item.id === current) ? current : null)
    } else setMessage(data?.error || "No se pudieron cargar los empleados.")
    setLoading(false)
  }, [])
  useEffect(() => { queueMicrotask(() => void load()) }, [load])

  const filtered = useMemo(() => { const normalized = query.toLowerCase().trim(); return employees.filter((employee) => !normalized || `${employee.firstName} ${employee.lastName} ${employee.dni} ${employee.position} ${employee.employeeNumber}`.toLowerCase().includes(normalized)) }, [employees, query])
  const selected = employees.find((employee) => employee.id === selectedId) || null
  const activeCount = employees.filter((employee) => employee.active).length
  const payrollAnalytics = useMemo(() => {
    const period = currentPeriod()
    const rows = employees.flatMap((employee) => {
      const existing = employee.payrolls.find((item) => item.period === period) || null
      if (!employee.active && !existing) return []
      const preview = payrollPreview(employee, period)
      return [{ employee, existing, preview }]
    })
    const payrollTotal = rows.reduce((sum, row) => sum + (row.existing?.netSalary ?? row.preview.netSalary), 0)
    const paidTotal = rows.reduce((sum, row) => sum + (row.existing?.status === "PAID" ? row.existing.netSalary : 0), 0)
    const componentValue = (row: (typeof rows)[number], key: "base" | "overtime" | "additions" | "aguinaldo" | "deductions") => {
      if (!row.existing) {
        if (key === "base") return row.preview.baseSalary
        if (key === "overtime") return row.preview.overtimeAmount
        if (key === "additions") return row.preview.additions
        if (key === "aguinaldo") return row.preview.aguinaldo
        return row.preview.deductions
      }
      if (key === "base") return row.existing.baseSalary
      if (key === "overtime") return row.existing.overtimeAmount
      if (key === "additions") return row.existing.adjustmentAdditions + row.existing.bonuses
      if (key === "aguinaldo") return row.existing.aguinaldoAmount
      return row.existing.adjustmentDeductions + row.existing.deductions
    }
    const [year, month] = period.split("-").map(Number)
    const trend = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(year, month - 6 + index, 1)
      const itemPeriod = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const payrolls = employees.flatMap((employee) => employee.payrolls).filter((item) => item.period === itemPeriod)
      const isCurrent = itemPeriod === period
      return {
        period: itemPeriod,
        label: date.toLocaleDateString("es-AR", { month: "short" }).replace(".", ""),
        total: isCurrent ? payrollTotal : payrolls.reduce((sum, item) => sum + item.netSalary, 0),
        paid: isCurrent ? paidTotal : payrolls.filter((item) => item.status === "PAID").reduce((sum, item) => sum + item.netSalary, 0),
      }
    })
    return {
      period,
      payrollTotal,
      paidTotal,
      pendingTotal: Math.max(0, payrollTotal - paidTotal),
      baseTotal: rows.reduce((sum, row) => sum + componentValue(row, "base"), 0),
      overtimeTotal: rows.reduce((sum, row) => sum + componentValue(row, "overtime"), 0),
      additionsTotal: rows.reduce((sum, row) => sum + componentValue(row, "additions"), 0),
      aguinaldoTotal: rows.reduce((sum, row) => sum + componentValue(row, "aguinaldo"), 0),
      deductionsTotal: rows.reduce((sum, row) => sum + componentValue(row, "deductions"), 0),
      healthInsuranceTotal: employees.filter((employee) => employee.active && employee.companyPaysHealthInsurance).reduce((sum, employee) => sum + employee.healthInsuranceAmount, 0),
      pendingEmployees: rows.filter((row) => row.existing?.status !== "PAID").length,
      liquidatedEmployees: rows.filter((row) => Boolean(row.existing)).length,
      payrollEmployees: rows.length,
      pendingOvertimeHours: employees.flatMap((employee) => employee.overtimeEntries).filter((entry) => !entry.settled).reduce((sum, entry) => sum + entry.hours, 0),
      trend,
    }
  }, [employees])
  const calculatedRate = calculateHourlyRate(Number(form.baseSalary), form.paymentFrequency, Number(form.hoursPerDay), Number(form.workDaysPerWeek))
  const calculatedMonthly = monthlyEquivalent(Number(form.baseSalary), form.paymentFrequency, Number(form.workDaysPerWeek))
  const selectedMonthly = selected ? monthlyEquivalent(selected.baseSalary, selected.paymentFrequency, selected.workDaysPerWeek) : 0
  const selectedAguinaldo = selected ? calculateAguinaldo(selected, payroll.period, selectedMonthly) : 0
  const pendingAdjustments = selected?.adjustments.filter((item) => !item.settled) || []
  const pendingAdditions = pendingAdjustments.filter((item) => item.impact === "ADDITION").reduce((sum, item) => sum + item.amount, 0)
  const pendingDeductions = pendingAdjustments.filter((item) => item.impact === "DEDUCTION").reduce((sum, item) => sum + item.amount, 0)
  const adjustmentEstimate = selected && adjustment.impact !== "INFORMATIVE" ? adjustment.unit === "HOURS" ? Number(adjustment.quantity) * selected.hourlyRate : adjustment.unit === "DAYS" ? Number(adjustment.quantity) * selected.hourlyRate * selected.hoursPerDay : Number(adjustment.amount) : 0
  const bulkPayrollRows = useMemo(() => employees.filter((employee) => employee.active).map((employee) => ({ employee, payroll: employee.payrolls.find((item) => item.period === bulkPeriod) || null })), [employees, bulkPeriod])
  const bulkEligiblePayrolls = bulkPayrollRows.flatMap((row) => row.payroll && ["DRAFT", "APPROVED"].includes(row.payroll.status) ? [row.payroll] : [])
  const bulkSelectedPayrolls = bulkEligiblePayrolls.filter((item) => bulkSelectedIds.includes(item.id))
  const bulkPaymentTotal = bulkSelectedPayrolls.reduce((sum, item) => sum + item.netSalary, 0)
  const bulkLiquidationRows = useMemo(() => employees.filter((employee) => employee.active).map((employee) => ({ employee, existing: employee.payrolls.find((item) => item.period === bulkLiquidatePeriod) || null, preview: payrollPreview(employee, bulkLiquidatePeriod) })), [employees, bulkLiquidatePeriod])
  const bulkLiquidationAvailable = bulkLiquidationRows.filter((row) => !row.existing)
  const bulkLiquidationSelected = bulkLiquidationAvailable.filter((row) => bulkLiquidateSelectedIds.includes(row.employee.id))
  const bulkLiquidationTotal = bulkLiquidationSelected.reduce((sum, row) => sum + row.preview.netSalary, 0)

  function openNew() { setEditingId(null); setForm({ ...emptyEmployee, employeeNumber: `EMP-${String(employees.length + 1).padStart(3, "0")}` }); setEditorOpen(true) }
  function openEdit(employee: Employee) {
    setEditingId(employee.id)
    setForm({ employeeNumber: employee.employeeNumber, firstName: employee.firstName, lastName: employee.lastName, dni: employee.dni, cuil: employee.cuil || "", birthDate: employee.birthDate?.slice(0, 10) || "", phone: employee.phone || "", email: employee.email || "", address: employee.address || "", city: employee.city || "", position: employee.position, department: employee.department || "", contractType: employee.contractType, startDate: employee.startDate.slice(0, 10), endDate: employee.endDate?.slice(0, 10) || "", baseSalary: String(employee.baseSalary), paymentFrequency: employee.paymentFrequency, hoursPerDay: String(employee.hoursPerDay), workDaysPerWeek: String(employee.workDaysPerWeek), aguinaldoEnabled: employee.aguinaldoEnabled, aguinaldoMonths: employee.aguinaldoMonths.split(",").filter(Boolean), aguinaldoMethod: employee.aguinaldoMethod, aguinaldoPercent: String(employee.aguinaldoPercent), aguinaldoAmount: String(employee.aguinaldoAmount), bank: employee.bank || "", cbu: employee.cbu || "", emergencyContact: employee.emergencyContact || "", emergencyPhone: employee.emergencyPhone || "", healthInsurance: employee.healthInsurance || "", healthInsuranceMemberNumber: employee.healthInsuranceMemberNumber || "", companyPaysHealthInsurance: employee.companyPaysHealthInsurance, healthInsuranceAmount: String(employee.healthInsuranceAmount), active: employee.active, notes: employee.notes || "" })
    setEditorOpen(true)
  }

  async function post(payload: Record<string, unknown>, closeEditor = false) {
    setBusy(true); setMessage("")
    const response = await fetch("/api/admin/employees", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    const data = await response.json().catch(() => null)
    if (!response.ok) setMessage(data?.error || "No se pudo guardar.")
    else { setMessage("Información guardada correctamente."); if (closeEditor) setEditorOpen(false); await load() }
    setBusy(false)
    return response.ok
  }

  async function saveEmployee(event: React.FormEvent) { event.preventDefault(); await post({ action: "employee", id: editingId, ...form, baseSalary: Number(form.baseSalary), hoursPerDay: Number(form.hoursPerDay), workDaysPerWeek: Number(form.workDaysPerWeek), aguinaldoPercent: Number(form.aguinaldoPercent), aguinaldoAmount: Number(form.aguinaldoAmount), healthInsuranceAmount: Number(form.healthInsuranceAmount) }, true) }
  async function addOvertime(event: React.FormEvent) { event.preventDefault(); if (!selected) return; const ok = await post({ action: "overtime", employeeId: selected.id, ...overtime, hours: Number(overtime.hours), multiplier: Number(overtime.multiplier), fixedAmount: Number(overtime.fixedAmount) }); if (ok) setOvertime({ ...emptyOvertime, workDate: today() }) }
  async function addAdjustment(event: React.FormEvent) { event.preventDefault(); if (!selected) return; const ok = await post({ action: "adjustment", employeeId: selected.id, ...adjustment, quantity: Number(adjustment.quantity), amount: Number(adjustment.amount) }); if (ok) setAdjustment({ ...emptyAdjustment, eventDate: today() }) }
  async function createPayroll(event: React.FormEvent) { event.preventDefault(); if (!selected) return; const ok = await post({ action: "payroll", employeeId: selected.id, ...payroll, bonuses: Number(payroll.bonuses), deductions: Number(payroll.deductions) }); if (ok) setPayroll({ period: currentPeriod(), bonuses: "0", deductions: "0", notes: "" }) }
  async function changePayroll(payrollId: number, status: string, paymentMethod?: string) { setBusy(true); setMessage(""); const response = await fetch("/api/admin/employees", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ payrollId, status, paymentMethod }) }); const data = await response.json().catch(() => null); if (!response.ok) setMessage(data?.error || "No se pudo actualizar la liquidación."); else { setMessage(status === "PAID" ? "Pago registrado y enviado al arqueo de Caja." : "Estado de liquidación actualizado."); await load() } setBusy(false); return response.ok }
  async function registerPayrollPayment(event: React.FormEvent) { event.preventDefault(); if (!payingPayroll) return; const ok = await changePayroll(payingPayroll.id, "PAID", payrollPaymentMethod); if (ok) setPayingPayroll(null) }
  async function remove(type: "employee" | "overtime" | "adjustment" | "payroll", id: number) { if (!window.confirm("¿Eliminar definitivamente este registro? Esta acción no se puede deshacer.")) return; setBusy(true); const response = await fetch(`/api/admin/employees?type=${type}&id=${id}`, { method: "DELETE" }); if (!response.ok) setMessage("No se pudo eliminar el registro."); else await load(); setBusy(false) }

  function changeAdjustmentType(type: string) {
    const defaults: Record<string, { impact: string; unit: string }> = { ABSENCE: { impact: "DEDUCTION", unit: "DAYS" }, VACATION: { impact: "INFORMATIVE", unit: "DAYS" }, BREAKAGE: { impact: "DEDUCTION", unit: "AMOUNT" }, SUSPENSION: { impact: "DEDUCTION", unit: "DAYS" }, BONUS: { impact: "ADDITION", unit: "AMOUNT" }, OTHER_DEDUCTION: { impact: "DEDUCTION", unit: "AMOUNT" }, OTHER_ADDITION: { impact: "ADDITION", unit: "AMOUNT" } }
    setAdjustment({ ...adjustment, type, ...defaults[type], quantity: defaults[type].unit === "AMOUNT" ? "1" : adjustment.quantity })
  }

  function toggleAguinaldoMonth(month: string) {
    setForm((current) => ({
      ...current,
      aguinaldoMonths: current.aguinaldoMonths.includes(month)
        ? current.aguinaldoMonths.filter((item) => item !== month)
        : [...current.aguinaldoMonths, month].sort(),
    }))
  }

  function selectEmployee(id: number) {
    setSelectedId(id)
    setEmployeeView("PROFILE")
    setEmployeeModalOpen(true)
  }

  function closeEmployee() {
    setEmployeeModalOpen(false)
    setSelectedId(null)
  }

  function openBulkPay() {
    setBulkPeriod(currentPeriod())
    setBulkSelectedIds([])
    setBulkPaymentMethods({})
    setBulkPayOpen(true)
  }

  function openBulkLiquidate() {
    setBulkLiquidatePeriod(currentPeriod())
    setBulkLiquidateSelectedIds([])
    setBulkLiquidateOpen(true)
  }

  function toggleBulkPayroll(id: number) {
    setBulkSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  async function paySelectedPayrolls() {
    if (!bulkSelectedPayrolls.length) { setMessage("Seleccioná al menos un sueldo para pagar."); return }
    setBusy(true); setMessage("")
    const response = await fetch("/api/admin/employees", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "bulk-payroll-payment", payments: bulkSelectedPayrolls.map((item) => ({ payrollId: item.id, paymentMethod: bulkPaymentMethods[item.id] || "CASH" })) }) })
    const data = await response.json().catch(() => null)
    if (!response.ok) setMessage(data?.error || "No se pudieron registrar los pagos.")
    else { setMessage(`${data.paid} sueldo${data.paid === 1 ? "" : "s"} registrado${data.paid === 1 ? "" : "s"} en Caja.`); setBulkPayOpen(false); setBulkSelectedIds([]); await load() }
    setBusy(false)
  }

  async function liquidateSelectedEmployees() {
    if (!bulkLiquidationSelected.length) { setMessage("Seleccioná al menos un empleado para liquidar."); return }
    setBusy(true); setMessage("")
    const response = await fetch("/api/admin/employees", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "bulk-payroll", period: bulkLiquidatePeriod, employeeIds: bulkLiquidationSelected.map((row) => row.employee.id) }) })
    const data = await response.json().catch(() => null)
    if (!response.ok) setMessage(data?.error || "No se pudieron generar las liquidaciones.")
    else { setMessage(`${data.created} liquidación${data.created === 1 ? "" : "es"} generada${data.created === 1 ? "" : "s"} correctamente.`); setBulkLiquidateOpen(false); setBulkLiquidateSelectedIds([]); await load() }
    setBusy(false)
  }

  return <div className="relative mx-auto w-full max-w-[1500px] space-y-6 pb-10 text-slate-950">
    <div className="pointer-events-none absolute -left-24 -top-24 -z-10 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />
    <header><div className="flex items-center gap-4"><span className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/80 bg-white/75 shadow-[0_12px_35px_rgba(15,23,42,.1)] backdrop-blur-xl"><ContactRound className="h-8 w-8 text-blue-600" /></span><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-slate-400">Capital humano</p><h1 className="text-3xl font-semibold tracking-[-.045em] sm:text-4xl">Empleados</h1><p className="mt-1 text-sm text-slate-500">Legajos, novedades y liquidaciones profesionales.</p></div></div></header>

    <EmployeePayrollAnalytics
      periodLabel={payrollAnalytics.period}
      activeCount={activeCount}
      totalEmployees={employees.length}
      payrollTotal={payrollAnalytics.payrollTotal}
      pendingTotal={payrollAnalytics.pendingTotal}
      paidTotal={payrollAnalytics.paidTotal}
      healthInsuranceTotal={payrollAnalytics.healthInsuranceTotal}
      baseTotal={payrollAnalytics.baseTotal}
      overtimeTotal={payrollAnalytics.overtimeTotal}
      additionsTotal={payrollAnalytics.additionsTotal}
      aguinaldoTotal={payrollAnalytics.aguinaldoTotal}
      deductionsTotal={payrollAnalytics.deductionsTotal}
      pendingEmployees={payrollAnalytics.pendingEmployees}
      liquidatedEmployees={payrollAnalytics.liquidatedEmployees}
      payrollEmployees={payrollAnalytics.payrollEmployees}
      pendingOvertimeHours={payrollAnalytics.pendingOvertimeHours}
      trend={payrollAnalytics.trend}
    />

    {loading ? <div className="grid min-h-72 place-items-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div> : <div className="space-y-5">
      <section className="overflow-hidden rounded-[28px] border border-white/90 bg-white/78 shadow-[0_18px_60px_rgba(15,23,42,.07)] backdrop-blur-2xl">
        <div className="border-b border-slate-200/70 p-4 sm:p-5">
          <div><h2 data-quick-access-label="Empleados" className="font-semibold text-slate-950">Listado de empleados</h2><p className="text-xs text-slate-500">Seleccioná una fila para consultar su ficha, novedades o liquidaciones.</p></div>
          <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="grid gap-2 sm:grid-cols-3">
              <button onClick={openBulkLiquidate} className="flex h-11 items-center justify-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"><Clock3 className="h-4 w-4" /> Liquidar sueldos</button>
              <button onClick={openBulkPay} className="flex h-11 items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"><BadgeDollarSign className="h-4 w-4" /> Pagar sueldos</button>
              <button onClick={openNew} className="flex h-11 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"><Plus className="h-4 w-4" /> Nuevo empleado</button>
            </div>
            <label className="relative block w-full xl:w-80"><Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><input className={`${inputClass} pl-10`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar nombre, legajo, DNI o puesto" /></label>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="border-b border-slate-200/70 bg-slate-50/80 text-[11px] uppercase tracking-[.08em] text-slate-400"><tr><th className="px-5 py-3 font-semibold">Empleado</th><th className="px-4 py-3 font-semibold">Legajo / DNI</th><th className="px-4 py-3 font-semibold">Puesto</th><th className="px-4 py-3 font-semibold">Modalidad</th><th className="px-4 py-3 text-right font-semibold">Pago acordado</th><th className="px-4 py-3 font-semibold">Aguinaldo</th><th className="px-4 py-3 font-semibold">Estado</th><th className="px-5 py-3 text-right font-semibold">Acción</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{filtered.map((employee) => <tr key={employee.id} onClick={() => selectEmployee(employee.id)} className="cursor-pointer transition hover:bg-blue-500/[.045]"><td className="px-5 py-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 font-semibold text-slate-500">{employee.firstName[0]}{employee.lastName[0]}</span><div><strong className="block text-slate-950">{employee.lastName}, {employee.firstName}</strong><small className="text-slate-400">{employee.phone || employee.email || "Sin contacto"}</small></div></div></td><td className="px-4 py-3"><strong className="block text-xs text-slate-700">{employee.employeeNumber}</strong><small className="text-slate-400">DNI {employee.dni}</small></td><td className="px-4 py-3"><span className="block font-medium text-slate-800">{employee.position}</span><small className="text-slate-400">{employee.department || "Sin área"}</small></td><td className="px-4 py-3 text-slate-600">{paymentLabels[employee.paymentFrequency] || employee.paymentFrequency}</td><td className="px-4 py-3 text-right font-semibold text-slate-900">{formatPrice(employee.baseSalary)}</td><td className="px-4 py-3">{employee.aguinaldoEnabled ? <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700">Configurado</span> : <span className="text-xs text-slate-400">No configurado</span>}</td><td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${employee.active ? "bg-emerald-500/10 text-emerald-700" : "bg-slate-100 text-slate-500"}`}><span className={`h-1.5 w-1.5 rounded-full ${employee.active ? "bg-emerald-500" : "bg-slate-400"}`} />{employee.active ? "Activo" : "Inactivo"}</span></td><td className="px-5 py-3 text-right"><button type="button" onClick={(event) => { event.stopPropagation(); selectEmployee(employee.id) }} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-950 hover:text-white">Abrir</button></td></tr>)}{!filtered.length && <tr><td colSpan={8} className="p-12 text-center text-sm text-slate-400">No hay empleados que coincidan con la búsqueda.</td></tr>}</tbody>
          </table>
        </div>
      </section>

      {employeeModalOpen && selected && <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/35 p-2 backdrop-blur-md sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) closeEmployee() }}><div className="flex max-h-[calc(100vh-1rem)] w-full max-w-[1380px] flex-col overflow-hidden rounded-[30px] border border-white/80 bg-white/95 shadow-[0_35px_120px_rgba(15,23,42,.28)] sm:max-h-[calc(100vh-2.5rem)]">
        <header className="flex items-center justify-between gap-4 border-b border-slate-200/70 bg-white/90 px-4 py-4 sm:px-6"><div className="flex min-w-0 items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 font-semibold text-white">{selected.firstName[0]}{selected.lastName[0]}</span><div className="min-w-0"><p className="truncate text-lg font-semibold text-slate-950">{selected.firstName} {selected.lastName}</p><p className="truncate text-xs text-slate-500">{selected.position} · Legajo {selected.employeeNumber}</p></div></div><button type="button" onClick={closeEmployee} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200" aria-label="Cerrar detalle del empleado"><X className="h-5 w-5" /></button></header>
        <nav className="grid grid-cols-2 gap-1 border-b border-slate-200/70 bg-white/90 p-2 sm:grid-cols-4" aria-label="Secciones del empleado">
          <button type="button" onClick={() => setEmployeeView("PROFILE")} className={`flex min-h-11 items-center justify-center gap-2 rounded-[15px] px-3 text-xs font-semibold transition sm:text-sm ${employeeView === "PROFILE" ? "bg-slate-950 text-white shadow-lg" : "text-slate-500 hover:bg-slate-100"}`}><ContactRound className="h-4 w-4" /> Datos personales</button>
          <button type="button" onClick={() => setEmployeeView("OVERTIME")} className={`flex min-h-11 items-center justify-center gap-2 rounded-[15px] px-3 text-xs font-semibold transition sm:text-sm ${employeeView === "OVERTIME" ? "bg-slate-950 text-white shadow-lg" : "text-slate-500 hover:bg-slate-100"}`}><Clock3 className="h-4 w-4" /> Horas extra</button>
          <button type="button" onClick={() => setEmployeeView("ADJUSTMENT")} className={`flex min-h-11 items-center justify-center gap-2 rounded-[15px] px-3 text-xs font-semibold transition sm:text-sm ${employeeView === "ADJUSTMENT" ? "bg-slate-950 text-white shadow-lg" : "text-slate-500 hover:bg-slate-100"}`}><Plus className="h-4 w-4" /> Novedades / descuentos</button>
          <button type="button" onClick={() => setEmployeeView("PAYROLL")} className={`flex min-h-11 items-center justify-center gap-2 rounded-[15px] px-3 text-xs font-semibold transition sm:text-sm ${employeeView === "PAYROLL" ? "bg-slate-950 text-white shadow-lg" : "text-slate-500 hover:bg-slate-100"}`}><BadgeDollarSign className="h-4 w-4" /> Liquidaciones</button>
        </nav>
        <div className="flex-1 overflow-y-auto bg-slate-50/70 p-3 sm:p-5"><div className="space-y-5">

        {employeeView === "PROFILE" && <section className="overflow-hidden rounded-[28px] border border-white/80 bg-white/85 shadow-[0_18px_60px_rgba(15,23,42,.07)] backdrop-blur-xl"><div className="flex flex-col gap-4 border-b border-slate-200/80 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6"><div className="flex items-center gap-4"><span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-gradient-to-br from-blue-500 to-violet-500 text-xl font-semibold text-white">{selected.firstName[0]}{selected.lastName[0]}</span><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-2xl font-semibold tracking-tight">{selected.firstName} {selected.lastName}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${selected.active ? "bg-emerald-500/10 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{selected.active ? "Activo" : "Inactivo"}</span></div><p className="mt-1 text-sm text-slate-500">{selected.position} · {selected.department || "Sin área"}</p></div></div><div className="flex gap-2"><button onClick={() => openEdit(selected)} className="flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold"><Pencil className="h-4 w-4" /> Editar</button><button onClick={() => void remove("employee", selected.id)} className="flex h-10 w-10 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600"><Trash2 className="h-4 w-4" /></button></div></div><EmployeeDetailsTable employee={selected} /></section>}

        {(employeeView === "OVERTIME" || employeeView === "ADJUSTMENT") && <div className="space-y-4">
          <div className="rounded-[22px] border border-blue-100 bg-blue-50/70 px-4 py-3 text-xs text-slate-600">Las horas y novedades quedan pendientes para la liquidación correspondiente. Recién afectan Caja cuando registrás el pago del sueldo.</div>
          {employeeView === "OVERTIME" && <section className="rounded-[28px] border border-white/80 bg-white/75 p-5 shadow-[0_18px_60px_rgba(15,23,42,.07)] backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-slate-400">Adicional de jornada</p>
            <h3 className="mt-1 text-xl font-semibold">Horas extra o trabajo acordado</h3>
            <form onSubmit={addOvertime} className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Fecha"><input required type="date" className={inputClass} value={overtime.workDate} onChange={(event) => setOvertime({ ...overtime, workDate: event.target.value })} /></Field>
              <Field label="Forma de cálculo"><select className={inputClass} value={overtime.calculationType} onChange={(event) => setOvertime({ ...overtime, calculationType: event.target.value })}><option value="MULTIPLIER">Por horas y porcentaje</option><option value="FIXED">Monto acordado por el trabajo</option></select></Field>
              {overtime.calculationType === "MULTIPLIER" ? <>
                <Field label="Cantidad de horas"><input required type="number" min="0.25" max="24" step="0.25" className={inputClass} value={overtime.hours} onChange={(event) => setOvertime({ ...overtime, hours: event.target.value })} /></Field>
                <Field label="Recargo"><select className={inputClass} value={overtime.multiplier} onChange={(event) => setOvertime({ ...overtime, multiplier: event.target.value })}><option value="1.5">50% (x1,5)</option><option value="2">100% (x2)</option></select></Field>
              </> : <Field label="Monto acordado"><input required type="number" min="0.01" step="0.01" className={inputClass} value={overtime.fixedAmount} onChange={(event) => setOvertime({ ...overtime, fixedAmount: event.target.value })} placeholder="Importe del trabajo" /></Field>}
              <div className={overtime.calculationType === "FIXED" ? "" : "sm:col-span-2"}><Field label="Motivo / trabajo realizado"><input required className={inputClass} value={overtime.description} onChange={(event) => setOvertime({ ...overtime, description: event.target.value })} placeholder="Detalle del trabajo" /></Field></div>
              <div className="rounded-2xl bg-blue-50 p-3 text-sm sm:col-span-2"><span className="text-slate-500">{overtime.calculationType === "FIXED" ? "Importe a incorporar: " : "Valor hora base: "}</span><strong>{overtime.calculationType === "FIXED" ? formatPrice(Number(overtime.fixedAmount) || 0) : formatPrice(selected.hourlyRate)}</strong></div>
              <button disabled={busy} className="h-11 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white sm:col-span-2">Registrar adicional</button>
            </form>
            <div className="mt-5 divide-y divide-slate-100">{selected.overtimeEntries.slice(0, 8).map((entry) => <div key={entry.id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-semibold">{entry.calculationType === "FIXED" ? "Monto acordado" : `${entry.hours} h · x${entry.multiplier}`} {entry.settled && <span className="ml-1 text-xs font-normal text-emerald-600">Liquidada</span>}</p><p className="text-xs text-slate-400">{localDate(entry.workDate)} · {entry.description || "Sin detalle"}</p></div><div className="flex items-center gap-2"><strong className="text-sm">{formatPrice(entry.amount)}</strong>{!entry.settled && <button onClick={() => void remove("overtime", entry.id)} className="text-rose-500"><Trash2 className="h-4 w-4" /></button>}</div></div>)}{!selected.overtimeEntries.length && <p className="py-8 text-center text-sm text-slate-400">Sin adicionales registrados.</p>}</div>
          </section>}

          {employeeView === "ADJUSTMENT" && <section className="rounded-[28px] border border-white/80 bg-white/75 p-5 shadow-[0_18px_60px_rgba(15,23,42,.07)] backdrop-blur-xl"><p className="text-xs font-semibold uppercase tracking-[.14em] text-slate-400">Historial laboral</p><h3 className="mt-1 text-xl font-semibold">Novedades y descuentos</h3><form onSubmit={addAdjustment} className="mt-4 grid gap-3 sm:grid-cols-2"><Field label="Tipo de novedad"><select className={inputClass} value={adjustment.type} onChange={(event) => changeAdjustmentType(event.target.value)}>{Object.entries(adjustmentLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="Impacto en el sueldo"><select className={inputClass} value={adjustment.impact} onChange={(event) => setAdjustment({ ...adjustment, impact: event.target.value })}>{Object.entries(impactLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="Fecha desde"><input required type="date" className={inputClass} value={adjustment.eventDate} onChange={(event) => setAdjustment({ ...adjustment, eventDate: event.target.value })} /></Field><Field label="Fecha hasta (opcional)"><input type="date" className={inputClass} value={adjustment.endDate} onChange={(event) => setAdjustment({ ...adjustment, endDate: event.target.value })} /></Field><Field label="Unidad"><select className={inputClass} value={adjustment.unit} onChange={(event) => setAdjustment({ ...adjustment, unit: event.target.value, quantity: event.target.value === "AMOUNT" ? "1" : adjustment.quantity })}>{Object.entries(unitLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>{adjustment.unit === "AMOUNT" ? <Field label="Importe"><input required type="number" min="0" step="0.01" className={inputClass} value={adjustment.amount} onChange={(event) => setAdjustment({ ...adjustment, amount: event.target.value, quantity: "1" })} /></Field> : <Field label={`Cantidad de ${unitLabels[adjustment.unit].toLowerCase()}`}><input required type="number" min="0.25" step="0.25" className={inputClass} value={adjustment.quantity} onChange={(event) => setAdjustment({ ...adjustment, quantity: event.target.value })} /></Field>}<Field label="Motivo / referencia"><input required className={inputClass} value={adjustment.description} onChange={(event) => setAdjustment({ ...adjustment, description: event.target.value })} placeholder="Detalle de la novedad" /></Field><div className="flex h-11 items-center rounded-2xl bg-slate-50 px-4 text-sm"><span className="text-slate-500">Impacto estimado:&nbsp;</span><strong>{adjustment.impact === "INFORMATIVE" ? "Sin impacto" : formatPrice(adjustmentEstimate)}</strong></div><button disabled={busy} className="h-11 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white sm:col-span-2">Registrar novedad</button></form><div className="mt-5 divide-y divide-slate-100">{selected.adjustments.slice(0, 10).map((item) => <div key={item.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{adjustmentLabels[item.type] || item.type} <span className={`ml-1 text-xs font-normal ${item.impact === "ADDITION" ? "text-emerald-600" : item.impact === "DEDUCTION" ? "text-rose-600" : "text-blue-600"}`}>{impactLabels[item.impact]}</span></p><p className="truncate text-xs text-slate-400">{localDate(item.eventDate)} · {item.quantity} {unitLabels[item.unit]?.toLowerCase()} · {item.description || "Sin detalle"}</p></div><div className="flex shrink-0 items-center gap-2"><strong className="text-sm">{item.impact === "INFORMATIVE" ? "—" : formatPrice(item.amount)}</strong>{!item.settled && <button onClick={() => void remove("adjustment", item.id)} className="text-rose-500"><Trash2 className="h-4 w-4" /></button>}</div></div>)}{!selected.adjustments.length && <p className="py-8 text-center text-sm text-slate-400">Sin novedades registradas.</p>}</div></section>}
        </div>}

        {employeeView === "PAYROLL" && <section className="relative overflow-hidden rounded-[28px] border border-white/90 bg-white/80 p-5 shadow-[0_24px_70px_rgba(15,23,42,.09)] backdrop-blur-2xl sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-slate-200/45 blur-3xl" aria-hidden="true" />
          <div className="relative">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.14em] text-slate-400">Remuneraciones</p>
                <h3 className="mt-1 text-xl font-semibold tracking-[-.02em] text-slate-950">Liquidación de sueldo</h3>
                <p className="mt-1 text-sm text-slate-500">Las novedades pendientes se incorporan al cálculo. Caja se actualiza únicamente cuando confirmás el pago.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-4">
                <PayrollStat label="Base mensual" value={formatPrice(selectedMonthly)} />
                <PayrollStat label="Adicionales" value={formatPrice(pendingAdditions)} positive />
                <PayrollStat label="Aguinaldo" value={formatPrice(selectedAguinaldo)} positive />
                <PayrollStat label="Descuentos" value={formatPrice(pendingDeductions)} negative />
              </div>
            </div>

            <form onSubmit={createPayroll} className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <Field label="Período"><input required type="month" className={payrollInputClass} value={payroll.period} onChange={(event) => setPayroll({ ...payroll, period: event.target.value })} /></Field>
              <Field label="Base calculada"><div className="flex h-11 items-center rounded-2xl border border-slate-200/80 bg-slate-100/80 px-4 text-sm font-semibold text-slate-700">{formatPrice(selectedMonthly)}</div></Field>
              <Field label="Aguinaldo del período"><div className={`flex h-11 items-center rounded-2xl border px-4 text-sm font-semibold ${selectedAguinaldo > 0 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200/80 bg-slate-100/80 text-slate-500"}`}>{formatPrice(selectedAguinaldo)}</div></Field>
              <Field label="Bono manual"><input type="number" min="0" className={payrollInputClass} value={payroll.bonuses} onChange={(event) => setPayroll({ ...payroll, bonuses: event.target.value })} /></Field>
              <Field label="Descuento manual"><input type="number" min="0" className={payrollInputClass} value={payroll.deductions} onChange={(event) => setPayroll({ ...payroll, deductions: event.target.value })} /></Field>
              <button disabled={busy} className="h-11 self-end rounded-full bg-slate-950 px-5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(15,23,42,.18)] transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:translate-y-0 disabled:opacity-50">Generar liquidación</button>
            </form>

            <div className="mt-6 grid gap-3 lg:grid-cols-2">
              {selected.payrolls.slice(0, 8).map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-[0_10px_30px_rgba(15,23,42,.05)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">Período {item.period}</p>
                      <p className="mt-1 text-xs text-slate-400">Base {formatPrice(item.baseSalary)} · {item.overtimeHours} h extra</p>
                      {item.aguinaldoAmount > 0 && <p className="mt-1 text-xs font-semibold text-emerald-600">Aguinaldo +{formatPrice(item.aguinaldoAmount)}</p>}
                      <p className="mt-1 text-xs text-slate-400">Novedades +{formatPrice(item.adjustmentAdditions)} / -{formatPrice(item.adjustmentDeductions)}</p>
                    </div>
                    <div className="text-right">
                      <strong className="text-lg text-slate-950">{formatPrice(item.netSalary)}</strong>
                      <p className="text-xs text-slate-400">{statusLabels[item.status]}</p>
                    </div>
                  </div>
                  {item.status === "PAID" ? <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-emerald-50 px-3 py-2"><div><p className="text-xs font-semibold text-emerald-700">Pago registrado · {cashPaymentLabels[item.paymentMethod || ""] || "Medio no indicado"}</p><p className="mt-0.5 text-[11px] text-emerald-600">Incluido en Caja{item.paidAt ? ` el ${localDate(item.paidAt)}` : ""}</p></div><span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Pagada</span></div> : <div className="mt-3 flex flex-wrap gap-2">
                    <select disabled={busy} className="h-9 min-w-36 flex-1 rounded-full border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 outline-none focus:border-slate-400" value={item.status} onChange={(event) => void changePayroll(item.id, event.target.value)}>
                      <option value="DRAFT">Borrador</option>
                      <option value="APPROVED">Aprobada</option>
                    </select>
                    {item.status === "APPROVED" && <button type="button" disabled={busy} onClick={() => { setPayingPayroll(item); setPayrollPaymentMethod("CASH") }} className="flex h-9 items-center gap-2 rounded-full bg-emerald-600 px-4 text-xs font-semibold text-white transition hover:bg-emerald-700"><BadgeDollarSign className="h-4 w-4" /> Registrar pago</button>}
                    <button type="button" onClick={() => void remove("payroll", item.id)} className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-rose-500 transition hover:bg-rose-100" aria-label="Eliminar liquidación"><Trash2 className="h-4 w-4" /></button>
                  </div>}
                </div>
              ))}
              {!selected.payrolls.length && <p className="py-8 text-center text-sm text-slate-400 lg:col-span-2">Sin liquidaciones generadas.</p>}
            </div>
          </div>
        </section>}
        </div></div></div></div>}
    </div>}

    {bulkLiquidateOpen && <div className="fixed inset-0 z-[65] grid place-items-center bg-slate-950/40 p-2 backdrop-blur-md sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setBulkLiquidateOpen(false) }}><div className="flex max-h-[calc(100vh-1rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[30px] border border-white/80 bg-white shadow-[0_35px_120px_rgba(15,23,42,.3)] sm:max-h-[calc(100vh-2.5rem)]"><header className="flex items-start justify-between gap-4 border-b border-slate-200/80 p-5 sm:p-6"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-blue-600">Cálculo múltiple</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Liquidar sueldos</h2><p className="mt-1 text-sm text-slate-500">Elegí a qué empleados querés generarles la liquidación del período.</p></div><button type="button" disabled={busy} onClick={() => setBulkLiquidateOpen(false)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600"><X className="h-5 w-5" /></button></header><div className="flex flex-col gap-3 border-b border-slate-200/80 bg-slate-50/80 p-4 sm:flex-row sm:items-end sm:justify-between sm:px-6"><div className="w-full sm:w-56"><Field label="Período a liquidar"><input type="month" className={inputClass} value={bulkLiquidatePeriod} onChange={(event) => { setBulkLiquidatePeriod(event.target.value); setBulkLiquidateSelectedIds([]) }} /></Field></div><button type="button" disabled={!bulkLiquidationAvailable.length} onClick={() => setBulkLiquidateSelectedIds(bulkLiquidationAvailable.length && bulkLiquidationAvailable.every((row) => bulkLiquidateSelectedIds.includes(row.employee.id)) ? [] : bulkLiquidationAvailable.map((row) => row.employee.id))} className="h-10 rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 disabled:opacity-40">{bulkLiquidationAvailable.length > 0 && bulkLiquidationAvailable.every((row) => bulkLiquidateSelectedIds.includes(row.employee.id)) ? "Desmarcar todos" : "Marcar disponibles"}</button></div><div className="flex-1 overflow-y-auto p-3 sm:p-5"><div className="overflow-hidden rounded-[22px] border border-slate-200/80"><div className="hidden grid-cols-[52px_1fr_170px_1fr_150px] bg-slate-100/80 px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:grid"><span /><span>Empleado</span><span>Estado</span><span>Conceptos incluidos</span><span className="text-right">Total estimado</span></div><div className="divide-y divide-slate-100">{bulkLiquidationRows.map(({ employee, existing, preview }) => { const available = !existing; const checked = bulkLiquidateSelectedIds.includes(employee.id); return <div key={employee.id} className={`grid gap-3 px-4 py-4 sm:grid-cols-[52px_1fr_170px_1fr_150px] sm:items-center ${checked ? "bg-blue-50/70" : "bg-white"}`}><label className="flex items-center gap-2 text-xs font-semibold sm:block"><input type="checkbox" disabled={!available} checked={checked} onChange={() => setBulkLiquidateSelectedIds((current) => current.includes(employee.id) ? current.filter((id) => id !== employee.id) : [...current, employee.id])} className="h-5 w-5 accent-blue-600 disabled:opacity-30" /><span className="sm:hidden">Seleccionar</span></label><div><p className="font-semibold text-slate-950">{employee.lastName}, {employee.firstName}</p><p className="mt-0.5 text-xs text-slate-400">{employee.position} · {employee.employeeNumber}</p></div><div>{existing ? <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${existing.status === "PAID" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{existing.status === "PAID" ? "Ya pagada" : "Ya liquidada"}</span> : <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">Disponible</span>}</div><div className="text-xs leading-5 text-slate-500"><span>Base {formatPrice(preview.baseSalary)}</span>{preview.overtimeAmount > 0 && <span className="block text-emerald-600">Extras +{formatPrice(preview.overtimeAmount)}</span>}{preview.additions > 0 && <span className="block text-emerald-600">Adicionales +{formatPrice(preview.additions)}</span>}{preview.aguinaldo > 0 && <span className="block text-emerald-600">Aguinaldo +{formatPrice(preview.aguinaldo)}</span>}{preview.deductions > 0 && <span className="block text-rose-500">Descuentos -{formatPrice(preview.deductions)}</span>}</div><strong className="text-left text-sm text-slate-950 sm:text-right">{existing ? formatPrice(existing.netSalary) : formatPrice(preview.netSalary)}</strong></div>})}{!bulkLiquidationRows.length && <p className="py-12 text-center text-sm text-slate-400">No hay empleados activos para liquidar.</p>}</div></div><p className="mt-3 text-xs text-slate-400">Cada liquidación se generará como borrador. Las horas extra, trabajos acordados, novedades, descuentos y aguinaldo del período se incorporan automáticamente.</p></div><footer className="flex flex-col gap-4 border-t border-slate-200/80 bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><p className="text-xs text-slate-400">{bulkLiquidationSelected.length} empleado{bulkLiquidationSelected.length === 1 ? "" : "s"} seleccionado{bulkLiquidationSelected.length === 1 ? "" : "s"}</p><strong className="text-2xl text-slate-950">{formatPrice(bulkLiquidationTotal)}</strong></div><div className="flex flex-col-reverse gap-2 sm:flex-row"><button type="button" disabled={busy} onClick={() => setBulkLiquidateOpen(false)} className="h-11 rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-600">Cancelar</button><button type="button" disabled={busy || !bulkLiquidationSelected.length} onClick={() => void liquidateSelectedEmployees()} className="h-11 rounded-full bg-blue-600 px-6 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,.25)] disabled:opacity-40">{busy ? "Generando liquidaciones…" : "Generar liquidaciones seleccionadas"}</button></div></footer></div></div>}

    {bulkPayOpen && <div className="fixed inset-0 z-[65] grid place-items-center bg-slate-950/40 p-2 backdrop-blur-md sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setBulkPayOpen(false) }}><div className="flex max-h-[calc(100vh-1rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[30px] border border-white/80 bg-white shadow-[0_35px_120px_rgba(15,23,42,.3)] sm:max-h-[calc(100vh-2.5rem)]"><header className="flex items-start justify-between gap-4 border-b border-slate-200/80 p-5 sm:p-6"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-emerald-600">Pago múltiple</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Pagar sueldos</h2><p className="mt-1 text-sm text-slate-500">Seleccioná únicamente a quienes se les pagará hoy.</p></div><button type="button" disabled={busy} onClick={() => setBulkPayOpen(false)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600"><X className="h-5 w-5" /></button></header><div className="flex flex-col gap-3 border-b border-slate-200/80 bg-slate-50/80 p-4 sm:flex-row sm:items-end sm:justify-between sm:px-6"><div className="w-full sm:w-56"><Field label="Período de liquidación"><input type="month" className={inputClass} value={bulkPeriod} onChange={(event) => { setBulkPeriod(event.target.value); setBulkSelectedIds([]); setBulkPaymentMethods({}) }} /></Field></div><button type="button" disabled={!bulkEligiblePayrolls.length} onClick={() => setBulkSelectedIds(bulkEligiblePayrolls.length && bulkEligiblePayrolls.every((item) => bulkSelectedIds.includes(item.id)) ? [] : bulkEligiblePayrolls.map((item) => item.id))} className="h-10 rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 disabled:opacity-40">{bulkEligiblePayrolls.length > 0 && bulkEligiblePayrolls.every((item) => bulkSelectedIds.includes(item.id)) ? "Desmarcar todos" : "Marcar disponibles"}</button></div><div className="flex-1 overflow-y-auto p-3 sm:p-5"><div className="overflow-hidden rounded-[22px] border border-slate-200/80"><div className="hidden grid-cols-[52px_1fr_150px_160px_150px] bg-slate-100/80 px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:grid"><span /><span>Empleado</span><span>Estado</span><span>Medio de pago</span><span className="text-right">Importe</span></div><div className="divide-y divide-slate-100">{bulkPayrollRows.map(({ employee, payroll: item }) => { const available = Boolean(item && ["DRAFT", "APPROVED"].includes(item.status)); const checked = Boolean(item && bulkSelectedIds.includes(item.id)); return <div key={employee.id} className={`grid gap-3 px-4 py-4 sm:grid-cols-[52px_1fr_150px_160px_150px] sm:items-center ${checked ? "bg-emerald-50/70" : "bg-white"}`}><label className="flex items-center gap-2 text-xs font-semibold sm:block"><input type="checkbox" disabled={!available || !item} checked={checked} onChange={() => item && toggleBulkPayroll(item.id)} className="h-5 w-5 accent-emerald-600 disabled:opacity-30" /><span className="sm:hidden">Seleccionar</span></label><div><p className="font-semibold text-slate-950">{employee.lastName}, {employee.firstName}</p><p className="mt-0.5 text-xs text-slate-400">{employee.position} · {employee.employeeNumber}</p></div><div>{!item ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">Sin liquidación</span> : item.status === "PAID" ? <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Ya pagado</span> : <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">{item.status === "APPROVED" ? "Aprobada" : "Borrador"}</span>}</div><div>{available && item ? <select disabled={!checked} className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none disabled:bg-slate-50 disabled:text-slate-400" value={bulkPaymentMethods[item.id] || "CASH"} onChange={(event) => setBulkPaymentMethods((current) => ({ ...current, [item.id]: event.target.value }))}><option value="CASH">Efectivo</option><option value="TRANSFER">Transferencia</option></select> : <span className="text-xs text-slate-400">—</span>}</div><strong className="text-left text-sm text-slate-950 sm:text-right">{item ? formatPrice(item.netSalary) : "—"}</strong></div>})}{!bulkPayrollRows.length && <p className="py-12 text-center text-sm text-slate-400">No hay empleados activos para este período.</p>}</div></div><p className="mt-3 text-xs text-slate-400">Las liquidaciones en borrador se consideran aprobadas al confirmar este pago. Los empleados sin liquidación no pueden seleccionarse.</p></div><footer className="flex flex-col gap-4 border-t border-slate-200/80 bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><p className="text-xs text-slate-400">{bulkSelectedPayrolls.length} sueldo{bulkSelectedPayrolls.length === 1 ? "" : "s"} seleccionado{bulkSelectedPayrolls.length === 1 ? "" : "s"}</p><strong className="text-2xl text-slate-950">{formatPrice(bulkPaymentTotal)}</strong></div><div className="flex flex-col-reverse gap-2 sm:flex-row"><button type="button" disabled={busy} onClick={() => setBulkPayOpen(false)} className="h-11 rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-600">Cancelar</button><button type="button" disabled={busy || !bulkSelectedPayrolls.length} onClick={() => void paySelectedPayrolls()} className="h-11 rounded-full bg-emerald-600 px-6 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(5,150,105,.25)] disabled:opacity-40">{busy ? "Registrando pagos…" : "Confirmar pagos y registrar en Caja"}</button></div></footer></div></div>}

    {payingPayroll && selected && <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-md"><form onSubmit={registerPayrollPayment} className="w-full max-w-lg rounded-[30px] border border-white/70 bg-white/95 p-6 shadow-[0_30px_100px_rgba(15,23,42,.25)]"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-emerald-600">Impacta en Caja</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Registrar pago de sueldo</h2><p className="mt-1 text-sm text-slate-500">{selected.firstName} {selected.lastName} · período {payingPayroll.period}</p></div><button type="button" onClick={() => setPayingPayroll(null)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600"><X className="h-4 w-4" /></button></div><div className="mt-6 rounded-[22px] bg-slate-950 p-5 text-white"><p className="text-xs text-slate-400">Total a pagar</p><strong className="mt-1 block text-3xl tracking-tight">{formatPrice(payingPayroll.netSalary)}</strong><p className="mt-2 text-xs text-slate-400">Incluye sueldo, horas extra, adicionales, descuentos y aguinaldo calculados.</p></div><div className="mt-5"><Field label="Medio de pago"><select className={inputClass} value={payrollPaymentMethod} onChange={(event) => setPayrollPaymentMethod(event.target.value)}><option value="CASH">Efectivo</option><option value="TRANSFER">Transferencia</option></select></Field></div><div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-xs leading-5 text-emerald-800">Al confirmar se creará un egreso en la Caja abierta de hoy. El efectivo reduce el saldo físico esperado; la transferencia queda registrada como egreso sin modificar el efectivo físico.</div><div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setPayingPayroll(null)} className="h-11 rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-600">Cancelar</button><button disabled={busy} className="h-11 rounded-full bg-emerald-600 px-6 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(5,150,105,.25)] disabled:opacity-50">{busy ? "Registrando…" : "Confirmar pago y registrar en Caja"}</button></div></form></div>}

    {editorOpen && <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/35 p-4 backdrop-blur-sm"><form onSubmit={saveEmployee} className="mx-auto my-6 max-w-5xl rounded-[30px] bg-white p-5 shadow-2xl sm:p-7"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-slate-400">Legajo profesional</p><h2 className="mt-1 text-2xl font-semibold">{editingId ? "Editar empleado" : "Nuevo empleado"}</h2></div><button type="button" onClick={() => setEditorOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100"><X className="h-4 w-4" /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Field label="N.º de legajo *"><input required className={inputClass} value={form.employeeNumber} onChange={(event) => setForm({ ...form, employeeNumber: event.target.value })} /></Field><Field label="Nombre *"><input required className={inputClass} value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></Field><Field label="Apellido *"><input required className={inputClass} value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></Field><Field label="DNI *"><input required className={inputClass} value={form.dni} onChange={(event) => setForm({ ...form, dni: event.target.value })} /></Field><Field label="CUIL"><input className={inputClass} value={form.cuil} onChange={(event) => setForm({ ...form, cuil: event.target.value })} /></Field><Field label="Fecha de nacimiento"><input type="date" className={inputClass} value={form.birthDate} onChange={(event) => setForm({ ...form, birthDate: event.target.value })} /></Field><Field label="Teléfono"><input className={inputClass} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field><Field label="Correo"><input type="email" className={inputClass} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field><Field label="Domicilio"><input className={inputClass} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></Field><Field label="Ciudad"><input className={inputClass} value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></Field><Field label="Puesto *"><input required className={inputClass} value={form.position} onChange={(event) => setForm({ ...form, position: event.target.value })} /></Field><Field label="Área"><input className={inputClass} value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} /></Field><Field label="Tipo de contrato"><select className={inputClass} value={form.contractType} onChange={(event) => setForm({ ...form, contractType: event.target.value })}>{Object.entries(contractLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="Fecha de ingreso *"><input required type="date" className={inputClass} value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} /></Field><Field label="Fecha de egreso"><input type="date" className={inputClass} value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} /></Field></div>

      <div className="mt-6 rounded-[24px] border border-blue-100 bg-blue-50/70 p-4 sm:p-5"><div className="flex items-center gap-3"><BadgeDollarSign className="h-5 w-5 text-blue-600" /><div><h3 className="font-semibold">Remuneración y jornada</h3><p className="text-xs text-slate-500">El valor hora se calcula automáticamente con estos datos.</p></div></div><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Field label="Modalidad de pago *"><select className={inputClass} value={form.paymentFrequency} onChange={(event) => setForm({ ...form, paymentFrequency: event.target.value })}>{Object.entries(paymentLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label={`Pago ${paymentLabels[form.paymentFrequency].toLowerCase()} *`}><input required type="number" min="0" step="0.01" className={inputClass} value={form.baseSalary} onChange={(event) => setForm({ ...form, baseSalary: event.target.value })} /></Field><Field label="Horas de trabajo por día *"><input required type="number" min="0.5" max="24" step="0.5" className={inputClass} value={form.hoursPerDay} onChange={(event) => setForm({ ...form, hoursPerDay: event.target.value })} /></Field><Field label="Días de trabajo por semana *"><input required type="number" min="1" max="7" step="0.5" className={inputClass} value={form.workDaysPerWeek} onChange={(event) => setForm({ ...form, workDaysPerWeek: event.target.value })} /></Field></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-white p-3"><p className="text-[11px] uppercase tracking-wider text-slate-400">Valor hora automático</p><strong className="text-lg text-blue-700">{formatPrice(calculatedRate)}</strong></div><div className="rounded-2xl bg-white p-3"><p className="text-[11px] uppercase tracking-wider text-slate-400">Equivalente mensual estimado</p><strong className="text-lg">{formatPrice(calculatedMonthly)}</strong></div></div></div>

      <div className="mt-6 rounded-[24px] border border-emerald-100 bg-emerald-50/65 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700"><Gift className="h-5 w-5" /></span><div><h3 className="font-semibold">Pago de aguinaldo</h3><p className="text-xs text-slate-500">Se incorporará automáticamente en la liquidación de los meses elegidos.</p></div></div>
          <label className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={form.aguinaldoEnabled} onChange={(event) => setForm({ ...form, aguinaldoEnabled: event.target.checked })} className="h-4 w-4 accent-emerald-600" /> Activar aguinaldo</label>
        </div>
        {form.aguinaldoEnabled && <div className="mt-5 space-y-4">
          <div><p className="text-xs font-medium text-slate-500">Meses de pago *</p><div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">{monthOptions.map((month) => <button key={month.value} type="button" onClick={() => toggleAguinaldoMonth(month.value)} className={`rounded-xl border px-2 py-2 text-xs font-semibold transition ${form.aguinaldoMonths.includes(month.value) ? "border-emerald-500 bg-emerald-600 text-white" : "border-emerald-100 bg-white text-slate-600 hover:border-emerald-300"}`}>{month.label}</button>)}</div>{!form.aguinaldoMonths.length && <p className="mt-2 text-xs font-medium text-rose-600">Elegí al menos un mes.</p>}</div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Forma de cálculo"><select className={inputClass} value={form.aguinaldoMethod} onChange={(event) => setForm({ ...form, aguinaldoMethod: event.target.value })}><option value="HALF">Mitad del sueldo mensual (50%)</option><option value="PERCENTAGE">Porcentaje personalizado</option><option value="FIXED">Monto fijo manual</option></select></Field>
            {form.aguinaldoMethod === "PERCENTAGE" && <Field label="Porcentaje del sueldo"><input required type="number" min="0" step="0.01" className={inputClass} value={form.aguinaldoPercent} onChange={(event) => setForm({ ...form, aguinaldoPercent: event.target.value })} /></Field>}
            {form.aguinaldoMethod === "FIXED" && <Field label="Monto del aguinaldo"><input required type="number" min="0" step="0.01" className={inputClass} value={form.aguinaldoAmount} onChange={(event) => setForm({ ...form, aguinaldoAmount: event.target.value })} /></Field>}
            <div className="rounded-2xl bg-white p-3"><p className="text-[11px] uppercase tracking-wider text-slate-400">Importe estimado</p><strong className="text-lg text-emerald-700">{formatPrice(form.aguinaldoMethod === "FIXED" ? Number(form.aguinaldoAmount) || 0 : form.aguinaldoMethod === "PERCENTAGE" ? calculatedMonthly * ((Number(form.aguinaldoPercent) || 0) / 100) : calculatedMonthly / 2)}</strong></div>
          </div>
        </div>}
      </div>

      <div className="mt-6 rounded-[24px] border border-violet-100 bg-violet-50/60 p-4 sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-semibold text-slate-950">Obra social o prepaga</h3><p className="mt-1 text-xs text-slate-500">Registrá la cobertura y si el costo mensual está a cargo de la empresa.</p></div><label className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={form.companyPaysHealthInsurance} onChange={(event) => setForm({ ...form, companyPaysHealthInsurance: event.target.checked, healthInsuranceAmount: event.target.checked ? form.healthInsuranceAmount : "0" })} className="h-4 w-4 accent-violet-600" /> La paga la empresa</label></div><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Field label="Nombre de la obra social / prepaga"><input required={form.companyPaysHealthInsurance} className={inputClass} value={form.healthInsurance} onChange={(event) => setForm({ ...form, healthInsurance: event.target.value })} placeholder="Ej. OSDE, Swiss Medical, OSECAC" /></Field><Field label="Número de afiliado"><input className={inputClass} value={form.healthInsuranceMemberNumber} onChange={(event) => setForm({ ...form, healthInsuranceMemberNumber: event.target.value })} placeholder="Opcional" /></Field>{form.companyPaysHealthInsurance && <Field label="Valor mensual pagado por la empresa *"><input required type="number" min="0.01" step="0.01" className={inputClass} value={form.healthInsuranceAmount} onChange={(event) => setForm({ ...form, healthInsuranceAmount: event.target.value })} placeholder="Importe mensual" /></Field>}</div>{form.companyPaysHealthInsurance && <div className="mt-4 rounded-2xl bg-white p-3 text-sm"><span className="text-slate-500">Costo mensual para la empresa: </span><strong className="text-violet-700">{formatPrice(Number(form.healthInsuranceAmount) || 0)}</strong><p className="mt-1 text-xs text-slate-400">Se registra como beneficio laboral y no se descuenta del sueldo del empleado.</p></div>}</div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Field label="Banco"><input className={inputClass} value={form.bank} onChange={(event) => setForm({ ...form, bank: event.target.value })} /></Field><Field label="CBU / Alias"><input className={inputClass} value={form.cbu} onChange={(event) => setForm({ ...form, cbu: event.target.value })} /></Field><Field label="Contacto de emergencia"><input className={inputClass} value={form.emergencyContact} onChange={(event) => setForm({ ...form, emergencyContact: event.target.value })} /></Field><Field label="Teléfono de emergencia"><input className={inputClass} value={form.emergencyPhone} onChange={(event) => setForm({ ...form, emergencyPhone: event.target.value })} /></Field><label className="flex h-11 items-center gap-2 rounded-2xl bg-slate-50 px-4 text-sm lg:mt-6"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Empleado activo</label></div><div className="mt-4"><Field label="Observaciones"><textarea className="mt-1 min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></Field></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setEditorOpen(false)} className="h-11 rounded-full border border-slate-200 px-6 text-sm font-semibold">Cancelar</button><button disabled={busy} className="h-11 rounded-full bg-slate-950 px-6 text-sm font-semibold text-white">{busy ? "Guardando…" : "Guardar legajo"}</button></div></form></div>}
    {message && <p className="fixed bottom-5 right-5 z-[90] rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-xl">{message}</p>}
  </div>
}

function EmployeeDetailsTable({ employee }: { employee: Employee }) {
  const sections = [
    {
      title: "Identificación y contacto",
      rows: [
        ["Legajo", employee.employeeNumber, "DNI / CUIL", `${employee.dni}${employee.cuil ? ` · ${employee.cuil}` : ""}`],
        ["Nacimiento", employee.birthDate ? localDate(employee.birthDate) : "No informado", "Teléfono", employee.phone || "No informado"],
        ["Correo", employee.email || "No informado", "Domicilio", [employee.address, employee.city].filter(Boolean).join(" · ") || "No informado"],
      ],
    },
    {
      title: "Información laboral",
      rows: [
        ["Puesto", employee.position, "Área", employee.department || "Sin área"],
        ["Fecha de ingreso", localDate(employee.startDate), "Fecha de egreso", employee.endDate ? localDate(employee.endDate) : "Continúa activo"],
        ["Contrato", contractLabels[employee.contractType] || employee.contractType, "Jornada habitual", `${employee.hoursPerDay} h/día · ${employee.workDaysPerWeek} días/semana`],
      ],
    },
    {
      title: "Remuneración y beneficios",
      rows: [
        ["Modalidad de pago", paymentLabels[employee.paymentFrequency] || employee.paymentFrequency, "Pago acordado", formatPrice(employee.baseSalary)],
        ["Valor hora calculado", formatPrice(employee.hourlyRate), "Aguinaldo", aguinaldoDescription(employee)],
        ["Obra social / prepaga", employee.healthInsurance || "No informada", "Número de afiliado", employee.healthInsuranceMemberNumber || "No informado"],
        ["Cobertura a cargo de la empresa", employee.companyPaysHealthInsurance ? "Sí" : "No", "Valor mensual empresa", employee.companyPaysHealthInsurance ? formatPrice(employee.healthInsuranceAmount) : "No corresponde"],
        ["Banco", employee.bank || "No informado", "CBU / Alias", employee.cbu || "No informado"],
        ["Contacto de emergencia", [employee.emergencyContact, employee.emergencyPhone].filter(Boolean).join(" · ") || "No informado", "Estado del legajo", employee.active ? "Activo" : "Inactivo"],
      ],
    },
  ]

  return <div className="p-4 sm:p-6">
    <div className="overflow-hidden rounded-[22px] border border-slate-200/80 bg-white">
      {sections.map((section, sectionIndex) => <div key={section.title} className={sectionIndex ? "border-t border-slate-200/80" : ""}>
        <div className="bg-slate-100/80 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[.1em] text-slate-500">{section.title}</div>
        <div className="hidden overflow-x-auto sm:block"><table className="w-full table-fixed text-left text-sm"><tbody className="divide-y divide-slate-100">{section.rows.map((row) => <tr key={`${section.title}-${row[0]}`}><EmployeeDetailLabel>{row[0]}</EmployeeDetailLabel><EmployeeDetailValue label={row[0]} value={row[1]} /><EmployeeDetailLabel>{row[2]}</EmployeeDetailLabel><EmployeeDetailValue label={row[2]} value={row[3]} /></tr>)}</tbody></table></div>
        <div className="divide-y divide-slate-100 sm:hidden">{section.rows.flatMap((row) => [[row[0], row[1]], [row[2], row[3]]]).map(([label, value]) => <div key={`${section.title}-${label}`} className="grid grid-cols-[120px_1fr] gap-3 px-4 py-3"><span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</span><AdminMobileExpandableText value={value} label={label} className="text-sm font-semibold text-slate-900" /></div>)}</div>
      </div>)}
    </div>
  </div>
}
function EmployeeDetailLabel({ children }: { children: React.ReactNode }) { return <th className="w-[17%] bg-slate-50/70 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{children}</th> }
function EmployeeDetailValue({ label, value }: { label: string; value: string }) { return <td className="w-[33%] px-4 py-3"><AdminMobileExpandableText value={value} label={label} className="text-sm font-semibold text-slate-900" /></td> }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="text-xs font-medium text-slate-500">{label}<div className="mt-1">{children}</div></label> }
function PayrollStat({ label, value, positive = false, negative = false }: { label: string; value: string; positive?: boolean; negative?: boolean }) { return <div className="rounded-2xl border border-slate-200/70 bg-slate-50/90 px-3 py-2"><p className="text-slate-400">{label}</p><strong className={positive ? "text-emerald-600" : negative ? "text-rose-500" : "text-slate-900"}>{value}</strong></div> }
