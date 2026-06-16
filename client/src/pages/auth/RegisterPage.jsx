import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { api } from '../../lib/axios'
import { useAuthStore } from '../../store/authStore'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Avatar } from '../../components/ui/Avatar'
import { useSiteSettings } from '../../hooks/useSiteSettings'

const registerSchema = z.object({
  firstName: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  lastName: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'رقم هاتف غير صحيح'),
  email: z.string().email('بريد إلكتروني غير صحيح'),
  password: z.string().min(8).regex(
    /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).+$/,
    'يجب أن تحتوي على حرف كبير، رقم، ورمز خاص'
  ),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'كلمتا المرور غير متطابقتان',
  path: ['confirmPassword'],
})

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const { data: landingContent } = useSiteSettings()
  const logoUrl = landingContent?.site?.logoUrl
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)

  useEffect(() => {
    return () => { if (avatarPreview) URL.revokeObjectURL(avatarPreview) }
  }, [avatarPreview])

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registerSchema),
  })

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const onSubmit = async (data) => {
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([k, v]) => formData.append(k, v))
      if (avatarFile) formData.append('avatar', avatarFile)

      await api.post('/auth/register', formData)
      await login({ email: data.email, password: data.password })
      navigate('/dashboard', { replace: true })
      toast.success('تم إنشاء الحساب بنجاح!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'حدث خطأ، حاول مجدداً')
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
            <h1 className="text-2xl font-bold text-gray-900">إنشاء حساب جديد</h1>
            <p className="text-gray-500 mt-2">انضم إلينا وابدأ رحلتك</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="flex justify-center">
              <label className="cursor-pointer">
                <Avatar src={avatarPreview} name="?" size="xl" className="ring-2 ring-gray-200 hover:ring-brand-500 transition" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="الاسم الأول" error={errors.firstName?.message} {...register('firstName')} />
              <Input label="الاسم الأخير" error={errors.lastName?.message} {...register('lastName')} />
            </div>

            <Input label="رقم الهاتف" type="tel" error={errors.phone?.message} placeholder="+201234567890" {...register('phone')} />
            <Input label="البريد الإلكتروني" type="email" error={errors.email?.message} placeholder="example@email.com" {...register('email')} />
            <Input label="كلمة المرور" type="password" error={errors.password?.message} {...register('password')} />
            <Input label="تأكيد كلمة المرور" type="password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />

            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              إنشاء الحساب
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500">
            لديك حساب؟{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:underline">تسجيل الدخول</Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-accent-600 to-brand-600 items-center justify-center p-12">
        <div className="text-white text-center space-y-6">
          <div className="w-32 h-32 mx-auto opacity-20 rounded-full bg-white" />
          <h2 className="text-3xl font-bold">ابدأ رحلتك الآن</h2>
          <p className="text-white/70 text-lg">آلاف العملاء يثقون في Templyn</p>
        </div>
      </div>
    </div>
  )
}
