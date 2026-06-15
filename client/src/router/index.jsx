import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthGuard } from '../features/auth/AuthGuard'
import { PageLoader } from '../components/ui/Spinner'
import { PageTransition } from '../components/shared/PageTransition'
import PublicLayout from '../components/layout/PublicLayout'

const LandingPage = lazy(() => import('../pages/public/LandingPage'))

const AboutPage = lazy(() => import('../pages/public/AboutPage'))
const ContactPage = lazy(() => import('../pages/public/ContactPage'))
const TemplatesPage = lazy(() => import('../pages/public/TemplatesPage'))
const TemplatePreviewPage = lazy(() => import('../pages/public/TemplatePreviewPage'))
const LoginPage = lazy(() => import('../pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))

const ClientLayout = lazy(() => import('../components/layout/ClientLayout'))
const ClientOverviewPage = lazy(() => import('../pages/client/ClientOverviewPage'))
const ClientOrdersPage = lazy(() => import('../pages/client/ClientOrdersPage'))
const ClientOrderDetailPage = lazy(() => import('../pages/client/ClientOrderDetailPage'))
const ClientProfilePage = lazy(() => import('../pages/client/ClientProfilePage'))
const ClientChatPage = lazy(() => import('../pages/client/ClientChatPage'))
const TemplateCustomizerPage = lazy(() => import('../pages/customize/TemplateCustomizerPage'))
const AdminLoginPage = lazy(() => import('../pages/admin/AdminLoginPage'))
const AdminLayout = lazy(() => import('../components/layout/AdminLayout'))
const AdminOverviewPage = lazy(() => import('../pages/admin/AdminOverviewPage'))
const AdminOrdersPage = lazy(() => import('../pages/admin/AdminOrdersPage'))
const AdminOrderDetailPage = lazy(() => import('../pages/admin/AdminOrderDetailPage'))
const AdminTemplatesPage = lazy(() => import('../pages/admin/AdminTemplatesPage'))
const AddTemplatePage = lazy(() => import('../pages/admin/AddTemplatePage'))
const AdminLandingEditorPage = lazy(() => import('../pages/admin/AdminLandingEditorPage'))
const AdminChatPage = lazy(() => import('../pages/admin/AdminChatPage'))
const AdminContactPage = lazy(() => import('../pages/admin/AdminContactPage'))
const AdminUsersPage = lazy(() => import('../pages/admin/AdminUsersPage'))
const AdminAccountsPage = lazy(() => import('../pages/admin/AdminAccountsPage'))

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <Suspense fallback={<PageLoader />}><PageTransition><LandingPage /></PageTransition></Suspense> },
      { path: '/about', element: <PageTransition><AboutPage /></PageTransition> },
      { path: '/contact', element: <PageTransition><ContactPage /></PageTransition> },
      { path: '/templates', element: <PageTransition><TemplatesPage /></PageTransition> },
      { path: '/templates/:id', element: <PageTransition><TemplatePreviewPage /></PageTransition> },
    ],
  },
  { path: '/login', element: <AuthGuard require="GUEST"><PageTransition><LoginPage /></PageTransition></AuthGuard> },
  { path: '/register', element: <AuthGuard require="GUEST"><PageTransition><RegisterPage /></PageTransition></AuthGuard> },

  {
    path: '/dashboard',
    element: (
      <AuthGuard require="CLIENT">
        <Suspense fallback={<PageLoader />}><ClientLayout /></Suspense>
      </AuthGuard>
    ),
    children: [
      { index: true, element: <PageTransition><ClientOverviewPage /></PageTransition> },
      { path: 'orders', element: <PageTransition><ClientOrdersPage /></PageTransition> },
      { path: 'orders/:id', element: <PageTransition><ClientOrderDetailPage /></PageTransition> },
      { path: 'profile', element: <PageTransition><ClientProfilePage /></PageTransition> },
      { path: 'chat', element: <PageTransition><ClientChatPage /></PageTransition> },
    ]
  },

  {
    path: '/customize/:templateId',
    element: (
      <AuthGuard require="CLIENT">
        <Suspense fallback={<PageLoader />}><PageTransition><TemplateCustomizerPage /></PageTransition></Suspense>
      </AuthGuard>
    )
  },

  {
    path: '/x9k2-manage',
    element: <Suspense fallback={<PageLoader />}><PageTransition><AdminLoginPage /></PageTransition></Suspense>
  },
  {
    path: '/x9k2-manage/panel',
    element: (
      <AuthGuard require="ADMIN">
        <Suspense fallback={<PageLoader />}><AdminLayout /></Suspense>
      </AuthGuard>
    ),
    children: [
      { index: true, element: <PageTransition><AdminOverviewPage /></PageTransition> },
      { path: 'orders', element: <PageTransition><AdminOrdersPage /></PageTransition> },
      { path: 'orders/:id', element: <PageTransition><AdminOrderDetailPage /></PageTransition> },
      { path: 'templates', element: <PageTransition><AdminTemplatesPage /></PageTransition> },
      { path: 'templates/new', element: <PageTransition><AddTemplatePage /></PageTransition> },
      { path: 'templates/edit/:id', element: <PageTransition><AddTemplatePage /></PageTransition> },
      { path: 'landing', element: <PageTransition><AdminLandingEditorPage /></PageTransition> },
      { path: 'chat', element: <PageTransition><AdminChatPage /></PageTransition> },
      { path: 'chat/:convId', element: <PageTransition><AdminChatPage /></PageTransition> },
      { path: 'users', element: <PageTransition><AdminUsersPage /></PageTransition> },
      { path: 'contact', element: <PageTransition><AdminContactPage /></PageTransition> },
      { path: 'accounts', element: <PageTransition><AdminAccountsPage /></PageTransition> },
    ]
  },

  { path: '*', element: <PageTransition><NotFoundPage /></PageTransition> }
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
