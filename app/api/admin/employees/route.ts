/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { getRequestAdminSession } from "@/lib/admin-request"
import { argentinaDate } from "@/lib/cash"
import { prisma } from "@/lib/db/prisma"

function text(value: unknown, max: number) {
  const normalized = typeof value === "string" ? value.trim() : ""
  return normalized ? normalized.slice(0, max) : null
}

function money(value: unknown) {
  const amount = Number(value || 0)
  return Number.isFinite(amount) && amount >= 0 ? amount : null
}

const paymentFrequencies = new Set(["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"])
const aguinaldoMethods = new Set(["HALF", "PERCENTAGE", "FIXED"])
const adjustmentTypes = new Set(["ABSENCE", "VACATION", "BREAKAGE", "SUSPENSION", "BONUS", "OTHER_DEDUCTION", "OTHER_ADDITION"])
const adjustmentImpacts = new Set(["ADDITION", "DEDUCTION", "INFORMATIVE"])
const adjustmentUnits = new Set(["HOURS", "DAYS", "AMOUNT"])

function monthlyEquivalent(baseSalary: number, frequency: string, workDaysPerWeek: number) {
  if (frequency === "DAILY") return baseSalary * workDaysPerWeek * (52 / 12)
  if (frequency === "WEEKLY") return baseSalary * (52 / 12)
  if (frequency === "BIWEEKLY") return baseSalary * (26 / 12)
  return baseSalary
}

function calculatedHourlyRate(baseSalary: number, frequency: string, hoursPerDay: number, workDaysPerWeek: number) {
  if (frequency === "DAILY") return baseSalary / hoursPerDay
  if (frequency === "WEEKLY") return baseSalary / (hoursPerDay * workDaysPerWeek)
  if (frequency === "BIWEEKLY") return baseSalary / (hoursPerDay * workDaysPerWeek * 2)
  return baseSalary / (hoursPerDay * workDaysPerWeek * (52 / 12))
}

function normalizedAguinaldoMonths(value: unknown) {
  const values = Array.isArray(value) ? value : String(value || "").split(",")
  return Array.from(
    new Set(
      values
        .map((month) => String(month).padStart(2, "0"))
        .filter((month) => /^(0[1-9]|1[0-2])$/.test(month))
    )
  ).sort()
}

function calculateAguinaldo(employee: any, period: string, monthlySalary: number) {
  if (!employee.aguinaldoEnabled) return 0
  const month = period.slice(5, 7)
  if (!normalizedAguinaldoMonths(employee.aguinaldoMonths).includes(month)) return 0
  if (employee.aguinaldoMethod === "FIXED") return Math.max(0, Number(employee.aguinaldoAmount) || 0)
  if (employee.aguinaldoMethod === "PERCENTAGE") {
    return monthlySalary * (Math.max(0, Number(employee.aguinaldoPercent) || 0) / 100)
  }
  return monthlySalary / 2
}

function serializeEmployee(employee: any) {
  return {
    ...employee,
    baseSalary: Number(employee.baseSalary),
    hourlyRate: Number(employee.hourlyRate),
    hoursPerDay: Number(employee.hoursPerDay),
    workDaysPerWeek: Number(employee.workDaysPerWeek),
    aguinaldoPercent: Number(employee.aguinaldoPercent),
    aguinaldoAmount: Number(employee.aguinaldoAmount),
    healthInsuranceAmount: Number(employee.healthInsuranceAmount),
    overtimeEntries: (employee.overtimeEntries || []).map((entry: any) => ({
      ...entry,
      hours: Number(entry.hours),
      multiplier: Number(entry.multiplier),
      hourlyRate: Number(entry.hourlyRate),
      amount: Number(entry.amount),
    })),
    payrolls: (employee.payrolls || []).map((payroll: any) => ({
      ...payroll,
      baseSalary: Number(payroll.baseSalary),
      overtimeHours: Number(payroll.overtimeHours),
      overtimeAmount: Number(payroll.overtimeAmount),
      bonuses: Number(payroll.bonuses),
      deductions: Number(payroll.deductions),
      adjustmentAdditions: Number(payroll.adjustmentAdditions),
      adjustmentDeductions: Number(payroll.adjustmentDeductions),
      aguinaldoAmount: Number(payroll.aguinaldoAmount),
      grossSalary: Number(payroll.grossSalary),
      netSalary: Number(payroll.netSalary),
    })),
    adjustments: (employee.adjustments || []).map((adjustment: any) => ({
      ...adjustment,
      quantity: Number(adjustment.quantity),
      unitValue: Number(adjustment.unitValue),
      amount: Number(adjustment.amount),
    })),
  }
}

