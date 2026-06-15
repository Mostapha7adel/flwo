import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Button } from '../components/ui/Button'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-6">
        <h1 className="text-8xl font-extrabold text-gray-200">404</h1>
        <h2 className="text-2xl font-bold text-gray-900">الصفحة غير موجودة</h2>
        <p className="text-gray-500">عذراً، الصفحة التي تبحث عنها غير موجودة</p>
        <Button onClick={() => navigate('/')} variant="primary" size="lg">
          <ArrowRight className="w-5 h-5" />
          العودة للرئيسية
        </Button>
      </div>
    </div>
  )
}
