import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { formatDate } from '../../utils/formatDate'
import { formatCurrency } from '../../utils/formatCurrency'
import { ORDER_STATUS } from '../../utils/constants'

export const OrderCard = memo(({ order }) => {
  const navigate = useNavigate()
  const status = ORDER_STATUS[order.status] || { label: order.status, color: 'info' }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden shrink-0">
          {order.templatePreview ? (
            <img src={order.templatePreview} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold text-lg">
              {(order.templateName || '?')[0]}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-900">{order.templateName}</h3>
              <p className="text-sm text-gray-500">{order.templateCategory}</p>
              <p className="text-xs text-gray-400 mt-1">{formatDate(order.createdAt)}</p>
            </div>
            <div className="text-left">
              <p className="text-lg font-bold text-brand-600">{formatCurrency(order.amount)}</p>
              <Badge variant={status.color}>{status.label}</Badge>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="ghost" onClick={() => navigate(`/dashboard/orders/${order.id}`)}>
              تفاصيل الطلب
            </Button>
            {order.hasChat && (
              <Button size="sm" variant="ghost" onClick={() => navigate('/dashboard/chat')}>
                فتح المحادثة
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})
