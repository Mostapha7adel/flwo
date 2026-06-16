import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Loader } from 'lucide-react'
import { connectSocket } from '../../features/chat/socketClient'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../lib/axios'

export function SupportWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [convId, setConvId] = useState(null)
  const [loading, setLoading] = useState(false)
  const user = useAuthStore(s => s.user)
  const accessToken = useAuthStore(s => s.accessToken)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    if (!open || !accessToken) return
    const socket = connectSocket(accessToken)
    const handler = (msg) => {
      if (msg.conversationId === convId) {
        setMessages(prev => [...prev, msg])
      }
    }
    socket.on('chat:newMessage', handler)
    return () => socket.off('chat:newMessage', handler)
  }, [open, accessToken, convId])

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages])

  const handleOpen = async () => {
    setOpen(true)
    if (!user || convId) return
    setLoading(true)
    try {
      const res = await api.post('/chat/direct', { clientId: user.id, title: 'دعم فني' })
      setConvId(res.data.conversation.id)
    } catch { /* fail */ }
    setLoading(false)
  }

  const handleSend = async () => {
    if (!input.trim() || !convId || !accessToken) return
    const text = input.trim()
    setInput('')
    setMessages(prev => [...prev, { id: 'temp-' + Date.now(), content: text, senderId: user?.id }])
    const socket = connectSocket(accessToken)
    socket.emit('chat:message', { conversationId: convId, content: text })
  }

  if (!user) return null

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-80 flex flex-col overflow-hidden" style={{ maxHeight: '450px' }}>
          <div className="bg-brand-600 text-white px-4 py-3 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">الدعم الفني</p>
              <p className="text-[11px] opacity-80">نرد عليك في أقرب وقت</p>
            </div>
            <button onClick={() => setOpen(false)}><X className="w-5 h-5" /></button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-2" style={{ minHeight: '200px' }}>
            {loading && <div className="flex justify-center py-4"><Loader className="w-5 h-5 animate-spin text-gray-400" /></div>}
            {messages.length === 0 && !loading && (
              <p className="text-center text-gray-400 text-sm py-8">اكتب رسالتك وسنرد عليك</p>
            )}
            {messages.map((msg, i) => {
              const isOwn = msg.senderId === user?.id
              return (
                <div key={msg.id || i} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${isOwn ? 'bg-brand-500 text-white rounded-br-md' : 'bg-gray-100 text-gray-800 rounded-bl-md'}`}>
                    <p>{msg.content}</p>
                    <p className={`text-[10px] mt-0.5 ${isOwn ? 'text-white/70' : 'text-gray-400'}`}>
                      {new Date(msg.createdAt || Date.now()).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="border-t p-3 flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="اكتب رسالتك..."
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-brand-400"
            />
            <button onClick={handleSend} className="bg-brand-500 text-white rounded-xl p-2 hover:bg-brand-600">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={handleOpen}
        className="w-14 h-14 bg-brand-500 text-white rounded-full shadow-lg hover:bg-brand-600 flex items-center justify-center transition-all"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  )
}
