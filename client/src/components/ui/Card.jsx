import { cn } from '../../utils/cn'

export function Card({ children, className, hover = false, ...props }) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-gray-100 shadow-sm',
        hover && 'hover:shadow-xl hover:-translate-y-1 transition-all duration-300',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
