import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { Avatar } from '../../components/ui/Avatar'
import { PageHeader } from '../../components/shared/PageHeader'
import { Spinner } from '../../components/ui/Spinner'
import { api } from '../../lib/axios'
import { formatDate } from '../../utils/formatDate'

const CYCLE_MAP = { MONTHLY: 'شهري', YEARLY: 'سنوي' }

function getStatusOptions(currentStatus) {
  if (currentStatus === 'PENDING') return [
    { value: 'ACTIVE', label: 'تفعيل' },
    { value: 'REJECTED', label: 'رفض' },
  ]
  if (currentStatus === 'ACTIVE') return [
    { value: 'CANCELLED', label: 'إلغاء (بعد انتهاء المدة)' },
  ]
  return []
}

function getStatusBadge(status) {
  const map = {
    ACTIVE: { label: 'نشط', variant: 'success' },
    PENDING: { label: 'معلق', variant: 'warning' },
    CANCELLED: { label: 'ملغي', variant: 'subtle' },
    EXPIRED: { label: 'منتهي', variant: 'subtle' },
    REJECTED: { label: 'مرفوض', variant: 'error' },
  }
  return map[status] || { label: status, variant: 'subtle' }
}

export default function AdminSubscriptionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [showStatusModal, setShowStatusModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [adminNotes, setAdminNotes] = useState('')

  const { data: sub, isLoading, error } = useQuery({
    queryKey: ['admin-subscription', id],
    queryFn: () => api.get(`/admin/server-subscriptions/${id}`).then(r => r.data),
    enabled: !!id,
  })

  const subData = sub?.data ?? sub

  const updateMutation = useMutation({
    mutationFn: (payload) => api.patch(`/admin/server-subscriptions/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscription', id] })
      queryClient.invalidateQueries({ queryKey: ['admin-server-subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      toast.success('تم تحديث الاشتراك')
      setShowStatusModal(false)
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'فشل تحديث الاشتراك'),
  })

  const openStatusModal = () => {
    setNewStatus('')
    setAdminNotes(subData?.adminNotes || '')
    setShowStatusModal(true)
  }

  const handleStatusChange = () => {
    if (!newStatus) { toast.error('يرجى اختيار الحالة'); return }
    updateMutation.mutate({ status: newStatus, adminNotes: adminNotes.trim() || undefined })
  }

  if (isLoading) {
    return (
      <div>
        <button onClick={() => navigate('/x9k2-manage/panel/orders')} className="flex items-center gap-2 text-gray-500 hover:text-brand-600 mb-4 transition-colors">
          <ArrowRight className="w-4 h-4" />
          رجوع
        </button>
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      </div>
    )
  }

  if (error || !subData) {
    return (
      <div>
        <button onClick={() => navigate('/x9k2-manage/panel/orders')} className="flex items-center gap-2 text-gray-500 hover:text-brand-600 mb-4 transition-colors">
          <ArrowRight className="w-4 h-4" />
          رجوع
        </button>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-medium">لم يتم العثور على الاشتراك</p>
        </div>
      </div>
    )
  }

  const user = subData.user || {}
  const plan = subData.plan || {}
  const userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'مستخدم'
  const statusOpts = getStatusOptions(subData.status)
  const badge = getStatusBadge(subData.status)

  return (
    <div>
      <button onClick={() => navigate('/x9k2-manage/panel/orders')} className="flex items-center gap-2 text-gray-500 hover:text-brand-600 mb-4 transition-colors">
        <ArrowRight className="w-4 h-4" />
        رجوع للطلبات
      </button>

      <PageHeader title={`اشتراك استضافة — ${plan.name || '—'}`} />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">بيانات العميل</h3>
          <div className="flex items-center gap-3 mb-4">
            <Avatar name={userName} size="lg" />
            <div>
              <p className="font-semibold text-gray-900">{userName}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
              {user.phone && <p className="text-xs text-gray-400">📱 {user.phone}</p>}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">بيانات الاشتراك</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">الباقة</span><span className="font-medium">{plan.name || '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">المبلغ</span><span className="font-medium">${Number(subData.price).toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">الدورة</span><span className="font-medium">{CYCLE_MAP[subData.billingCycle] || subData.billingCycle}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">تاريخ البدء</span><span className="font-medium">{subData.startDate ? formatDate(subData.startDate) : '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">تاريخ الانتهاء</span><span className="font-medium">{subData.endDate ? formatDate(subData.endDate) : '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">تاريخ الطلب</span><span className="font-medium">{formatDate(subData.createdAt)}</span></div>
            <div className="flex justify-between items-center pt-3 border-t">
              <span className="text-gray-500">الحالة</span>
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </div>
          </div>

          {plan.features?.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">مميزات الباقة</h4>
              <div className="flex flex-wrap gap-1.5">
                {plan.features.map((f, i) => (
                  <span key={i} className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">{f}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {statusOpts.length > 0 && (
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">تغيير الحالة</h3>
            <Button onClick={openStatusModal} variant={subData.status === 'PENDING' ? 'primary' : 'outline'}>
              {subData.status === 'PENDING' ? 'تفعيل الاشتراك' : 'تغيير الحالة'}
            </Button>
            {subData.adminNotes && (
              <div className="mt-3 p-3 bg-gray-50 rounded-xl text-sm text-gray-600">
                <span className="font-semibold">ملاحظات: </span>{subData.adminNotes}
              </div>
            )}
          </div>
        )}
      </div>

      <Modal open={showStatusModal} onClose={() => setShowStatusModal(false)} title="تغيير حالة الاشتراك">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">الحالية:</span>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
          <Select
            label="الحالة الجديدة"
            options={[{ value: '', label: 'اختر الحالة' }, ...statusOpts]}
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
          />
          <Textarea label="ملاحظات (للمستخدم)" rows={3} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowStatusModal(false)}>إلغاء</Button>
            <Button onClick={handleStatusChange} loading={updateMutation.isPending}>حفظ</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
