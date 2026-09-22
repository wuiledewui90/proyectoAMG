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
  defaultTerms: string | null
}

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
  defaultTerms:
    "Precios expresados en pesos argentinos. Sujeto a disponibilidad de repuestos.",
}

type StoredSettings = Omit<ErpSettings, "defaultTaxRate"> & {
  defaultTaxRate: { toString(): string } | number
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
    defaultTerms: settings.defaultTerms,
  }
}
