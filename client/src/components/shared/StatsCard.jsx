import { memo } from 'react'
import { cn } from '../../utils/cn'

export const StatsCard = memo(({ icon: Icon, label, value, trend, trendUp }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
          <Icon className="w-5 h-5 text-brand-600" />
        </div>
        {trend != null && (
          <span className={cn(
            'text-xs font-semibold px-2 py-0.5 rounded-full',
            trendUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          )}>
            {trendUp ? '↑' : '↓'} {trend}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  )
})
