import type { HTMLAttributes, PropsWithChildren } from 'react'

export interface CardProps extends PropsWithChildren, HTMLAttributes<HTMLDivElement> {}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 text-gray-900 dark:text-white ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

