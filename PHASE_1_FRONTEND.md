# DesignFlow — المرحلة الأولى: تصميم وبناء الـ Frontend

> **للـ AI المنفذ:** هذا الملف يغطي كل تفاصيل الـ Frontend من الصفر حتى الصفحة الأخيرة.  
> لا تبدأ الـ Backend قبل ما تخلص هذه المرحلة كاملة وتتأكد من الـ UI/UX على كل صفحة.  
> التصميم يكون **عربي RTL** بالكامل، تصميم **Dark/Light mode** اختياري لكن الـ Light هو الـ default.

---

## 1. إعداد المشروع (Project Setup)

### 1.1 إنشاء المشروع

```bash
npm create vite@latest client -- --template react
cd client
npm install

# Core dependencies
npm install react-router-dom@6 zustand axios
npm install @tanstack/react-query

# Styling
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Forms & Validation
npm install react-hook-form @hookform/resolvers zod

# Drag & Drop
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# UI Utilities
npm install lucide-react          # icons
npm install react-hot-toast       # notifications
npm install clsx tailwind-merge   # class merging
npm install react-color           # color pickers في الـ customizer
npm install framer-motion         # animations ناعمة
npm install socket.io-client      # للـ chat
npm install react-intersection-observer  # lazy loading images
```

### 1.2 tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Cairo', 'Inter', 'sans-serif'],   // Cairo للعربي
        display: ['Sora', 'sans-serif'],           // headlines
      },
      colors: {
        brand: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          500: '#2563EB',   // Primary brand color
          600: '#1D4ED8',
          700: '#1E40AF',
          900: '#1E3A5F',
        },
        accent: {
          500: '#7C3AED',
          600: '#6D28D9',
        },
        dark: {
          800: '#0F172A',
          900: '#020617',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        float:   { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
      }
    },
  },
  plugins: [],
}
```

### 1.3 هيكل المجلدات الكامل

```
src/
├── assets/
│   ├── fonts/           (Cairo, Sora إذا محلية)
│   ├── images/
│   │   ├── logo.svg
│   │   ├── hero-bg.svg
│   │   └── placeholders/
│   └── icons/
│
├── components/
│   ├── ui/              ← Building blocks أصغر وحدة في الـ UI
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Textarea.jsx
│   │   ├── Select.jsx
│   │   ├── Modal.jsx
│   │   ├── Badge.jsx
│   │   ├── Avatar.jsx
│   │   ├── Spinner.jsx
│   │   ├── Skeleton.jsx
│   │   ├── Tooltip.jsx
│   │   ├── Dropdown.jsx
│   │   ├── Card.jsx
│   │   ├── Divider.jsx
│   │   └── ColorPicker.jsx
│   │
│   ├── layout/          ← هيكل الصفحات
│   │   ├── PublicLayout.jsx      (Navbar + Footer للصفحات العامة)
│   │   ├── ClientLayout.jsx      (Sidebar + Header للعميل)
│   │   ├── AdminLayout.jsx       (Sidebar + Header للأدمن)
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   ├── ClientSidebar.jsx
│   │   └── AdminSidebar.jsx
│   │
│   └── shared/          ← Components متكررة في أكثر من صفحة
│       ├── TemplateCard.jsx
│       ├── OrderCard.jsx
│       ├── OrderStatusBadge.jsx
│       ├── ChatBubble.jsx
│       ├── ChatWindow.jsx
│       ├── StatsCard.jsx
│       ├── PageHeader.jsx
│       ├── EmptyState.jsx
│       └── ConfirmDialog.jsx
│
├── pages/
│   ├── public/
│   │   ├── LandingPage.jsx
│   │   ├── TemplatesPage.jsx
│   │   └── TemplatePreviewPage.jsx
│   │
│   ├── auth/
│   │   ├── LoginPage.jsx
│   │   └── RegisterPage.jsx
│   │
│   ├── client/
│   │   ├── ClientOverviewPage.jsx
│   │   ├── ClientOrdersPage.jsx
│   │   ├── ClientOrderDetailPage.jsx
│   │   ├── ClientProfilePage.jsx
│   │   └── ClientChatPage.jsx
│   │
│   ├── customize/
│   │   └── TemplateCustomizerPage.jsx
│   │
│   ├── admin/
│   │   ├── AdminLoginPage.jsx
│   │   ├── AdminOverviewPage.jsx
│   │   ├── AdminOrdersPage.jsx
│   │   ├── AdminOrderDetailPage.jsx
│   │   ├── AdminTemplatesPage.jsx
│   │   ├── AddTemplatePage.jsx
│   │   ├── AdminLandingEditorPage.jsx
│   │   └── AdminChatPage.jsx
│   │
│   └── NotFoundPage.jsx
│
├── features/
│   ├── auth/
│   │   ├── AuthGuard.jsx
│   │   └── useAuth.js
│   ├── templates/
│   │   └── useTemplates.js
│   ├── orders/
│   │   └── useOrders.js
│   └── chat/
│       ├── useChat.js
│       └── socketClient.js
│
├── store/
│   ├── authStore.js
│   ├── templateStore.js
│   ├── orderStore.js
│   └── chatStore.js
│
├── lib/
│   ├── axios.js          (configured axios instance)
│   └── queryClient.js    (TanStack Query config)
│
├── router/
│   └── index.jsx
│
├── utils/
│   ├── cn.js             (clsx + twMerge helper)
│   ├── formatDate.js
│   ├── formatCurrency.js
│   └── constants.js
│
├── App.jsx
├── main.jsx
└── index.css
```

---

## 2. Design System — نظام التصميم

### 2.1 Color Palette

```
Primary:    #2563EB  (أزرق عميق — CTAs، links، active states)
Accent:     #7C3AED  (بنفسجي — highlights، badges خاصة)
Success:    #16A34A  (أخضر — completed، approved)
Warning:    #D97706  (برتقالي — pending، in-progress)
Danger:     #DC2626  (أحمر — error، cancelled)
Neutral:    #64748B  (رمادي — secondary text)
Background: #F8FAFC  (أبيض مائل — page bg)
Surface:    #FFFFFF  (بطاقات، inputs)
Border:     #E2E8F0  (حدود ناعمة)
Text:       #0F172A  (نص رئيسي)
Text-muted: #94A3B8  (نص ثانوي)
```

### 2.2 Typography Scale

```css
/* في index.css */
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&family=Sora:wght@400;600;700&display=swap');

