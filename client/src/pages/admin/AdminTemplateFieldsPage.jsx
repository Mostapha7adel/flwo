import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Plus, Edit3, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { api } from '../../lib/axios'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { PageHeader } from '../../components/shared/PageHeader'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/shared/EmptyState'

const FIELD_TYPES = [
  { value: 'text', label: 'نص' },
  { value: 'color', label: 'لون' },
  { value: 'image', label: 'صورة' },
  { value: 'boolean', label: 'نعم/لا' },
  { value: 'select', label: 'اختيار من متعدد' },
]

const emptyForm = { key: '', label: '', type: 'text', required: false, defaultValue: '', options: '', sortOrder: 0 }

export default function AdminTemplateFieldsPage() {
  const { templateId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ ...emptyForm })

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['template-fields', templateId],
    queryFn: () => api.get(`/admin/templates/${templateId}/fields`).then(r => r.data),
    enabled: !!templateId,
  })

  const fields = data?.data ?? data ?? []

  const createMutation = useMutation({
    mutationFn: (payload) => api.post(`/admin/templates/${templateId}/fields`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-fields', templateId] })
      toast.success('تم إضافة الحقل بنجاح')
      closeModal()
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'فشل إضافة الحقل'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => api.put(`/admin/fields/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-fields', templateId] })
      toast.success('تم تحديث الحقل بنجاح')
      closeModal()
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'فشل تحديث الحقل'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/fields/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-fields', templateId] })
      toast.success('تم حذف الحقل')
    },
    onError: () => toast.error('فشل حذف الحقل'),
  })

  const reorderMutation = useMutation({
    mutationFn: (orderedIds) => api.put(`/admin/templates/${templateId}/fields/reorder`, { orderedIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-fields', templateId] })
      toast.success('تم إعادة الترتيب')
    },
    onError: () => toast.error('فشل إعادة الترتيب'),
  })

  const closeModal = () => {
    setShowModal(false)
    setEditId(null)
    setForm({ ...emptyForm })
  }

  const openEdit = (field) => {
    setEditId(field.id)
    setForm({
      key: field.key || '',
      label: field.label || '',
      type: field.type || 'text',
      required: field.required || false,
      defaultValue: field.defaultValue || '',
      options: Array.isArray(field.options) ? field.options.join('\n') : '',
      sortOrder: field.sortOrder ?? 0,
    })
    setShowModal(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.key.trim() || !form.label.trim()) {
      toast.error('يرجى إدخال المفتاح والعنوان')
      return
    }
    const payload = {
      key: form.key.trim(),
      label: form.label.trim(),
      type: form.type,
      required: form.required,
      defaultValue: form.defaultValue.trim() || undefined,
      options: form.type === 'select' ? form.options.split('\n').map(s => s.trim()).filter(Boolean) : undefined,
      sortOrder: Number(form.sortOrder),
    }
    if (editId) {
      updateMutation.mutate({ id: editId, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const moveUp = (index) => {
    if (index === 0) return
    const ids = fields.map(f => f.id)
    ;[ids[index - 1], ids[index]] = [ids[index], ids[index - 1]]
    reorderMutation.mutate(ids)
  }

  const moveDown = (index) => {
    if (index === fields.length - 1) return
    const ids = fields.map(f => f.id)
    ;[ids[index], ids[index + 1]] = [ids[index + 1], ids[index]]
    reorderMutation.mutate(ids)
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <p className="text-red-600">{error?.message || 'حدث خطأ أثناء تحميل الحقول'}</p>
      </div>
    )
  }

  return (
    <div>
      <button onClick={() => navigate('/x9k2-manage/panel/templates')} className="flex items-center gap-2 text-gray-500 hover:text-brand-600 mb-4 transition-colors">
        <ArrowRight className="w-4 h-4" />
        العودة للقوالب
      </button>

      <PageHeader
        title="إدارة حقول القالب"
        description={`${fields.length} حقل`}
        action={
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" /> إضافة حقل
          </Button>
        }
      />

      {fields.length === 0 ? (
        <EmptyState title="لا توجد حقول بعد" description="أضف الحقل الأول للقالب" actionLabel="إضافة حقل" onAction={() => setShowModal(true)} />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 w-16">ترتيب</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">المفتاح</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">العنوان</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">النوع</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">إجباري</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((f, i) => (
                <tr key={f.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => moveUp(i)} disabled={i === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed">
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => moveDown(i)} disabled={i === fields.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm font-mono text-gray-900">{f.key}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{f.label}</td>
                  <td className="py-3 px-4">
                    <Badge variant="info">{FIELD_TYPES.find(t => t.value === f.type)?.label || f.type}</Badge>
                  </td>
                  <td className="py-3 px-4 text-sm">{f.required ? <Badge variant="success">نعم</Badge> : <Badge variant="subtle">لا</Badge>}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(f)}>
                        <Edit3 className="w-3.5 h-3.5" /> تعديل
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600"
                        loading={deleteMutation.isPending && deleteMutation.variables === f.id}
                        onClick={() => {
                          if (window.confirm('هل أنت متأكد من حذف هذا الحقل؟')) {
                            deleteMutation.mutate(f.id)
                          }
                        }}
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

      <Modal isOpen={showModal} onClose={closeModal} title={editId ? 'تعديل الحقل' : 'إضافة حقل'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="المفتاح (key)" dir="ltr" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} />
            <Input label="العنوان (label)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="النوع"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              options={FIELD_TYPES}
            />
            <Input label="ترتيب العرض" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
          </div>
          <Input label="القيمة الافتراضية" value={form.defaultValue} onChange={(e) => setForm({ ...form, defaultValue: e.target.value })} />
          {form.type === 'select' && (
            <Textarea label="الخيارات (واحد لكل سطر)" rows={4} dir="ltr" value={form.options} onChange={(e) => setForm({ ...form, options: e.target.value })} />
          )}
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.required} onChange={(e) => setForm({ ...form, required: e.target.checked })} className="rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
            حقل إجباري
          </label>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={closeModal}>إلغاء</Button>
            <Button type="submit" loading={isPending}>{editId ? 'حفظ التغييرات' : 'إضافة'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
