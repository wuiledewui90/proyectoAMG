import type { LucideIcon } from "lucide-react"

type MetricTone = "blue" | "violet" | "cyan" | "emerald" | "amber" | "rose"

type MobileMetric = {
  label: string
  value: string | number
  detail?: string
  icon?: LucideIcon
  tone?: MetricTone
}

const tones: Record<MetricTone, string> = {
  blue: "from-blue-600 to-blue-500 text-white shadow-blue-500/20",
  violet: "from-violet-600 to-indigo-500 text-white shadow-violet-500/20",
  cyan: "from-cyan-500 to-sky-500 text-white shadow-cyan-500/20",
  emerald: "from-emerald-500 to-teal-500 text-white shadow-emerald-500/20",
  amber: "from-amber-400 to-orange-500 text-slate-950 shadow-amber-500/20",
  rose: "from-rose-500 to-pink-500 text-white shadow-rose-500/20",
}

export function AdminMobileMetrics({ items }: { items: MobileMetric[] }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 lg:hidden">
      {items.map((item, index) => {
        const Icon = item.icon
        const tone = item.tone || (["blue", "violet", "cyan", "emerald"] as MetricTone[])[index % 4]
        return (
          <article
            key={`${item.label}-${index}`}
            className={`relative min-h-[104px] overflow-hidden rounded-[22px] bg-gradient-to-br p-4 shadow-[0_14px_34px] ${tones[tone]}`}
          >
            <span className="pointer-events-none absolute -right-5 -top-7 h-20 w-20 rounded-full bg-white/15 blur-sm" />
            <div className="relative flex items-start justify-between gap-2">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] opacity-75">{item.label}</p>
              {Icon && <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden="true" />}
            </div>
            <p className="relative mt-2 text-2xl font-semibold tracking-[-0.045em]">{item.value}</p>
            {item.detail && <p className="relative mt-1 text-[10px] font-medium opacity-70">{item.detail}</p>}
          </article>
        )
      })}
    </div>
  )
}
