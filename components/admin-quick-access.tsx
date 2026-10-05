"use client"

import { useEffect, useState } from "react"
import { ArrowDown, LayoutGrid } from "lucide-react"

type QuickSection = {
  id: string
  label: string
}

function cleanLabel(value: string) {
  return value.replace(/\s*\(\d+\)\s*$/, "").trim()
}

export function AdminQuickAccess({ pathname }: { pathname: string }) {
  const [sections, setSections] = useState<QuickSection[]>([])

  useEffect(() => {
    let frame = 0

    const scanSections = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        const main = document.querySelector<HTMLElement>(".admin-authenticated-content main")
        if (!main) return

        const seen = new Set<string>()
        const nextSections: QuickSection[] = []
        const headings = Array.from(main.querySelectorAll<HTMLElement>("h2, h3, [data-quick-access-label]"))
        const explicitHeadings = headings.filter((heading) => heading.hasAttribute("data-quick-access-label"))
        const candidateHeadings = explicitHeadings.length ? explicitHeadings : headings

        candidateHeadings.forEach((heading, index) => {
          if (
            heading.offsetParent === null ||
            heading.closest(".admin-quick-access") ||
            heading.closest("[role='dialog']") ||
            heading.closest(".fixed")
          ) {
            return
          }

          const label = cleanLabel(heading.dataset.quickAccessLabel || heading.textContent || "")
          const normalizedLabel = label.toLocaleLowerCase("es")

          if (!label || seen.has(normalizedLabel) || nextSections.length >= 8) return

          seen.add(normalizedLabel)
          const id = `admin-section-${pathname.replace(/[^a-z0-9]+/gi, "-")}-${index}`
          heading.id = id
          heading.classList.add("admin-quick-access-target")
          nextSections.push({ id, label })
        })

        setSections(nextSections.length >= 2 ? nextSections : [])
      })
    }

    scanSections()
    const observer = new MutationObserver(scanSections)
    const main = document.querySelector<HTMLElement>(".admin-authenticated-content main")
    if (main) observer.observe(main, { childList: true, subtree: true })

    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [pathname])

  function goToSection(id: string) {
    const target = document.getElementById(id)
    if (!target) return

    const mobileOffset = window.matchMedia("(max-width: 1023px)").matches ? 132 : 24
    const top = target.getBoundingClientRect().top + window.scrollY - mobileOffset
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    window.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" })
  }

  if (!sections.length) return null

  return (
    <nav className="admin-quick-access" aria-label="Accesos rápidos del módulo">
      <div className="admin-quick-access-heading">
        <LayoutGrid className="h-4 w-4" aria-hidden="true" />
        <span>Accesos rápidos</span>
      </div>
      <div className="admin-quick-access-scroll">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            className="admin-quick-access-button"
            onClick={() => goToSection(section.id)}
          >
            <span>{section.label}</span>
            <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        ))}
      </div>
    </nav>
  )
}
