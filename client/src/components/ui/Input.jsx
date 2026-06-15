import { cn } from '../../utils/cn'

export function Input({ label, error, hint, icon, className, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-semibold text-gray-700">{label}</label>}
      <div className="relative">
        {icon && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>}
        <input
          className={cn(
            'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900',
            'placeholder:text-gray-400',
            'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
            'transition-all duration-150',
            error && 'border-red-400 focus:ring-red-400/20',
            icon && 'pr-10',
            className
          )}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
      {hint && !error && <span className="text-xs text-gray-500">{hint}</span>}
    </div>
  )
}
