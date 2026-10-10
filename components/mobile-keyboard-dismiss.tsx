"use client"

import { useEffect } from "react"

const editableSelector = 'input, textarea, [contenteditable="true"]'

function isEditableElement(element: Element | null): element is HTMLElement {
  return element instanceof HTMLElement && element.matches(editableSelector)
}

export function MobileKeyboardDismiss() {
  useEffect(() => {
    function dismissKeyboard(event: PointerEvent) {
      if (event.pointerType !== "touch") return

      const activeElement = document.activeElement
      if (!isEditableElement(activeElement)) return

      const target = event.target
      if (!(target instanceof Element)) return
      if (target.closest(editableSelector)) return
      if (target.closest("[data-keep-mobile-keyboard-open]")) return

      activeElement.blur()
    }

    document.addEventListener("pointerdown", dismissKeyboard, true)
    return () => document.removeEventListener("pointerdown", dismissKeyboard, true)
  }, [])

  return null
}
