import { ShoppingBag, Users, DollarSign, Clock, Loader } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/axios'
import { StatsCard } from '../../components/shared/StatsCard'
import { PageHeader } from '../../components/shared/PageHeader'
import { Badge } from '../../components/ui/Badge'

const statusMap = {
  PENDING: { variant: 'warning', label: 'انتظار' },
  ACCEPTED: { variant: 'info', label: 'مقبول' },
  IN_PROGRESS: { variant: 'info', label: 'جاري' },
  COMPLETED: { variant: 'success', label: 'مكتمل' },
  CANCELLED: { variant: 'danger', label: 'ملغي' },
}

export default function AdminOverviewPage() {
  const { data: stats, isLoading: statsLoading, isError: statsError } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then(r => r.data),
  })

  const { data: ordersData, isLoading: ordersLoading, isError: ordersError } = useQuery({
    queryKey: ['admin-orders-recent'],
    queryFn: () => api.get('/admin/orders', { params: { limit: 5 } }).then(r => r.data),
  })

  if (statsError || ordersError) {
    return (
      <div>
        <PageHeader title="نظرة عامة" />
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-medium">حدث خطأ أثناء تحميل البيانات</p>
        </div>
      </div>
    )
  }

  const orders = ordersData?.orders || []
  const cards = stats ? [
    { icon: ShoppingBag, label: 'الطلبات', value: stats.orders },
    { icon: Users, label: 'العملاء', value: stats.users },
    { icon: DollarSign, label: 'القوالب', value: stats.templates },
    { icon: Clock, label: 'قيد الانتظار', value: stats.ordersByStatus?.PENDING || 0 },
  ] : []

  return (
    <div>
      <PageHeader title="نظرة عامة" />

      {statsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 animate-spin text-brand-500" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {cards.map(s => <StatsCard key={s.label} {...s} />)}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-4">آخر الطلبات</h2>
        {ordersLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-5 h-5 animate-spin text-brand-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b">
                  <th className="text-right py-3 px-2">#</th>
                  <th className="text-right py-3 px-2">العميل</th>
                  <th className="text-right py-3 px-2">القالب</th>
                  <th className="text-right py-3 px-2">المبلغ</th>
                  <th className="text-right py-3 px-2">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => {
                  const st = statusMap[order.status] || { variant: 'default', label: order.status }
                  return (
                    <tr key={order.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 px-2 font-medium">{order.orderNumber}</td>
                      <td className="py-3 px-2">{order.user?.firstName} {order.user?.lastName}</td>
                      <td className="py-3 px-2">{order.template?.title}</td>
                      <td className="py-3 px-2 font-medium">${order.totalAmount}</td>
                      <td className="py-3 px-2"><Badge variant={st.variant}>{st.label}</Badge></td>
                    </tr>
                  )
                })}
                {orders.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-400">لا توجد طلبات بعد</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
