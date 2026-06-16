import { useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { Search, Ban, CheckCircle, Crown, Star, MessageCircle } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '../../components/shared/PageHeader'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { api } from '../../lib/axios'

const BAN_DURATIONS = [
  { value: '7', label: 'أسبوع' },
  { value: '30', label: 'شهر' },
  { value: 'permanent', label: 'مدى الحياة' },
]

export default function AdminUsersPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [banModal, setBanModal] = useState(null)
  const [banDuration, setBanDuration] = useState('7')
  const [chatModal, setChatModal] = useState(null)
  const [chatTitle, setChatTitle] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-users', roleFilter],
    queryFn: () => api.get('/admin/users', { params: { role: roleFilter || undefined, page: 1, limit: 100 } }).then(r => r.data),
  })

  const banMutation = useMutation({
    mutationFn: ({ id, bannedUntil }) => api.patch(`/admin/users/${id}/ban`, { bannedUntil }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setBanModal(null)
      toast.success('تم تحديث حالة الحظر')
    },
    onError: () => toast.error('فشل تحديث حالة الحظر'),
  })

  const vipMutation = useMutation({
    mutationFn: ({ id, isVIP }) => api.patch(`/admin/users/${id}/vip`, { isVIP }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('تم تحديث حالة التميز')
    },
    onError: () => toast.error('فشل تحديث حالة التميز'),
  })

  const chatMutation = useMutation({
    mutationFn: ({ clientId, title }) => api.post('/chat/direct', { clientId, title }),
    onSuccess: (res) => {
      setChatModal(null)
      setChatTitle('')
      navigate(`/x9k2-manage/panel/chat/${res.data.conversation.id}`)
    },
    onError: () => toast.error('فشل فتح المحادثة'),
  })

  const handleChat = (user) => {
    setChatTitle('')
    setChatModal(user)
  }

  const users = (data?.users || []).filter(u => {
    if (!search) return true
    const q = search.toLowerCase()
    return u.firstName?.toLowerCase().includes(q) || u.lastName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
  })

  const handleBan = (user) => {
    let bannedUntil = null
    if (banDuration === 'permanent') {
      bannedUntil = '2099-12-31T23:59:59.000Z'
    } else {
      const d = new Date()
      d.setDate(d.getDate() + parseInt(banDuration))
      bannedUntil = d.toISOString()
    }
    banMutation.mutate({ id: user.id, bannedUntil })
  }

  const handleUnban = (user) => {
    banMutation.mutate({ id: user.id, bannedUntil: null })
  }

  if (error) {
    return (
      <div>
        <PageHeader title="إدارة المستخدمين" />
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-medium">حدث خطأ أثناء تحميل المستخدمين</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="إدارة المستخدمين" />

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <Input placeholder="بحث..." icon={<Search className="w-4 h-4" />} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="w-40">
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={[
              { value: '', label: 'كل الأدوار' },
              { value: 'CLIENT', label: 'عملاء' },
              { value: 'SUPPORT', label: 'دعم' },
              { value: 'ADMIN', label: 'أدمن' },
            ]}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500">
                  <th className="text-right py-3 px-4">الاسم</th>
                  <th className="text-right py-3 px-4">البريد</th>
                  <th className="text-right py-3 px-4">الدور</th>
                  <th className="text-center py-3 px-4">طلبات مكتملة</th>
                  <th className="text-center py-3 px-4">ملغية</th>
                  <th className="text-right py-3 px-4">الحالة</th>
                  <th className="text-right py-3 px-4">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => {
                  const isBanned = user.bannedUntil && new Date(user.bannedUntil) > new Date()
                  return (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span>{user.firstName} {user.lastName}</span>
                          {user.isVIP && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{user.email}</td>
                      <td className="py-3 px-4">
                        <Badge variant={user.role === 'ADMIN' ? 'danger' : user.role === 'SUPPORT' ? 'accent' : 'subtle'}>
                          {user.role === 'CLIENT' ? 'عميل' : user.role === 'SUPPORT' ? 'دعم' : 'أدمن'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-green-600">{user.completedOrders}</td>
                      <td className="py-3 px-4 text-center font-medium text-red-500">{user.cancelledOrders}</td>
                      <td className="py-3 px-4">
                        {isBanned ? (
                          <Badge variant="danger">محظور</Badge>
                        ) : user.isActive ? (
                          <Badge variant="success">نشط</Badge>
                        ) : (
                          <Badge variant="warning">موقوف</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {user.role === 'CLIENT' && (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => handleChat(user)}>
                                <MessageCircle className="w-4 h-4 text-primary-500" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => vipMutation.mutate({ id: user.id, isVIP: !user.isVIP })}>
                                {user.isVIP ? <Crown className="w-4 h-4 text-yellow-500" /> : <Crown className="w-4 h-4 text-gray-400" />}
                              </Button>
                              {isBanned ? (
                                <Button size="sm" variant="ghost" onClick={() => handleUnban(user)}>
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                  فك الحظر
                                </Button>
                              ) : (
                                <Button size="sm" variant="ghost" onClick={() => setBanModal(user)}>
                                  <Ban className="w-4 h-4 text-red-500" />
                                  حظر
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {banModal && (
        <Modal onClose={() => setBanModal(null)} title={`حظر ${banModal.firstName} ${banModal.lastName}`}>
          <div className="space-y-4 p-4">
            <Select
              label="مدة الحظر"
              value={banDuration}
              onChange={(e) => setBanDuration(e.target.value)}
              options={BAN_DURATIONS}
            />
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setBanModal(null)}>إلغاء</Button>
              <Button variant="primary" onClick={() => handleBan(banModal)}>حظر</Button>
            </div>
          </div>
        </Modal>
      )}

      {chatModal && (
        <Modal onClose={() => { setChatModal(null); setChatTitle('') }} title={`محادثة مع ${chatModal.firstName} ${chatModal.lastName}`}>
          <div className="space-y-4 p-4">
            <Input
              label="عنوان المحادثة"
              value={chatTitle}
              onChange={(e) => setChatTitle(e.target.value)}
              placeholder="مثال: استفسار عن طلب"
            />
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => { setChatModal(null); setChatTitle('') }}>إلغاء</Button>
              <Button variant="primary" onClick={() => chatMutation.mutate({ clientId: chatModal.id, title: chatTitle })}>
                بدء المحادثة
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
