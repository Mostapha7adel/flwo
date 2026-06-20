import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Server, CheckCircle, Clock, XCircle, Calendar } from 'lucide-react'
import { api } from '../../lib/axios'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
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

export default function ClientSubscriptionsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showSubscribe, setShowSubscribe] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [billingCycle, setBillingCycle] = useState('MONTHLY')

  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['server-plans'],
    queryFn: () => api.get('/server-plans').then(r => r.data),
  })

  const plans = plansData?.data ?? plansData ?? []

  const { data: subsData, isLoading: subsLoading } = useQuery({
    queryKey: ['my-subscriptions'],
    queryFn: () => api.get('/server-subscriptions').then(r => r.data),
  })

  const subscriptions = subsData?.data ?? subsData ?? []

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/server-subscriptions', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-subscriptions'] })
      toast.success('تم إرسال طلب الاشتراك بنجاح')
      setShowSubscribe(false)
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'فشل إرسال الطلب'),
  })

  const handleSubscribe = (e) => {
    e.preventDefault()
    if (!selectedPlanId) {
      toast.error('يرجى اختيار باقة')
      return
    }
    createMutation.mutate({ planId: selectedPlanId, billingCycle })
  }

  if (plansLoading || subsLoading) {
    return <div className="min-h-[400px] flex items-center justify-center"><Spinner size="lg" /></div>
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">اشتراكات الاستضافة</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة باقات استضافة موقعك</p>
        </div>
        <Button onClick={() => setShowSubscribe(true)}>
          <Server className="w-4 h-4" /> اشتراك جديد
        </Button>
      </div>

      {subscriptions.length === 0 ? (
        <EmptyState
          icon={Server}
          title="لا توجد اشتراكات"
          description="اشترك في إحدى باقات الاستضافة لاستضافة موقعك"
          actionLabel="اشتراك جديد"
          onAction={() => setShowSubscribe(true)}
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {subscriptions.map((s) => {
            const st = STATUS_MAP[s.status] || { label: s.status, variant: 'subtle' }
            return (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{s.plan?.name}</h3>
                    <p className="text-2xl font-bold text-brand-600 mt-1">${Number(s.price).toFixed(2)} <span className="text-sm font-normal text-gray-400">/{s.billingCycle === 'YEARLY' ? 'سنوياً' : 'شهرياً'}</span></p>
                  </div>
                  <Badge variant={st.variant}>{st.label}</Badge>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {formatDate(s.createdAt)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-gray-400" />
                    {CYCLE_MAP[s.billingCycle] || s.billingCycle}
                  </div>
                  {s.plan?.features?.length > 0 && (
                    <div className="pt-3 space-y-1.5">
                      {s.plan.features.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                          {f}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {s.adminNotes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-xl text-sm text-gray-600">
                    <span className="font-semibold">ملاحظات: </span>{s.adminNotes}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Modal isOpen={showSubscribe} onClose={() => setShowSubscribe(false)} title="اشتراك جديد" size="lg">
        <form onSubmit={handleSubscribe} className="space-y-6">
          {plans.map((plan) => (
            <label
              key={plan.id}
              className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedPlanId === plan.id ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input type="radio" name="plan" value={plan.id} checked={selectedPlanId === plan.id} onChange={(e) => setSelectedPlanId(e.target.value)} className="sr-only" />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">{plan.name}</h3>
                  {plan.description && <p className="text-sm text-gray-500 mt-1">{plan.description}</p>}
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-brand-600">
                    ${Number(plan.monthlyPrice).toFixed(2)}
                    <span className="text-xs font-normal text-gray-400">/شهر</span>
                  </p>
                  <p className="text-xs text-gray-400">${Number(plan.yearlyPrice).toFixed(2)}/سنوياً</p>
                </div>
              </div>
              {plan.features?.length > 0 && (
                <div className="grid grid-cols-2 gap-1.5 mt-3 pt-3 border-t border-gray-100">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-gray-500">
                      <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              )}
            </label>
          ))}
          <Select
            label="دورة الفوترة"
            value={billingCycle}
            onChange={(e) => setBillingCycle(e.target.value)}
            options={[
              { value: 'MONTHLY', label: 'شهري' },
              { value: 'YEARLY', label: 'سنوي (خصم)' },
            ]}
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowSubscribe(false)}>إلغاء</Button>
            <Button type="submit" loading={createMutation.isPending}>طلب الاشتراك</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
