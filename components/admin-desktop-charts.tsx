"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

type TrendPoint = {
  label: string
  ventas: number
  gastos: number
}

type CategoryPoint = {
  name: string
  value: number
}

const RevenueTrendChart = dynamic(
  () => import("@/components/admin-dashboard-charts").then((module) => module.RevenueTrendChart),
  {
    ssr: false,
    loading: () => <div className="h-[300px] w-full animate-pulse rounded-2xl bg-slate-100" />,
  },
)

const InventoryCategoryChart = dynamic(
  () => import("@/components/admin-dashboard-charts").then((module) => module.InventoryCategoryChart),
  {
    ssr: false,
    loading: () => <div className="h-[300px] w-full animate-pulse rounded-2xl bg-slate-100" />,
  },
)

function useDesktopViewport() {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)")
    const update = () => setIsDesktop(media.matches)

    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  return isDesktop
}

export function AdminDesktopRevenueChart({ data }: { data: TrendPoint[] }) {
  const isDesktop = useDesktopViewport()
  return isDesktop ? <RevenueTrendChart data={data} /> : null
}

export function AdminDesktopInventoryChart({
  data,
  total,
}: {
  data: CategoryPoint[]
  total: string
}) {
  const isDesktop = useDesktopViewport()
  return isDesktop ? <InventoryCategoryChart data={data} total={total} /> : null
}
