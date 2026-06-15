import { useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import { ShoppingBag, Clock, CheckCircle, MessageCircle, Loader } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { StatsCard } from '../../components/shared/StatsCard'
import { EmptyState } from '../../components/shared/EmptyState'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../lib/axios'
import { formatDate } from '../../utils/formatDate'

export default function ClientOverviewPage() {
  const user = useAuthStore(s => s.user)
  const navigate = useNavigate()

  const { data: ordersData, isLoading, isError } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders').then(r => r.data),
  })

  const orders = ordersData?.orders || []
  const totalOrders = ordersData?.total || orders.length
  const inProgress = useMemo(() => orders.filter(o => o.status === 'ACCEPTED' || o.status === 'IN_PROGRESS').length, [orders])
  const completed = useMemo(() => orders.filter(o => o.status === 'COMPLETED').length, [orders])

  const stats = [
    { icon: ShoppingBag, label: 'طلباتي', value: totalOrders },
    { icon: Clock, label: 'قيد التنفيذ', value: inProgress },
    { icon: CheckCircle, label: 'مكتملة', value: completed },
  ]

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders])

  return (
    <div>
      <PageHeader title={`مرحباً بك، ${user?.firstName}!`} />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 animate-spin text-brand-500" />
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-medium">حدث خطأ أثناء تحميل البيانات</p>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {stats.map(s => <StatsCard key={s.label} {...s} />)}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">آخر الطلبات</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/orders')}>عرض كل الطلبات</Button>
            </div>
            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <EmptyState icon={ShoppingBag} title="لا توجد طلبات" description="لم تقم بإنشاء أي طلب بعد" actionLabel="تصفح القوالب" onAction={() => navigate('/templates')} />
              ) : (
                recentOrders.map(order => (
                  <div key={order.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/dashboard/orders/${order.id}`)}>
                    <div className="w-12 h-12 rounded-xl bg-gray-100" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{order.template?.title || 'بدون اسم'}</p>
                      <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${order.status === 'COMPLETED' ? 'bg-green-500' : order.status === 'CANCELLED' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                      <span className="text-sm text-gray-500">{order.status === 'PENDING' ? 'قيد الانتظار' : order.status === 'ACCEPTED' ? 'مقبول' : order.status === 'IN_PROGRESS' ? 'جاري التنفيذ' : order.status === 'COMPLETED' ? 'مكتمل' : order.status === 'CANCELLED' ? 'ملغي' : order.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      <div className="mt-6 bg-gradient-to-r from-brand-500 to-accent-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <MessageCircle className="w-5 h-5" />
          <p className="font-semibold">هل تحتاج مساعدة؟ تواصل مع فريق الدعم</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard/chat')}>فتح المحادثة</Button>
      </div>
    </div>
  )
}
