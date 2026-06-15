import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Search, Download, MessageCircle } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '../../components/shared/PageHeader'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'
import { api } from '../../lib/axios'
import { ORDER_STATUS } from '../../utils/constants'
import { STATUS_OPTIONS } from '../../utils/orderStatus'

const statusConfig = {
  PENDING: { label: 'قيد الانتظار', variant: 'warning' },
  ACCEPTED: { label: 'مقبول', variant: 'info' },
  IN_PROGRESS: { label: 'جاري التنفيذ', variant: 'accent' },
  COMPLETED: { label: 'مكتمل', variant: 'success' },
  CANCELLED: { label: 'ملغي', variant: 'danger' },
}

const statusFilterOptions = [
  { value: '', label: 'الحالة' },
  ...STATUS_OPTIONS,
]

const statusChangeOptions = STATUS_OPTIONS

function downloadCSV(orders) {
  const headers = ['#', 'العميل', 'البريد الإلكتروني', 'القالب', 'المبلغ', 'التاريخ', 'الحالة']
  const rows = orders.map(o => [
    o.id,
    `${o.user?.firstName || ''} ${o.user?.lastName || ''}`.trim(),
    o.user?.email || '',
    o.template?.title || '',
    Number(o.totalAmount).toFixed(2),
    new Date(o.createdAt).toLocaleDateString('ar-EG'),
    statusConfig[o.status]?.label || o.status,
  ])
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminOrdersPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-orders', statusFilter],
    queryFn: () => api.get('/admin/orders', { params: { status: statusFilter || undefined, page: 1, limit: 100 } }).then(r => r.data),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/admin/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    },
    onError: () => {
      toast.error('فشل تغيير حالة الطلب')
    },
  })

  const openChat = async (orderId) => {
    try {
      const { data } = await api.get(`/admin/orders/${orderId}/conversation`)
      navigate(`/x9k2-manage/panel/chat/${data.id}`)
    } catch {
      toast.error('فشل فتح المحادثة')
    }
  }

  const orders = data?.orders || []
  const filtered = useMemo(() => orders.filter(o => {
    if (!search) return true
    const q = search.toLowerCase()
    const clientName = `${o.user?.firstName || ''} ${o.user?.lastName || ''}`.toLowerCase()
    const templateTitle = o.template?.title?.toLowerCase() || ''
    return clientName.includes(q) || templateTitle.includes(q)
  }), [orders, search])

  if (error) {
    return (
      <div>
        <PageHeader title="إدارة الطلبات" />
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-medium">حدث خطأ أثناء تحميل الطلبات</p>
          <p className="text-red-500 text-sm mt-1">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="إدارة الطلبات"
        action={<Button variant="secondary" size="sm" onClick={() => downloadCSV(orders)}><Download className="w-4 h-4" /> تصدير CSV</Button>}
      />

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <Input placeholder="بحث..." icon={<Search className="w-4 h-4" />} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="w-40">
          <Select options={statusFilterOptions} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500">
                  <th className="text-right py-3 px-4">#</th>
                  <th className="text-right py-3 px-4">العميل</th>
                  <th className="text-right py-3 px-4">القالب</th>
                  <th className="text-right py-3 px-4">المبلغ</th>
                  <th className="text-right py-3 px-4">التاريخ</th>
                  <th className="text-right py-3 px-4">الحالة</th>
                  <th className="text-right py-3 px-4">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => {
                  const cfg = statusConfig[order.status] || { label: order.status, variant: 'subtle' }
                  return (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{order.id}</td>
                      <td className="py-3 px-4">{order.user?.firstName} {order.user?.lastName}</td>
                      <td className="py-3 px-4">{order.template?.title}</td>
                      <td className="py-3 px-4 font-medium">${Number(order.totalAmount).toLocaleString()}</td>
                      <td className="py-3 px-4 text-gray-500">{new Date(order.createdAt).toLocaleDateString('ar-EG')}</td>
                      <td className="py-3 px-4"><Badge variant={cfg.variant}>{cfg.label}</Badge></td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => navigate(`/x9k2-manage/panel/orders/${order.id}`)}>عرض</Button>
                          <Button size="sm" variant="ghost" onClick={() => openChat(order.id)}><MessageCircle className="w-4 h-4" /> محادثة</Button>
                          <Select
                            options={[{ value: '', label: 'تغيير الحالة' }, ...statusChangeOptions]}
                            className="w-32"
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                updateStatus.mutate({ id: order.id, status: e.target.value })
                              }
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
