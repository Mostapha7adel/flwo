import { cn } from '../../utils/cn'

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
}

export function Spinner({ size = 'md', className }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }

  return (
    <div className={cn('animate-spin rounded-full border-2 border-gray-200 border-t-brand-500', sizes[size], className)} />
  )
}
