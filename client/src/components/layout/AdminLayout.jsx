import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { AdminSidebar } from './AdminSidebar'
import { NotificationBell } from '../shared/NotificationBell'
import { useAuthStore } from '../../store/authStore'

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user = useAuthStore(s => s.user)

  const initials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}` : 'A'

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-16 bg-white border-b flex items-center px-6 gap-4 md:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-1 hover:bg-gray-100 rounded-lg">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-sm text-gray-900">Admin Panel</span>
        </header>
        <header className="h-16 bg-white border-b hidden md:flex items-center justify-between px-6 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs">DF</span>
            </div>
            <span className="font-bold text-base text-gray-900">Templyn</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 font-medium">{user?.firstName} {user?.lastName}</span>
            <NotificationBell basePath="/admin" />
            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold">
              {initials}
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
