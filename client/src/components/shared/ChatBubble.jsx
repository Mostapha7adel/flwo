import { memo } from 'react'
import { cn } from '../../utils/cn'

export const ChatBubble = memo(({ message, isOwn }) => {
  return (
    <div className={cn('flex flex-col', isOwn ? 'items-start' : 'items-end')}>
      {message.senderName && !isOwn && (
        <span className="text-[10px] text-brand-600 font-medium mb-1 mr-1">{message.senderName}</span>
      )}
      {message.senderName && isOwn && (
        <span className="text-[10px] text-gray-500 font-medium mb-1 ml-1">{message.senderName}</span>
      )}
      <div className={cn(
        'max-w-[75%] px-4 py-3 rounded-2xl text-sm',
        isOwn ? 'bg-brand-500 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'
      )}>
        <p className="leading-relaxed">{message.text}</p>
        <p className={cn('text-xs mt-1', isOwn ? 'text-white/70' : 'text-gray-400')}>
          {message.time}
        </p>
      </div>
    </div>
  )
})
