import { cn } from '../../utils/cn'
import { Spinner } from './Spinner'

const variants = {
  primary: 'bg-brand-500 hover:bg-brand-600 text-white shadow-sm',
  secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300',
  accent: 'bg-accent-500 hover:bg-accent-600 text-white shadow-sm',
  ghost: 'hover:bg-gray-100 text-gray-600',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  outline: 'border-2 border-brand-500 text-brand-500 hover:bg-brand-50',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-7 py-3.5 text-base rounded-xl',
  xl: 'px-9 py-4 text-lg rounded-2xl',
}

export function Button({ variant = 'primary', size = 'md', loading, icon, children, className, ...props }) {
  return (
    <button
      className={cn(
        'inline-flex items-center gap-2 font-semibold transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        variants[variant], sizes[size], className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : icon}
      {children}
    </button>
  )
}