html { direction: rtl; }

body {
  font-family: 'Cairo', 'Inter', sans-serif;
  color: #0F172A;
  background: #F8FAFC;
}

/* Scale:
  xs:   12px / 0.75rem
  sm:   14px / 0.875rem
  base: 16px / 1rem
  lg:   18px / 1.125rem
  xl:   20px / 1.25rem
  2xl:  24px / 1.5rem
  3xl:  30px / 1.875rem
  4xl:  36px / 2.25rem
  5xl:  48px / 3rem
  6xl:  60px / 3.75rem   ← headlines كبيرة
*/
```

### 2.3 Component: Button.jsx

```jsx
// components/ui/Button.jsx
import { cn } from '../../utils/cn'
import { Spinner } from './Spinner'

const variants = {
  primary:   'bg-brand-500 hover:bg-brand-600 text-white shadow-sm',
  secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300',
  accent:    'bg-accent-500 hover:bg-accent-600 text-white shadow-sm',
  ghost:     'hover:bg-gray-100 text-gray-600',
  danger:    'bg-red-600 hover:bg-red-700 text-white',
  outline:   'border-2 border-brand-500 text-brand-500 hover:bg-brand-50',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-7 py-3.5 text-base rounded-xl',
  xl: 'px-9 py-4 text-lg rounded-2xl',
}

export function Button({ variant='primary', size='md', loading, icon, children, className, ...props }) {
  return (
    <button
      className={cn(
        'inline-flex items-center gap-2 font-semibold transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        variants[variant], sizes[size], className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : icon}
      {children}
    </button>
  )
}
```

### 2.4 Component: Input.jsx

```jsx
// components/ui/Input.jsx
export function Input({ label, error, hint, icon, className, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-semibold text-gray-700">{label}</label>}
      <div className="relative">
        {icon && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>}
        <input
          className={cn(
            'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900',
            'placeholder:text-gray-400',
            'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
            'transition-all duration-150',
            error && 'border-red-400 focus:ring-red-400/20',
            icon && 'pr-10',
            className
          )}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
      {hint && !error && <span className="text-xs text-gray-500">{hint}</span>}
    </div>
  )
}
```

---

## 3. Router Setup

```jsx
// src/router/index.jsx
import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AuthGuard } from '../features/auth/AuthGuard'
import { PageLoader } from '../components/ui/Spinner'

// Public (Eager loaded — بسرعة)
import LandingPage          from '../pages/public/LandingPage'
import TemplatesPage        from '../pages/public/TemplatesPage'
import TemplatePreviewPage  from '../pages/public/TemplatePreviewPage'
import LoginPage            from '../pages/auth/LoginPage'
import RegisterPage         from '../pages/auth/RegisterPage'
import NotFoundPage         from '../pages/NotFoundPage'

// Lazy loaded (code splitting)
const ClientLayout               = lazy(() => import('../components/layout/ClientLayout'))
const ClientOverviewPage         = lazy(() => import('../pages/client/ClientOverviewPage'))
const ClientOrdersPage           = lazy(() => import('../pages/client/ClientOrdersPage'))
const ClientOrderDetailPage      = lazy(() => import('../pages/client/ClientOrderDetailPage'))
const ClientProfilePage          = lazy(() => import('../pages/client/ClientProfilePage'))
const ClientChatPage             = lazy(() => import('../pages/client/ClientChatPage'))
const TemplateCustomizerPage     = lazy(() => import('../pages/customize/TemplateCustomizerPage'))
const AdminLoginPage             = lazy(() => import('../pages/admin/AdminLoginPage'))
const AdminLayout                = lazy(() => import('../components/layout/AdminLayout'))
const AdminOverviewPage          = lazy(() => import('../pages/admin/AdminOverviewPage'))
const AdminOrdersPage            = lazy(() => import('../pages/admin/AdminOrdersPage'))
const AdminOrderDetailPage       = lazy(() => import('../pages/admin/AdminOrderDetailPage'))
const AdminTemplatesPage         = lazy(() => import('../pages/admin/AdminTemplatesPage'))
const AddTemplatePage            = lazy(() => import('../pages/admin/AddTemplatePage'))
const AdminLandingEditorPage     = lazy(() => import('../pages/admin/AdminLandingEditorPage'))
const AdminChatPage              = lazy(() => import('../pages/admin/AdminChatPage'))

const router = createBrowserRouter([
  // ===== PUBLIC =====
  { path: '/',              element: <LandingPage /> },
  { path: '/templates',     element: <TemplatesPage /> },
  { path: '/templates/:id', element: <TemplatePreviewPage /> },
  { path: '/login',         element: <AuthGuard require="GUEST"><LoginPage /></AuthGuard> },
  { path: '/register',      element: <AuthGuard require="GUEST"><RegisterPage /></AuthGuard> },

  // ===== CLIENT DASHBOARD =====
  {
    path: '/dashboard',
    element: (
      <AuthGuard require="CLIENT">
        <Suspense fallback={<PageLoader />}><ClientLayout /></Suspense>
      </AuthGuard>
    ),
    children: [
      { index: true,          element: <ClientOverviewPage /> },
      { path: 'orders',       element: <ClientOrdersPage /> },
      { path: 'orders/:id',   element: <ClientOrderDetailPage /> },
      { path: 'profile',      element: <ClientProfilePage /> },
      { path: 'chat',         element: <ClientChatPage /> },
    ]
  },

  // ===== CUSTOMIZER =====
  {
    path: '/customize/:templateId',
    element: (
      <AuthGuard require="CLIENT">
        <Suspense fallback={<PageLoader />}><TemplateCustomizerPage /></Suspense>
      </AuthGuard>
    )
  },

  // ===== ADMIN (HIDDEN) =====
  {
    path: '/x9k2-manage',
    element: <Suspense fallback={<PageLoader />}><AdminLoginPage /></Suspense>
  },
  {
    path: '/x9k2-manage/panel',
    element: (
      <AuthGuard require="ADMIN">
        <Suspense fallback={<PageLoader />}><AdminLayout /></Suspense>
      </AuthGuard>
    ),
    children: [
      { index: true,               element: <AdminOverviewPage /> },
      { path: 'orders',            element: <AdminOrdersPage /> },
      { path: 'orders/:id',        element: <AdminOrderDetailPage /> },
      { path: 'templates',         element: <AdminTemplatesPage /> },
      { path: 'templates/new',     element: <AddTemplatePage /> },
      { path: 'templates/:id/edit',element: <AddTemplatePage /> },
      { path: 'landing',           element: <AdminLandingEditorPage /> },
      { path: 'chat/:convId',      element: <AdminChatPage /> },
    ]
  },

  { path: '*', element: <NotFoundPage /> }
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
```

```jsx
// features/auth/AuthGuard.jsx
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export function AuthGuard({ children, require: requiredRole }) {
  const { user, isLoading } = useAuthStore()
  const location = useLocation()

  if (isLoading) return <PageLoader />

  if (requiredRole === 'GUEST') {
    if (user) return <Navigate to="/dashboard" replace />
    return children
  }

  if (requiredRole === 'CLIENT') {
    if (!user) return <Navigate to={`/login?redirect=${location.pathname}`} replace />
    return children
  }

  if (requiredRole === 'ADMIN') {
    // CRITICAL: مش بيـredirect لـ admin login، بيروح 404
    // عشان نخبي وجود الـ admin panel
    if (!user || !['ADMIN', 'SUPPORT'].includes(user.role)) {
      return <Navigate to="/404" replace />
    }
    return children
  }

  return children
}
```

---

## 4. Stores (Zustand)

```javascript
// store/authStore.js
import { create } from 'zustand'
import { api } from '../lib/axios'

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,   // في memory فقط — مش localStorage
  isLoading: true,     // true عند أول load

  init: async () => {
    // بيحاول يعمل refresh عند أول load
    try {
      const res = await api.post('/auth/refresh')
      set({ user: res.data.user, accessToken: res.data.accessToken, isLoading: false })
    } catch {
      set({ user: null, accessToken: null, isLoading: false })
    }
  },

  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials)
    set({ user: res.data.user, accessToken: res.data.accessToken })
    return res.data
  },

  logout: async () => {
    try { await api.post('/auth/logout') } catch {}
    set({ user: null, accessToken: null })
  },

  setTokens: (user, accessToken) => set({ user, accessToken })
}))
```

```javascript
// store/templateStore.js
import { create } from 'zustand'

