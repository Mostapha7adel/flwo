import { useState } from 'react'
import toast from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { api } from '../../lib/axios'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { PageHeader } from '../../components/shared/PageHeader'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { formatDate } from '../../utils/formatDate'

const CYCLE_MAP = { MONTHLY: 'شهري', YEARLY: 'سنوي' }

export default function AdminServerSubscriptionsPage() {
  const [showRejected, setShowRejected] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-server-subscriptions'],
    queryFn: () => api.get('/admin/server-subscriptions').then(r => r.data),
  })

  const subs = data?.data?.subscriptions ?? data?.subscriptions ?? data?.data ?? []

  const active = subs.filter(s => s.status === 'ACTIVE')
  const rejected = subs.filter(s => s.status === 'REJECTED')

  if (isLoading) {
    return <div className="min-h-[400px] flex items-center justify-center"><Spinner size="lg" /></div>
  }

  return (
    <div>
      <PageHeader title="اشتراكات الاستضافة" description={`${active.length} نشط`} />

      {active.length === 0 ? (
        <EmptyState title="لا توجد اشتراكات نشطة" description="سيظهر هنا الاشتراكات بعد قبولها" />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div className="px-4 py-3 bg-green-50 border-b border-green-100">
            <h3 className="font-bold text-green-700 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> الاشتراكات النشطة ({active.length})
            </h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">العميل</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">الباقة</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">المبلغ</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">الدورة</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">تاريخ البدء</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">تاريخ الانتهاء</th>
              </tr>
            </thead>
            <tbody>
              {active.map((s) => (
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
                  <td className="py-3 px-4 text-sm text-gray-600">{s.startDate ? formatDate(s.startDate) : '—'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{s.endDate ? formatDate(s.endDate) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rejected.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowRejected(!showRejected)}
            className="w-full px-4 py-3 bg-red-50 border-b border-red-100 flex items-center justify-between hover:bg-red-100/50 transition-colors"
          >
            <h3 className="font-bold text-red-700 flex items-center gap-2">
              <XCircle className="w-4 h-4" /> الاشتراكات المرفوضة ({rejected.length})
            </h3>
            {showRejected ? <ChevronUp className="w-4 h-4 text-red-400" /> : <ChevronDown className="w-4 h-4 text-red-400" />}
          </button>
          {showRejected && (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">العميل</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">الباقة</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">المبلغ</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">تاريخ الطلب</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {rejected.map((s) => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{s.user?.firstName} {s.user?.lastName}</p>
                        <p className="text-xs text-gray-400">{s.user?.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">{s.plan?.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">${Number(s.price).toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{formatDate(s.createdAt)}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">{s.adminNotes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
