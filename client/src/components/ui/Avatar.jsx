import { cn } from '../../utils/cn'

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
}

export function Avatar({ src, name, size = 'md', className }) {
  const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover', sizes[size], className)}
      />
    )
  }

  return (
    <div className={cn(
      'rounded-full bg-brand-500 flex items-center justify-center text-white font-bold',
      sizes[size], className
    )}>
      {initials}
    </div>
  )
}