export const useTemplateStore = create((set, get) => ({
  // Customizer state
  sections: [],
  colorTokens: { primary: '#2563EB', secondary: '#F8FAFC', accent: '#7C3AED', text: '#0F172A' },
  templateId: null,

  initCustomizer: (template) => set({
    templateId: template.id,
    sections: template.components.sections,
    colorTokens: template.defaultColors
  }),

  updateColor: (token, value) => set(state => ({
    colorTokens: { ...state.colorTokens, [token]: value }
  })),

  reorderSections: (newOrder) => set({ sections: newOrder }),

  getCustomization: () => {
    const { sections, colorTokens } = get()
    return { sections, colorTokens }
  }
}))
```

---

## 5. Axios Instance

```javascript
// lib/axios.js
import axios from 'axios'
import { useAuthStore } from '../store/authStore'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,   // عشان الـ cookies (refresh token)
  timeout: 15000,
})

// Request interceptor — بيضيف الـ access token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor — بيعمل retry لو 401
let isRefreshing = false
let failedQueue = []

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      original._retry = true
      isRefreshing = true

      try {
        const res = await api.post('/auth/refresh')
        const { accessToken, user } = res.data
        useAuthStore.getState().setTokens(user, accessToken)

        failedQueue.forEach(p => p.resolve(accessToken))
        failedQueue = []
        isRefreshing = false

        original.headers.Authorization = `Bearer ${accessToken}`
        return api(original)
      } catch (refreshError) {
        failedQueue.forEach(p => p.reject(refreshError))
        failedQueue = []
        isRefreshing = false
        useAuthStore.getState().logout()
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  }
)
```

---

## 6. Landing Page — تفاصيل التصميم الكاملة

### 6.1 Navbar

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo DesignFlow]    القوالب   كيف يعمل   التسعير   تواصل معنا │
│                                              [تسجيل] [ابدأ الآن]│
└─────────────────────────────────────────────────────────────────┘

التصميم:
- خلفية: شفافة عند أعلى الصفحة → تصبح white/blur عند الـ scroll
- Shadow خفيف عند الـ scroll
- زر "ابدأ الآن": gradient أزرق-بنفسجي
- Sticky position
- Mobile: hamburger menu مع drawer
- لو logged in: Avatar مع Dropdown (لوحة التحكم | تسجيل خروج)
```

```jsx
// components/layout/Navbar.jsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Avatar } from '../ui/Avatar'
import { Dropdown } from '../ui/Dropdown'
import { Button } from '../ui/Button'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`
      fixed top-0 w-full z-50 transition-all duration-300
      ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100' : 'bg-transparent'}
    `}>
      <nav className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">DF</span>
          </div>
          <span className="font-bold text-xl text-gray-900">DesignFlow</span>
        </Link>

        {/* Desktop Nav */}
        <ul className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <li><Link to="/templates" className="hover:text-brand-500 transition-colors">القوالب</Link></li>
          <li><a href="#how-it-works" className="hover:text-brand-500 transition-colors">كيف يعمل</a></li>
          <li><a href="#pricing" className="hover:text-brand-500 transition-colors">التسعير</a></li>
          <li><a href="#contact" className="hover:text-brand-500 transition-colors">تواصل معنا</a></li>
        </ul>

        {/* Auth Area */}
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

        {/* Mobile Menu Button */}
        <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
          <MenuIcon className="w-6 h-6" />
        </button>
      </nav>

      {/* Mobile Drawer */}
      {menuOpen && <MobileMenu onClose={() => setMenuOpen(false)} user={user} logout={logout} />}
    </header>
  )
}
```

### 6.2 Hero Section

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│      ✦ منصة تصميم احترافية                                       │
│                                                                  │
│   قوالب جاهزة تُطلقك                                             │
│   في دقائق لا أيام                                               │
│                                                                  │
│   اكتشف مئات القوالب الاحترافية، خصصها بلمسة واحدة              │
│   واحصل على موقعك الجاهز في أسرع وقت.                           │
│                                                                  │
│   [استعرض القوالب ←]  [شاهد كيف يعمل ▶]                         │
│                                                                  │
│   ✓ 100+ قالب   ✓ تخصيص كامل   ✓ دعم فوري                       │
│                                                                  │
│          [صورة/Animation لمعاينة قوالب]                          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

