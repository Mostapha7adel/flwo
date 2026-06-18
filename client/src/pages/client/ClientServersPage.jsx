import { useState } from 'react'
import toast from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Server, Edit3, Trash2 } from 'lucide-react'
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
import { SkeletonList } from '../../components/ui/Skeleton'

const emptyForm = { label: '', host: '', port: '22', username: 'root', authType: 'PASSWORD', password: '', sshKey: '', domain: '', notes: '' }

export default function ClientServersPage() {
  const queryClient = useQueryClient()

  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ ...emptyForm })

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['servers'],
    queryFn: () => api.get('/v1/servers').then(r => r.data),
  })

  const servers = data?.data ?? []

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/v1/servers', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] })
      toast.success('تم إضافة السيرفر بنجاح')
      closeModal()
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'فشل إضافة السيرفر'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => api.put(`/v1/servers/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] })
      toast.success('تم تحديث السيرفر بنجاح')
      closeModal()
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'فشل تحديث السيرفر'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/v1/servers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] })
      toast.success('تم حذف السيرفر')
    },
    onError: () => toast.error('فشل حذف السيرفر'),
  })

  const closeModal = () => {
    setShowModal(false)
    setEditId(null)
    setForm({ ...emptyForm })
  }

  const openEdit = (server) => {
    setEditId(server.id)
    setForm({
      label: server.label || '',
      host: server.host || '',
      port: String(server.port || '22'),
      username: server.username || 'root',
      authType: server.authType || 'PASSWORD',
      password: '',
      sshKey: '',
      domain: server.domain || '',
      notes: server.notes || '',
    })
    setShowModal(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.label.trim() || !form.host.trim()) {
      toast.error('يرجى إدخال اسم السيرفر والعنوان')
      return
    }
    const payload = {
      label: form.label.trim(),
      host: form.host.trim(),
      port: Number(form.port),
      username: form.username.trim(),
      authType: form.authType,
      domain: form.domain.trim() || undefined,
      notes: form.notes.trim() || undefined,
    }
    if (form.authType === 'PASSWORD') {
      payload.password = form.password || undefined
    } else {
      payload.sshKey = form.sshKey || undefined
    }
    if (editId) {
      updateMutation.mutate({ id: editId, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  if (isLoading) {
    return (
      <div>
        <PageHeader title="السيرفات" />
        <SkeletonList items={3} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <p className="text-red-600">{error?.message || 'حدث خطأ أثناء تحميل السيرفات'}</p>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="السيرفات"
        description={`${servers.length} سيرفر`}
        action={
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" /> إضافة سيرفر جديد
          </Button>
        }
      />

      {servers.length === 0 ? (
        <EmptyState icon={Server} title="لا توجد سيرفات بعد" description="أضف سيرفرك الأول لبدء النشر" actionLabel="إضافة سيرفر" onAction={() => setShowModal(true)} />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {servers.map((server) => (
            <div key={server.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
                    <Server className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{server.label}</h3>
                    <p className="text-xs text-gray-500">{server.host}:{server.port}</p>
                  </div>
                </div>
                <Badge variant={server.authType === 'SSH_KEY' ? 'info' : 'subtle'}>
                  {server.authType === 'SSH_KEY' ? 'SSH Key' : 'كلمة مرور'}
                </Badge>
              </div>
              {server.domain && (
                <p className="text-sm text-gray-600">
                  <span className="text-gray-400">النطاق:</span> {server.domain}
                </p>
              )}
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="ghost" className="flex-1" onClick={() => openEdit(server)}>
                  <Edit3 className="w-3.5 h-3.5" /> تعديل
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1 text-red-600"
                  loading={deleteMutation.isPending && deleteMutation.variables === server.id}
                  onClick={() => {
                    if (window.confirm('هل أنت متأكد من حذف هذا السيرفر؟')) {
                      deleteMutation.mutate(server.id)
                    }
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" /> حذف
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={closeModal} title={editId ? 'تعديل السيرفر' : 'إضافة سيرفر جديد'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="اسم السيرفر" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
            <Input label="العنوان (Host)" dir="ltr" value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} />
            <Input label="المنفذ (Port)" type="number" dir="ltr" value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} />
            <Input label="اسم المستخدم" dir="ltr" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </div>
          <Select
            label="طريقة المصادقة"
            value={form.authType}
            onChange={(e) => setForm({ ...form, authType: e.target.value, password: '', sshKey: '' })}
            options={[
              { value: 'PASSWORD', label: 'كلمة مرور' },
              { value: 'SSH_KEY', label: 'مفتاح SSH' },
            ]}
          />
          {form.authType === 'PASSWORD' ? (
            <Input label="كلمة المرور" type="password" dir="ltr" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          ) : (
            <Textarea label="مفتاح SSH" rows={4} className="font-mono text-xs" dir="ltr" value={form.sshKey} onChange={(e) => setForm({ ...form, sshKey: e.target.value })} />
          )}
          <Input label="النطاق (Domain)" dir="ltr" placeholder="example.com" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} />
          <Textarea label="ملاحظات" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={closeModal}>إلغاء</Button>
            <Button type="submit" loading={isPending}>{editId ? 'حفظ التغييرات' : 'إضافة'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
