/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { BadgeDollarSign, CalendarClock, CarFront, CheckCircle2, ClipboardPlus, PackagePlus, Pencil, Plus, ReceiptText, Search, Trash2, UserPlus, UsersRound, Wrench, X } from "lucide-react"
import { formatPrice } from "@/lib/data"

type Customer = { id:number; name:string; phone:string|null; email:string|null; taxId:string|null; address:string|null; vehiclePlate:string|null; vehicleBrand:string|null; vehicleModel:string|null; vehicleYear:number|null; currentAccountEnabled?:boolean; hasCurrentAccount?:boolean }
type User = { id:string; name:string; role:string; active:boolean }
type Product = { id:number; name:string; sku:string|null; price:number; stock:number; isActive:boolean; category:string|null; stockCategory:string|null }
type OrderItem = { id?:number; productId:number|null; kind:"PART"|"SERVICE"; description:string; quantity:number; unitPrice:number; subtotal:number }
type FormLine = { productId:string; kind:"PART"|"SERVICE"; description:string; quantity:string; unitPrice:string }
type Order = { id:number; vehiclePlate:string; vehicleDescription:string|null; problem:string; diagnosis:string|null; workPerformed:string|null; partsCost:number; laborCost:number; total:number; status:string; createdAt:string; receivedAt:string; estimatedDelivery:string|null; invoiceDocumentId:number|null; invoiceDocument:{id:number;status:string}|null; items:OrderItem[]; customer:Customer|null; assignedTo:User|null }

const labels:Record<string,string> = { OPEN:"Ingresada", DIAGNOSIS:"Diagnóstico", WAITING_PARTS:"Esperando repuestos", IN_PROGRESS:"En reparación", READY:"Lista para entregar", DELIVERED:"Entregada", CANCELLED:"Cancelada" }
function localDateTimeInput(value:Date|string = new Date()) { const date = new Date(value); const local = new Date(date.getTime()-date.getTimezoneOffset()*60000); return local.toISOString().slice(0,16) }
const emptyOrder = () => ({ customerId:"", assignedToId:"", vehiclePlate:"", vehicleDescription:"", problem:"", receivedAt:localDateTimeInput(), estimatedDelivery:"" })
const emptyLine = (kind:"PART"|"SERVICE"="PART"):FormLine => ({ productId:"",kind,description:kind==="SERVICE"?"Mano de obra":"",quantity:"1",unitPrice:"" })
const emptyCustomer = { name:"", phone:"", email:"", taxId:"", address:"", vehiclePlate:"", vehicleBrand:"", vehicleModel:"", vehicleYear:"", notes:"", currentAccountEnabled:false }
const inputClass = "h-11 w-full !rounded-2xl border border-slate-200 bg-white/75 px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
function productCategory(product:Product) { return product.stockCategory?.trim() || product.category?.trim() || "Sin categoría" }