async function requireAdmin(req: Request) {
  const session = await getRequestAdminSession(req)
  return session?.role === "ADMIN" ? session : null
}

const includeEmployee = {
  overtimeEntries: { orderBy: { workDate: "desc" as const }, take: 50 },
  adjustments: { orderBy: { eventDate: "desc" as const }, take: 100 },
  payrolls: { orderBy: { period: "desc" as const }, take: 24 },
}

export async function GET(req: Request) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Solo un administrador puede consultar empleados." }, { status: 403 })
  }
  const employees = await prisma.employee.findMany({
    orderBy: [{ active: "desc" }, { lastName: "asc" }, { firstName: "asc" }],
    include: includeEmployee,
  })
  return NextResponse.json(employees.map(serializeEmployee))
}

export async function POST(req: Request) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Solo un administrador puede gestionar empleados." }, { status: 403 })
  }
  const body = await req.json().catch(() => ({}))
  const action = String(body.action || "employee")

  try {
    if (action === "employee") {
      const employeeNumber = text(body.employeeNumber, 30)
      const firstName = text(body.firstName, 100)
      const lastName = text(body.lastName, 100)
      const dni = text(body.dni, 20)
      const position = text(body.position, 120)
      const baseSalary = money(body.baseSalary)
      const paymentFrequency = String(body.paymentFrequency || "MONTHLY")
      const hoursPerDay = Number(body.hoursPerDay)
      const workDaysPerWeek = Number(body.workDaysPerWeek)
      const aguinaldoEnabled = body.aguinaldoEnabled === true
      const aguinaldoMonths = normalizedAguinaldoMonths(body.aguinaldoMonths)
      const aguinaldoMethod = String(body.aguinaldoMethod || "HALF")
      const aguinaldoPercent = money(body.aguinaldoPercent)
      const aguinaldoAmount = money(body.aguinaldoAmount)
      const companyPaysHealthInsurance = body.companyPaysHealthInsurance === true
      const healthInsuranceAmount = money(body.healthInsuranceAmount)
      const startDate = body.startDate ? new Date(body.startDate) : null
      if (companyPaysHealthInsurance && (!text(body.healthInsurance, 120) || healthInsuranceAmount === null || healthInsuranceAmount <= 0)) {
        return NextResponse.json({ error: "Indicá el nombre y el valor mensual de la obra social que paga la empresa." }, { status: 400 })
      }
      if (!employeeNumber || !firstName || !lastName || !dni || !position || baseSalary === null || !paymentFrequencies.has(paymentFrequency) || !Number.isFinite(hoursPerDay) || hoursPerDay <= 0 || hoursPerDay > 24 || !Number.isFinite(workDaysPerWeek) || workDaysPerWeek <= 0 || workDaysPerWeek > 7 || !startDate || Number.isNaN(startDate.getTime()) || !aguinaldoMethods.has(aguinaldoMethod) || aguinaldoPercent === null || aguinaldoAmount === null || healthInsuranceAmount === null || (aguinaldoEnabled && !aguinaldoMonths.length)) {
        return NextResponse.json({ error: "Completá legajo, datos laborales, modalidad de pago y jornada." }, { status: 400 })
      }
      const hourlyRate = calculatedHourlyRate(baseSalary, paymentFrequency, hoursPerDay, workDaysPerWeek)
      const data = {
        employeeNumber,
        firstName,
        lastName,
        dni,
        cuil: text(body.cuil, 20),
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        phone: text(body.phone, 40),
        email: text(body.email, 191),
        address: text(body.address, 255),
        city: text(body.city, 100),
        position,
        department: text(body.department, 100),
        contractType: text(body.contractType, 30) || "PERMANENT",
        startDate,
        endDate: body.endDate ? new Date(body.endDate) : null,
        baseSalary,
        hourlyRate,
        paymentFrequency,
        hoursPerDay,
        workDaysPerWeek,
        aguinaldoEnabled,
        aguinaldoMonths: aguinaldoMonths.join(","),
        aguinaldoMethod,
        aguinaldoPercent,
        aguinaldoAmount,
        bank: text(body.bank, 100),
        cbu: text(body.cbu, 30),
        emergencyContact: text(body.emergencyContact, 160),
        emergencyPhone: text(body.emergencyPhone, 40),
        healthInsurance: text(body.healthInsurance, 120),
        healthInsuranceMemberNumber: text(body.healthInsuranceMemberNumber, 80),
        companyPaysHealthInsurance,
        healthInsuranceAmount: companyPaysHealthInsurance ? healthInsuranceAmount : 0,
        notes: text(body.notes, 5000),
        active: body.active !== false,
      }
      const id = Number(body.id)
      const employee = Number.isInteger(id) && id > 0
        ? await prisma.employee.update({ where: { id }, data, include: includeEmployee })
        : await prisma.employee.create({ data, include: includeEmployee })
      return NextResponse.json(serializeEmployee(employee), { status: Number.isInteger(id) ? 200 : 201 })
    }

    if (action === "bulk-payroll") {
      const period = String(body.period || "")
      const requestedIds: number[] = Array.isArray(body.employeeIds) ? body.employeeIds.map((value: unknown) => Number(value)) : []
      const employeeIds: number[] = [...new Set(requestedIds)].filter((id) => Number.isInteger(id) && id > 0)
      if (!/^\d{4}-\d{2}$/.test(period) || !employeeIds.length || employeeIds.length !== requestedIds.length || employeeIds.length > 100) {
        return NextResponse.json({ error: "Elegí un período y al menos un empleado válido." }, { status: 400 })
      }
      const [year, month] = period.split("-").map(Number)
      const start = new Date(Date.UTC(year, month - 1, 1))
      const end = new Date(Date.UTC(year, month, 1))
      const employees = await prisma.employee.findMany({
        where: { id: { in: employeeIds }, active: true },
        include: {
          overtimeEntries: { where: { workDate: { gte: start, lt: end }, settled: false } },
          adjustments: { where: { eventDate: { gte: start, lt: end }, settled: false } },
        },
      })
      if (employees.length !== employeeIds.length) {
        return NextResponse.json({ error: "Uno o más empleados no están disponibles para liquidar." }, { status: 409 })
      }
      const existing = await prisma.employeePayroll.findMany({ where: { employeeId: { in: employeeIds }, period }, select: { employeeId: true } })
      if (existing.length) {
        return NextResponse.json({ error: "Uno o más empleados ya tienen una liquidación para este período." }, { status: 409 })
      }
      const created = await prisma.$transaction(async (tx) => {
        const payrollIds: number[] = []
        for (const employee of employees) {
          const overtimeHours = employee.overtimeEntries.reduce((sum, entry) => sum + Number(entry.hours), 0)
          const overtimeAmount = employee.overtimeEntries.reduce((sum, entry) => sum + Number(entry.amount), 0)
          const adjustmentAdditions = employee.adjustments.filter((entry) => entry.impact === "ADDITION").reduce((sum, entry) => sum + Number(entry.amount), 0)
          const adjustmentDeductions = employee.adjustments.filter((entry) => entry.impact === "DEDUCTION").reduce((sum, entry) => sum + Number(entry.amount), 0)
          const baseSalary = monthlyEquivalent(Number(employee.baseSalary), employee.paymentFrequency, Number(employee.workDaysPerWeek))
          const aguinaldoAmount = calculateAguinaldo(employee, period, baseSalary)
          const grossSalary = baseSalary + overtimeAmount + adjustmentAdditions + aguinaldoAmount
          const netSalary = Math.max(0, grossSalary - adjustmentDeductions)
          const payroll = await tx.employeePayroll.create({
            data: { employeeId: employee.id, period, baseSalary, overtimeHours, overtimeAmount, bonuses: 0, deductions: 0, adjustmentAdditions, adjustmentDeductions, aguinaldoAmount, grossSalary, netSalary },
          })
          if (employee.overtimeEntries.length) {
            await tx.employeeOvertime.updateMany({ where: { id: { in: employee.overtimeEntries.map((entry) => entry.id) } }, data: { settled: true, payrollId: payroll.id } })
          }
          if (employee.adjustments.length) {
            await tx.employeeAdjustment.updateMany({ where: { id: { in: employee.adjustments.map((entry) => entry.id) } }, data: { settled: true, payrollId: payroll.id } })
          }
          payrollIds.push(payroll.id)
        }
        return payrollIds
      })
      return NextResponse.json({ created: created.length, payrollIds: created }, { status: 201 })
    }

    const employeeId = Number(body.employeeId)
    if (!Number.isInteger(employeeId) || employeeId <= 0) {
      return NextResponse.json({ error: "Empleado inválido." }, { status: 400 })
    }
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } })
    if (!employee) return NextResponse.json({ error: "Empleado no encontrado." }, { status: 404 })

    if (action === "overtime") {
      const calculationType = String(body.calculationType || "MULTIPLIER")
      const hours = Number(body.hours)
      const multiplier = Number(body.multiplier)
      const fixedAmount = Number(body.fixedAmount)
      const hourlyRate = Number(employee.hourlyRate)
      const workDate = body.workDate ? new Date(body.workDate) : null
      if (!new Set(["MULTIPLIER", "FIXED"]).has(calculationType) || !workDate || Number.isNaN(workDate.getTime()) || !Number.isFinite(hourlyRate) || hourlyRate < 0) {
        return NextResponse.json({ error: "Revisá la fecha y la forma de cálculo." }, { status: 400 })
      }
      if (calculationType === "MULTIPLIER" && (!Number.isFinite(hours) || hours <= 0 || hours > 24 || !Number.isFinite(multiplier) || multiplier < 1)) {
        return NextResponse.json({ error: "Ingresá una cantidad de horas y un recargo válidos." }, { status: 400 })
      }
      if (calculationType === "FIXED" && (!Number.isFinite(fixedAmount) || fixedAmount <= 0)) {
        return NextResponse.json({ error: "Ingresá el monto acordado para este trabajo." }, { status: 400 })
      }
      const overtime = await prisma.employeeOvertime.create({
        data: {
          employeeId,
          calculationType,
          workDate,
          hours: calculationType === "FIXED" ? 0 : hours,
          multiplier: calculationType === "FIXED" ? 1 : multiplier,
          hourlyRate,
          amount: calculationType === "FIXED" ? fixedAmount : hours * multiplier * hourlyRate,
          description: text(body.description, 255),
        },
      })
      return NextResponse.json({ id: overtime.id }, { status: 201 })
    }

    if (action === "adjustment") {
      const type = String(body.type || "")
      const impact = String(body.impact || "DEDUCTION")
      const unit = String(body.unit || "AMOUNT")
      const quantity = Number(body.quantity)
      const eventDate = body.eventDate ? new Date(body.eventDate) : null
      const endDate = body.endDate ? new Date(body.endDate) : null
      if (!adjustmentTypes.has(type) || !adjustmentImpacts.has(impact) || !adjustmentUnits.has(unit) || !Number.isFinite(quantity) || quantity <= 0 || !eventDate || Number.isNaN(eventDate.getTime()) || (endDate && Number.isNaN(endDate.getTime()))) {
        return NextResponse.json({ error: "Revisá el tipo de novedad, la fecha y la cantidad." }, { status: 400 })
      }
      const hourlyRate = Number(employee.hourlyRate)
      const hoursPerDay = Number(employee.hoursPerDay)
      let unitValue = unit === "HOURS" ? hourlyRate : unit === "DAYS" ? hourlyRate * hoursPerDay : Number(body.amount)
      if (impact === "INFORMATIVE") unitValue = 0
      if (!Number.isFinite(unitValue) || unitValue < 0) {
        return NextResponse.json({ error: "Ingresá un importe válido para la novedad." }, { status: 400 })
      }
      const adjustment = await prisma.employeeAdjustment.create({
        data: {
          employeeId,
          type,
          impact,
          eventDate,
          endDate,
          quantity,
          unit,
          unitValue,
          amount: unitValue * quantity,
          description: text(body.description, 500),
        },
      })
      return NextResponse.json({ id: adjustment.id, amount: Number(adjustment.amount) }, { status: 201 })
    }

    if (action === "payroll") {
      const period = String(body.period || "")
      if (!/^\d{4}-\d{2}$/.test(period)) {
        return NextResponse.json({ error: "Seleccioná un período válido." }, { status: 400 })
      }
      const [year, month] = period.split("-").map(Number)
      const start = new Date(Date.UTC(year, month - 1, 1))
      const end = new Date(Date.UTC(year, month, 1))
      const overtime = await prisma.employeeOvertime.findMany({
        where: { employeeId, workDate: { gte: start, lt: end }, settled: false },
      })
      const overtimeHours = overtime.reduce((sum, entry) => sum + Number(entry.hours), 0)
      const overtimeAmount = overtime.reduce((sum, entry) => sum + Number(entry.amount), 0)
      const adjustments = await prisma.employeeAdjustment.findMany({
        where: { employeeId, eventDate: { gte: start, lt: end }, settled: false },
      })
      const adjustmentAdditions = adjustments.filter((entry) => entry.impact === "ADDITION").reduce((sum, entry) => sum + Number(entry.amount), 0)
      const adjustmentDeductions = adjustments.filter((entry) => entry.impact === "DEDUCTION").reduce((sum, entry) => sum + Number(entry.amount), 0)
      const bonuses = money(body.bonuses)
      const deductions = money(body.deductions)
      if (bonuses === null || deductions === null) {
        return NextResponse.json({ error: "Bonos y descuentos deben ser importes positivos." }, { status: 400 })
      }
      const baseSalary = monthlyEquivalent(Number(employee.baseSalary), employee.paymentFrequency, Number(employee.workDaysPerWeek))
      const aguinaldoAmount = calculateAguinaldo(employee, period, baseSalary)
      const grossSalary = baseSalary + overtimeAmount + bonuses + adjustmentAdditions + aguinaldoAmount
      const netSalary = Math.max(0, grossSalary - deductions - adjustmentDeductions)
      const payroll = await prisma.$transaction(async (tx) => {
        const created = await tx.employeePayroll.create({
          data: {
            employeeId,
            period,
            baseSalary,
            overtimeHours,
            overtimeAmount,
            bonuses,
            deductions,
            adjustmentAdditions,
            adjustmentDeductions,
            aguinaldoAmount,
            grossSalary,
            netSalary,
            notes: text(body.notes, 5000),
          },
        })
        if (overtime.length) {
          await tx.employeeOvertime.updateMany({
            where: { id: { in: overtime.map((entry) => entry.id) } },
            data: { settled: true, payrollId: created.id },
          })
        }
        if (adjustments.length) {
          await tx.employeeAdjustment.updateMany({
            where: { id: { in: adjustments.map((entry) => entry.id) } },
            data: { settled: true, payrollId: created.id },
          })
        }
        return created
      })
      return NextResponse.json({ id: payroll.id, netSalary }, { status: 201 })
    }

    return NextResponse.json({ error: "Acción inválida." }, { status: 400 })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un empleado o una liquidación con esos datos." }, { status: 409 })
    }
    return NextResponse.json({ error: "No se pudo guardar la información." }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: "No autorizado." }, { status: 403 })
  const body = await req.json().catch(() => ({}))

  if (body.action === "bulk-payroll-payment") {
    const requested = Array.isArray(body.payments) ? body.payments : []
    if (!requested.length || requested.length > 100) {
      return NextResponse.json({ error: "Seleccioná al menos una liquidación para pagar." }, { status: 400 })
    }
    const payments = requested.map((item: unknown) => {
      const value = item && typeof item === "object" ? item as Record<string, unknown> : {}
      return { payrollId: Number(value.payrollId), paymentMethod: String(value.paymentMethod || "") }
    })
    const ids = payments.map((item: { payrollId: number }) => item.payrollId)
    if (new Set(ids).size !== ids.length || payments.some((item: { payrollId: number; paymentMethod: string }) => !Number.isInteger(item.payrollId) || !["CASH", "TRANSFER"].includes(item.paymentMethod))) {
      return NextResponse.json({ error: "Revisá las liquidaciones y sus medios de pago." }, { status: 400 })
    }
    const payrolls = await prisma.employeePayroll.findMany({
      where: { id: { in: ids } },
      include: { employee: { select: { firstName: true, lastName: true } } },
    })
    if (payrolls.length !== ids.length || payrolls.some((item) => !["DRAFT", "APPROVED"].includes(item.status) || item.cashMovementId)) {
      return NextResponse.json({ error: "Una o más liquidaciones ya fueron pagadas o no están disponibles." }, { status: 409 })
    }
    const cashSession = await prisma.cashSession.findUnique({ where: { businessDate: argentinaDate() } })
    if (!cashSession) return NextResponse.json({ error: "Primero abrí la caja de hoy para registrar los pagos." }, { status: 409 })
    if (cashSession.closedAt) return NextResponse.json({ error: "La caja de hoy está cerrada. Reabrila antes de registrar los pagos." }, { status: 409 })

    try {
      const paidAt = new Date()
      const result = await prisma.$transaction(async (tx) => {
        const movements: number[] = []
        for (const payment of payments) {
          const payroll = payrolls.find((item) => item.id === payment.payrollId)!
          const claimed = await tx.employeePayroll.updateMany({
            where: { id: payroll.id, status: { in: ["DRAFT", "APPROVED"] }, cashMovementId: null },
            data: { status: "PAID", paidAt, paymentMethod: payment.paymentMethod },
          })
          if (claimed.count !== 1) throw new Error("PAYROLL_ALREADY_PROCESSED")
          const movement = await tx.cashMovement.create({
            data: {
              sessionId: cashSession.id,
              type: "EXPENSE",
              description: `Sueldo ${payroll.period} · ${payroll.employee.firstName} ${payroll.employee.lastName}`,
              amount: payroll.netSalary,
              paymentMethod: payment.paymentMethod as "CASH" | "TRANSFER",
              createdById: admin.userId || null,
            },
          })
          await tx.employeePayroll.update({ where: { id: payroll.id }, data: { cashMovementId: movement.id } })
          movements.push(movement.id)
        }
        return movements
      })
      return NextResponse.json({ paid: result.length, cashMovementIds: result })
    } catch {
      return NextResponse.json({ error: "Alguna liquidación cambió mientras realizabas el pago. Actualizá la lista e intentá nuevamente." }, { status: 409 })
    }
  }

  const payrollId = Number(body.payrollId)
  if (!Number.isInteger(payrollId) || !["DRAFT", "APPROVED", "PAID"].includes(body.status)) {
    return NextResponse.json({ error: "Liquidación o estado inválido." }, { status: 400 })
  }
  const currentPayroll = await prisma.employeePayroll.findUnique({
    where: { id: payrollId },
    include: { employee: { select: { firstName: true, lastName: true, employeeNumber: true } } },
  })
  if (!currentPayroll) return NextResponse.json({ error: "Liquidación no encontrada." }, { status: 404 })

  if (body.status === "PAID") {
    if (currentPayroll.status === "PAID" && currentPayroll.cashMovementId) {
      return NextResponse.json({ id: currentPayroll.id, status: currentPayroll.status, cashMovementId: currentPayroll.cashMovementId })
    }
    const paymentMethod = String(body.paymentMethod || "")
    if (!new Set(["CASH", "TRANSFER"]).has(paymentMethod)) {
      return NextResponse.json({ error: "Elegí efectivo o transferencia para registrar el pago." }, { status: 400 })
    }
    const cashSession = await prisma.cashSession.findUnique({ where: { businessDate: argentinaDate() } })
    if (!cashSession) return NextResponse.json({ error: "Primero abrí la caja de hoy para registrar el pago." }, { status: 409 })
    if (cashSession.closedAt) return NextResponse.json({ error: "La caja de hoy está cerrada. Reabrila antes de registrar el pago." }, { status: 409 })

    const payroll = await prisma.$transaction(async (tx) => {
      const movement = await tx.cashMovement.create({
        data: {
          sessionId: cashSession.id,
          type: "EXPENSE",
          description: `Sueldo ${currentPayroll.period} · ${currentPayroll.employee.firstName} ${currentPayroll.employee.lastName}`,
          amount: currentPayroll.netSalary,
          paymentMethod: paymentMethod as "CASH" | "TRANSFER",
          createdById: admin.userId || null,
        },
      })
      return tx.employeePayroll.update({
        where: { id: payrollId },
        data: { status: "PAID", paidAt: new Date(), paymentMethod, cashMovementId: movement.id },
      })
    })
    return NextResponse.json({ id: payroll.id, status: payroll.status, cashMovementId: payroll.cashMovementId })
  }

  if (currentPayroll.status === "PAID") {
    return NextResponse.json({ error: "Una liquidación pagada no puede volver a un estado anterior porque ya forma parte de Caja." }, { status: 409 })
  }
  const payroll = await prisma.employeePayroll.update({ where: { id: payrollId }, data: { status: body.status } })
  return NextResponse.json({ id: payroll.id, status: payroll.status })
}

export async function DELETE(req: Request) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "No autorizado." }, { status: 403 })
  const params = new URL(req.url).searchParams
  const type = params.get("type")
  const id = Number(params.get("id"))
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Registro inválido." }, { status: 400 })
  if (type === "overtime") await prisma.employeeOvertime.delete({ where: { id } })
  else if (type === "adjustment") await prisma.employeeAdjustment.delete({ where: { id } })
  else if (type === "payroll") {
    const payroll = await prisma.employeePayroll.findUnique({ where: { id } })
    if (payroll?.status === "PAID" || payroll?.cashMovementId) {
      return NextResponse.json({ error: "No se puede eliminar una liquidación pagada porque ya forma parte del arqueo de Caja." }, { status: 409 })
    }
    await prisma.$transaction([
      prisma.employeeOvertime.updateMany({ where: { payrollId: id }, data: { settled: false, payrollId: null } }),
      prisma.employeeAdjustment.updateMany({ where: { payrollId: id }, data: { settled: false, payrollId: null } }),
      prisma.employeePayroll.delete({ where: { id } }),
    ])
  }
  else await prisma.employee.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
