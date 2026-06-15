import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/axios'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { PageHeader } from '../../components/shared/PageHeader'
import { Spinner } from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

export default function AdminTemplatesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-templates'],
    queryFn: () => api.get('/admin/templates').then(r => r.data),
  })

  const publishMutation = useMutation({
    mutationFn: ({ id, isPublished }) =>
      api.patch(`/admin/templates/${id}/publish`, { isPublished }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-templates'] })
      toast.success('تم تحديث حالة القالب')
    },
    onError: () => toast.error('فشل تحديث حالة القالب'),
  })

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
        <p className="text-red-600">{error?.message || 'حدث خطأ أثناء تحميل القوالب'}</p>
      </div>
    )
  }

  const templates = data?.templates ?? []

  return (
    <div>
      <PageHeader
        title="القوالب"
        description={`${templates.length} قالب`}
        action={
          <Button onClick={() => navigate('/x9k2-manage/panel/templates/new')}>
            <Plus className="w-4 h-4" /> إضافة قالب جديد
          </Button>
        }
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(t => (
          <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-40 bg-gradient-to-br from-brand-500/20 to-accent-500/20 flex items-center justify-center">
              <span className="text-gray-400 text-4xl font-bold">{t.title?.[0]}</span>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-gray-900">{t.title}</h3>
                <span className="font-bold text-brand-600">${t.price}</span>
              </div>
              <Badge variant={t.isPublished ? 'success' : 'subtle'}>{t.isPublished ? 'منشور' : 'مخفي'}</Badge>
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1"
                  onClick={() => navigate(`/x9k2-manage/panel/templates/edit/${t.id}`)}
                >
                  تعديل
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1 text-red-600"
                  loading={publishMutation.isPending && publishMutation.variables?.id === t.id}
                  onClick={() => publishMutation.mutate({ id: t.id, isPublished: !t.isPublished })}
                >
                  {t.isPublished ? 'إخفاء' : 'نشر'}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
