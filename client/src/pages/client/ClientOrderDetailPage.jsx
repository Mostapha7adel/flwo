import { useParams, useNavigate } from 'react-router-dom'
import { ArrowRight, MessageCircle, Loader } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button'
import { OrderStatusBadge } from '../../components/shared/OrderStatusBadge'
import { PageHeader } from '../../components/shared/PageHeader'
import { api } from '../../lib/axios'
import { formatDate } from '../../utils/formatDate'
import { formatCurrency } from '../../utils/formatCurrency'

const TIMELINE_STEPS = [
  { key: 'PENDING', label: 'تم استقبال الطلب' },
  { key: 'ACCEPTED', label: 'قيد المراجعة' },
  { key: 'IN_PROGRESS', label: 'قيد التنفيذ' },
  { key: 'COMPLETED', label: 'تم التسليم' },
]

function buildTimeline(status) {
  if (status === 'CANCELLED') {
    return [
      { label: 'تم إلغاء الطلب', done: false, current: true, cancelled: true },
    ]
  }
  const statusOrder = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED']
  const currentIdx = statusOrder.indexOf(status)
  return TIMELINE_STEPS.map((step, i) => ({
    label: step.label,
    done: i < currentIdx,
    current: i === currentIdx,
  }))
}

export default function ClientOrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get(`/orders/${id}`).then(r => r.data),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">الطلب غير موجود</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/dashboard/orders')}>العودة للطلبات</Button>
      </div>
    )
  }

  const colors = order.customization?.colors || {}
  const timeline = buildTimeline(order.status)

  return (
    <div>
      <button onClick={() => navigate('/dashboard/orders')} className="flex items-center gap-2 text-gray-500 hover:text-brand-600 mb-4 transition-colors">
        <ArrowRight className="w-4 h-4" />
        رجوع
      </button>

      <PageHeader title={`طلب #${order.orderNumber || order.id}`} />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">معاينة القالب</h3>
          <div className="aspect-video bg-gradient-to-br from-brand-500/20 to-accent-500/20 rounded-xl flex items-center justify-center">
            {order.template?.previewUrl ? (
              <img src={order.template.previewUrl} alt="" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <span className="text-gray-400">معاينة القالب</span>
            )}
          </div>

          <h3 className="font-bold text-gray-900 mt-6 mb-3">التخصيصات المطلوبة</h3>
          <div className="space-y-3">
            {Object.keys(colors).length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">الألوان</p>
                <div className="flex gap-3">
                  {Object.entries(colors).map(([name, hex]) => (
                    <div key={name} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg border" style={{ backgroundColor: hex }} />
                      <span className="text-xs text-gray-500">{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {order.customization?.additionalPages > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">صفحات إضافية</p>
                <p className="text-sm text-gray-600">{order.customization.additionalPages} صفحة</p>
              </div>
            )}
            {order.customization?.theme && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">النسق</p>
                <p className="text-sm text-gray-600">{order.customization.theme === 'dark' ? 'داكن' : 'فاتح'}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">تفاصيل الطلب</h3>
            <div className="space-y-3 text-sm">
              {[
                ['القالب', order.template?.title || 'بدون اسم'],
                ['المبلغ', formatCurrency(Number(order.totalAmount))],
                ['تاريخ الطلب', formatDate(order.createdAt)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-900">{value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-gray-500">الحالة</span>
                <OrderStatusBadge status={order.status} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">تتبع الطلب</h3>
            <div className="space-y-4">
              {timeline.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    item.cancelled ? 'bg-red-500' : item.done ? 'bg-green-500' : item.current ? 'bg-brand-500' : 'bg-gray-200'
                  }`}>
                    {item.cancelled ? <span className="text-white text-xs">✕</span> : item.done ? <span className="text-white text-xs">✓</span> : <span className="text-white text-xs">{i + 1}</span>}
                  </div>
                  <div>
                    <p className={`font-medium text-sm ${item.cancelled ? 'text-red-600' : item.done ? 'text-green-600' : item.current ? 'text-brand-600' : 'text-gray-400'}`}>
                      {item.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(order.status) && (
            <Button variant="accent" className="w-full" onClick={() => navigate('/dashboard/chat')}>
              <MessageCircle className="w-5 h-5" />
              فتح المحادثة
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
