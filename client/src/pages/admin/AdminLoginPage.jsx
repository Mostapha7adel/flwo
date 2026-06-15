import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Lock } from 'lucide-react'
import { api } from '../../lib/axios'
import { useAuthStore } from '../../store/authStore'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const setTokens = useAuthStore((s) => s.setTokens)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data) => {
    try {
      const res = await api.post('/admin/login', data)
      setTokens(res.data.user, res.data.accessToken)
      navigate('/x9k2-manage/panel', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.error || 'بيانات دخول غير صحيحة')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-sm shadow-2xl border border-gray-700">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">وصول محدود</h1>
          <p className="text-sm text-gray-400 mt-1">لوحة الإدارة</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            placeholder="البريد الإلكتروني"
            type="email"
            error={errors.email?.message}
            {...register('email')}
            className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
          />
          <Input
            placeholder="كلمة المرور"
            type="password"
            error={errors.password?.message}
            {...register('password')}
            className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
          />
          <Button type="submit" className="w-full" loading={isSubmitting}>دخول</Button>
        </form>
      </div>
    </div>
  )
}
