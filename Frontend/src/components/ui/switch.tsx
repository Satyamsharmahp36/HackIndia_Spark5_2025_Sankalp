"use client"

import { useState, useEffect } from 'react'
import { cn } from '../../lib/utils'

interface SwitchProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  className?: string
}

export default function Switch({ checked, onCheckedChange, className }: SwitchProps) {
  const [internal, setInternal] = useState<boolean>(!!checked)

  useEffect(() => {
    if (typeof checked === 'boolean') setInternal(checked)
  }, [checked])

  const toggle = () => {
    const next = !internal
    setInternal(next)
    onCheckedChange?.(next)
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={internal}
      onClick={toggle}
      className={cn(
        "inline-flex h-6 w-11 items-center rounded-full transition-colors",
        internal ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-700",
        className
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
          internal ? "translate-x-5" : "translate-x-1"
        )}
      />
    </button>
  )
}


