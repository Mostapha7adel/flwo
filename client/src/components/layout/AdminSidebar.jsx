import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ShoppingBag, Palette, Monitor, MessageCircle, Mail, LogOut, X, Users, UserCog, Shield, DollarSign, Layers, Server, CreditCard } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { cn } from '../../utils/cn'

const links = [
  { to: '/x9k2-manage/panel', icon: LayoutDashboard, label: 'نظرة عامة', end: true },
  { to: '/x9k2-manage/panel/orders', icon: ShoppingBag, label: 'الطلبات' },
  { to: '/x9k2-manage/panel/users', icon: Users, label: 'المستخدمين' },
  { to: '/x9k2-manage/panel/chat', icon: MessageCircle, label: 'المحادثات' },
  { to: '/x9k2-manage/panel/templates', icon: Palette, label: 'القوالب' },
  { to: '/x9k2-manage/panel/server-plans', icon: Server, label: 'باقات الاستضافة' },
  { to: '/x9k2-manage/panel/server-subscriptions', icon: CreditCard, label: 'اشتراكات الاستضافة' },
  { to: '/x9k2-manage/panel/landing', icon: Monitor, label: 'تعديل Landing' },
  { to: '/x9k2-manage/panel/contact', icon: Mail, label: 'رسائل التواصل' },
]

const accounts = [
  { to: '/x9k2-manage/panel/accounts', icon: UserCog, label: 'الحسابات' },
  { to: '/x9k2-manage/panel/accounting', icon: DollarSign, label: 'المحاسبة' },
]

export function AdminSidebar({ open, onClose }) {
  const { logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/x9k2-manage')
  }

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={onClose} />}
      <aside className={`fixed md:sticky top-0 right-0 h-screen w-64 bg-gray-900 text-white z-50 transform transition-transform duration-300 ${
        open ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
      }`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
                <span className="text-white font-bold text-xs">DF</span>
              </div>
              <span className="font-bold text-sm">Admin Panel</span>
            </div>
            <button onClick={onClose} className="md:hidden p-1 hover:bg-gray-800 rounded-lg">
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
                  isActive ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                )}
              >
                <link.icon className="w-5 h-5" />
                {link.label}
              </NavLink>
            ))}
            <div className="pt-3 pb-1 px-4">
              <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">الإدارة</span>
            </div>
            {accounts.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                  isActive ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                )}
              >
                <link.icon className="w-5 h-5" />
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="p-3 border-t border-gray-800">
            <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
              <LogOut className="w-5 h-5" />
              تسجيل الخروج
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
