import { useState } from 'react'
import toast from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle } from 'lucide-react'
import { api } from '../../lib/axios'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { PageHeader } from '../../components/shared/PageHeader'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { formatDate } from '../../utils/formatDate'

const STATUS_MAP = {
  PENDING: { label: 'معلق', variant: 'warning' },
  ACTIVE: { label: 'نشط', variant: 'success' },
  CANCELLED: { label: 'ملغي', variant: 'subtle' },
  EXPIRED: { label: 'منتهي', variant: 'subtle' },
  REJECTED: { label: 'مرفوض', variant: 'error' },
}

const CYCLE_MAP = { MONTHLY: 'شهري', YEARLY: 'سنوي' }

export default function AdminServerSubscriptionsPage() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [status, setStatus] = useState('ACTIVE')
  const [adminNotes, setAdminNotes] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-server-subscriptions'],
    queryFn: () => api.get('/admin/server-subscriptions').then(r => r.data),
  })

  const subs = data?.data?.subscriptions ?? data?.subscriptions ?? data?.data ?? []

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => api.patch(`/admin/server-subscriptions/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-server-subscriptions'] })
      toast.success('تم تحديث الاشتراك')
      setShowModal(false)
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'فشل تحديث الاشتراك'),
  })

  const openEdit = (sub) => {
    setEditId(sub.id)
    setStatus(sub.status)
    setAdminNotes(sub.adminNotes || '')
    setShowModal(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    updateMutation.mutate({ id: editId, payload: { status, adminNotes: adminNotes.trim() || undefined } })
  }

  if (isLoading) {
    return <div className="min-h-[400px] flex items-center justify-center"><Spinner size="lg" /></div>
  }

  return (
    <div>
      <PageHeader title="اشتراكات الاستضافة" description={`${subs.length} اشتراك`} />

      {subs.length === 0 ? (
        <EmptyState title="لا توجد اشتراكات" description="لا يوجد طلبات اشتراك بعد" />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">العميل</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">الباقة</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">المبلغ</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">الدورة</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">الحالة</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">تاريخ البدء</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">تاريخ الانتهاء</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">تاريخ الطلب</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => {
                const st = STATUS_MAP[s.status] || { label: s.status, variant: 'subtle' }
                return (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{s.user?.firstName} {s.user?.lastName}</p>
                        <p className="text-xs text-gray-400">{s.user?.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">{s.plan?.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">${Number(s.price).toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{CYCLE_MAP[s.billingCycle] || s.billingCycle}</td>
                    <td className="py-3 px-4"><Badge variant={st.variant}>{st.label}</Badge></td>
                    <td className="py-3 px-4 text-sm text-gray-600">{s.startDate ? formatDate(s.startDate) : '—'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{s.endDate ? formatDate(s.endDate) : '—'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{formatDate(s.createdAt)}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>
                          {s.status === 'PENDING' ? <><CheckCircle className="w-3.5 h-3.5" /> مراجعة</> : 'تعديل'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="تحديث الاشتراك">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="الحالة"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: 'ACTIVE', label: 'نشط' },
              { value: 'CANCELLED', label: 'ملغي' },
              { value: 'REJECTED', label: 'مرفوض' },
            ]}
          />
          <Textarea label="ملاحظات الإدارة" rows={3} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>إلغاء</Button>
            <Button type="submit" loading={updateMutation.isPending}>حفظ</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
