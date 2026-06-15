import { cn } from '../../utils/cn'

export function Textarea({ label, error, className, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-semibold text-gray-700">{label}</label>}
      <textarea
        className={cn(
          'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900',
          'placeholder:text-gray-400 resize-none',
          'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
          'transition-all duration-150',
          error && 'border-red-400 focus:ring-red-400/20',
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
