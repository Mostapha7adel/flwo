import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api } from '../../lib/axios'
import { useAuthStore } from '../../store/authStore'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Avatar } from '../../components/ui/Avatar'
import { Divider } from '../../components/ui/Divider'
import { PageHeader } from '../../components/shared/PageHeader'

export default function ClientProfilePage() {
  const { user, setTokens } = useAuthStore()
  const queryClient = useQueryClient()

  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)

  useEffect(() => {
    return () => { if (avatarPreview) URL.revokeObjectURL(avatarPreview) }
  }, [avatarPreview])
  const [password, setPassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordError, setPasswordError] = useState('')

  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/users/profile').then(res => res.data),
  })

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (profileData?.user) {
      setForm({
        firstName: profileData.user.firstName || '',
        lastName: profileData.user.lastName || '',
        email: profileData.user.email || '',
        phone: profileData.user.phone || '',
      })
    }
  }, [profileData])
  /* eslint-enable react-hooks/set-state-in-effect */

  const updateMutation = useMutation({
    mutationFn: (data) => api.put('/users/profile', data).then(res => res.data),
    onSuccess: (data) => {
      setTokens(data.user, useAuthStore.getState().accessToken)
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      toast.success('تم حفظ التغييرات بنجاح')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء حفظ التغييرات')
    },
  })

  const passwordMutation = useMutation({
    mutationFn: (data) => api.put('/auth/change-password', data).then(res => res.data),
    onSuccess: () => {
      setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' })
      toast.success('تم تغيير كلمة المرور بنجاح')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء تغيير كلمة المرور')
    },
  })

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleFormChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handlePasswordChange = (field) => (e) => {
    setPassword(prev => ({ ...prev, [field]: e.target.value }))
    setPasswordError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = new FormData()
    payload.append('firstName', form.firstName)
    payload.append('lastName', form.lastName)
    payload.append('phone', form.phone)
    if (avatarFile) payload.append('avatar', avatarFile)
    updateMutation.mutate(payload)
  }

  const handlePasswordSubmit = () => {
    if (password.newPassword !== password.confirmPassword) {
      setPasswordError('كلمة المرور الجديدة وتأكيدها غير متطابقتين')
      return
    }
    passwordMutation.mutate({
      currentPassword: password.currentPassword,
      newPassword: password.newPassword,
    })
  }

  return (
    <div>
      <PageHeader title="الملف الشخصي" />

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex flex-col items-center">
            <label className="cursor-pointer">
              <Avatar src={avatarPreview || user?.avatarUrl} name={`${user?.firstName} ${user?.lastName}`} size="xl" className="ring-4 ring-gray-100 hover:ring-brand-200 transition" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
            <p className="text-xs text-gray-400 mt-2">اضغط لتغيير الصورة</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="الاسم الأول" value={form.firstName} onChange={handleFormChange('firstName')} />
            <Input label="الاسم الأخير" value={form.lastName} onChange={handleFormChange('lastName')} />
          </div>

          <Input label="رقم الهاتف" type="tel" value={form.phone} onChange={handleFormChange('phone')} placeholder="+201234567890" />
          <Input label="البريد الإلكتروني" type="email" value={form.email} onChange={handleFormChange('email')} disabled hint="البريد الإلكتروني غير قابل للتغيير" />

          <Button type="submit" variant="primary" loading={updateMutation.isPending}>حفظ التغييرات</Button>

          <Divider />

          <div className="space-y-4">
            <h3 className="font-bold text-gray-900">تغيير كلمة المرور</h3>
            <Input label="كلمة المرور الحالية" type="password" value={password.currentPassword} onChange={handlePasswordChange('currentPassword')} />
            <Input label="كلمة المرور الجديدة" type="password" value={password.newPassword} onChange={handlePasswordChange('newPassword')} />
            <Input label="تأكيد كلمة المرور الجديدة" type="password" value={password.confirmPassword} onChange={handlePasswordChange('confirmPassword')} error={passwordError} />
            <Button type="button" variant="secondary" loading={passwordMutation.isPending} onClick={handlePasswordSubmit}>تغيير كلمة المرور</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
