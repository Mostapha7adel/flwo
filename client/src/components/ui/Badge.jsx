import { cn } from '../../utils/cn'

const variants = {
  success: 'bg-green-100 text-green-700 border-green-200',
  warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  danger: 'bg-red-100 text-red-700 border-red-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
  accent: 'bg-purple-100 text-purple-700 border-purple-200',
  subtle: 'bg-gray-100 text-gray-600 border-gray-200',
}

export function Badge({ children, variant = 'info', className }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
      variants[variant], className
    )}>
      {children}
    </span>
  )
}
