import { MessageSquare, User, ArrowRight, Loader } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '../../components/shared/PageHeader'
import { ChatWindow } from '../../components/shared/ChatWindow'
import { Spinner } from '../../components/ui/Spinner'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { connectSocket, getSocket, disconnectSocket } from '../../features/chat/socketClient'
import { api } from '../../lib/axios'

function mapMessage(msg, userId) {
  const isStaff = msg.sender?.role === 'ADMIN' || msg.sender?.role === 'SUPPORT' || msg.sender?.role === 'ACCOUNTS' || msg.sender?.role === 'SUPER_ADMIN'
  return {
    text: msg.content,
    time: new Date(msg.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    isOwn: msg.senderId === userId,
    senderName: isStaff ? 'الدعم الفني' : undefined,
  }
}

export default function ClientChatPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const user = useAuthStore(s => s.user)
  const accessToken = useAuthStore(s => s.accessToken)
  const queryClient = useQueryClient()
  const [messages, setMessages] = useState([])
  const [localConvId, setLocalConvId] = useState(null)

  const urlConvId = searchParams.get('convId')
  const currentConvId = localConvId || urlConvId

  const { data: convsData, isLoading: convsLoading } = useQuery({
    queryKey: ['client-conversations'],
    queryFn: () => api.get('/chat/my').then(r => r.data),
  })

  const conversations = convsData?.conversations || []

  const { data: convDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['client-conversation-detail', currentConvId],
    queryFn: () => api.get(`/chat/conversation/${currentConvId}/messages`).then(r => r.data),
    enabled: !!currentConvId,
  })

  const selectedConv = currentConvId ? conversations.find(c => c.id === currentConvId) : null

  useEffect(() => {
    if (convDetail?.messages) {
      setMessages(convDetail.messages.map(m => mapMessage(m, user?.id)))
    } else {
      setMessages([])
    }
  }, [convDetail, user?.id])

  useEffect(() => {
    if (!accessToken || !currentConvId) return
    const socket = connectSocket(accessToken)
    const handleNewMessage = (msg) => {
      queryClient.invalidateQueries({ queryKey: ['client-conversations'] })
      if (msg.conversationId === currentConvId) {
        setMessages(prev => [...prev, mapMessage(msg, user.id)])
        queryClient.invalidateQueries({ queryKey: ['client-conversation-detail', currentConvId] })
      }
    }
    socket.on('chat:newMessage', handleNewMessage)
    function joinRoom() { socket.emit('chat:join', currentConvId) }
    if (socket.connected) joinRoom()
    else socket.once('connect', joinRoom)
    return () => { socket.off('chat:newMessage') }
  }, [currentConvId, user?.id, accessToken, queryClient])

  const sendMutation = useMutation({
    mutationFn: (text) => api.post(`/chat/conversation/${currentConvId}/messages`, { content: text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-conversations'] })
      queryClient.invalidateQueries({ queryKey: ['client-conversation-detail', currentConvId] })
    },
    onError: () => {},
  })

  const handleSend = (text) => {
    if (!currentConvId) return
    sendMutation.mutate(text)
  }

  if (convsLoading) {
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
    const conv = selectedConv
    const label = conv.title || `طلب #${conv.order?.orderNumber || ''}`
    return (
      <div>
        <button onClick={() => { setLocalConvId(null); navigate('/dashboard/chat', { replace: true }) }} className="flex items-center gap-2 text-gray-500 hover:text-brand-600 mb-4 transition-colors">
          <ArrowRight className="w-4 h-4" />
          رجوع
        </button>
        <PageHeader title={label} />
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{ height: '500px' }}>
          <ChatWindow messages={messages} onSend={handleSend} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="المحادثات" />
      {conversations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">لا توجد محادثات حالياً</p>
          <p className="text-sm text-gray-400">عندما يقوم فريق الدعم بفتح محادثة معك، ستظهر هنا</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {conversations.map(conv => {
            const lastMsg = conv.messages?.[0]
            const label = conv.title || conv.order?.template?.title || `طلب #${conv.order?.orderNumber}`
            return (
              <button
                key={conv.id}
                onClick={() => { setLocalConvId(conv.id); navigate(`/dashboard/chat?convId=${conv.id}`, { replace: true }) }}
                className="w-full text-right px-4 py-3 border-b hover:bg-gray-50 transition-colors flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-brand-600" />
                </div>
                <div className="flex-1 min-w-0 text-right">
                  <p className="font-medium text-gray-900">{label}</p>
                  <p className="text-xs text-gray-400">الدعم الفني</p>
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
