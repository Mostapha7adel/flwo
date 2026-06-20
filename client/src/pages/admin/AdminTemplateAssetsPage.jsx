import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Plus, Trash2, Image, FileText, Code, Film } from 'lucide-react'
import { api } from '../../lib/axios'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { PageHeader } from '../../components/shared/PageHeader'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { formatDate } from '../../utils/formatDate'

const ASSET_TYPES = [
  { value: 'image', label: 'صورة', icon: Image },
  { value: 'css', label: 'CSS', icon: Code },
  { value: 'js', label: 'JavaScript', icon: Code },
  { value: 'font', label: 'خط', icon: FileText },
  { value: 'video', label: 'فيديو', icon: Film },
  { value: 'other', label: 'أخرى', icon: FileText },
]

export default function AdminTemplateAssetsPage() {
  const { templateId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [showAdd, setShowAdd] = useState(false)
  const [type, setType] = useState('image')
  const [url, setUrl] = useState('')
  const [label, setLabel] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['template-assets', templateId],
    queryFn: () => api.get(`/templates/${templateId}/assets`).then(r => r.data),
    enabled: !!templateId,
  })

  const assets = data?.data ?? data ?? []

  const createMutation = useMutation({
    mutationFn: (payload) => api.post(`/templates/${templateId}/assets`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-assets', templateId] })
      toast.success('تم إضافة الأصل بنجاح')
      setShowAdd(false)
      setUrl('')
      setLabel('')
      setType('image')
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'فشل إضافة الأصل'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/templates/assets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-assets', templateId] })
      toast.success('تم حذف الأصل')
    },
    onError: () => toast.error('فشل حذف الأصل'),
  })

  const handleAdd = (e) => {
    e.preventDefault()
    if (!url.trim()) {
      toast.error('يرجى إدخال رابط الأصل')
      return
    }
    createMutation.mutate({
      type,
      url: url.trim(),
      label: label.trim() || undefined,
    })
  }

  const TypeIcon = ASSET_TYPES.find(t => t.value === type)?.icon || FileText

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Spinner size="lg" />
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
        title="إدارة أصول القالب"
        description={`${assets.length} أصل`}
        action={
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4" /> إضافة أصل
          </Button>
        }
      />

      {assets.length === 0 ? (
        <EmptyState icon={Image} title="لا توجد أصول بعد" description="أضف أول أصل للقالب" actionLabel="إضافة أصل" onAction={() => setShowAdd(true)} />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 w-12">نوع</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">العنوان</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">الرابط</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">التاريخ</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => {
                const IconComp = ASSET_TYPES.find(t => t.value === a.type)?.icon || FileText
                return (
                  <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                        <IconComp className="w-4 h-4 text-gray-600" />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{a.label || '—'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate" dir="ltr">{a.url}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{formatDate(a.createdAt)}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600"
                          loading={deleteMutation.isPending && deleteMutation.variables === a.id}
                          onClick={() => {
                            if (window.confirm('هل أنت متأكد من حذف هذا الأصل؟')) {
                              deleteMutation.mutate(a.id)
                            }
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> حذف
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

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="إضافة أصل جديد">
        <form onSubmit={handleAdd} className="space-y-4">
          <Select label="النوع" value={type} onChange={(e) => setType(e.target.value)} options={ASSET_TYPES} />
          <Input label="الرابط" type="url" dir="ltr" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
          <Input label="العنوان (اختياري)" value={label} onChange={(e) => setLabel(e.target.value)} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowAdd(false)}>إلغاء</Button>
            <Button type="submit" loading={createMutation.isPending}>إضافة</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
