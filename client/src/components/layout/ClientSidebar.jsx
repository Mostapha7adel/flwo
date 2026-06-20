import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ShoppingBag, MessageCircle, User, LogOut, X, Globe, Rocket, CreditCard } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { Avatar } from '../ui/Avatar'
import { cn } from '../../utils/cn'

const links = [
  { to: '/', icon: Globe, label: 'الصفحة الرئيسية' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'نظرة عامة', end: true },
  { to: '/dashboard/orders', icon: ShoppingBag, label: 'طلباتي' },
  { to: '/dashboard/subscriptions', icon: CreditCard, label: 'الاستضافة' },
  { to: '/dashboard/chat', icon: MessageCircle, label: 'المحادثة' },
  { to: '/dashboard/profile', icon: User, label: 'الملف الشخصي' },
]

export function ClientSidebar({ open, onClose }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={onClose} />}
      <aside className={`fixed md:sticky top-0 right-0 h-screen w-64 bg-white border-l border-gray-200 z-50 transform transition-transform duration-300 ${
        open ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
      }`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar src={user?.avatarUrl} name={user?.firstName} size="md" />
              <div>
                <p className="font-semibold text-sm text-gray-900">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
            <button onClick={onClose} className="md:hidden p-1 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            {links.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={onClose}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                  isActive ? 'bg-brand-50 text-brand-600' : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                <link.icon className="w-5 h-5" />
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="p-3 border-t">
            <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
              <LogOut className="w-5 h-5" />
              تسجيل الخروج
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
