import { useState, useMemo } from 'react'
import { ShoppingBag, Loader } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '../../components/shared/PageHeader'
import { OrderCard } from '../../components/shared/OrderCard'
import { EmptyState } from '../../components/shared/EmptyState'
import { Select } from '../../components/ui/Select'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/axios'

const filterOptions = [
  { value: 'all', label: 'الكل' },
  { value: 'PENDING', label: 'قيد الانتظار' },
  { value: 'ACCEPTED', label: 'مقبول' },
  { value: 'IN_PROGRESS', label: 'جاري التنفيذ' },
  { value: 'COMPLETED', label: 'مكتمل' },
  { value: 'CANCELLED', label: 'ملغي' },
]

function mapOrderToCard(order) {
  return {
    id: order.id,
    templateName: order.template?.title || 'بدون اسم',
    templateCategory: order.template?.category || 'عام',
    templatePreview: order.template?.previewUrl || '',
    amount: Number(order.totalAmount),
    createdAt: new Date(order.createdAt),
    status: order.status,
    hasChat: ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(order.status),
  }
}

export default function ClientOrdersPage() {
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders').then(r => r.data),
  })

  const orders = useMemo(() => (ordersData?.orders || []).map(mapOrderToCard), [ordersData])
  const filtered = useMemo(() => filter === 'all' ? orders : orders.filter(o => o.status === filter), [orders, filter])

  return (
    <div>
      <PageHeader title="طلباتي" description={isLoading ? 'جاري التحميل...' : `${orders.length} طلب`} />

      <div className="mb-6 w-44">
        <Select options={filterOptions} value={filter} onChange={(e) => setFilter(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 animate-spin text-brand-500" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="لا توجد طلبات" description="لم تقم بإنشاء أي طلب بعد" actionLabel="تصفح القوالب" onAction={() => navigate('/templates')} />
      ) : (
        <div className="space-y-4">
          {filtered.map(order => <OrderCard key={order.id} order={order} />)}
        </div>
      )}
    </div>
  )
}
