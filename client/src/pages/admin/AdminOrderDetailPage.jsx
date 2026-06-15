import { useParams, useNavigate } from 'react-router-dom'
import { ArrowRight, MessageCircle } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { Avatar } from '../../components/ui/Avatar'
import { PageHeader } from '../../components/shared/PageHeader'
import { Spinner } from '../../components/ui/Spinner'
import { api } from '../../lib/axios'

const statusOptions = [
  { value: 'PENDING', label: 'قيد الانتظار' },
  { value: 'ACCEPTED', label: 'مقبول' },
  { value: 'IN_PROGRESS', label: 'جاري التنفيذ' },
  { value: 'COMPLETED', label: 'مكتمل' },
  { value: 'CANCELLED', label: 'ملغي' },
]

export default function AdminOrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['admin-order', id],
    queryFn: () => api.get(`/admin/orders/${id}`).then(r => r.data),
    enabled: !!id,
  })

  const updateStatus = useMutation({
    mutationFn: (status) => api.patch(`/admin/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order', id] })
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    },
  })

  if (isLoading) {
    return (
      <div>
        <button onClick={() => navigate('/x9k2-manage/panel/orders')} className="flex items-center gap-2 text-gray-500 hover:text-brand-600 mb-4 transition-colors">
          <ArrowRight className="w-4 h-4" />
          رجوع
        </button>
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div>
        <button onClick={() => navigate('/x9k2-manage/panel/orders')} className="flex items-center gap-2 text-gray-500 hover:text-brand-600 mb-4 transition-colors">
          <ArrowRight className="w-4 h-4" />
          رجوع
        </button>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-medium">لم يتم العثور على الطلب</p>
        </div>
      </div>
    )
  }

  const user = order.user || {}
  const template = order.template || {}
  const colors = order.customization?.colors || {}
  const sections = order.customization?.components?.sections || []
  const userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'مستخدم'

  return (
    <div>
      <button onClick={() => navigate('/x9k2-manage/panel/orders')} className="flex items-center gap-2 text-gray-500 hover:text-brand-600 mb-4 transition-colors">
        <ArrowRight className="w-4 h-4" />
        رجوع
      </button>

      <PageHeader title={`طلب #ORD-${id}`} />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">بيانات العميل</h3>
          <div className="flex items-center gap-3 mb-4">
            <Avatar name={userName} size="lg" />
            <div>
              <p className="font-semibold text-gray-900">{userName}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
          {user.phone && (
            <div className="space-y-2 text-sm text-gray-600">
              <p>📱 {user.phone}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">بيانات الطلب</h3>
          <div className="space-y-3 text-sm">
            {[
              ['القالب', template.title || '—'],
              ['المبلغ', `$${Number(order.totalAmount).toLocaleString()}`],
              ['التاريخ', new Date(order.createdAt).toLocaleDateString('ar-EG')],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between">
                <span className="text-gray-500">{l}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-3 border-t">
              <span className="text-gray-500">الحالة</span>
              <Select
                options={statusOptions}
                className="w-40"
                value={order.status}
                onChange={(e) => updateStatus.mutate(e.target.value)}
              />
            </div>
          </div>
          <Button variant="accent" className="w-full mt-4" onClick={() => navigate('/x9k2-manage/panel/chat')}>
            <MessageCircle className="w-4 h-4" /> فتح المحادثة مع العميل
          </Button>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">التخصيصات المطلوبة</h3>
          <div className="flex flex-wrap gap-6">
            {Object.entries(colors).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg border" style={{ backgroundColor: value }} />
                {key} {value}
              </div>
            ))}
          </div>
          {sections.length > 0 && (
            <p className="text-sm text-gray-600 mt-4">ترتيب الأقسام: {sections.join(' → ')}</p>
          )}
        </div>
      </div>
    </div>
  )
}
