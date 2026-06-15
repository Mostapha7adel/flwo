import { MessageSquare, Loader } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '../../components/shared/PageHeader'
import { EmptyState } from '../../components/shared/EmptyState'
import { ChatWindow } from '../../components/shared/ChatWindow'
import { useNavigate } from 'react-router-dom'
import { useEffect, useCallback, useState } from 'react'
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
  const user = useAuthStore(s => s.user)
  const accessToken = useAuthStore(s => s.accessToken)
  const queryClient = useQueryClient()
  const [messages, setMessages] = useState([])
  const [conversationId, setConversationId] = useState(null)
  const [orderSubject, setOrderSubject] = useState('')
  const urlParams = new URLSearchParams(window.location.search)
  const urlConvId = urlParams.get('convId')

  const { data: ordersData, isError: ordersError } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders').then(r => r.data),
  })

  const activeOrder = urlConvId ? null : (ordersData?.orders || []).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  )[0]

  const { data: conversationData, isLoading: convLoading } = useQuery({
    queryKey: ['conversation', activeOrder?.id],
    queryFn: () => api.get('/chat/conversation', { params: { orderId: activeOrder.id } }).then(r => r.data),
    enabled: !!activeOrder && !urlConvId,
  })

  const { data: directConvData, isLoading: directConvLoading } = useQuery({
    queryKey: ['client-conversation-detail', urlConvId],
    queryFn: () => api.get(`/chat/conversation/${urlConvId}/messages`).then(r => r.data),
    enabled: !!urlConvId,
  })

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (directConvData) {
      setConversationId(urlConvId)
      setMessages((directConvData.messages || []).map(m => mapMessage(m, user?.id)))
      setOrderSubject('')
    } else if (conversationData) {
      setConversationId(conversationData.id)
      setMessages((conversationData.messages || []).map(m => mapMessage(m, user?.id)))
      setOrderSubject(activeOrder?.template?.title || '')
    }
  }, [conversationData, directConvData, user?.id, activeOrder?.template?.title, urlConvId])
  /* eslint-enable react-hooks/set-state-in-effect */

  const sendMutation = useMutation({
    mutationFn: (content) => api.post(`/chat/conversation/${conversationId}/messages`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', activeOrder?.id] })
    },
  })

  useEffect(() => {
    if (!accessToken || !conversationId) return
    const socket = connectSocket(accessToken)
    const handleNewMessage = (msg) => {
      if (msg.conversationId === conversationId) {
        setMessages(prev => [...prev, mapMessage(msg, user.id)])
      }
    }
    socket.on('chat:newMessage', handleNewMessage)
    function joinRoom() { socket.emit('chat:join', conversationId) }
    if (socket.connected) joinRoom()
    else socket.once('connect', joinRoom)
    return () => { socket.off('chat:newMessage') }
  }, [conversationId, user?.id, accessToken])

  useEffect(() => {
    const socket = getSocket()
    if (!socket?.connected || !conversationId) return
    socket.emit('chat:join', conversationId)
    return () => { socket.emit('chat:leave', conversationId) }
  }, [conversationId])

  useEffect(() => {
    return () => disconnectSocket()
  }, [])

  const handleSend = useCallback((text) => {
    if (!conversationId) return
    sendMutation.mutate(text)
  }, [conversationId, sendMutation])

  if (ordersError) {
    return (
      <div>
        <PageHeader title="المحادثة" />
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-medium">حدث خطأ أثناء تحميل البيانات</p>
        </div>
      </div>
    )
  }

  if (!activeOrder) {
    return (
      <div>
        <PageHeader title="المحادثة" />
        <EmptyState
          icon={MessageSquare}
          title="لا توجد محادثات نشطة حالياً"
          description="سيتواصل معك فريق الدعم بعد مراجعة طلبك وقبوله"
          actionLabel="تصفح القوالب"
          onAction={() => navigate('/templates')}
        />
      </div>
    )
  }

  if (convLoading) {
    return (
      <div>
        <PageHeader title="المحادثة" />
        <div className="flex items-center justify-center py-16">
          <Loader className="w-6 h-6 animate-spin text-brand-500" />
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="المحادثة" description={orderSubject ? `بخصوص: ${orderSubject}` : ''} />
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{ height: '500px' }}>
        <ChatWindow messages={messages} onSend={handleSend} />
      </div>
    </div>
  )
}