export default function WorkshopPage() {
  const router = useRouter()
  const [orders,setOrders] = useState<Order[]>([])
  const [customers,setCustomers] = useState<Customer[]>([])
  const [users,setUsers] = useState<User[]>([])
  const [products,setProducts] = useState<Product[]>([])
  const [filter,setFilter] = useState("ACTIVE")
  const [query,setQuery] = useState("")
  const [message,setMessage] = useState("")
  const [busy,setBusy] = useState(false)
  const [orderOpen,setOrderOpen] = useState(false)
  const [customerOpen,setCustomerOpen] = useState(false)
  const [productPickerLine,setProductPickerLine] = useState<number|null>(null)
  const [productQuery,setProductQuery] = useState("")
  const [openProductCategories,setOpenProductCategories] = useState<Record<string,boolean>>({})
  const [addedProduct,setAddedProduct] = useState<string|null>(null)
  const [editingId,setEditingId] = useState<number|null>(null)
  const [form,setForm] = useState(emptyOrder())
  const [lines,setLines] = useState<FormLine[]>([])
  const [customerForm,setCustomerForm] = useState(emptyCustomer)

  async function load() {
    const [ordersResponse,customersResponse,usersResponse,productsResponse] = await Promise.all([fetch("/api/admin/work-orders",{cache:"no-store"}),fetch("/api/admin/customers",{cache:"no-store"}),fetch("/api/admin/users",{cache:"no-store"}),fetch("/api/admin/product-picker",{cache:"no-store"})])
    if (ordersResponse.ok) setOrders(await ordersResponse.json())
    if (customersResponse.ok) setCustomers(await customersResponse.json())
    if (usersResponse.ok) setUsers(await usersResponse.json())
    if (productsResponse.ok) setProducts(await productsResponse.json())
  }

  useEffect(()=>{ void load() },[])
  useEffect(()=>{
    if (!orderOpen && !customerOpen && productPickerLine === null && !addedProduct) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    function closeWithEscape(event:KeyboardEvent) { if (event.key !== "Escape" || busy) return; if (addedProduct) setAddedProduct(null); else if (productPickerLine !== null) setProductPickerLine(null); else if (customerOpen) setCustomerOpen(false); else setOrderOpen(false) }
    window.addEventListener("keydown",closeWithEscape)
    return ()=>{ document.body.style.overflow = previousOverflow; window.removeEventListener("keydown",closeWithEscape) }
  },[orderOpen,customerOpen,productPickerLine,addedProduct,busy])

  const visible = useMemo(()=>{
    const normalized = query.trim().toLocaleLowerCase("es")
    return orders.filter((order)=>{
      const matchesFilter = filter === "ALL" || (filter === "ACTIVE" ? !["DELIVERED","CANCELLED"].includes(order.status) : order.status === filter)
      const matchesQuery = !normalized || `${order.vehiclePlate} ${order.customer?.name || ""} ${order.vehicleDescription || ""} ${order.problem}`.toLocaleLowerCase("es").includes(normalized)
      return matchesFilter && matchesQuery
    })
  },[orders,filter,query])

  const productsByCategory = useMemo(()=>{
    const normalized = productQuery.trim().toLocaleLowerCase("es")
    const grouped = new Map<string,Product[]>()
    products
      .filter((product)=>product.isActive && (!normalized || `${product.name} ${product.sku || ""} ${productCategory(product)}`.toLocaleLowerCase("es").includes(normalized)))
      .forEach((product)=>{
        const category = productCategory(product)
        grouped.set(category,[...(grouped.get(category)||[]),product])
      })
    return [...grouped.entries()]
      .sort(([left],[right])=>left.localeCompare(right,"es"))
      .map(([category,items])=>({category,items:items.sort((left,right)=>left.name.localeCompare(right.name,"es"))}))
  },[products,productQuery])

  const activeCount = orders.filter((order)=>!["DELIVERED","CANCELLED"].includes(order.status)).length
  const readyCount = orders.filter((order)=>order.status === "READY").length
  const mechanics = users.filter((user)=>user.active && user.role === "TECHNICIAN")
  const estimatedTotal = lines.reduce((sum,line)=>sum+(Number(line.quantity)||0)*(Number(line.unitPrice)||0),0)

  function selectCustomer(customerId:string) {
    const customer = customers.find((item)=>item.id === Number(customerId))
    setForm((current)=>({ ...current, customerId, vehiclePlate:customer?.vehiclePlate || current.vehiclePlate, vehicleDescription:customer ? [customer.vehicleBrand,customer.vehicleModel,customer.vehicleYear].filter(Boolean).join(" ") : current.vehicleDescription }))
  }
  function openOrder() { setMessage(""); setEditingId(null); setForm(emptyOrder()); setLines([]); setOrderOpen(true) }
  function openEdit(order:Order) {
    if (order.invoiceDocumentId) { router.push(`/admin/documentos/${order.invoiceDocumentId}`); return }
    setMessage(""); setEditingId(order.id)
    setForm({customerId:order.customer?String(order.customer.id):"",assignedToId:order.assignedTo?.id||"",vehiclePlate:order.vehiclePlate,vehicleDescription:order.vehicleDescription||"",problem:order.problem,receivedAt:localDateTimeInput(order.receivedAt||order.createdAt),estimatedDelivery:order.estimatedDelivery?localDateTimeInput(order.estimatedDelivery):""})
    setLines(order.items.map((item)=>({productId:item.productId?String(item.productId):"",kind:item.kind,description:item.description,quantity:String(item.quantity),unitPrice:String(item.unitPrice)})))
    setOrderOpen(true)
  }
  function openCustomer() { setMessage(""); setCustomerForm(emptyCustomer); setCustomerOpen(true) }

  async function createOrder(event:React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("")
    const response = await fetch("/api/admin/work-orders",{method:editingId?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,...(editingId?{id:editingId,action:"details"}:{}),items:lines})})
    const data = await response.json().catch(()=>null)
    if (!response.ok) setMessage(data?.error || "No se pudo guardar la orden.")
    else { setForm(emptyOrder()); setLines([]); setEditingId(null); setOrderOpen(false); setMessage(editingId?`Orden #${data.id} actualizada.`:`Orden #${data.id} creada correctamente.`); await load() }
    setBusy(false)
  }

  async function createCustomer(event:React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("")
    const response = await fetch("/api/admin/customers",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(customerForm)})
    const data = await response.json().catch(()=>null)
    if (!response.ok) setMessage(data?.error || "No se pudo guardar el cliente.")
    else {
      await load()
      setForm((current)=>({...current,customerId:String(data.id),vehiclePlate:data.vehiclePlate || current.vehiclePlate,vehicleDescription:[data.vehicleBrand,data.vehicleModel,data.vehicleYear].filter(Boolean).join(" ") || current.vehicleDescription}))
      setCustomerForm(emptyCustomer); setCustomerOpen(false); setMessage("Cliente guardado y vinculado a la agenda de Ventas.")
    }
    setBusy(false)
  }

  async function status(id:number,value:string) { await fetch("/api/admin/work-orders",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,status:value})}); await load() }

  function updateLine(index:number,data:Partial<FormLine>) { setLines((current)=>current.map((line,lineIndex)=>lineIndex===index?{...line,...data}:line)) }
  function selectProduct(index:number,value:string) { const product=products.find((item)=>item.id===Number(value)); updateLine(index,{productId:value,description:product?.name||"",unitPrice:product?String(product.price):""}) }
  function openProductPicker(index:number) { setProductQuery(""); setOpenProductCategories({}); setProductPickerLine(index) }
  function chooseProduct(product:Product) {
    if (productPickerLine === null || product.stock <= 0) return
    selectProduct(productPickerLine,String(product.id))
    setProductPickerLine(null)
    setAddedProduct(product.name)
  }
  function addAnotherProduct() {
    const nextLine = lines.length
    setLines((current)=>[...current,emptyLine("PART")])
    setAddedProduct(null)
    setProductQuery("")
    setOpenProductCategories({})
    setProductPickerLine(nextLine)
  }
  async function invoiceOrder(order:Order) {
    if (order.invoiceDocumentId) { router.push(`/admin/documentos/${order.invoiceDocumentId}`); return }
    setBusy(true); setMessage("")
    const response=await fetch(`/api/admin/work-orders/${order.id}/invoice`,{method:"POST"})
    const data=await response.json().catch(()=>null)
    if (!response.ok) setMessage(data?.error||"No se pudo generar la factura.")
    else router.push(`/admin/documentos/${data.id}`)
    setBusy(false)
  }

  return <div className="mx-auto max-w-7xl space-y-5">
    <header className="relative overflow-hidden rounded-[26px] border border-white/80 bg-white/75 p-5 shadow-[0_18px_55px_rgba(15,23,42,.07)] backdrop-blur-2xl sm:p-6">
      <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-blue-400/10 blur-3xl" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4"><span className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-blue-50 text-blue-700"><Wrench className="h-7 w-7" /></span><div><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Operación del taller</p><h1 className="mt-1 text-3xl font-semibold tracking-[-.035em]">Órdenes de trabajo</h1><p className="mt-1 text-sm text-slate-500">Seguimiento desde el ingreso del vehículo hasta la entrega.</p></div></div>
        <div className="flex flex-col gap-2 min-[430px]:flex-row"><button type="button" onClick={openCustomer} className="flex h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/85 px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"><UserPlus className="h-4 w-4" /> Nuevo cliente</button><button type="button" onClick={openOrder} className="flex h-11 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(15,23,42,.2)] transition hover:bg-slate-800"><ClipboardPlus className="h-4 w-4" /> Nueva orden</button></div>
      </div>
    </header>

    <div className="grid gap-3 sm:grid-cols-3"><Metric icon={Wrench} label="Órdenes activas" value={activeCount} detail="En seguimiento" tone="blue" /><Metric icon={CalendarClock} label="Listas para entregar" value={readyCount} detail="Esperando al cliente" tone="emerald" /><Metric icon={UsersRound} label="Clientes agendados" value={customers.length} detail="Disponibles para vincular" tone="violet" /></div>

    <section className="overflow-hidden rounded-[26px] border border-white/80 bg-white/80 shadow-[0_18px_55px_rgba(15,23,42,.06)] backdrop-blur-xl">
      <div className="flex flex-col gap-3 border-b border-slate-200/70 p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-slate-950">Tablero del taller</h2><p className="text-xs text-slate-500">{visible.length} orden{visible.length===1?"":"es"} visible{visible.length===1?"":"s"}</p></div><div className="flex flex-col gap-2 sm:flex-row"><label className="relative block sm:w-72"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className={`${inputClass} pl-10`} value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Buscar patente, cliente o trabajo" /></label><select className={`${inputClass} sm:w-48`} value={filter} onChange={(event)=>setFilter(event.target.value)}><option value="ACTIVE">Activas</option><option value="ALL">Todas</option>{Object.entries(labels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></div></div>
      <div className="grid gap-4 p-4 lg:grid-cols-2">{visible.map((order)=><article key={order.id} className="rounded-[22px] border border-slate-200/80 bg-white/80 p-4 shadow-[0_8px_28px_rgba(15,23,42,.04)]"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Orden #{order.id}</p><h3 className="mt-1 text-lg font-bold text-slate-950">{order.vehiclePlate}</h3><p className="text-sm text-slate-500">{order.customer?.name || order.vehicleDescription || "Cliente sin registrar"}</p></div><select className="h-9 max-w-44 !rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs outline-none" value={order.status} onChange={(event)=>void status(order.id,event.target.value)}>{Object.entries(labels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></div><p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">{order.problem}</p><div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm"><span className="text-slate-500">{order.assignedTo?.name || "Sin mecánico"} · {order.items.length} concepto{order.items.length===1?"":"s"}</span><strong>{formatPrice(order.total)}</strong></div><div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={()=>openEdit(order)} className="flex h-10 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700">{order.invoiceDocumentId?<ReceiptText className="h-4 w-4"/>:<Pencil className="h-4 w-4"/>}{order.invoiceDocumentId?"Ver factura":"Editar orden"}</button><button type="button" disabled={busy||(!order.invoiceDocumentId&&order.total<=0)} onClick={()=>void invoiceOrder(order)} className="flex h-10 items-center justify-center gap-2 rounded-full bg-slate-950 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-35"><ReceiptText className="h-4 w-4" />{order.invoiceDocumentId?"Factura generada":"Facturar orden"}</button></div></article>)}{!visible.length&&<div className="py-14 text-center text-sm text-slate-400 lg:col-span-2">No hay órdenes que coincidan con la búsqueda.</div>}</div>
    </section>

    {orderOpen&&<ModalBackdrop onClose={()=>!busy&&setOrderOpen(false)} z="z-[70]"><form onSubmit={createOrder} className="flex max-h-[calc(100vh-1rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[32px] border border-white/80 bg-white/88 shadow-[0_35px_120px_rgba(15,23,42,.32)] backdrop-blur-2xl sm:max-h-[calc(100vh-2.5rem)]"><ModalHeader icon={editingId?Pencil:ClipboardPlus} eyebrow={editingId?`Orden #${editingId}`:"Ingreso al taller"} title={editingId?"Editar orden de trabajo":"Nueva orden de trabajo"} description="Completá los datos, repuestos y servicios necesarios." onClose={()=>setOrderOpen(false)} disabled={busy} /><div className="flex-1 space-y-5 overflow-y-auto bg-slate-50/65 p-5 sm:p-6">
      <section className="rounded-[24px] border border-white/90 bg-white/80 p-4 shadow-[0_10px_35px_rgba(15,23,42,.05)] backdrop-blur-xl sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-semibold">Cliente y vehículo</h3><p className="text-xs text-slate-400">Podés usar un cliente agendado o cargar los datos manualmente.</p></div><button type="button" onClick={openCustomer} className="flex h-9 items-center justify-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 text-xs font-semibold text-blue-700"><UserPlus className="h-3.5 w-3.5" /> Nuevo cliente</button></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Cliente agendado"><select className={inputClass} value={form.customerId} onChange={(event)=>selectCustomer(event.target.value)}><option value="">Cliente sin registrar</option>{customers.map((customer)=><option key={customer.id} value={customer.id}>{customer.name}{customer.vehiclePlate?` · ${customer.vehiclePlate}`:""}</option>)}</select></Field><Field label="Mecánico asignado"><select className={inputClass} value={form.assignedToId} onChange={(event)=>setForm({...form,assignedToId:event.target.value})}><option value="">Sin mecánico asignado</option>{mechanics.map((user)=><option key={user.id} value={user.id}>{user.name}</option>)}</select></Field><Field label="Patente *"><input required className={`${inputClass} uppercase`} value={form.vehiclePlate} onChange={(event)=>setForm({...form,vehiclePlate:event.target.value})} placeholder="Ej. AA123BB" /></Field><Field label="Vehículo"><input className={inputClass} value={form.vehicleDescription} onChange={(event)=>setForm({...form,vehicleDescription:event.target.value})} placeholder="Marca, modelo y año" /></Field></div></section>
      <section className="rounded-[24px] border border-white/90 bg-white/80 p-4 shadow-[0_10px_35px_rgba(15,23,42,.05)] backdrop-blur-xl sm:p-5"><h3 className="font-semibold">Trabajo solicitado</h3><p className="text-xs text-slate-400">Describí el problema con el mayor detalle posible.</p><textarea required className="mt-4 min-h-28 w-full !rounded-2xl border border-slate-200 bg-white/75 p-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10" value={form.problem} onChange={(event)=>setForm({...form,problem:event.target.value})} placeholder="Ej. Pérdida de refrigerante, revisar radiador y mangueras…" /><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Fecha y hora de recepción *"><input required type="datetime-local" className={inputClass} value={form.receivedAt} onChange={(event)=>setForm({...form,receivedAt:event.target.value})} /></Field><Field label="Entrega estimada"><input type="datetime-local" min={form.receivedAt} className={inputClass} value={form.estimatedDelivery} onChange={(event)=>setForm({...form,estimatedDelivery:event.target.value})} /></Field></div></section>
      <section className="rounded-[24px] border border-blue-100 bg-blue-50/55 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><h3 className="font-semibold text-slate-950">Repuestos y servicios</h3><p className="text-xs text-slate-500">Agregá productos del catálogo, mano de obra u otros trabajos. Podés editar todo antes de facturar.</p></div>
          <div className="flex gap-2"><button type="button" onClick={()=>setLines((current)=>[...current,emptyLine("PART")])} className="flex h-9 items-center gap-2 rounded-full border border-blue-200 bg-white px-4 text-xs font-semibold text-blue-700"><PackagePlus className="h-4 w-4" /> Repuesto</button><button type="button" onClick={()=>setLines((current)=>[...current,emptyLine("SERVICE")])} className="flex h-9 items-center gap-2 rounded-full bg-slate-950 px-4 text-xs font-semibold text-white"><Wrench className="h-4 w-4" /> Mano de obra</button></div>
        </div>
        <div className="mt-4 space-y-3">
          {lines.map((line,index)=>{
            const selectedProduct = products.find((product)=>String(product.id)===line.productId)
            return <div key={index} className="grid gap-3 rounded-[20px] border border-blue-100 bg-white/90 p-3 lg:grid-cols-[130px_1.2fr_1.6fr_90px_130px_40px] lg:items-end">
              <Field label="Tipo"><select className={inputClass} value={line.kind} onChange={(event)=>updateLine(index,{kind:event.target.value as "PART"|"SERVICE",productId:event.target.value==="SERVICE"?"":line.productId})}><option value="PART">Repuesto</option><option value="SERVICE">Servicio</option></select></Field>
              <div className="text-xs font-medium text-slate-500">
                <span>Producto del catálogo</span>
                <div className="mt-1">
                {line.kind==="PART"?<button type="button" onClick={()=>openProductPicker(index)} className="flex h-11 w-full min-w-0 items-center gap-2 rounded-2xl border border-blue-200 bg-white/80 px-3 text-left text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:bg-blue-50">
                  <PackagePlus className="h-4 w-4 shrink-0 text-blue-600" />
                  <span className="min-w-0 flex-1 truncate">{selectedProduct?.name || "Elegir producto"}</span>
                </button>:<div className="flex h-11 items-center rounded-2xl bg-slate-100 px-4 text-xs text-slate-500">Trabajo / servicio</div>}
                </div>
              </div>
              <Field label="Descripción *"><input required className={inputClass} value={line.description} onChange={(event)=>updateLine(index,{description:event.target.value})} placeholder={line.kind==="PART"?"Nombre del repuesto":"Trabajo realizado"} /></Field>
              <Field label="Cantidad"><input required type="number" min="0.01" step="0.01" className={inputClass} value={line.quantity} onChange={(event)=>updateLine(index,{quantity:event.target.value})} /></Field>
              <Field label="Precio unitario"><input required type="number" min="0" step="0.01" className={inputClass} value={line.unitPrice} onChange={(event)=>updateLine(index,{unitPrice:event.target.value})} placeholder="$ 0" /></Field>
              <button type="button" aria-label="Eliminar concepto" onClick={()=>setLines((current)=>current.filter((_,lineIndex)=>lineIndex!==index))} className="flex h-10 w-10 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600"><Trash2 className="h-4 w-4" /></button>
            </div>
          })}
          {!lines.length&&<div className="rounded-2xl border border-dashed border-blue-200 bg-white/55 px-4 py-8 text-center text-sm text-slate-400">Todavía no agregaste repuestos ni servicios. Podés crear la orden y completarlos después.</div>}
        </div>
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-950 px-4 py-3 text-white"><span className="text-xs text-slate-300">Total estimado de la orden</span><strong className="text-lg">{formatPrice(estimatedTotal)}</strong></div>
      </section>
    </div><ModalFooter onCancel={()=>setOrderOpen(false)} busy={busy} submitLabel={editingId?"Guardar cambios":"Crear orden de trabajo"} /></form></ModalBackdrop>}

    {productPickerLine!==null&&<ModalBackdrop onClose={()=>setProductPickerLine(null)} z="z-[90]">
      <section role="dialog" aria-modal="true" aria-labelledby="product-picker-title" className="flex max-h-[calc(100dvh-1rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[30px] border border-white/80 bg-white/90 shadow-[0_30px_110px_rgba(15,23,42,.4)] backdrop-blur-2xl sm:max-h-[calc(100dvh-2.5rem)]">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200/70 bg-white/75 p-5 sm:p-6">
          <div className="flex items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><PackagePlus className="h-5 w-5" /></span><div><p className="text-[10px] font-semibold uppercase tracking-[.15em] text-blue-600">Catálogo</p><h2 id="product-picker-title" className="text-xl font-semibold tracking-tight sm:text-2xl">Elegir producto</h2><p className="mt-1 text-xs text-slate-500">Buscá por nombre o SKU y abrí una categoría.</p></div></div>
          <button type="button" onClick={()=>setProductPickerLine(null)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600" aria-label="Cerrar catálogo"><X className="h-5 w-5" /></button>
        </header>
        <div className="border-b border-slate-200/70 bg-white/65 p-4 sm:px-6">
          <label className="relative block"><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input autoFocus className={`${inputClass} pl-11`} value={productQuery} onChange={(event)=>setProductQuery(event.target.value)} placeholder="Buscar producto o SKU" /></label>
          <button type="button" onClick={()=>{selectProduct(productPickerLine,"");setProductPickerLine(null)}} className="mt-3 text-xs font-semibold text-blue-700 hover:underline">Usar un ítem libre</button>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-slate-50/70 p-4 sm:p-6">
          {productsByCategory.map(({category,items})=>{
            const expanded = Boolean(productQuery.trim()) || Boolean(openProductCategories[category])
            return <section key={category} className="overflow-hidden rounded-2xl border border-slate-200 bg-white/85 shadow-sm">
              <button type="button" onClick={()=>setOpenProductCategories((current)=>({...current,[category]:!current[category]}))} aria-expanded={expanded} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
                <span><strong className="text-sm text-slate-800">{category}</strong><small className="ml-2 text-xs text-slate-400">{items.length} {items.length===1?"producto":"productos"}</small></span>
                <span className="grid h-7 w-7 place-items-center rounded-full border border-slate-200 text-lg leading-none text-slate-500" aria-hidden="true">{expanded?"−":"+"}</span>
              </button>
              {expanded&&<div className="grid gap-2 border-t border-slate-100 p-3 sm:grid-cols-2">
                {items.map((product)=><button key={product.id} type="button" disabled={product.stock<=0} onClick={()=>chooseProduct(product)} className="flex min-h-20 items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-45">
                  <span className="min-w-0"><strong className="block text-sm leading-snug text-slate-900">{product.name}</strong><small className="mt-1 block text-xs text-slate-500">{product.sku?`${product.sku} · `:""}{product.stock>0?`Stock ${product.stock}`:"Sin stock"}</small></span>
                  <strong className="shrink-0 text-sm text-blue-700">{formatPrice(product.price)}</strong>
                </button>)}
              </div>}
            </section>
          })}
          {!productsByCategory.length&&<p className="py-12 text-center text-sm text-slate-400">No hay productos que coincidan con la búsqueda.</p>}
        </div>
      </section>
    </ModalBackdrop>}

    {addedProduct&&<ModalBackdrop onClose={()=>setAddedProduct(null)} z="z-[100]">
      <section role="dialog" aria-modal="true" aria-labelledby="product-added-title" className="w-full max-w-sm rounded-[28px] border border-white/80 bg-white p-6 text-center shadow-[0_30px_100px_rgba(15,23,42,.38)]">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 className="h-7 w-7" /></span>
        <p className="mt-5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-emerald-700">Producto agregado con éxito</p>
        <h2 id="product-added-title" className="mt-1 text-lg font-bold text-slate-950">{addedProduct}</h2>
        <p className="mt-2 text-sm text-slate-500">Ya está incluido en la orden de trabajo.</p>
        <div className="mt-6 grid gap-2"><button type="button" onClick={addAnotherProduct} className="h-12 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white">Agregar otro producto</button><button type="button" onClick={()=>setAddedProduct(null)} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700">Volver a la orden</button></div>
      </section>
    </ModalBackdrop>}

    {customerOpen&&<ModalBackdrop onClose={()=>!busy&&setCustomerOpen(false)} z="z-[80]"><form onSubmit={createCustomer} className="flex max-h-[calc(100vh-1rem)] w-full max-w-4xl flex-col overflow-hidden rounded-[32px] border border-white/80 bg-white/88 shadow-[0_35px_120px_rgba(15,23,42,.34)] backdrop-blur-2xl sm:max-h-[calc(100vh-2.5rem)]"><ModalHeader icon={UserPlus} eyebrow="Agenda de clientes" title="Nuevo cliente" description="Se guardará también en la agenda de Ventas y documentos." onClose={()=>setCustomerOpen(false)} disabled={busy} /><div className="flex-1 space-y-5 overflow-y-auto bg-slate-50/65 p-5 sm:p-6">
      <section className="rounded-[24px] border border-white/90 bg-white/80 p-4 shadow-[0_10px_35px_rgba(15,23,42,.05)] backdrop-blur-xl sm:p-5"><h3 className="font-semibold">Datos principales</h3><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Field label="Nombre o razón social *"><input autoFocus required className={inputClass} value={customerForm.name} onChange={(event)=>setCustomerForm({...customerForm,name:event.target.value})} /></Field><Field label="Teléfono"><input className={inputClass} value={customerForm.phone} onChange={(event)=>setCustomerForm({...customerForm,phone:event.target.value})} /></Field><Field label="Correo"><input type="email" className={inputClass} value={customerForm.email} onChange={(event)=>setCustomerForm({...customerForm,email:event.target.value})} placeholder="Opcional" /></Field><Field label="CUIT / DNI"><input className={inputClass} value={customerForm.taxId} onChange={(event)=>setCustomerForm({...customerForm,taxId:event.target.value})} /></Field><div className="sm:col-span-2"><Field label="Dirección"><input className={inputClass} value={customerForm.address} onChange={(event)=>setCustomerForm({...customerForm,address:event.target.value})} /></Field></div></div></section>
      <button type="button" role="switch" aria-checked={customerForm.currentAccountEnabled} onClick={()=>setCustomerForm({...customerForm,currentAccountEnabled:!customerForm.currentAccountEnabled})} className={`flex w-full items-center justify-between gap-4 rounded-[24px] border p-4 text-left transition sm:p-5 ${customerForm.currentAccountEnabled?"border-emerald-300 bg-emerald-50":"border-white/90 bg-white/80"}`}><span className="flex min-w-0 items-center gap-3"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${customerForm.currentAccountEnabled?"bg-emerald-600 text-white":"bg-slate-100 text-slate-500"}`}><BadgeDollarSign className="h-5 w-5" /></span><span><strong className="block text-sm">Habilitar cuenta corriente</strong><small className="mt-1 block text-slate-500">También aparecerá en la sección Cuenta corriente de la agenda de Ventas.</small></span></span><span className={`relative h-7 w-12 shrink-0 rounded-full transition ${customerForm.currentAccountEnabled?"bg-emerald-600":"bg-slate-300"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${customerForm.currentAccountEnabled?"left-6":"left-1"}`} /></span></button>
      <section className="rounded-[24px] border border-white/90 bg-white/80 p-4 shadow-[0_10px_35px_rgba(15,23,42,.05)] backdrop-blur-xl sm:p-5"><div className="flex items-center gap-3"><CarFront className="h-5 w-5 text-blue-600" /><div><h3 className="font-semibold">Vehículo</h3><p className="text-xs text-slate-400">Se usará automáticamente al crear la orden.</p></div></div><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Field label="Patente"><input className={`${inputClass} uppercase`} value={customerForm.vehiclePlate} onChange={(event)=>setCustomerForm({...customerForm,vehiclePlate:event.target.value})} /></Field><Field label="Marca"><input className={inputClass} value={customerForm.vehicleBrand} onChange={(event)=>setCustomerForm({...customerForm,vehicleBrand:event.target.value})} /></Field><Field label="Modelo"><input className={inputClass} value={customerForm.vehicleModel} onChange={(event)=>setCustomerForm({...customerForm,vehicleModel:event.target.value})} /></Field><Field label="Año"><input type="number" min="1900" max="2100" className={inputClass} value={customerForm.vehicleYear} onChange={(event)=>setCustomerForm({...customerForm,vehicleYear:event.target.value})} /></Field></div></section>
    </div><ModalFooter onCancel={()=>setCustomerOpen(false)} busy={busy} submitLabel={customerForm.currentAccountEnabled?"Crear cuenta corriente":"Guardar cliente"} /></form></ModalBackdrop>}

    {message&&<p className="fixed bottom-5 right-5 z-[100] max-w-sm rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-xl">{message}</p>}
  </div>
}

function Field({label,children}:{label:string;children:React.ReactNode}) { return <label className="text-xs font-medium text-slate-500">{label}<div className="mt-1">{children}</div></label> }
function Metric({icon:Icon,label,value,detail,tone}:{icon:typeof Wrench;label:string;value:number;detail:string;tone:"blue"|"emerald"|"violet"}) { const tones={blue:"bg-blue-50 text-blue-700",emerald:"bg-emerald-50 text-emerald-700",violet:"bg-violet-50 text-violet-700"}; return <div className="flex items-center gap-3 rounded-[22px] border border-white/80 bg-white/75 p-4 shadow-[0_10px_35px_rgba(15,23,42,.05)] backdrop-blur-xl"><span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tones[tone]}`}><Icon className="h-5 w-5" /></span><div><p className="text-[11px] text-slate-500">{label}</p><strong className="text-xl text-slate-950">{value}</strong><p className="text-[10px] text-slate-400">{detail}</p></div></div> }
function ModalBackdrop({children,onClose,z}:{children:React.ReactNode;onClose:()=>void;z:string}) { return <div className={`fixed inset-0 ${z} grid place-items-center overflow-y-auto bg-slate-950/42 p-2 backdrop-blur-md sm:p-5`} onMouseDown={(event)=>{if(event.target===event.currentTarget)onClose()}}>{children}</div> }
function ModalHeader({icon:Icon,eyebrow,title,description,onClose,disabled}:{icon:typeof Wrench;eyebrow:string;title:string;description:string;onClose:()=>void;disabled:boolean}) { return <header className="flex items-start justify-between gap-4 border-b border-slate-200/70 bg-white/75 px-5 py-5 backdrop-blur-xl sm:px-6"><div className="flex items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><Icon className="h-5 w-5" /></span><div><p className="text-[10px] font-semibold uppercase tracking-[.15em] text-blue-600">{eyebrow}</p><h2 className="text-2xl font-semibold tracking-tight">{title}</h2><p className="mt-1 text-xs text-slate-500">{description}</p></div></div><button type="button" disabled={disabled} onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600"><X className="h-5 w-5" /></button></header> }
function ModalFooter({onCancel,busy,submitLabel}:{onCancel:()=>void;busy:boolean;submitLabel:string}) { return <footer className="flex flex-col-reverse gap-2 border-t border-slate-200/70 bg-white/80 px-5 py-4 backdrop-blur-xl sm:flex-row sm:justify-end sm:px-6"><button type="button" disabled={busy} onClick={onCancel} className="h-11 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600">Cancelar</button><button disabled={busy} className="flex h-11 items-center justify-center gap-2 rounded-full bg-slate-950 px-6 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(15,23,42,.2)] disabled:opacity-50"><Plus className="h-4 w-4" />{busy?"Guardando…":submitLabel}</button></footer> }