التصميم:
- خلفية: gradient mesh خفيف (أبيض + أزرق فاتح جداً)
- Blobs ملونة animated خلف النص
- العنوان: font-size كبير (56-72px)، font-weight 800
- الـ word الرئيسي "في دقائق" يكون gradient أزرق-بنفسجي
- Animation: النص بيـslide up عند load
- الـ CTA buttons: shadow كبير + hover scale effect
- الـ trust badges (✓) تظهر بعد الـ buttons
- على اليمين: mockup ثلاثي الأبعاد لواجهات قوالب
```

```jsx
// في LandingPage.jsx — Hero Section
export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background blobs */}
      <div className="absolute top-20 right-10 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 left-10 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

      <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        {/* Text */}
        <div className="space-y-6 animate-slide-up">
          <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 px-4 py-2 rounded-full text-sm font-semibold border border-brand-100">
            <Sparkles className="w-4 h-4" />
            منصة تصميم احترافية
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
            قوالب جاهزة<br />
            تُطلقك{' '}
            <span className="bg-gradient-to-l from-brand-500 to-accent-500 bg-clip-text text-transparent">
              في دقائق
            </span>{' '}
            لا أيام
          </h1>

          <p className="text-lg text-gray-500 leading-relaxed max-w-lg">
            اكتشف مئات القوالب الاحترافية، خصصها بلمسة واحدة
            واحصل على موقعك الجاهز في أسرع وقت.
          </p>

          <div className="flex flex-wrap gap-4">
            <Button size="lg" onClick={() => navigate('/templates')}>
              استعرض القوالب
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Button variant="secondary" size="lg">
              <Play className="w-5 h-5 fill-current" />
              شاهد كيف يعمل
            </Button>
          </div>

          {/* Trust badges */}
          <div className="flex items-center gap-6 text-sm text-gray-500">
            {['100+ قالب', 'تخصيص كامل', 'دعم فوري'].map(badge => (
              <span key={badge} className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-500" />
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* Visual */}
        <div className="relative hidden md:block">
          {/* Stack of template mockups */}
          <div className="relative w-full h-96">
            <TemplateMockupStack />
          </div>
        </div>
      </div>
    </section>
  )
}
```

### 6.3 Templates Preview Section

```
[Section Title: "أحدث القوالب"]

┌──────────┐  ┌──────────┐  ┌──────────┐
│[Preview] │  │[Preview] │  │[Preview] │
│          │  │          │  │          │
│Template 1│  │Template 2│  │Template 3│
│  $99     │  │  $149    │  │  $79     │
│[عرض]    │  │[عرض]    │  │[عرض]    │
└──────────┘  └──────────┘  └──────────┘
┌──────────┐  ┌──────────┐  ┌──────────┐
│...       │  │...       │  │...       │
└──────────┘  └──────────┘  └──────────┘

                [عرض كل القوالب ←]
```

### 6.4 How It Works Section

```
[١]─────────[٢]─────────[٣]
 │           │           │
اختر         خصص         احصل
قالبك       ألوانه      على موقعك

Cards: أيقونة + رقم + عنوان + وصف
خط رابط بين الـ steps (SVG line/arrow)
```

### 6.5 Features Section

```
Grid 2x3:
┌─────────────────────┬─────────────────────┐
│ 🎨 تخصيص بالسحب    │ ⚡ تسليم سريع       │
│ اسحب وأفلت عناصر   │ نسلم خلال 48 ساعة  │
│ القالب لتغيير شكله │                     │
├─────────────────────┼─────────────────────┤
│ 🔒 أمان عالي       │ 💬 دعم فوري         │
│...                  │...                  │
├─────────────────────┼─────────────────────┤
│ 📱 متجاوب 100%     │ ♾️ تحديثات مجانية  │
└─────────────────────┴─────────────────────┘
```

### 6.6 Footer

```
┌────────────────────────────────────────────────────┐
│ [Logo + Description]   روابط سريعة   تواصل معنا   │
│                                                    │
│ © 2025 DesignFlow. جميع الحقوق محفوظة.             │
│                          [Facebook][Twitter][Insta]│
└────────────────────────────────────────────────────┘
```

---

## 7. Templates Page — صفحة القوالب

```
┌─────────────────────────────────────────────────────────────────┐
│  القوالب                            [بحث...]                    │
├──────────────────────────────────────────────────────────────────┤
│  الفئات: [الكل] [تجارة] [خدمات] [مدونة] [بورتفوليو] [تقني]     │
│  الترتيب: [الأحدث ▼]           السعر: [كل الأسعار ▼]            │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ img      │  │ img      │  │ img      │  │ img      │        │
│  │          │  │          │  │          │  │          │        │
│  │ Name     │  │ Name     │  │ Name     │  │ Name     │        │
│  │ Category │  │ Category │  │ Category │  │ Category │        │
│  │ $99  [→] │  │ $149 [→] │  │ $79  [→] │  │ $199 [→] │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│  ...                                                            │
│                      [تحميل المزيد]                             │
└─────────────────────────────────────────────────────────────────┘
```

```jsx
// components/shared/TemplateCard.jsx
export function TemplateCard({ template }) {
  const navigate = useNavigate()

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
      {/* Preview Image */}
      <div className="relative overflow-hidden aspect-video bg-gray-50">
        <img
          src={template.previewUrl}
          alt={template.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
          <Button size="sm" variant="secondary" onClick={() => navigate(`/templates/${template.id}`)}>
            <Eye className="w-4 h-4" />
            معاينة
          </Button>
          <Button size="sm" onClick={() => navigate(`/templates/${template.id}`)}>
            اشتر الآن
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-gray-900">{template.title}</h3>
            <span className="text-xs text-gray-400 mt-0.5">{template.category}</span>
          </div>
          <span className="text-lg font-bold text-brand-600">${template.price}</span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {template.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="subtle">{tag}</Badge>
          ))}
        </div>

        <Button variant="outline" className="w-full mt-4" onClick={() => navigate(`/templates/${template.id}`)}>
          عرض التفاصيل
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
```

---

## 8. Template Preview Page — صفحة معاينة القالب

```
┌───────────────────────────────────────────────────────────────────┐
│ [← رجوع للقوالب]                                                 │
├──────────────────────────┬────────────────────────────────────────┤
│                          │                                        │
│   [Preview iframe/       │  E-Commerce Pro Template               │
│    mockup كبير]          │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━           │
│                          │  فئة: تجارة إلكترونية                  │
│   [Desktop] [Mobile]     │                                        │
│   toggle                 │  الوصف: قالب احترافي مثالي             │
│                          │  للمتاجر الإلكترونية...               │
│                          │                                        │
│                          │  Tags: [متجر] [عربي] [RTL]             │
│                          │                                        │
│                          │  ┌──────────────────────────┐          │
│                          │  │     $149                 │          │
│                          │  │  [اشتر وخصص الآن →]      │          │
│                          │  └──────────────────────────┘          │
│                          │                                        │
│                          │  ✓ دعم RTL كامل                        │
│                          │  ✓ تصميم متجاوب                        │
│                          │  ✓ ألوان قابلة للتخصيص                │
│                          │  ✓ مراجعة خلال 48 ساعة               │
├──────────────────────────┴────────────────────────────────────────┤
│  قوالب مشابهة: [Card] [Card] [Card]                              │
└───────────────────────────────────────────────────────────────────┘

