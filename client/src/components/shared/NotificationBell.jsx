import { Bell, Loader, CheckCheck } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/axios'
import { useState, useRef, useEffect } from 'react'

export function NotificationBell({ basePath = '/admin' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const queryClient = useQueryClient()
  const prefix = basePath === '/admin' ? '/admin' : ''

  const { data: countData } = useQuery({
    queryKey: ['notifications-count', prefix],
    queryFn: () => api.get(`${prefix}/notifications/count`).then(r => r.data),
    refetchInterval: 30000,
  })

  const { data: notifData } = useQuery({
    queryKey: ['notifications', prefix],
    queryFn: () => api.get(`${prefix}/notifications`, { params: { limit: 10 } }).then(r => r.data),
    enabled: open,
  })

  const markRead = useMutation({
    mutationFn: (id) => api.patch(`${prefix}/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', prefix] })
      queryClient.invalidateQueries({ queryKey: ['notifications-count', prefix] })
    },
  })

  const markAllRead = useMutation({
    mutationFn: () => api.patch(`${prefix}/notifications/read-all`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', prefix] })
      queryClient.invalidateQueries({ queryKey: ['notifications-count', prefix] })
    },
  })

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const unread = countData?.count || 0

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
        <Bell className="w-5 h-5 text-gray-600" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 max-h-[450px] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-sm text-gray-800">الإشعارات</h3>
            {unread > 0 && (
              <button onClick={() => markAllRead.mutate()} className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                تحديد الكل كمقروء
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1">
            {!notifData ? (
              <div className="flex items-center justify-center py-8"><Loader className="w-5 h-5 animate-spin text-gray-400" /></div>
            ) : notifData.notifications?.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">لا توجد إشعارات</div>
            ) : (
              notifData.notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-brand-50/40' : ''}`}
                  onClick={() => {
                    if (!n.isRead) markRead.mutate(n.id)
                    setOpen(false)
                  }}
                >
                  <div className="flex items-start gap-2">
                    <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${!n.isRead ? 'bg-brand-500' : 'bg-transparent'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleDateString('ar-EG')}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {unread > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 text-center">
              <span className="text-xs text-gray-400">{unread} إشعار غير مقروء</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
