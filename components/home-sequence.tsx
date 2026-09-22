"use client"

import { useCallback, useLayoutEffect, useState, type ReactNode } from "react"
import { HomeIntro } from "@/components/home-intro"

interface HomeSequenceProps {
  children: ReactNode
}

function wasHomeTheInitialDocument() {
  const [navigationEntry] = performance.getEntriesByType(
    "navigation"
  ) as PerformanceNavigationTiming[]

  if (!navigationEntry) return true

  try {
    return new URL(navigationEntry.name).pathname === window.location.pathname
  } catch {
    return true
  }
}

function shouldPlayHomeIntro() {
  if (typeof window === "undefined") return true

  const introAlreadyStarted =
    document.documentElement.dataset.homeIntroStarted === "true"

  return !introAlreadyStarted && wasHomeTheInitialDocument()
}

export function HomeSequence({ children }: HomeSequenceProps) {
  const [shouldPlayIntro] = useState(shouldPlayHomeIntro)

  useLayoutEffect(() => {
    document.documentElement.dataset.homeIntroStarted = "true"

    if (shouldPlayIntro) {
      document.documentElement.classList.add("home-intro-active")
    } else {
      document.documentElement.classList.remove("home-intro-active")
    }

    return () => {
      document.documentElement.classList.remove("home-intro-active")
    }
  }, [shouldPlayIntro])

  const showHero = useCallback(() => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.documentElement.classList.remove("home-intro-active")
      })
    })
  }, [])

  return (
    <>
      {shouldPlayIntro ? <HomeIntro onComplete={showHero} /> : null}
      {children}
    </>
  )
}
