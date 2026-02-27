import React from 'react'
import { cn } from '../../lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950 disabled:opacity-50 disabled:cursor-not-allowed select-none',
        {
          'bg-onyx-600 hover:bg-onyx-500 text-white focus:ring-onyx-500': variant === 'primary',
          'bg-gray-800 hover:bg-gray-700 text-gray-100 focus:ring-gray-600': variant === 'secondary',
          'hover:bg-gray-800 text-gray-400 hover:text-gray-100 focus:ring-gray-700': variant === 'ghost',
          'bg-red-600 hover:bg-red-500 text-white focus:ring-red-500': variant === 'danger',
          'border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white bg-transparent focus:ring-gray-600': variant === 'outline',
        },
        {
          'px-2.5 py-1.5 text-xs gap-1.5': size === 'sm',
          'px-4 py-2 text-sm gap-2': size === 'md',
          'px-5 py-2.5 text-base gap-2.5': size === 'lg',
          'w-8 h-8': size === 'icon',
        },
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  )
}
