import Image from "next/image"
import { notFound } from "next/navigation"
import {
  CalendarDays,
  FileText,
  Handshake,
  Mail,
  MapPin,
  Phone,
  Settings,
  ShieldCheck,
  UserRound,
  Wrench,
} from "lucide-react"
import { prisma } from "@/lib/db/prisma"
import { formatPrice } from "@/lib/data"
import { documentCode, documentStatusLabels, documentTypeLabels } from "@/lib/documents"
import { defaultErpSettings, serializeErpSettings } from "@/lib/erp-settings"
import { DocumentActions } from "./document-actions"

export const dynamic = "force-dynamic"
export const revalidate = 0

function formatDate(value: Date | null) {
  return value?.toLocaleDateString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
  }) || "—"
}

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const id = Number((await params).id)
  if (!Number.isInteger(id)) notFound()

  const [document, storedSettings] = await Promise.all([
    prisma.erpDocument.findUnique({
      where: { id },
      include: {
        items: { orderBy: { id: "asc" } },
        sourceDocument: { select: { id: true, type: true } },
        convertedDocuments: {
          where: { type: "INVOICE" },
          select: { id: true },
          take: 1,
        },
      },
    }),
    prisma.erpSetting.findUnique({ where: { id: 1 } }),
  ])
  if (!document) notFound()

  const code = documentCode(document.type, document.id)
  const expiration =
    document.type === "INVOICE" ? document.dueDate : document.validUntil
  const business = storedSettings
    ? serializeErpSettings(storedSettings)
    : defaultErpSettings
  const title = documentTypeLabels[document.type]
  const contactLine = [business.phone, business.email].filter(Boolean).join(" · ")

  return (
    <div className="mx-auto max-w-5xl print:max-w-none">
      <DocumentActions
        id={document.id}
        canEdit={document.status === "DRAFT"}
        canConvert={
          document.type !== "INVOICE" && document.convertedDocuments.length === 0
        }
      />

      <article className="amg-document mx-auto flex min-h-[1180px] max-w-[850px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-[#09213c] shadow-xl print:min-h-0 print:max-w-none print:rounded-none print:border-0 print:shadow-none">
        <header className="relative isolate min-h-[230px] overflow-hidden bg-[#071b33] text-white print:min-h-[53mm]">
          <div
            className="absolute inset-y-0 left-0 w-[67%] bg-white [clip-path:polygon(0_0,100%_0,78%_100%,0_100%)]"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_73%_22%,rgba(34,92,145,.5),transparent_40%),linear-gradient(120deg,transparent_48%,rgba(255,255,255,.05)_48%_50%,transparent_50%)]"
            aria-hidden="true"
          />
          <div
            className="absolute inset-y-[-12%] left-[57%] w-4 -skew-x-[18deg] bg-[#009de0]"
            aria-hidden="true"
          />
          <div
            className="absolute inset-y-[-12%] left-[59.2%] w-3 -skew-x-[18deg] bg-[#d20a1e]"
            aria-hidden="true"
          />

          <div className="relative z-10 grid min-h-[230px] grid-cols-[58%_42%] print:min-h-[53mm]">
            <div className="flex flex-col justify-between px-7 py-6 pr-14 text-[#09213c] sm:px-9 sm:pr-20 print:px-8 print:py-5 print:pr-16">
              <Image
                src="/images/documents/amg-logo-document.png"
                alt="AMG Radiadores"
                width={1768}
                height={768}
                priority
                className="h-auto w-[245px] max-w-full object-contain object-left"
              />

              <div className="mt-3 space-y-1.5 text-[10px] font-medium leading-tight sm:text-xs print:text-[8.5px]">
                {business.address && (
                  <p className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {business.address}
                  </p>
                )}
                {business.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    {business.phone}
                  </p>
                )}
                {business.email && (
                  <p className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    {business.email}
                  </p>
                )}
                {business.taxId && (
                  <p className="pl-[22px]">CUIT: {business.taxId}</p>
                )}
              </div>
            </div>

            <div className="relative overflow-hidden px-5 py-6 print:py-5">
              <div className="relative z-10 ml-6 mt-14 max-w-[150px] text-[9px] uppercase tracking-[0.12em] text-white/85 print:ml-5 print:mt-10 print:text-[7.5px]">
                <p className="font-bold text-white">
                  ESPECIALISTAS EN<br />
                  SISTEMAS DE<br />
                  REFRIGERACIÓN
                </p>
                <div className="mt-4 space-y-1.5 text-[8px] tracking-[0.06em] print:text-[6.5px]">
                  <p className="flex items-center gap-1.5"><Settings className="h-3 w-3" /> Radiadores</p>
                  <p className="flex items-center gap-1.5"><Wrench className="h-3 w-3" /> Reparación</p>
                  <p className="flex items-center gap-1.5"><ShieldCheck className="h-3 w-3" /> Repuestos</p>
                </div>
              </div>
              <Image
                src="/images/documents/radiator-document.png"
                alt="Radiador automotor"
                width={1200}
                height={1200}
                priority
                className="absolute -bottom-12 -right-20 z-0 h-[225px] w-[225px] object-contain drop-shadow-[0_14px_28px_rgba(0,0,0,.5)] sm:-right-12 sm:h-[255px] sm:w-[255px] print:-bottom-10 print:-right-12 print:h-[54mm] print:w-[54mm]"
              />
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col px-6 pb-0 pt-5 sm:px-8 print:px-7 print:pt-4">
          <section className="amg-document-section flex items-start justify-between gap-5">
            <div>
              <h1 className="font-display text-4xl font-black uppercase leading-none tracking-[-0.04em] text-[#071b33] sm:text-5xl print:text-[28px]">
                {title}
              </h1>
              <div className="mt-2 flex h-1.5 w-44 overflow-hidden">
                <span className="w-1/3 bg-[#d20a1e]" />
                <span className="w-1/3 bg-slate-300" />
                <span className="w-1/3 bg-[#009de0]" />
              </div>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                N° {code}
              </p>
            </div>

            <div className="min-w-[190px] rounded-md border border-[#8ca4bc] bg-white p-3 text-xs shadow-sm print:min-w-[42mm] print:p-2.5 print:text-[8px]">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-7 w-7 text-[#09213c] print:h-5 print:w-5" />
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-slate-500">Fecha de emisión</p>
                  <p className="font-bold text-[#09213c]">{formatDate(document.issueDate)}</p>
                </div>
              </div>
              {expiration && (
                <p className="mt-2 border-t pt-1.5 text-[10px] print:text-[7px]">
                  {document.type === "INVOICE" ? "Vencimiento" : "Válido hasta"}: <strong>{formatDate(expiration)}</strong>
                </p>
              )}
              <p className="mt-2 rounded-full bg-[#e8edf3] px-3 py-1 text-center text-[9px] font-extrabold uppercase tracking-wider text-[#09213c] print:mt-1 print:py-0.5 print:text-[7px]">
                {documentStatusLabels[document.status]}
              </p>
            </div>
          </section>

          <section className="amg-document-section mt-4 overflow-hidden rounded-md border border-[#a9bdd0]">
            <div className="flex items-center gap-2 bg-[#08223e] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white print:py-1.5 print:text-[8px]">
              <UserRound className="h-4 w-4" /> Datos del cliente
            </div>
            <div className="grid gap-4 bg-[#f8fafc] px-4 py-3 text-xs sm:grid-cols-2 print:grid-cols-2 print:gap-2 print:py-2 print:text-[8px]">
              <div className="space-y-1.5">
                <p><span className="inline-block w-20 text-slate-500">Cliente:</span><strong>{document.customerName}</strong></p>
                <p><span className="inline-block w-20 text-slate-500">DNI / CUIT:</span>{document.customerTaxId || "—"}</p>
                <p><span className="inline-block w-20 text-slate-500">Dirección:</span>{document.customerAddress || "—"}</p>
              </div>
              <div className="space-y-1.5 border-slate-300 sm:border-l sm:pl-5 print:border-l print:pl-4">
                <p><span className="inline-block w-20 text-slate-500">Teléfono:</span>{document.customerPhone || "—"}</p>
                <p><span className="inline-block w-20 text-slate-500">E-mail:</span>{document.customerEmail || "—"}</p>
                <p><span className="inline-block w-20 text-slate-500">Vehículo:</span>{[document.vehicleDescription, document.vehiclePlate].filter(Boolean).join(" · ") || "—"}</p>
              </div>
            </div>
          </section>

          <section className="mt-4 overflow-hidden rounded-md border border-[#a9bdd0]">
            <table className="amg-document-table w-full table-fixed text-left text-xs print:text-[8px]">
              <thead className="bg-[#08223e] text-[10px] uppercase text-white print:text-[7px]">
                <tr>
                  <th className="w-10 border-r border-white/15 px-3 py-2.5 text-center print:py-1.5">#</th>
                  <th className="border-r border-white/15 px-3 py-2.5 print:py-1.5">Descripción</th>
                  <th className="w-24 border-r border-white/15 px-3 py-2.5 text-center print:w-[20mm] print:py-1.5">Cantidad</th>
                  <th className="w-28 border-r border-white/15 px-3 py-2.5 text-right print:w-[25mm] print:py-1.5">Precio unit.</th>
                  <th className="w-28 px-3 py-2.5 text-right print:w-[25mm] print:py-1.5">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {document.items.map((item, index) => (
                  <tr key={item.id} className="border-t border-[#cfdae4] even:bg-[#f8fafc]">
                    <td className="border-r border-[#cfdae4] px-3 py-3 text-center text-slate-500 print:py-2">{index + 1}</td>
                    <td className="border-r border-[#cfdae4] px-3 py-3 font-medium print:py-2">{item.description}</td>
                    <td className="border-r border-[#cfdae4] px-3 py-3 text-center print:py-2">{Number(item.quantity).toLocaleString("es-AR", { maximumFractionDigits: 2 })}</td>
                    <td className="border-r border-[#cfdae4] px-3 py-3 text-right print:py-2">{formatPrice(Number(item.unitPrice))}</td>
                    <td className="px-3 py-3 text-right font-bold print:py-2">{formatPrice(Number(item.subtotal))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <div className="amg-document-section mt-4 grid gap-4 sm:grid-cols-[1fr_280px] print:grid-cols-[1fr_64mm] print:gap-3">
            <div className="rounded-md bg-[linear-gradient(135deg,#f0f4f8,#e2e8f0)] p-4 text-xs print:p-3 print:text-[8px]">
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#09213c] print:text-[7px]">
                <FileText className="h-4 w-4" /> Observaciones
              </p>
              <p className="mt-3 whitespace-pre-wrap leading-relaxed text-slate-600">
                {document.notes || "Comprobante generado desde el sistema de gestión de Radiadores AMG."}
              </p>
              {document.sourceDocument && (
                <p className="mt-2 text-slate-500">
                  Originada desde {documentCode(document.sourceDocument.type, document.sourceDocument.id)}.
                </p>
              )}
            </div>

            <div className="overflow-hidden rounded-md border border-[#cfdae4] text-xs print:text-[8px]">
              <div className="space-y-2 bg-[#eef3f7] p-3">
                <div className="flex justify-between"><span>Subtotal</span><strong>{formatPrice(Number(document.subtotal))}</strong></div>
                {Number(document.discount) > 0 && <div className="flex justify-between"><span>Descuento</span><strong>− {formatPrice(Number(document.discount))}</strong></div>}
                {Number(document.taxRate) > 0 && <div className="flex justify-between"><span>IVA / impuesto ({Number(document.taxRate).toLocaleString("es-AR")}%)</span><strong>{formatPrice(Number(document.taxAmount))}</strong></div>}
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-[#cfdae4] bg-[#e5ebf1] px-3 py-3">
                <span className="text-base font-black uppercase print:text-[11px]">Total</span>
                <strong className="rounded-md bg-[#cf0717] px-4 py-2 text-lg text-white print:px-3 print:py-1.5 print:text-[12px]">{formatPrice(Number(document.total))}</strong>
              </div>
            </div>
          </div>

          {document.terms && (
            <section className="amg-document-section mt-3 rounded-md border border-[#d7e0e8] px-4 py-3 text-[10px] leading-relaxed text-slate-500 print:px-3 print:py-2 print:text-[7px]">
              <strong className="uppercase text-[#09213c]">Condiciones: </strong>
              <span className="whitespace-pre-wrap">{document.terms}</span>
            </section>
          )}

          <section className="amg-document-section mt-5 grid grid-cols-3 border-y border-[#c9d5df] py-4 print:mt-3 print:py-2.5">
            <div className="flex items-center justify-center gap-3 border-r border-[#c9d5df] px-3">
              <Handshake className="h-9 w-9 shrink-0 rounded-full border border-[#8ca4bc] p-2 text-[#09213c] print:h-7 print:w-7" />
              <p className="text-[9px] font-bold uppercase leading-snug tracking-wide print:text-[6.5px]">Tu vehículo<br />en buenas manos</p>
            </div>
            <div className="flex items-center justify-center gap-3 border-r border-[#c9d5df] px-3">
              <ShieldCheck className="h-9 w-9 shrink-0 rounded-full border border-[#8ca4bc] p-2 text-[#09213c] print:h-7 print:w-7" />
              <p className="text-[9px] font-bold uppercase leading-snug tracking-wide print:text-[6.5px]">Calidad y servicio<br />con confianza</p>
            </div>
            <div className="flex items-center justify-center gap-3 px-3">
              <Settings className="h-9 w-9 shrink-0 rounded-full border border-[#8ca4bc] p-2 text-[#09213c] print:h-7 print:w-7" />
              <p className="text-[9px] font-bold uppercase leading-snug tracking-wide print:text-[6.5px]">Soluciones reales<br />para que sigas</p>
            </div>
          </section>

          <section className="amg-document-section mt-5 grid grid-cols-2 items-end gap-8 px-2 pb-5 text-[10px] text-slate-500 print:mt-3 print:pb-3 print:text-[7px]">
            <div>
              <p className="font-semibold text-[#09213c]">Gracias por confiar en {business.businessName}.</p>
              {contactLine && <p className="mt-1">{contactLine}</p>}
              {document.type === "INVOICE" && (
                <p className="mt-1">Comprobante comercial interno. No reemplaza la factura electrónica fiscal autorizada por ARCA.</p>
              )}
            </div>
            <div className="ml-auto w-48 border-t border-[#5d7185] pt-2 text-center print:w-[42mm]">
              Firma y aclaración
            </div>
          </section>
        </div>

        <footer className="amg-document-footer relative mt-auto overflow-hidden bg-[#071b33] px-8 py-5 text-white print:px-7 print:py-3">
          <div className="absolute inset-y-[-30%] left-5 w-4 -skew-x-[28deg] bg-[#d20a1e]" aria-hidden="true" />
          <div className="absolute inset-y-[-30%] left-10 w-4 -skew-x-[28deg] bg-white/75" aria-hidden="true" />
          <div className="absolute inset-y-[-30%] left-[60px] w-4 -skew-x-[28deg] bg-[#009de0]" aria-hidden="true" />
          <div className="relative flex items-center justify-between gap-5 pl-16 text-[9px] uppercase tracking-[0.13em] print:text-[6.5px]">
            <div>
              <p>Sistemas de refrigeración</p>
              <p className="text-white/70">que mantienen tu motor en marcha.</p>
              <div className="mt-2 flex h-0.5 w-28"><span className="w-1/3 bg-[#d20a1e]" /><span className="w-1/3 bg-white" /><span className="w-1/3 bg-[#009de0]" /></div>
            </div>
            {business.address && (
              <p className="flex max-w-[220px] items-center gap-2 text-right text-white/80">
                <MapPin className="h-4 w-4 shrink-0 text-white" /> {business.address}
              </p>
            )}
          </div>
        </footer>
      </article>
    </div>
  )
}
