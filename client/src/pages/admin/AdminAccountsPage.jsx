import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserCog, Plus, Shield, X, Loader, Trash2, CheckCircle, XCircle, ChevronDown } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { EmptyState } from '../../components/shared/EmptyState'
import { api } from '../../lib/axios'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'react-hot-toast'

const roleLabels = {
  SUPER_ADMIN: 'مشرف عام',
  ADMIN: 'أدمن',
  ACCOUNTS: 'حسابات',
  SUPPORT: 'دعم فني',
}

const roleColors = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700',
  ADMIN: 'bg-brand-100 text-brand-700',
  ACCOUNTS: 'bg-blue-100 text-blue-700',
  SUPPORT: 'bg-green-100 text-green-700',
}

export default function AdminAccountsPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', role: 'SUPPORT' })
  const [editingRole, setEditingRole] = useState(null)
  const currentUser = useAuthStore(s => s.user)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-accounts'],
    queryFn: () => api.get('/admin/accounts').then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/admin/accounts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-accounts'] })
      setShowCreate(false)
      setForm({ firstName: '', lastName: '', email: '', phone: '', password: '', role: 'SUPPORT' })
      toast.success('تم إنشاء الحساب بنجاح')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'فشل إنشاء الحساب')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/accounts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-accounts'] })
      toast.success('تم حذف الحساب')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'فشل الحذف'),
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }) => api.patch(`/admin/accounts/${id}/status`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-accounts'] })
      toast.success('تم تحديث الحالة')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'فشل التحديث'),
  })

  const changeRoleMutation = useMutation({
    mutationFn: ({ id, role }) => api.patch(`/admin/accounts/${id}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-accounts'] })
      setEditingRole(null)
      toast.success('تم تغيير الدور')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'فشل تغيير الدور'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    createMutation.mutate(form)
  }

  return (
    <div>
      <PageHeader
        title="إدارة الحسابات"
        description="إنشاء وإدارة حسابات فريق العمل"
        action={
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> حساب جديد
          </button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader className="w-6 h-6 animate-spin text-brand-500" /></div>
      ) : !data?.accounts?.length ? (
        <EmptyState icon={UserCog} title="لا توجد حسابات" description="لم يتم إنشاء أي حسابات موظفين بعد" />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-right px-4 py-3 font-medium text-gray-600">الاسم</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">البريد</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">الدور</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">الحالة</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {data.accounts.map(acc => (
                  <tr key={acc.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium">{acc.firstName} {acc.lastName}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{acc.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${roleColors[acc.role] || 'bg-gray-100 text-gray-700'}`}>
                          <Shield className="w-3 h-3" />
                          {roleLabels[acc.role] || acc.role}
                        </span>
                        {editingRole === acc.id ? (
                          <div className="flex items-center gap-1">
                            <select
                              defaultValue={acc.role}
                              onChange={e => changeRoleMutation.mutate({ id: acc.id, role: e.target.value })}
                              className="text-xs border border-gray-200 rounded-lg px-2 py-1"
                            >
                              <option value="SUPPORT">دعم فني</option>
                              <option value="ACCOUNTS">حسابات</option>
                              <option value="ADMIN">أدمن</option>
                            </select>
                            <button onClick={() => setEditingRole(null)} className="text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>
                          </div>
                        ) : (
                          <button onClick={() => setEditingRole(acc.id)} className="text-gray-400 hover:text-brand-600 transition-colors p-1" title="تغيير الدور">
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleStatusMutation.mutate({ id: acc.id, isActive: !acc.isActive })}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          acc.isActive
                            ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700'
                            : 'bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700'
                        }`}
                      >
                        {acc.isActive ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        {acc.isActive ? 'نشط - اضغط للإيقاف' : 'موقوف - اضغط للتفعيل'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-left">
                      {acc.id !== currentUser?.id && (
                        <button
                          onClick={() => { if (confirm(`حذف حساب ${acc.firstName} ${acc.lastName}؟`)) deleteMutation.mutate(acc.id) }}
                          className="text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors inline-flex items-center gap-1 text-sm font-medium"
                        >
                          <Trash2 className="w-4 h-4" /> حذف
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">حساب جديد</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">الاسم الأول</label>
                  <input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">اسم العائلة</label>
                  <input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">رقم الهاتف</label>
                <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">كلمة المرور</label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" required minLength={6} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">الدور</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500">
                  <option value="SUPPORT">دعم فني</option>
                  <option value="ACCOUNTS">حسابات</option>
                  <option value="ADMIN">أدمن</option>
                </select>
              </div>
              <button type="submit" disabled={createMutation.isPending} className="w-full bg-brand-600 hover:bg-brand-700 text-white py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                {createMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