عند الضغط على "اشتر وخصص":
- لو مش logged in → redirect لـ /login?redirect=/customize/[id]
- لو logged in → navigate لـ /customize/[id]
```

---

## 9. Login & Register Pages

### 9.1 Login Page

```
┌────────────────────────────────────┐
│        [Logo]                      │
│                                    │
│   مرحباً بعودتك 👋                 │
│   سجل دخولك للمتابعة              │
│                                    │
│   ┌──────────────────────────────┐ │
│   │ البريد الإلكتروني            │ │
│   └──────────────────────────────┘ │
│   ┌──────────────────────────────┐ │
│   │ كلمة المرور        [👁]      │ │
│   └──────────────────────────────┘ │
│                                    │
│   [تسجيل الدخول ←]                │
│                                    │
│   ليس لديك حساب؟ [إنشاء حساب]     │
└────────────────────────────────────┘

Layout: Split screen
- اليسار: Form (بيض)
- اليمين: Gradient image + quote
- Mobile: Form فقط
```

```jsx
// pages/auth/LoginPage.jsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '../../store/authStore'

const loginSchema = z.object({
  email:    z.string().email('بريد إلكتروني غير صحيح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة')
})

export default function LoginPage() {
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const redirect = new URLSearchParams(location.search).get('redirect') || '/dashboard'

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data) => {
    try {
      await login(data)
      navigate(redirect, { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.error || 'خطأ في تسجيل الدخول')
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Form Side */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-2 mb-8">
              <LogoIcon />
              <span className="font-bold text-xl">DesignFlow</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">مرحباً بعودتك 👋</h1>
            <p className="text-gray-500 mt-2">سجل دخولك للمتابعة</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input label="البريد الإلكتروني" type="email" error={errors.email?.message}
              placeholder="example@email.com" {...register('email')} />
            <PasswordInput label="كلمة المرور" error={errors.password?.message}
              {...register('password')} />
            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              تسجيل الدخول
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500">
            ليس لديك حساب؟{' '}
            <Link to="/register" className="font-semibold text-brand-600 hover:underline">
              إنشاء حساب مجاني
            </Link>
          </p>
        </div>
      </div>

      {/* Visual Side */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-brand-600 to-accent-600 items-center justify-center p-12">
        <div className="text-white text-center space-y-6">
          <div className="w-32 h-32 mx-auto opacity-20 rounded-full bg-white" />
          <h2 className="text-3xl font-bold">منصتك الإبداعية</h2>
          <p className="text-white/70 text-lg">آلاف العملاء يثقون في DesignFlow</p>
        </div>
      </div>
    </div>
  )
}
```

### 9.2 Register Page

```
┌────────────────────────────────────┐
│  إنشاء حساب جديد                  │
│                                    │
│  [صورة المستخدم] ← اضغط للاختيار │
│                                    │
│  [الاسم الأول]  [الاسم الأخير]    │ ← صف واحد
│  [رقم الهاتف]                     │
│  [البريد الإلكتروني]              │
│  [كلمة المرور]                    │
│  [تأكيد كلمة المرور]              │
│                                    │
│  [إنشاء الحساب ←]                 │
│                                    │
│  لديك حساب؟ [تسجيل الدخول]        │
└────────────────────────────────────┘
```

```jsx
const registerSchema = z.object({
  firstName:       z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  lastName:        z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  phone:           z.string().regex(/^\+?[0-9]{10,15}$/, 'رقم هاتف غير صحيح'),
  email:           z.string().email('بريد إلكتروني غير صحيح'),
  password:        z.string().min(8).regex(
                     /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).+$/,
                     'كلمة المرور يجب أن تحتوي على حرف كبير، رقم، ورمز خاص'
                   ),
  confirmPassword: z.string()
}).refine(d => d.password === d.confirmPassword, {
  message: 'كلمتا المرور غير متطابقتان',
  path: ['confirmPassword']
})

// Avatar upload: input[type=file] مخفي، ضغطة على دايرة بتفتحه
// Preview محلي باستخدام URL.createObjectURL()
```

---

## 10. Template Customizer Page

```
┌─────────────────────────────────────────────────────────────────┐
│  [← رجوع]     تخصيص: E-Commerce Pro                [✓ طلب الآن]│
├───────────────────┬─────────────────────────────────────────────┤
│                   │                                             │
│  ترتيب الأقسام   │                                             │
│  ─────────────   │                                             │
│  ≡  Hero          │                                             │
│  ≡  Features      │         معاينة مباشرة                      │
│  ≡  Pricing       │         (Live Preview)                      │
│  ≡  Testimonials  │                                             │
│  ≡  Footer        │         CSS variables بتتحدث               │
│                   │         فوراً مع كل تغيير                   │
│  ─────────────   │                                             │
│  الألوان          │                                             │
│                   │                                             │
│  اللون الرئيسي   │                                             │
│  [████] #2563EB  │                                             │
│                   │                                             │
│  اللون الثانوي   │                                             │
│  [████] #F8FAFC  │                                             │
│                   │                                             │
│  لون التمييز     │                                             │
│  [████] #7C3AED  │                                             │
│                   │                                             │
│  لون النص        │                                             │
│  [████] #0F172A  │                                             │
│                   │                                             │
└───────────────────┴─────────────────────────────────────────────┘
```

```jsx
// pages/customize/TemplateCustomizerPage.jsx
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { HexColorPicker } from 'react-colorful'

// SortableSection Component
function SortableSection({ section }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 cursor-grab
                  ${isDragging ? 'shadow-lg scale-105 opacity-75 z-50' : 'hover:border-brand-300'}`}
      {...attributes}
    >
      <div {...listeners} className="text-gray-400 hover:text-gray-600">
        <GripVertical className="w-4 h-4" />
      </div>
      <span className="text-sm font-medium text-gray-700">{section.label}</span>
    </div>
  )
}

// Main Customizer
export default function TemplateCustomizerPage() {
  const { templateId } = useParams()
  const { sections, colorTokens, updateColor, reorderSections, initCustomizer } = useTemplateStore()
  const navigate = useNavigate()

  // Load template data
  useEffect(() => {
    api.get(`/templates/${templateId}/preview`).then(res => initCustomizer(res.data))
  }, [templateId])

  // Apply colors as CSS variables to the preview
  useEffect(() => {
    const preview = document.getElementById('template-preview')
    if (!preview) return
    Object.entries(colorTokens).forEach(([token, value]) => {
      preview.style.setProperty(`--color-${token}`, value)
    })
  }, [colorTokens])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = ({ active, over }) => {
    if (active.id !== over?.id) {
      const oldIdx = sections.findIndex(s => s.id === active.id)
      const newIdx = sections.findIndex(s => s.id === over.id)
      reorderSections(arrayMove(sections, oldIdx, newIdx))
    }
  }

  const handleSubmitOrder = async () => {
    try {
      const { data } = await api.post('/orders', {
        templateId,
        customization: { sections, colorTokens }
      })
      navigate(`/dashboard/orders/${data.id}?success=true`)
      toast.success('تم إرسال طلبك بنجاح!')
    } catch {
      toast.error('حدث خطأ، حاول مجدداً')
    }
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="h-14 bg-white border-b flex items-center justify-between px-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowRight className="w-4 h-4" />
          رجوع
        </button>
        <h1 className="font-bold text-gray-900">تخصيص القالب</h1>
        <Button onClick={handleSubmitOrder} size="sm">
          <CheckCircle className="w-4 h-4" />
          طلب الآن
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 bg-gray-50 border-l p-4 overflow-y-auto space-y-6">
          {/* Sections Drag */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">ترتيب الأقسام</h3>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sections} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {sections.map(s => <SortableSection key={s.id} section={s} />)}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {/* Color Pickers */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">الألوان</h3>
            <div className="space-y-4">
              {Object.entries(colorTokens).map(([token, value]) => (
                <ColorTokenPicker key={token} token={token} value={value} onChange={updateColor} />
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 bg-gray-200 overflow-auto p-4">
          <div className="bg-white rounded-xl overflow-hidden shadow-lg min-h-full" id="template-preview">
            <TemplateLivePreview sections={sections} colorTokens={colorTokens} />
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## 11. Client Dashboard

### 11.1 Layout (Sidebar + Header)

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo]  DesignFlow         [🔔 Notifications]  [Ahmed ▼]       │
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                  │
│  [Avatar]    │                                                  │
│  Ahmed M.    │   [Page Content Here]                            │
│              │                                                  │
│  ●  نظرة عامة│                                                  │
│  ○  طلباتي   │                                                  │
│  ○  المحادثة │                                                  │
│     [●] dot  │  (red dot لو فيه رسالة جديدة)                   │
│  ○  الملف   │                                                  │
│              │                                                  │
│  ──────────  │                                                  │
│  [تسجيل خروج│                                                  │
└──────────────┴──────────────────────────────────────────────────┘
```

### 11.2 Overview Page

```
مرحباً بك، Ahmed! 👋

┌───────────┐  ┌───────────┐  ┌───────────┐
│  طلباتي   │  │ قيد التنفيذ│ │  مكتملة   │
│    5      │  │    2      │  │    3      │
│ [📋]      │  │ [⚡]      │  │ [✅]      │
└───────────┘  └───────────┘  └───────────┘

آخر الطلبات:
┌─────────────────────────────────────────────────────┐
│ [img] E-Commerce Pro      1 يونيو 2025   [Pending ●]│
│ [img] Landing Page Lite   20 مايو 2025   [Done ✓]   │
└─────────────────────────────────────────────────────┘
[عرض كل الطلبات]

لو فيه محادثة مفتوحة:
┌─────────────────────────────────────────────────────┐
│ 💬 لديك رسالة جديدة من فريق الدعم                  │
│ [فتح المحادثة →]                                    │
└─────────────────────────────────────────────────────┘
```

### 11.3 Orders Page

```
طلباتي (5)

Filter: [الكل] [قيد الانتظار] [جاري التنفيذ] [مكتمل] [ملغي]

┌───────────────────────────────────────────────────────────────┐
│ [img]  E-Commerce Pro Template                                │
│        القالب: تجارة إلكترونية          المبلغ: $149        │
│        التاريخ: 1 يونيو 2025            [قيد الانتظار 🟡]   │
│                                                               │
│        [تفاصيل الطلب]  [فتح المحادثة 💬]  (لو متاحة)       │
└───────────────────────────────────────────────────────────────┘
... (كل الطلبات)
```

### 11.4 Order Detail Page

```
┌─────────────────────────────────────────────────────────────────┐
│ [← رجوع]   طلب #ORD-2025-001                                   │
├──────────────────────────┬──────────────────────────────────────┤
│                          │                                      │
│  [Template Preview]      │  تفاصيل الطلب                       │
│                          │  ────────────────                    │
│                          │  القالب: E-Commerce Pro              │
│                          │  الفئة: تجارة                        │
│  التخصيصات المطلوبة:     │  المبلغ: $149                       │
│  ── الألوان ──           │  تاريخ الطلب: 1/6/2025              │
│  Primary: [████]         │  الحالة: [قيد الانتظار 🟡]          │
│  Accent:  [████]         │                                      │
│  Secondary: [████]       │  ── Timeline ──                      │
│                          │  ✅ تم استقبال الطلب                  │
│  ── ترتيب الأقسام ──     │  ⏳ قيد المراجعة                    │
│  1. Hero                 │  ○  قيد التنفيذ                     │
│  2. Features             │  ○  تم التسليم                      │
│  3. Pricing              │                                      │
│  4. Footer               │  [فتح المحادثة 💬]                   │
└──────────────────────────┴──────────────────────────────────────┘
```

### 11.5 Chat Page

```
لو مفيش محادثة مفتوحة:
┌────────────────────────────────────────┐
│  📬 لا توجد محادثات نشطة حالياً       │
│                                        │
│  سيتواصل معك فريق الدعم بعد           │
│  مراجعة طلبك وقبوله                  │
└────────────────────────────────────────┘

لو فيه محادثة:
┌────────────────────────────────────────┐
│  💬 المحادثة                          │
│  بخصوص: E-Commerce Pro Template      │
├────────────────────────────────────────┤
│                                        │
│      [رسالة من الدعم]        ◀        │
│      مرحباً، سيتم التواصل معك         │
│      قريباً لمناقشة متطلباتك           │
│                           11:30 ص     │
│                                        │
│  ▶         [ردك هنا...]               │
│                           11:45 ص     │
│                                        │
├────────────────────────────────────────┤
│  [اكتب رسالة...]            [إرسال ←] │
└────────────────────────────────────────┘
```

### 11.6 Profile Page

```
الملف الشخصي

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│         [صورة المستخدم الكبيرة]                                │
│         [📷 تغيير الصورة]                                      │
│                                                                 │
│  ┌─────────────────────────┬─────────────────────────────────┐ │
│  │ الاسم الأول             │ الاسم الأخير                    │ │
│  │ [Ahmed              ]   │ [Mohamed             ]          │ │
│  └─────────────────────────┴─────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ رقم الهاتف                                              │   │
│  │ [+201234567890                                       ]  │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ البريد الإلكتروني (للعرض فقط)                          │   │
│  │ ahmed@email.com                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [حفظ التغييرات]                                               │
│                                                                 │
│  ──────── تغيير كلمة المرور ────────                           │
│  [كلمة المرور الحالية]                                         │
│  [كلمة المرور الجديدة]                                         │
│  [تأكيد كلمة المرور الجديدة]                                   │
│  [تغيير كلمة المرور]                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 12. Admin Panel

### 12.1 Admin Login (Hidden)

```
Route: /x9k2-manage
لو حد بيحاول يدخل بدون auth → 404 مش login page

┌────────────────────────────────────┐
│                                    │
│   [Lock Icon]                      │
│                                    │
│   وصول محدود                      │
│                                    │
│   [البريد الإلكتروني]             │
│   [كلمة المرور]                   │
│                                    │
│   [دخول]                          │
│                                    │
│   (لا يوجد رابط تسجيل)            │
└────────────────────────────────────┘

لا Navbar عادي، لا Footer، لا أي إشارة للـ branding العادي
```

### 12.2 Admin Sidebar

```
[Logo] Admin Panel

─────────────────
📊  نظرة عامة
📋  الطلبات         [8] badge
🎨  القوالب
🖥️  تعديل Landing
💬  المحادثات        [3]
─────────────────
👤  المستخدمين
⚙️  الإعدادات
─────────────────
[تسجيل خروج]
```

### 12.3 Admin Overview Page

```
نظرة عامة

┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ الطلبات  │ │ العملاء  │ │ الإيراد  │ │ انتظار  │
│    45    │ │   120    │ │ $9,500   │ │    8    │
│ ↑ 12%    │ │ ↑ 5%     │ │ ↑ 18%    │ │         │
└──────────┘ └──────────┘ └──────────┘ └──────────┘

[Chart: طلبات آخر 30 يوم — Bar Chart]

آخر الطلبات:
┌─────────────────────────────────────────────────────────────────┐
│ # │ العميل      │ القالب          │ التاريخ  │ المبلغ │ الحالة │
│ 1 │ Ahmed M.    │ E-Commerce Pro  │ 1/6      │ $149   │ [انتظار]│
│ 2 │ Sara K.     │ Landing Lite    │ 31/5     │ $79    │ [جاري] │
└─────────────────────────────────────────────────────────────────┘
```

### 12.4 Admin Orders Page

```
إدارة الطلبات

[بحث...] [الحالة ▼] [الفترة ▼] [تصدير CSV]

Table:
# │ العميل │ القالب │ المبلغ │ التاريخ │ الحالة │ الإجراءات
──────────────────────────────────────────────────────────────
1 │ Ahmed  │ E-Com  │ $149   │ 1/6     │[انتظار]│[عرض][فتح محادثة][تغيير الحالة▼]
2 │ Sara   │ Landing│ $79    │ 31/5    │[جاري]  │[عرض][فتح محادثة][تغيير الحالة▼]

زرار "فتح محادثة":
- لو مفيش conversation → POST /api/admin/orders/:id/conversation (تعملها وتبعت welcome message)
- لو موجودة → navigate لـ /x9k2-manage/panel/chat/:convId

Dropdown تغيير الحالة:
[قيد الانتظار] [مقبول] [جاري التنفيذ] [مكتمل] [ملغي]
```

### 12.5 Admin Order Detail

```
[← رجوع]   طلب #ORD-001

┌──────────────────────────┬──────────────────────────────────────┐
│  بيانات العميل           │  بيانات الطلب                        │
│  ─────────────          │  ──────────────                       │
│  [Avatar] Ahmed Mohamed  │  القالب: E-Commerce Pro              │
│  📧 ahmed@email.com      │  المبلغ: $149                        │
│  📱 +201234567890        │  التاريخ: 1/6/2025                   │
│  📋 3 طلبات سابقة       │  الحالة: [قيد الانتظار ▼] ← Dropdown │
│                          │                                      │
│                          │  [فتح المحادثة مع العميل 💬]         │
├──────────────────────────┴──────────────────────────────────────┤
│  التخصيصات المطلوبة                                             │
│  Primary: [████] #2563EB  |  Accent: [████] #7C3AED             │
│  ترتيب الأقسام: Hero → Features → Pricing → Footer             │
└─────────────────────────────────────────────────────────────────┘
```

### 12.6 Admin Templates Page

```
القوالب (12)

[+ إضافة قالب جديد]

┌────────────┐ ┌────────────┐ ┌────────────┐
│[img]       │ │[img]       │ │[img]       │
│E-Com Pro   │ │Landing Lite│ │Portfolio X │
│$149  [✓]   │ │$79  [✓]   │ │$99  [✗]   │
│[تعديل][حذف]│ │[تعديل][حذف]│ │[تعديل][نشر]│
└────────────┘ └────────────┘ └────────────┘

✓ = منشور | ✗ = مخفي
[نشر/إخفاء] toggle على كل كارت
```

### 12.7 Add/Edit Template Page

```
[+ إضافة قالب جديد] / [تعديل: E-Commerce Pro]

Section 1: المعلومات الأساسية
┌──────────────────────────────────────────────────────────────┐
│ عنوان القالب: [                                           ]  │
│ الوصف:        [                                           ]  │
│               [                                           ]  │
│ الفئة:        [اختر الفئة ▼]                                │
│ السعر:        [$              ]                              │
│ Tags:         [أضف tag + Enter]  [RTL ×] [متجاوب ×]        │
└──────────────────────────────────────────────────────────────┘

Section 2: الصور
┌──────────────────────────────────────────────────────────────┐
│ صورة المعاينة:                                               │
│ ┌──────────────────┐                                         │
│ │                  │  ← Drag & Drop zone                    │
│ │  [📁 اختر صورة] │  أو اسحب الصورة هنا                   │
│ │                  │  PNG, JPG, WebP (max 5MB)              │
│ └──────────────────┘                                         │
│ رابط Demo: [https://...                               ]      │
└──────────────────────────────────────────────────────────────┘

Section 3: الألوان الافتراضية
┌──────────────────────────────────────────────────────────────┐
│ Primary:   [████] #2563EB   Secondary: [████] #F8FAFC       │
│ Accent:    [████] #7C3AED   Text:      [████] #0F172A       │
└──────────────────────────────────────────────────────────────┘

Section 4: هيكل الأقسام (JSON Editor)
┌──────────────────────────────────────────────────────────────┐
│ {                                                            │
│   "sections": [                                              │
│     { "id": "hero", "label": "Hero", "draggable": true }    │
│   ]                                                          │
│ }                                                            │
└──────────────────────────────────────────────────────────────┘

[نشر فوراً ○]
[حفظ كمسودة]  [نشر القالب ✓]
```

### 12.8 Landing Editor Page

```
تعديل Landing Page

[Tabs: Hero | المميزات | كيف يعمل | آراء العملاء | Footer]

── Hero Section ──
┌──────────────────────────────────────────────────────────────┐
│ العنوان الرئيسي:  [قوالب جاهزة تُطلقك في دقائق لا أيام  ] │
│ الوصف:            [اكتشف مئات القوالب الاحترافية...      ] │
│ نص زرار CTA:      [استعرض القوالب                        ] │
│ نص زرار ثانوي:   [شاهد كيف يعمل                         ] │
│                                                              │
│ Trust Badges:                                                │
│ [100+ قالب] [تخصيص كامل] [دعم فوري]  [+ إضافة]           │
└──────────────────────────────────────────────────────────────┘

[حفظ التغييرات]
```

### 12.9 Admin Chat Page

```
المحادثة مع: Ahmed Mohamed
بخصوص: طلب #ORD-001 — E-Commerce Pro

┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  ◀  مرحباً Ahmed، شكراً لطلبك! سنتواصل معك قريباً.  [11:30] │
│                                                                │
│     أهلاً، متى سيتم البدء في التنفيذ؟         ▶  [11:35]    │
│                                                                │
│  ◀  سنبدأ خلال 24 ساعة. هل لديك أي ملاحظات     [11:40]      │
│     إضافية؟                                                    │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│  [اكتب رسالة هنا...]                           [إرسال →]     │
└────────────────────────────────────────────────────────────────┘

[معلومات الطلب على اليمين أو الشريط العلوي]
```

---

## 13. NotFound Page (404)

```
┌────────────────────────────────────────┐
│                                        │
│           404                          │
│                                        │
│     الصفحة غير موجودة                 │
│                                        │
│   [← العودة للرئيسية]                 │
│                                        │
└────────────────────────────────────────┘

مهم: لما الأدمن يحاول يدخل Admin Panel بدون auth
→ navigate('/404') مش navigate('/x9k2-manage')
عشان نخبي وجود الـ admin route
```

---

## 14. Responsive Design Rules

```
Mobile First:  sm: 640px | md: 768px | lg: 1024px | xl: 1280px

Landing Page:
  - Navbar: hamburger menu + drawer
  - Hero: single column, smaller text
  - Templates Grid: 1 col → 2 col → 3 col → 4 col

Dashboards:
  - Sidebar: hidden on mobile, drawer on toggle
  - Stats cards: 2 col على mobile, 4 col على desktop
  - Tables: scrollable horizontally على mobile

Customizer:
  - Mobile: Tabs بدل الـ split (Sections tab | Colors tab | Preview tab)
```

---

## 15. Animations & Micro-interactions

```javascript
// كل حاجة تكون smooth:
// Buttons: scale(0.97) on press
// Cards: translateY(-4px) + shadow on hover  
// Page transitions: fade-in 300ms
// Dropdowns: slideDown 200ms
// Modals: scale(0.95)→scale(1) + fade
// Toast notifications: slideIn من الأعلى
// Loading states: skeleton screens مش spinners للـ content

// framer-motion للـ page transitions
import { AnimatePresence, motion } from 'framer-motion'

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -10 }
}

// Wrap page content:
<motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
  {children}
</motion.div>
```

---

## 16. Checklist قبل إنهاء المرحلة

- [ ] كل الصفحات شغالة بدون أي console errors
- [ ] الـ AuthGuard بيحمي الـ routes الصح
- [ ] الـ Admin route بيرجع 404 لغير الأدمن
- [ ] Axios interceptor بيعمل token refresh تلقائي
- [ ] كل الـ forms بتعمل validation قبل الإرسال
- [ ] الـ Customizer بيـupdate الـ preview فوراً
- [ ] Skeleton loaders تظهر عند الـ loading
- [ ] Empty states موجودة في كل قائمة فارغة
- [ ] Error states موجودة للـ API failures
- [ ] الموقع responsive على mobile, tablet, desktop
- [ ] RTL direction صح على كل الصفحات
- [ ] Toast notifications تظهر عند كل action
- [ ] Code splitting شغال (lazy loading)

---

*المرحلة الأولى منتهية — انتقل لـ PHASE_2_BACKEND.md*
