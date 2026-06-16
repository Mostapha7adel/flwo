import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useSiteSettings } from '../../hooks/useSiteSettings'

const loginSchema = z.object({
  email: z.string().email('بريد إلكتروني غير صحيح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
})

export default function LoginPage() {
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const redirect = new URLSearchParams(location.search).get('redirect') || '/dashboard'
  const { data: landingContent } = useSiteSettings()
  const logoUrl = landingContent?.site?.logoUrl

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data) => {
    try {
      const res = await login(data)
      if (res.user.role === 'ADMIN' || res.user.role === 'SUPPORT') {
        toast.error('هذا الحساب غير مسموح له بالدخول من هنا')
        return
      }
      navigate(redirect, { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.error || 'خطأ في تسجيل الدخول')
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-2 mb-8">
              {logoUrl ? (
                <img src={logoUrl} alt="Templyn" className="h-9 w-auto" />
              ) : (
                <>
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">DF</span>
                  </div>
                  <span className="font-bold text-xl text-gray-900">Templyn</span>
                </>
              )}
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">مرحباً بعودتك</h1>
            <p className="text-gray-500 mt-2">سجل دخولك للمتابعة</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input label="البريد الإلكتروني" type="email" error={errors.email?.message}
              placeholder="example@email.com" {...register('email')} />
            <Input label="كلمة المرور" type="password" error={errors.password?.message}
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

      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-brand-600 to-accent-600 items-center justify-center p-12">
        <div className="text-white text-center space-y-6">
          <div className="w-32 h-32 mx-auto opacity-20 rounded-full bg-white" />
          <h2 className="text-3xl font-bold">منصتك الإبداعية</h2>
          <p className="text-white/70 text-lg">آلاف العملاء يثقون في Templyn</p>
        </div>
      </div>
    </div>
  )
}
