import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { PageLoader } from '../../components/ui/Spinner'

const STAFF_ROLES = ['ADMIN', 'SUPPORT', 'ACCOUNTS', 'SUPER_ADMIN']

export function AuthGuard({ children, require: requiredRole }) {
  const user = useAuthStore(s => s.user)
  const isLoading = useAuthStore(s => s.isLoading)
  const location = useLocation()

  if (isLoading) return <PageLoader />

  if (requiredRole === 'GUEST') {
    if (!user) return children
    if (STAFF_ROLES.includes(user.role)) {
      return <Navigate to="/x9k2-manage/panel" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  if (requiredRole === 'CLIENT') {
    if (!user) return <Navigate to={`/login?redirect=${location.pathname}`} replace />
    if (STAFF_ROLES.includes(user.role)) {
      return <Navigate to="/x9k2-manage/panel" replace />
    }
    return children
  }

  if (requiredRole === 'ADMIN') {
    if (!user || !STAFF_ROLES.includes(user.role)) {
      return <Navigate to="/x9k2-manage" replace />
    }
    return children
  }

  return children
}
