import { useState } from 'react'
import toast from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit3, Trash2 } from 'lucide-react'
import { api } from '../../lib/axios'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { PageHeader } from '../../components/shared/PageHeader'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { formatDate } from '../../utils/formatDate'

const emptyForm = { name: '', description: '', features: '', monthlyPrice: '', yearlyPrice: '', isActive: true, sortOrder: 0 }

export default function AdminServerPlansPage() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ ...emptyForm })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-server-plans'],
    queryFn: () => api.get('/admin/server-plans').then(r => r.data),
  })

  const plans = data?.data ?? data ?? []

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/admin/server-plans', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-server-plans'] })
      toast.success('تم إضافة الباقة بنجاح')
      closeModal()
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'فشل إضافة الباقة'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => api.put(`/admin/server-plans/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-server-plans'] })
      toast.success('تم تحديث الباقة بنجاح')
      closeModal()
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'فشل تحديث الباقة'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/server-plans/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-server-plans'] })
      toast.success('تم حذف الباقة')
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'فشل حذف الباقة'),
  })

  const closeModal = () => {
    setShowModal(false)
    setEditId(null)
    setForm({ ...emptyForm })
  }

  const openEdit = (plan) => {
    setEditId(plan.id)
    setForm({
      name: plan.name || '',
      description: plan.description || '',
      features: Array.isArray(plan.features) ? plan.features.join('\n') : '',
      monthlyPrice: plan.monthlyPrice?.toString() || '',
      yearlyPrice: plan.yearlyPrice?.toString() || '',
      isActive: plan.isActive ?? true,
      sortOrder: plan.sortOrder ?? 0,
    })
    setShowModal(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('يرجى إدخال اسم الباقة')
      return
    }
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      features: form.features.split('\n').map(s => s.trim()).filter(Boolean),
      monthlyPrice: Number(form.monthlyPrice),
      yearlyPrice: Number(form.yearlyPrice),
      isActive: form.isActive,
      sortOrder: Number(form.sortOrder),
    }
    if (editId) {
      updateMutation.mutate({ id: editId, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  if (isLoading) {
    return <div className="min-h-[400px] flex items-center justify-center"><Spinner size="lg" /></div>
  }

  return (
    <div>
      <PageHeader
        title="باقات الاستضافة"
        description={`${plans.length} باقة`}
        action={
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" /> إضافة باقة
          </Button>
        }
      />

      {plans.length === 0 ? (
        <EmptyState title="لا توجد باقات بعد" description="أضف أول باقة استضافة" actionLabel="إضافة باقة" onAction={() => setShowModal(true)} />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">الاسم</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">شهرياً</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">سنوياً</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">المميزات</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">الحالة</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">التاريخ</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{p.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">${Number(p.monthlyPrice).toFixed(2)}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">${Number(p.yearlyPrice).toFixed(2)}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 max-w-xs">
                    <div className="flex flex-wrap gap-1">
                      {p.features?.slice(0, 3).map((f, i) => (
                        <span key={i} className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{f}</span>
                      ))}
                      {p.features?.length > 3 && <span className="text-xs text-gray-400">+{p.features.length - 3}</span>}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {p.isActive ? <Badge variant="success">نشط</Badge> : <Badge variant="subtle">غير نشط</Badge>}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{formatDate(p.createdAt)}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                        <Edit3 className="w-3.5 h-3.5" /> تعديل
                      </Button>
                      <Button
                        size="sm" variant="ghost" className="text-red-600"
                        loading={deleteMutation.isPending && deleteMutation.variables === p.id}
                        onClick={() => { if (window.confirm('هل أنت متأكد من حذف الباقة؟')) deleteMutation.mutate(p.id) }}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> حذف
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showModal} onClose={closeModal} title={editId ? 'تعديل الباقة' : 'إضافة باقة'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="اسم الباقة" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Textarea label="الوصف" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Textarea label="المميزات (واحد لكل سطر)" rows={5} dir="ltr" value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="السعر شهرياً ($)" type="number" step="0.01" value={form.monthlyPrice} onChange={(e) => setForm({ ...form, monthlyPrice: e.target.value })} />
            <Input label="السعر سنوياً ($)" type="number" step="0.01" value={form.yearlyPrice} onChange={(e) => setForm({ ...form, yearlyPrice: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="ترتيب العرض" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
            <label className="flex items-end gap-2 text-sm text-gray-700 pb-2">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
              الباقة نشطة
            </label>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={closeModal}>إلغاء</Button>
            <Button type="submit" loading={isPending}>{editId ? 'حفظ التغييرات' : 'إضافة'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
