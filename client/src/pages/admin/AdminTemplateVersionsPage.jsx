import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Plus, FileCode, Download } from 'lucide-react'
import { api } from '../../lib/axios'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/shared/PageHeader'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { formatDate } from '../../utils/formatDate'

export default function AdminTemplateVersionsPage() {
  const { templateId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [showAdd, setShowAdd] = useState(false)
  const [version, setVersion] = useState('')
  const [changelog, setChangelog] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [fileSize, setFileSize] = useState('')
  const [isCurrent, setIsCurrent] = useState(false)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['template-versions', templateId],
    queryFn: () => api.get(`/templates/${templateId}/versions`).then(r => r.data),
    enabled: !!templateId,
  })

  const versions = data?.versions ?? data?.data ?? []

  const createMutation = useMutation({
    mutationFn: (payload) => api.post(`/templates/${templateId}/versions`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-versions', templateId] })
      toast.success('تم إضافة الإصدار بنجاح')
      setShowAdd(false)
      setVersion('')
      setChangelog('')
      setFileUrl('')
      setFileSize('')
      setIsCurrent(false)
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'فشل إضافة الإصدار'),
  })

  const setCurrentMutation = useMutation({
    mutationFn: (id) => api.put(`/templates/${templateId}/versions/${id}/current`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-versions', templateId] })
      toast.success('تم تعيين الإصدار كحالي')
    },
    onError: () => toast.error('فشل تعيين الإصدار'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/templates/${templateId}/versions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-versions', templateId] })
      toast.success('تم حذف الإصدار')
    },
    onError: () => toast.error('فشل حذف الإصدار'),
  })

  const handleAdd = (e) => {
    e.preventDefault()
    if (!version.trim()) {
      toast.error('يرجى إدخال رقم الإصدار')
      return
    }
    createMutation.mutate({
      version: version.trim(),
      changelog: changelog.trim() || undefined,
      fileUrl: fileUrl.trim() || undefined,
      fileSize: fileSize ? Number(fileSize) : undefined,
      isCurrent,
    })
  }

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
        <p className="text-red-600">{error?.message || 'حدث خطأ أثناء تحميل الإصدارات'}</p>
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
        title="إدارة الإصدارات"
        description={`${data?.total || versions.length} إصدار`}
        action={
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4" /> إضافة إصدار جديد
          </Button>
        }
      />

      {versions.length === 0 ? (
        <EmptyState icon={FileCode} title="لا توجد إصدارات بعد" description="أضف أول إصدار للقالب" actionLabel="إضافة إصدار" onAction={() => setShowAdd(true)} />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">رقم الإصدار</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">سجل التغييرات</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">حجم الملف</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">الحالة</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">تاريخ الإضافة</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((v) => (
                <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{v.version}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">{v.changelog || '—'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {v.fileSize ? (
                      <span className="inline-flex items-center gap-1">
                        <Download className="w-3.5 h-3.5" />
                        {v.fileSize} MB
                      </span>
                    ) : '—'}
                  </td>
                  <td className="py-3 px-4">
                    {v.isCurrent ? (
                      <Badge variant="success">حالي</Badge>
                    ) : (
                      <Badge variant="subtle">سابق</Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{formatDate(v.createdAt)}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2 justify-end">
                      {!v.isCurrent && (
                        <Button
                          size="sm"
                          variant="outline"
                          loading={setCurrentMutation.isPending && setCurrentMutation.variables === v.id}
                          onClick={() => setCurrentMutation.mutate(v.id)}
                        >
                          تعيين كحالي
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600"
                        loading={deleteMutation.isPending && deleteMutation.variables === v.id}
                        onClick={() => {
                          if (window.confirm('هل أنت متأكد من حذف هذا الإصدار؟')) {
                            deleteMutation.mutate(v.id)
                          }
                        }}
                      >
                        حذف
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="إضافة إصدار جديد">
        <form onSubmit={handleAdd} className="space-y-4">
          <Input label="رقم الإصدار" placeholder="مثال: 1.0.0" value={version} onChange={(e) => setVersion(e.target.value)} />
          <Textarea label="سجل التغييرات" rows={3} value={changelog} onChange={(e) => setChangelog(e.target.value)} />
          <Input label="رابط الملف" type="url" dir="ltr" placeholder="https://..." value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} />
          <Input label="حجم الملف (MB)" type="number" value={fileSize} onChange={(e) => setFileSize(e.target.value)} />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={isCurrent} onChange={(e) => setIsCurrent(e.target.checked)} className="rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
            تعيين كإصدار حالي
          </label>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowAdd(false)}>إلغاء</Button>
            <Button type="submit" loading={createMutation.isPending}>إضافة</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
