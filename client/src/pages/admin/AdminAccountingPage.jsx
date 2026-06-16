import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DollarSign, TrendingUp, TrendingDown, Wallet, Plus, Trash2, Loader, Pencil, X, Calendar, Search } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { EmptyState } from '../../components/shared/EmptyState'
import { api } from '../../lib/axios'
import toast from 'react-hot-toast'

const categories = ['سيرفرات', 'استضافة', 'نطاقات', 'تسويق', 'برمجيات', 'مرتبات', 'ضرائب', 'أخرى']

const categoryColors = {
  سيرفرات: 'bg-red-100 text-red-700',
  استضافة: 'bg-blue-100 text-blue-700',
  نطاقات: 'bg-purple-100 text-purple-700',
  تسويق: 'bg-yellow-100 text-yellow-700',
  برمجيات: 'bg-indigo-100 text-indigo-700',
  مرتبات: 'bg-green-100 text-green-700',
  ضرائب: 'bg-orange-100 text-orange-700',
  أخرى: 'bg-gray-100 text-gray-700',
}

export default function AdminAccountingPage() {
  const queryClient = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filterCat, setFilterCat] = useState('')
  const [form, setForm] = useState({ description: '', amount: '', category: 'أخرى', date: '', notes: '' })

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['admin-accounting-summary'],
    queryFn: () => api.get('/admin/accounts/summary').then(r => r.data),
    refetchInterval: 30000,
  })

  const { data: expensesData, isLoading: expLoading } = useQuery({
    queryKey: ['admin-accounting-expenses', filterCat],
    queryFn: () => api.get('/admin/accounts/expenses', { params: { category: filterCat || undefined, limit: 100 } }).then(r => r.data),
  })

  const { data: revenueHistory } = useQuery({
    queryKey: ['admin-revenue-history'],
    queryFn: () => api.get('/admin/accounts/revenue-history').then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: (d) => api.post('/admin/accounts/expenses', d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-accounting'] })
      setShowAdd(false)
      resetForm()
      toast.success('تم إضافة المصروف')
    },
    onError: () => toast.error('فشل إضافة المصروف'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, ...d }) => api.put(`/admin/accounts/expenses/${id}`, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-accounting'] })
      setEditing(null)
      resetForm()
      toast.success('تم تحديث المصروف')
    },
    onError: () => toast.error('فشل تحديث المصروف'),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`/admin/accounts/expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-accounting'] })
      toast.success('تم حذف المصروف')
    },
    onError: () => toast.error('فشل حذف المصروف'),
  })

  const resetForm = () => setForm({ description: '', amount: '', category: 'أخرى', date: '', notes: '' })

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = { description: form.description, amount: parseFloat(form.amount), category: form.category, notes: form.notes || undefined }
    if (form.date) payload.date = form.date
    if (editing) updateMut.mutate({ id: editing, ...payload })
    else createMut.mutate(payload)
  }

  const startEdit = (exp) => {
    setEditing(exp.id)
    setForm({ description: exp.description, amount: String(exp.amount), category: exp.category, date: exp.date?.slice(0, 10) || '', notes: exp.notes || '' })
    setShowAdd(true)
  }

  if (summaryLoading) {
    return <div className="flex items-center justify-center py-16"><Loader className="w-6 h-6 animate-spin text-brand-500" /></div>
  }

  const expenses = expensesData?.expenses || []
  const revHistory = revenueHistory || []

  return (
    <div>
      <PageHeader title="المحاسبة" description="إدارة الإيرادات والمصروفات" />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 font-medium">إجمالي الإيرادات</span>
            <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-green-600" /></div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{summary?.totalRevenue?.toLocaleString() || 0} <span className="text-sm font-normal text-gray-500">ج.م</span></p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 font-medium">إجمالي المصروفات</span>
            <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center"><TrendingDown className="w-5 h-5 text-red-600" /></div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{summary?.totalExpenses?.toLocaleString() || 0} <span className="text-sm font-normal text-gray-500">ج.م</span></p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 font-medium">صافي الربح</span>
            <div className="w-9 h-9 rounded-lg bg-brand-100 flex items-center justify-center"><DollarSign className="w-5 h-5 text-brand-600" /></div>
          </div>
          <p className={`text-2xl font-bold ${(summary?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {summary?.netProfit?.toLocaleString() || 0} <span className="text-sm font-normal text-gray-500">ج.م</span>
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 font-medium">إيرادات معلقة</span>
            <div className="w-9 h-9 rounded-lg bg-yellow-100 flex items-center justify-center"><Wallet className="w-5 h-5 text-yellow-600" /></div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{summary?.pendingRevenue?.toLocaleString() || 0} <span className="text-sm font-normal text-gray-500">ج.م</span></p>
        </div>
      </div>

      {/* Revenue History */}
      {revHistory.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <h3 className="font-bold text-gray-900 mb-3">الإيرادات الشهرية</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {revHistory.map(m => (
              <div key={m.month} className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">{m.month}</p>
                <p className="font-bold text-sm">{Number(m.revenue).toLocaleString()}</p>
                <p className="text-xs text-gray-400">{m.orders} طلب</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expenses Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">المصروفات</h3>
          <div className="flex items-center gap-3">
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="text-sm border border-gray-200 rounded-xl px-3 py-1.5">
              <option value="">كل التصنيفات</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={() => { setEditing(null); resetForm(); setShowAdd(true) }} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> مصروف جديد
            </button>
          </div>
        </div>

        {expLoading ? (
          <div className="flex items-center justify-center py-12"><Loader className="w-6 h-6 animate-spin text-brand-500" /></div>
        ) : expenses.length === 0 ? (
          <EmptyState icon={TrendingDown} title="لا توجد مصروفات" description="لم يتم تسجيل أي مصروفات بعد" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-right px-4 py-3 font-medium text-gray-600">الوصف</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">التصنيف</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">المبلغ</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">التاريخ</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">بواسطة</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(exp => (
                  <tr key={exp.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium">{exp.description}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium ${categoryColors[exp.category] || 'bg-gray-100 text-gray-700'}`}>
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-red-600">-{Number(exp.amount).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(exp.date).toLocaleDateString('ar-EG')}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{exp.createdBy}</td>
                    <td className="px-4 py-3 text-left">
                      <div className="flex items-center gap-2">
                        <button onClick={() => startEdit(exp)} className="text-gray-400 hover:text-brand-600 p-1"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => { if (confirm('حذف هذا المصروف؟')) deleteMut.mutate(exp.id) }} className="text-gray-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {expensesData?.totalAmount > 0 && (
          <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700">
              إجمالي المصروفات المعروضة: <span className="text-red-600 font-bold">{Number(expensesData.totalAmount).toLocaleString()} ج.م</span>
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => { setShowAdd(false); setEditing(null) }}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">{editing ? 'تعديل مصروف' : 'مصروف جديد'}</h2>
              <button onClick={() => { setShowAdd(false); setEditing(null) }} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">الوصف</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">المبلغ</label>
                  <input type="number" step="0.01" min="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">التصنيف</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">التاريخ</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">ملاحظات</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
              </div>
              <button type="submit" disabled={createMut.isPending || updateMut.isPending} className="w-full bg-brand-600 hover:bg-brand-700 text-white py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                {createMut.isPending || updateMut.isPending ? 'جاري...' : editing ? 'تحديث' : 'إضافة'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
