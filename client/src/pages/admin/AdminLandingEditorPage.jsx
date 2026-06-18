import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Trash2, Loader, Upload, GripVertical } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Badge } from '../../components/ui/Badge'
import { api } from '../../lib/axios'

export default function AdminLandingEditorPage() {
  const [activeTab, setActiveTab] = useState('hero')

  const [heroTitle, setHeroTitle] = useState('قوالب جاهزة تُطلقك في دقائق لا أيام')
  const [heroDesc, setHeroDesc] = useState('اكتشف مئات القوالب الاحترافية...')
  const [ctaText, setCtaText] = useState('استعرض القوالب')
  const [secondaryText, setSecondaryText] = useState('شاهد كيف يعمل')
  const [badges, setBadges] = useState(['100+ قالب', 'تخصيص كامل', 'دعم فوري'])
  const [badgeInput, setBadgeInput] = useState('')

  const [heroImage, setHeroImage] = useState('')
  const [gradientFrom, setGradientFrom] = useState('from-brand-500/20')
  const [gradientTo, setGradientTo] = useState('to-accent-500/20')
  const [animation, setAnimation] = useState('float')

  const [aboutTitle, setAboutTitle] = useState('نبذة عن Templyn')
  const [aboutDesc, setAboutDesc] = useState('')
  const [aboutStats, setAboutStats] = useState([
    { num: '500+', label: 'موقع منشور' },
    { num: '50+', label: 'قالب احترافي' },
    { num: '98%', label: 'عملاء سعداء' },
    { num: '24/7', label: 'دعم فني' },
  ])

  const [aboutPageTitle, setAboutPageTitle] = useState('عن Templyn')
  const [aboutPageDesc, setAboutPageDesc] = useState('')
  const [aboutStory, setAboutStory] = useState('')
  const [aboutPageImage, setAboutPageImage] = useState('')

  const [demoVideo, setDemoVideo] = useState('')
  const [demoVideoTitle, setDemoVideoTitle] = useState('')

  const [features, setFeatures] = useState([])
  const [steps, setSteps] = useState([])
  const [testimonials, setTestimonials] = useState([])
  const [footerEmail, setFooterEmail] = useState('')
  const [footerPhone, setFooterPhone] = useState('')
  const [footerAddress, setFooterAddress] = useState('')
  const [socialLinks, setSocialLinks] = useState([])
  const [logoUrl, setLogoUrl] = useState('')

  const tabs = ['Hero', 'إعدادات الهيرو', 'المميزات', 'كيف يعمل', 'آراء العملاء', 'من نحن', 'صفحة عننا', 'فيديو تعريفي', 'الشعار', 'Footer']

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-landing'],
    queryFn: () => api.get('/admin/landing').then(r => r.data),
  })

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!data) return
    if (data.hero) {
      setHeroTitle(data.hero.title)
      setHeroDesc(data.hero.description)
      setCtaText(data.hero.ctaText)
      setSecondaryText(data.hero.secondaryText)
      setBadges(data.hero.badges)
    }
    if (data.heroSettings) {
      setHeroImage(data.heroSettings.imageUrl || '')
      setGradientFrom(data.heroSettings.gradientFrom || 'from-brand-500/20')
      setGradientTo(data.heroSettings.gradientTo || 'to-accent-500/20')
      setAnimation(data.heroSettings.animation || 'float')
    }
    if (data.about) {
      setAboutTitle(data.about.title || 'نبذة عن Templyn')
      setAboutDesc(data.about.description || '')
      setAboutStats(data.about.stats || [])
    }
    if (data.aboutPage) {
      setAboutPageTitle(data.aboutPage.title || 'عن Templyn')
      setAboutPageDesc(data.aboutPage.description || '')
      setAboutStory(data.aboutPage.story || '')
      setAboutPageImage(data.aboutPage.imageUrl || '')
    }
    if (data.demoVideo) {
      setDemoVideo(data.demoVideo.videoUrl || '')
      setDemoVideoTitle(data.demoVideo.title || '')
    }
    if (data.features) setFeatures(data.features)
    if (data.steps) setSteps(data.steps)
    if (data.testimonials) setTestimonials(data.testimonials)
    if (data.footer) {
      setFooterEmail(data.footer.email || '')
      setFooterPhone(data.footer.phone || '')
      setFooterAddress(data.footer.address || '')
      setSocialLinks(data.footer.socialLinks || [])
    }
    if (data.site) {
      setLogoUrl(data.site.logoUrl || '')
    }
  }, [data])
  /* eslint-enable react-hooks/set-state-in-effect */

  const saveMutation = useMutation({
    mutationFn: (payload) => api.put('/admin/landing', payload),
    onSuccess: () => { toast.success('تم حفظ التغييرات بنجاح') },
    onError: (err) => { toast.error(err.response?.data?.error || 'حدث خطأ أثناء الحفظ') },
  })

  const handleSave = () => {
    saveMutation.mutate({
      hero: { title: heroTitle, description: heroDesc, ctaText, secondaryText, badges },
      heroSettings: { imageUrl: heroImage, gradientFrom, gradientTo, animation },
      about: { title: aboutTitle, description: aboutDesc, stats: aboutStats },
      aboutPage: { title: aboutPageTitle, description: aboutPageDesc, story: aboutStory, imageUrl: aboutPageImage },
      demoVideo: { videoUrl: demoVideo, title: demoVideoTitle },
      features,
      steps,
      testimonials,
      footer: { email: footerEmail, phone: footerPhone, address: footerAddress, socialLinks },
    })
  }

  const addBadge = (e) => {
    if (e.key === 'Enter' && badgeInput.trim()) {
      setBadges([...badges, badgeInput.trim()])
      setBadgeInput('')
    }
  }

  const uploadFile = async (file) => {
    const form = new FormData()
    form.append('file', file)
    const res = await api.post('/admin/upload/media', form)
    return res.data.url
  }

  const handleHeroImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const url = await uploadFile(file)
      setHeroImage(url)
      toast.success('تم رفع الصورة')
    } catch {
      toast.error('فشل رفع الصورة')
    }
  }

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const url = await uploadFile(file)
      setDemoVideo(url)
      toast.success('تم رفع الفيديو')
    } catch {
      toast.error('فشل رفع الفيديو')
    }
  }

  const handleAboutImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const url = await uploadFile(file)
      setAboutPageImage(url)
      toast.success('تم رفع الصورة')
    } catch {
      toast.error('فشل رفع الصورة')
    }
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'Hero':
        return (
          <>
            <Input label="العنوان الرئيسي" value={heroTitle} onChange={e => setHeroTitle(e.target.value)} />
            <Textarea label="الوصف" rows={3} value={heroDesc} onChange={e => setHeroDesc(e.target.value)} />
            <Input label="نص زرار CTA" value={ctaText} onChange={e => setCtaText(e.target.value)} />
            <Input label="نص زرار ثانوي" value={secondaryText} onChange={e => setSecondaryText(e.target.value)} />
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Trust Badges</label>
              <Input placeholder="+ إضافة" value={badgeInput} onChange={e => setBadgeInput(e.target.value)} onKeyDown={addBadge} />
              <div className="flex flex-wrap gap-2 mt-2">
                {badges.map(b => (
                  <Badge key={b} variant="subtle">
                    {b}
                    <button onClick={() => setBadges(badges.filter(x => x !== b))} className="mr-1 text-gray-400 hover:text-red-500">&times;</button>
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )

      case 'إعدادات الهيرو':
        return (
          <>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">صورة الهيرو</label>
              <div className="flex items-center gap-4">
                {heroImage && (
                  <img src={heroImage} alt="" className="w-24 h-24 rounded-xl object-cover border" />
                )}
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 text-sm text-gray-600">
                  <Upload className="w-4 h-4" />
                  اختر صورة
                  <input type="file" accept="image/*" className="hidden" onChange={handleHeroImageUpload} />
                </label>
                {heroImage && (
                  <button onClick={() => setHeroImage('')} className="text-sm text-red-500 hover:underline">إزالة</button>
                )}
              </div>
            </div>
            <Input label="لون التدرج (من)" value={gradientFrom} onChange={e => setGradientFrom(e.target.value)} placeholder="from-brand-500/20" />
            <Input label="لون التدرج (إلى)" value={gradientTo} onChange={e => setGradientTo(e.target.value)} placeholder="to-accent-500/20" />
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">الأنيميشن</label>
              <select value={animation} onChange={e => setAnimation(e.target.value)} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm">
                <option value="float">عائم (Float)</option>
                <option value="fade">تلاشي (Fade)</option>
                <option value="slide">انزلاق (Slide)</option>
                <option value="pulse">نبض (Pulse)</option>
                <option value="none">بدون</option>
              </select>
            </div>
          </>
        )

      case 'المميزات':
        return (
          <div className="space-y-4">
            {features.map((f, i) => (
              <div key={i} className="border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">ميزة {i + 1}</span>
                  {features.length > 1 && (
                    <button onClick={() => setFeatures(features.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <Input label="العنوان" value={f.title} onChange={e => {
                  const copy = [...features]; copy[i] = { ...copy[i], title: e.target.value }; setFeatures(copy)
                }} />
                <Textarea label="الوصف" rows={2} value={f.description} onChange={e => {
                  const copy = [...features]; copy[i] = { ...copy[i], description: e.target.value }; setFeatures(copy)
                }} />
                <Input label="الأيقونة" value={f.icon} onChange={e => {
                  const copy = [...features]; copy[i] = { ...copy[i], icon: e.target.value }; setFeatures(copy)
                }} />
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={() => setFeatures([...features, { title: '', description: '', icon: '' }])}>
              <Plus className="w-4 h-4" /> إضافة ميزة
            </Button>
          </div>
        )

      case 'كيف يعمل':
        return (
          <div className="space-y-4">
            {steps.map((s, i) => (
              <div key={i} className="border rounded-xl p-4 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">الخطوة {i + 1}</span>
                  <button onClick={() => setSteps(steps.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <Input label="العنوان" value={s.title} onChange={e => {
                  const copy = [...steps]; copy[i] = { ...copy[i], title: e.target.value }; setSteps(copy)
                }} />
                <Textarea label="الوصف" rows={2} value={s.description} onChange={e => {
                  const copy = [...steps]; copy[i] = { ...copy[i], description: e.target.value }; setSteps(copy)
                }} />
              </div>
            ))}
            {steps.length < 8 && (
              <Button variant="secondary" size="sm" onClick={() => setSteps([...steps, { title: '', description: '' }])}>
                <Plus className="w-4 h-4" /> إضافة خطوة
              </Button>
            )}
          </div>
        )

      case 'آراء العملاء':
        return (
          <div className="space-y-4">
            {testimonials.map((t, i) => (
              <div key={i} className="border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">رأي {i + 1}</span>
                  <button onClick={() => setTestimonials(testimonials.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <Input label="الاسم" value={t.name} onChange={e => {
                  const copy = [...testimonials]; copy[i] = { ...copy[i], name: e.target.value }; setTestimonials(copy)
                }} />
                <Textarea label="النص" rows={2} value={t.text} onChange={e => {
                  const copy = [...testimonials]; copy[i] = { ...copy[i], text: e.target.value }; setTestimonials(copy)
                }} />
                <Input label="التقييم (1-5)" type="number" min="1" max="5" value={t.rating} onChange={e => {
                  const copy = [...testimonials]; copy[i] = { ...copy[i], rating: parseInt(e.target.value) || 1 }; setTestimonials(copy)
                }} />
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={() => setTestimonials([...testimonials, { name: '', text: '', rating: 5 }])}>
              <Plus className="w-4 h-4" /> إضافة رأي
            </Button>
          </div>
        )

      case 'من نحن':
        return (
          <>
            <Input label="العنوان" value={aboutTitle} onChange={e => setAboutTitle(e.target.value)} />
            <Textarea label="الوصف" rows={3} value={aboutDesc} onChange={e => setAboutDesc(e.target.value)} />
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 block">الإحصائيات</label>
              {aboutStats.map((s, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input placeholder="الرقم (مثال: 500+)" value={s.num} onChange={e => {
                    const copy = [...aboutStats]; copy[i] = { ...copy[i], num: e.target.value }; setAboutStats(copy)
                  }} />
                  <Input placeholder="العنوان" value={s.label} onChange={e => {
                    const copy = [...aboutStats]; copy[i] = { ...copy[i], label: e.target.value }; setAboutStats(copy)
                  }} />
                  <button onClick={() => setAboutStats(aboutStats.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <Button variant="secondary" size="sm" onClick={() => setAboutStats([...aboutStats, { num: '', label: '' }])}>
                <Plus className="w-4 h-4" /> إضافة إحصائية
              </Button>
            </div>
          </>
        )

      case 'صفحة عننا':
        return (
          <>
            <Input label="عنوان الصفحة" value={aboutPageTitle} onChange={e => setAboutPageTitle(e.target.value)} />
            <Textarea label="الوصف" rows={3} value={aboutPageDesc} onChange={e => setAboutPageDesc(e.target.value)} />
            <Textarea label="القصة" rows={5} value={aboutStory} onChange={e => setAboutStory(e.target.value)} />
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">صورة الصفحة</label>
              <div className="flex items-center gap-4">
                {aboutPageImage && (
                  <img src={aboutPageImage} alt="" className="w-24 h-24 rounded-xl object-cover border" />
                )}
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 text-sm text-gray-600">
                  <Upload className="w-4 h-4" />
                  اختر صورة
                  <input type="file" accept="image/*" className="hidden" onChange={handleAboutImageUpload} />
                </label>
                {aboutPageImage && (
                  <button onClick={() => setAboutPageImage('')} className="text-sm text-red-500 hover:underline">إزالة</button>
                )}
              </div>
            </div>
          </>
        )

      case 'فيديو تعريفي':
        return (
          <>
            <Input label="عنوان الفيديو" value={demoVideoTitle} onChange={e => setDemoVideoTitle(e.target.value)} />
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">ملف الفيديو</label>
              <div className="flex items-center gap-4">
                {demoVideo && (
                  <video src={demoVideo} className="w-40 h-24 rounded-xl object-cover border" controls />
                )}
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 text-sm text-gray-600">
                  <Upload className="w-4 h-4" />
                  {demoVideo ? 'تغيير الفيديو' : 'رفع فيديو'}
                  <input type="file" accept="video/mp4,video/webm" className="hidden" onChange={handleVideoUpload} />
                </label>
                {demoVideo && (
                  <button onClick={() => setDemoVideo('')} className="text-sm text-red-500 hover:underline">إزالة</button>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">mp4, webm - حد أقصى 50MB</p>
            </div>
          </>
        )

      case 'Footer':
        return (
          <>
            <Input label="البريد الإلكتروني" value={footerEmail} onChange={e => setFooterEmail(e.target.value)} />
            <Input label="رقم الهاتف" value={footerPhone} onChange={e => setFooterPhone(e.target.value)} />
            <Textarea label="العنوان" rows={2} value={footerAddress} onChange={e => setFooterAddress(e.target.value)} />
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 block">روابط التواصل</label>
              {socialLinks.map((link, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input placeholder="المنصة" value={link.platform} onChange={e => {
                    const copy = [...socialLinks]; copy[i] = { ...copy[i], platform: e.target.value }; setSocialLinks(copy)
                  }} />
                  <Input placeholder="الرابط" value={link.url} onChange={e => {
                    const copy = [...socialLinks]; copy[i] = { ...copy[i], url: e.target.value }; setSocialLinks(copy)
                  }} />
                  <button onClick={() => setSocialLinks(socialLinks.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <Button variant="secondary" size="sm" onClick={() => setSocialLinks([...socialLinks, { platform: '', url: '' }])}>
                <Plus className="w-4 h-4" /> إضافة رابط
              </Button>
            </div>
          </>
        )

      case 'الشعار':
        return (
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">شعار الموقع</label>
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-16 w-auto rounded-xl border p-2" />
              ) : (
                <div className="h-16 w-36 rounded-xl border border-dashed flex items-center justify-center text-sm text-gray-400">
                  لا يوجد شعار
                </div>
              )}
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 text-sm text-gray-600">
                <Upload className="w-4 h-4" />
                {logoUrl ? 'تغيير الشعار' : 'رفع شعار'}
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    const form = new FormData()
                    form.append('file', file)
                    const uploadRes = await api.post('/admin/upload/media', form)
                    await api.put('/admin/site', { logoUrl: uploadRes.data.url })
                    setLogoUrl(uploadRes.data.url)
                    toast.success('تم حفظ الشعار')
                  } catch {
                    toast.error('فشل رفع الشعار')
                  }
                }} />
              </label>
              {logoUrl && (
                <button onClick={async () => {
                  try {
                    await api.put('/admin/site', { logoUrl: '' })
                    setLogoUrl('')
                    toast.success('تم إزالة الشعار')
                  } catch {
                    toast.error('فشل إزالة الشعار')
                  }
                }} className="text-sm text-red-500 hover:underline">إزالة</button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">jpg, png, webp — يفضل شعار بخلفية شفافة</p>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div>
      <PageHeader title="تعديل Landing Page" action={<Button onClick={handleSave} loading={saveMutation.isPending}>حفظ التغييرات</Button>} />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 animate-spin text-brand-500" />
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-medium">حدث خطأ أثناء تحميل بيانات الصفحة</p>
        </div>
      ) : (
        <>
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab ? 'bg-brand-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 max-w-2xl">
            {renderTab()}
          </div>
        </>
      )}
    </div>
  )
}
