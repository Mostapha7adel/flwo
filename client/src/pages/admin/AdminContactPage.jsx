import { useState } from 'react'
import { Mail, Trash2, Loader, MessageSquareReply, X, CheckCircle, XCircle } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api } from '../../lib/axios'
import { PageHeader } from '../../components/shared/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'

const statusLabels = { OPEN: 'مفتوحة', RESOLVED: 'تم الحل', CANCELLED: 'ملغية' }
const statusColors = { OPEN: 'bg-yellow-100 text-yellow-700', RESOLVED: 'bg-green-100 text-green-700', CANCELLED: 'bg-gray-100 text-gray-600' }

export default function AdminContactPage() {
  const [selectedId, setSelectedId] = useState(null)
  const [replyText, setReplyText] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-contact'],
    queryFn: () => api.get('/admin/contact', { params: { page: 1, limit: 100 } }).then(r => r.data),
  })

  const { data: detail } = useQuery({
    queryKey: ['admin-contact-detail', selectedId],
    queryFn: () => api.get(`/admin/contact/${selectedId}`).then(r => r.data),
    enabled: !!selectedId,
  })

  const toggleRead = useMutation({
    mutationFn: (id) => api.patch(`/admin/contact/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-contact'] }),
  })

  const deleteMsg = useMutation({
    mutationFn: (id) => api.delete(`/admin/contact/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contact'] })
      toast.success('تم حذف الرسالة')
    },
  })

  const replyMutation = useMutation({
    mutationFn: ({ id, content }) => api.post(`/admin/contact/${id}/reply`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contact'] })
      queryClient.invalidateQueries({ queryKey: ['admin-contact-detail', selectedId] })
      setReplyText('')
      toast.success('تم إرسال الرد')
    },
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/admin/contact/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contact'] })
      if (selectedId) queryClient.invalidateQueries({ queryKey: ['admin-contact-detail', selectedId] })
      toast.success('تم تحديث الحالة')
    },
  })

  if (isError) {
    return (
      <div>
        <PageHeader title="رسائل التواصل" />
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-medium">حدث خطأ أثناء تحميل الرسائل</p>
        </div>
      </div>
    )
  }

  const messages = data?.messages || []

  return (
    <div>
      <PageHeader title="رسائل التواصل" description={data ? `إجمالي ${data.total} رسالة` : ''} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div>
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader className="w-6 h-6 animate-spin text-brand-500" /></div>
          ) : messages.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">لا توجد رسائل بعد</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`bg-white rounded-2xl border shadow-sm p-5 cursor-pointer transition-all hover:shadow-md ${msg.isRead ? 'border-gray-100' : 'border-brand-200 bg-brand-50/30'} ${selectedId === msg.id ? 'ring-2 ring-brand-500' : ''}`}
                  onClick={() => setSelectedId(msg.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 truncate">{msg.name}</h3>
                        {!msg.isRead && <Badge variant="warning">جديد</Badge>}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[msg.status] || ''}`}>{statusLabels[msg.status] || msg.status}</span>
                      </div>
                      <p className="text-xs text-gray-500">{msg.email} {msg.phone ? `| ${msg.phone}` : ''}</p>
                      <p className="text-xs text-gray-400">{new Date(msg.createdAt).toLocaleString('ar-EG')}</p>
                    </div>
                    <div className="flex gap-1 mr-3">
                      {msg.replies?.length > 0 && <span className="text-[10px] text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full font-medium">{msg.replies.length} رد</span>}
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 !p-1" onClick={(e) => { e.stopPropagation(); if (confirm('حذف الرسالة؟')) deleteMsg.mutate(msg.id) }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-400 mb-1 font-semibold">{msg.subject}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          {!selectedId ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <MessageSquareReply className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">اختر رسالة للرد عليها</p>
            </div>
          ) : !detail ? (
            <div className="flex items-center justify-center py-12"><Loader className="w-6 h-6 animate-spin text-brand-500" /></div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900">{detail.subject}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => updateStatus.mutate({ id: detail.id, status: 'RESOLVED' })} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 font-medium transition-colors">
                      <CheckCircle className="w-3.5 h-3.5" /> تم الحل
                    </button>
                    <button onClick={() => updateStatus.mutate({ id: detail.id, status: 'CANCELLED' })} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 font-medium transition-colors">
                      <XCircle className="w-3.5 h-3.5" /> إلغاء
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1"><strong>{detail.name}</strong> — {detail.email}</p>
                <p className="text-sm text-gray-500 mb-3">{detail.phone && `📞 ${detail.phone}`}</p>
                <p className="text-xs text-gray-400">{new Date(detail.createdAt).toLocaleString('ar-EG')}</p>
                <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-700">{detail.message}</p>
                </div>
              </div>

              <div className="p-5 border-b border-gray-100">
                <h4 className="text-sm font-bold text-gray-800 mb-3">الردود</h4>
                {detail.replies?.length === 0 ? (
                  <p className="text-sm text-gray-400">لا توجد ردود بعد</p>
                ) : (
                  <div className="space-y-3">
                    {detail.replies.map(reply => (
                      <div key={reply.id} className={`p-3 rounded-xl text-sm ${reply.isAdmin ? 'bg-brand-50 mr-6' : 'bg-gray-50 ml-6'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-500">{reply.isAdmin ? '🛡️ الدعم الفني' : '👤 المرسل'}</span>
                          <span className="text-[10px] text-gray-400">{new Date(reply.createdAt).toLocaleString('ar-EG')}</span>
                        </div>
                        <p className="text-gray-700">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-5">
                <h4 className="text-sm font-bold text-gray-800 mb-3">كتابة رد</h4>
                <div className="flex gap-3">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="اكتب ردك هنا..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    rows={3}
                  />
                  <button
                    onClick={() => replyMutation.mutate({ id: detail.id, content: replyText })}
                    disabled={!replyText.trim() || replyMutation.isPending}
                    className="self-end bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {replyMutation.isPending ? <Loader className="w-4 h-4 animate-spin" /> : 'إرسال'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedId && detail && (
        <div className="fixed bottom-6 left-6 z-40">
          <button onClick={() => { setSelectedId(null); setReplyText('') }} className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium hover:bg-gray-800 transition-colors">
            <X className="w-4 h-4" /> إغلاق
          </button>
        </div>
      )}
    </div>
  )
}
