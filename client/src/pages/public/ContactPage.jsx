import { useState } from 'react'
import { z } from 'zod'
import { Mail, Phone, MapPin, Send } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api } from '../../lib/axios'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { useSiteSettings } from '../../hooks/useSiteSettings'

const contactSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  phone: z.string().optional(),
  subject: z.string().min(3, 'الموضوع يجب أن يكون 3 أحرف على الأقل'),
  message: z.string().min(10, 'الرسالة يجب أن تكون 10 أحرف على الأقل'),
})

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [errors, setErrors] = useState({})
  const { data: content } = useSiteSettings()
  const footer = content?.footer || {}
  const contactEmail = footer.email || 'support@designflow.com'
  const contactPhone = footer.phone || '+966 55 123 4567'
  const contactAddress = footer.address || 'الرياض، المملكة العربية السعودية'

  const mutation = useMutation({
    mutationFn: (data) => api.post('/contact', data),
    onSuccess: () => {
      toast.success('تم إرسال رسالتك بنجاح، سنتواصل معك قريباً')
      setForm({ name: '', email: '', phone: '', subject: '', message: '' })
      setErrors({})
    },
    onError: (err) => {
      const details = err.response?.data?.details
      if (details) {
        const fieldErrors = {}
        Object.entries(details).forEach(([k, msgs]) => { fieldErrors[k] = msgs[0] })
        setErrors(fieldErrors)
      }
      toast.error(err.response?.data?.error || 'حدث خطأ أثناء الإرسال')
    },
  })

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) setErrors(prev => { const c = { ...prev }; delete c[field]; return c })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const result = contactSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors = {}
      result.error.errors.forEach(err => {
        const field = err.path[0]
        if (!fieldErrors[field]) fieldErrors[field] = err.message
      })
      setErrors(fieldErrors)
      toast.error('يرجى تصحيح الأخطاء في النموذج')
      return
    }
    setErrors({})
    mutation.mutate(result.data)
  }

  return (
    <div className="min-h-screen pt-24">
      <section className="py-16 bg-gradient-to-b from-brand-50/50 to-white">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">تواصل معنا</h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            لديك سؤال أو استفسار؟ نحن هنا لمساعدتك. أرسل لنا رسالة وسنرد عليك في أقرب وقت.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-6 h-6 text-brand-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">البريد الإلكتروني</h3>
                <p className="text-sm text-gray-500" dir="ltr">{contactEmail}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mx-auto mb-3">
                  <Phone className="w-6 h-6 text-brand-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">رقم الهاتف</h3>
                <p className="text-sm text-gray-500" dir="ltr">{contactPhone}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mx-auto mb-3">
                  <MapPin className="w-6 h-6 text-brand-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">العنوان</h3>
                <p className="text-sm text-gray-500">{contactAddress}</p>
              </div>
            </div>

            <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Input label="الاسم *" value={form.name} onChange={handleChange('name')} error={errors.name} />
                  <Input label="البريد الإلكتروني *" type="email" value={form.email} onChange={handleChange('email')} error={errors.email} />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <Input label="رقم الهاتف (اختياري)" type="tel" value={form.phone} onChange={handleChange('phone')} />
                  <Input label="الموضوع *" value={form.subject} onChange={handleChange('subject')} error={errors.subject} />
                </div>
                <Textarea label="الرسالة *" rows={5} value={form.message} onChange={handleChange('message')} error={errors.message} />
                <Button type="submit" className="w-full" loading={mutation.isPending}>
                  <Send className="w-4 h-4" />
                  إرسال الرسالة
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}