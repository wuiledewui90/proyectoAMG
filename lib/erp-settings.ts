export type CardInstallmentRate = {
  installments: number
  surchargeRate: number
}

export type ErpSettings = {
  id: number
  businessName: string
  tagline: string | null
  taxId: string | null
  phone: string | null
  email: string | null
  address: string | null
  whatsapp: string | null
  quoteValidityDays: number
  invoiceDueDays: number
  defaultTaxRate: number
  cardInstallmentRates: CardInstallmentRate[]
  defaultTerms: string | null
}

export const defaultCardInstallmentRates: CardInstallmentRate[] = [
  { installments: 1, surchargeRate: 0 },
  { installments: 3, surchargeRate: 0 },
  { installments: 6, surchargeRate: 0 },
  { installments: 12, surchargeRate: 0 },
]

export const defaultErpSettings: ErpSettings = {
  id: 1,
  businessName: "Radiadores AMG",
  tagline: "Especialistas en refrigeración automotor",
  taxId: null as string | null,
  phone: "+54 9 380 452-4590",
  email: "info@radiadoresamg.com.ar",
  address: "Cerro de la Cruz 810 · La Rioja Capital",
  whatsapp: "5493804524590",
  quoteValidityDays: 15,
  invoiceDueDays: 30,
  defaultTaxRate: 0,
  cardInstallmentRates: defaultCardInstallmentRates,
  defaultTerms:
    "Precios expresados en pesos argentinos. Sujeto a disponibilidad de repuestos.",
}

type StoredSettings = Omit<ErpSettings, "defaultTaxRate" | "cardInstallmentRates"> & {
  defaultTaxRate: { toString(): string } | number
  cardInstallmentRates: unknown
}

export function normalizeCardInstallmentRates(value: unknown): CardInstallmentRate[] {
  if (!Array.isArray(value)) return defaultCardInstallmentRates.map((plan) => ({ ...plan }))

  const plans = value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return []
    const installments = Number((entry as Record<string, unknown>).installments)
    const surchargeRate = Number((entry as Record<string, unknown>).surchargeRate)
    if (
      !Number.isInteger(installments) ||
      installments < 1 ||
      installments > 60 ||
      !Number.isFinite(surchargeRate) ||
      surchargeRate < 0 ||
      surchargeRate > 100
    ) return []
    return [{ installments, surchargeRate: Math.round(surchargeRate * 100) / 100 }]
  })

  const unique = new Map<number, CardInstallmentRate>()
  plans.forEach((plan) => unique.set(plan.installments, plan))
  const normalized = Array.from(unique.values()).sort((left, right) => left.installments - right.installments)
  return normalized.length ? normalized : defaultCardInstallmentRates.map((plan) => ({ ...plan }))
}

export function serializeErpSettings(settings: StoredSettings): ErpSettings {
  return {
    id: settings.id,
    businessName: settings.businessName,
    tagline: settings.tagline,
    taxId: settings.taxId,
    phone: settings.phone,
    email: settings.email,
    address: settings.address,
    whatsapp: settings.whatsapp,
    quoteValidityDays: settings.quoteValidityDays,
    invoiceDueDays: settings.invoiceDueDays,
    defaultTaxRate: Number(settings.defaultTaxRate),
    cardInstallmentRates: normalizeCardInstallmentRates(settings.cardInstallmentRates),
    defaultTerms: settings.defaultTerms,
  }
}
