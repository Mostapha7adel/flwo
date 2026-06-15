import { useParams, useNavigate } from 'react-router-dom'
import { ArrowRight, User } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { PageHeader } from '../../components/shared/PageHeader'
import { ChatWindow } from '../../components/shared/ChatWindow'
import { Spinner } from '../../components/ui/Spinner'
import { api } from '../../lib/axios'
import { useAuthStore } from '../../store/authStore'
import { connectSocket } from '../../features/chat/socketClient'

export default function AdminChatPage() {
  const { convId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const token = useAuthStore((s) => s.accessToken)
  const [localMessages, setLocalMessages] = useState([])

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-conversations'],
    queryFn: () => api.get('/admin/conversations').then(r => r.data),
  })

  const { data: convDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['admin-conversation-detail', convId],
    queryFn: () => api.get(`/chat/conversation/${convId}/messages`).then(r => r.data),
    enabled: !!convId,
  })

  const conversations = data?.conversations || []
  const selectedConv = convId ? conversations.find(c => c.id === convId) : null

  useEffect(() => {
    if (convDetail?.messages) {
      const msgs = convDetail.messages.map(m => ({
        id: m.id,
        text: m.content,
        time: new Date(m.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        isOwn: m.sender?.role === 'ADMIN' || m.sender?.role === 'SUPPORT' || m.sender?.role === 'ACCOUNTS' || m.sender?.role === 'SUPER_ADMIN',
        senderName: m.sender?.role === 'CLIENT' ? `${m.sender.firstName} ${m.sender.lastName}` : undefined,
      }))
      setLocalMessages(msgs)
    } else if (selectedConv?.messages?.length > 0) {
      const msgs = selectedConv.messages.map(m => ({
        id: m.id,
        text: m.content,
        time: new Date(m.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        isOwn: m.sender?.role === 'ADMIN' || m.sender?.role === 'SUPPORT' || m.sender?.role === 'ACCOUNTS' || m.sender?.role === 'SUPER_ADMIN',
        senderName: m.sender?.role === 'CLIENT' ? `${m.sender.firstName} ${m.sender.lastName}` : undefined,
      }))
      setLocalMessages(msgs)
    } else {
      setLocalMessages([])
    }
  }, [convDetail, selectedConv])

  useEffect(() => {
    if (!token || !convId) return
    const socket = connectSocket(token)
    const handleNewMessage = (msg) => {
      queryClient.invalidateQueries({ queryKey: ['admin-conversations'] })
      if (msg.conversationId === convId) {
        setLocalMessages(prev => [...prev, {
          id: msg.id,
          text: msg.content,
          time: new Date(msg.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
          isOwn: msg.sender?.role === 'ADMIN' || msg.sender?.role === 'SUPPORT' || msg.sender?.role === 'ACCOUNTS' || msg.sender?.role === 'SUPER_ADMIN',
          senderName: msg.sender?.role === 'CLIENT' ? `${msg.sender.firstName} ${msg.sender.lastName}` : undefined,
        }])
        queryClient.invalidateQueries({ queryKey: ['admin-conversation-detail', convId] })
      }
    }
    socket.on('chat:newMessage', handleNewMessage)
    function joinRoom() { socket.emit('chat:join', convId) }
    if (socket.connected) joinRoom()
    else socket.once('connect', joinRoom)
    return () => { socket.off('chat:newMessage') }
  }, [token, queryClient, convId])

  const sendMutation = useMutation({
    mutationFn: ({ convId, text }) => api.post(`/chat/conversation/${convId}/messages`, { content: text }),
    onSuccess: (_, { convId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-conversations'] })
      queryClient.invalidateQueries({ queryKey: ['admin-conversation-detail', convId] })
    },
    onError: () => {
      toast.error('فشل إرسال الرسالة')
    },
  })

  const handleSend = (text) => {
    if (!convId) return
    sendMutation.mutate({ convId, text })
  }

  if (error) {
    return (
      <div>
        <PageHeader title="المحادثات" />
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-medium">حدث خطأ أثناء تحميل المحادثات</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader title="المحادثات" />
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </div>
    )
  }

  if (selectedConv) {
    const { order, client } = selectedConv
    const clientName = `${(order?.user || client)?.firstName || ''} ${(order?.user || client)?.lastName || ''}`.trim()
    const clientEmail = (order?.user || client)?.email || ''
    const desc = order ? `طلب #${order?.orderNumber || order?.id}` : 'محادثة مباشرة'
    return (
      <div>
        <button onClick={() => navigate('/x9k2-manage/panel/chat')} className="flex items-center gap-2 text-gray-500 hover:text-brand-600 mb-4 transition-colors">
          <ArrowRight className="w-4 h-4" />
          رجوع
        </button>
        <PageHeader title={`المحادثة مع: ${clientName}`} description={`${clientEmail} · ${desc}`} />
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{ height: '500px' }}>
          <ChatWindow messages={localMessages} onSend={handleSend} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="المحادثات" />
      {conversations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-gray-500">لا توجد محادثات بعد</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {conversations.map(conv => {
            const { order, client } = conv
            const c = order?.user || client
            const clientName = `${c?.firstName || ''} ${c?.lastName || ''}`.trim()
            const subtitle = order ? `طلب #${order?.orderNumber || ''}` : 'محادثة مباشرة'
            const lastMsg = conv.messages?.[0]
            return (
              <button
                key={conv.id}
                onClick={() => navigate(`/x9k2-manage/panel/chat/${conv.id}`)}
                className="w-full text-right px-4 py-3 border-b hover:bg-gray-50 transition-colors flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-brand-600" />
                </div>
                <div className="flex-1 min-w-0 text-right">
                  <p className="font-medium text-gray-900">{clientName}</p>
                  <p className="text-xs text-gray-400">{subtitle}</p>
                  <p className="text-sm text-gray-500 truncate mt-0.5">{lastMsg?.content || 'لا توجد رسائل'}</p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">
                  {lastMsg ? new Date(lastMsg.createdAt).toLocaleDateString('ar-EG') : ''}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
