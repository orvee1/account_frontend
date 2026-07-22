'use client'
import * as React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

export function RadioGroup({
  className,
  children,
  ...props
}) {
  return (
    <div className={cn('flex flex-col space-y-2', className)} role="radiogroup" {...props}>
      {children}
    </div>
  )
}

export const RadioGroupItem = React.forwardRef(({ className, label, ...props }, ref) => {
  return (
    <label className="flex items-center space-x-2 cursor-pointer">
      <input
        type="radio"
        className={cn(
          'h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500',
          className
        )}
        ref={ref}
        {...props}
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  )
})
RadioGroupItem.displayName = 'RadioGroupItem'