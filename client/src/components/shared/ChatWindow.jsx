import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import { ChatBubble } from './ChatBubble'

export function ChatWindow({ messages, onSend }) {
  const [text, setText] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!text.trim()) return
    onSend?.(text)
    setText('')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages?.map((msg, i) => (
          <ChatBubble key={msg.id || i} message={msg} isOwn={msg.isOwn} />
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="border-t p-4 flex items-center gap-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="اكتب رسالة..."
          className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:border-brand-500"
        />
        <button onClick={handleSend} className="p-2.5 rounded-xl bg-brand-500 text-white hover:bg-brand-600 transition-colors">
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
