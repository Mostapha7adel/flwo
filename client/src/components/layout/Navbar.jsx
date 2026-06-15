import { useState, useEffect, memo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, Menu, X } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { Avatar } from '../ui/Avatar'
import { Dropdown, DropdownItem } from '../ui/Dropdown'
import { Button } from '../ui/Button'

export const Navbar = memo(function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const navigate = useNavigate()

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20)
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100' : 'bg-transparent'
    }`}>
      <nav className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">DF</span>
          </div>
          <span className="font-bold text-xl text-gray-900">DesignFlow</span>
        </Link>

        <ul className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <li><Link to="/templates" className="hover:text-brand-500 transition-colors">القوالب</Link></li>
          <li><Link to="/about" className="hover:text-brand-500 transition-colors">عننا</Link></li>
          <li><Link to="/contact" className="hover:text-brand-500 transition-colors">تواصل معنا</Link></li>
        </ul>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <Dropdown
              trigger={
                <button className="flex items-center gap-2 hover:bg-gray-100 rounded-xl px-3 py-2 transition">
                  <Avatar src={user.avatarUrl} name={user.firstName} size="sm" />
                  <span className="text-sm font-medium text-gray-700">{user.firstName}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
              }
            >
              <DropdownItem to="/dashboard">لوحة التحكم</DropdownItem>
              <DropdownItem onClick={logout} danger>تسجيل الخروج</DropdownItem>
            </Dropdown>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>تسجيل الدخول</Button>
              <Button variant="primary" size="sm" onClick={() => navigate('/register')}>إنشاء حساب</Button>
            </>
          )}
        </div>

        <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {menuOpen && (
        <div className="md:hidden bg-white border-b shadow-lg animate-fade-in">
          <div className="px-6 py-4 space-y-3">
            <Link to="/templates" className="block py-2 text-gray-700 hover:text-brand-500" onClick={() => setMenuOpen(false)}>القوالب</Link>
            <Link to="/about" className="block py-2 text-gray-700 hover:text-brand-500" onClick={() => setMenuOpen(false)}>عننا</Link>
            <Link to="/contact" className="block py-2 text-gray-700 hover:text-brand-500" onClick={() => setMenuOpen(false)}>تواصل معنا</Link>
            <div className="pt-3 border-t space-y-2">
              {user ? (
                <>
                  <Link to="/dashboard" className="block py-2 text-gray-700" onClick={() => setMenuOpen(false)}>لوحة التحكم</Link>
                  <button onClick={() => { logout(); setMenuOpen(false) }} className="block py-2 text-red-600">تسجيل الخروج</button>
                </>
              ) : (
                <>
                  <Button variant="ghost" className="w-full" onClick={() => { navigate('/login'); setMenuOpen(false) }}>تسجيل الدخول</Button>
                  <Button variant="primary" className="w-full" onClick={() => { navigate('/register'); setMenuOpen(false) }}>إنشاء حساب</Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
})
