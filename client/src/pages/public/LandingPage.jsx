import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, ArrowLeft, Play, CheckCircle, Palette, Zap, Shield, MessageCircle, Smartphone, Infinity as InfinityIcon, Star, Loader, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button'
import { api } from '../../lib/axios'

const ICON_MAP = { Palette, Zap, Shield, MessageCircle, Smartphone, Infinity: InfinityIcon, Sparkles, Star }

function VideoModal({ videoUrl, title, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-3xl mx-4 bg-black rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40 transition">
          <X className="w-5 h-5 text-white" />
        </button>
        {videoUrl ? (
          <video src={videoUrl} className="w-full aspect-video" controls autoPlay />
        ) : (
          <div className="w-full aspect-video flex items-center justify-center text-gray-400">
            {title || 'لا يوجد فيديو'}
          </div>
        )}
      </div>
    </div>
  )
}

function HeroSection({ content }) {
  const [videoOpen, setVideoOpen] = useState(false)
  const navigate = useNavigate()

  const hero = content?.hero || {}
  const heroSettings = content?.heroSettings || {}
  const demoVideo = content?.demoVideo || {}

  const title = hero.title || 'قوالب جاهزة تُطلقك في دقائق لا أيام'
  const description = hero.description || 'اكتشف مئات القوالب الاحترافية، خصصها بلمسة واحدة واحصل على موقعك الجاهز في أسرع وقت.'
  const cta = hero.ctaText || 'استعرض القوالب'
  const secondary = hero.secondaryText || 'شاهد كيف يعمل'
  const badges = hero.badges || ['100+ قالب', 'تخصيص كامل', 'دعم فوري']

  const imageUrl = heroSettings.imageUrl || ''
  const gradFrom = heroSettings.gradientFrom || 'from-brand-500/20'
  const gradTo = heroSettings.gradientTo || 'to-accent-500/20'
  const animClass = heroSettings.animation === 'none' ? '' : `animate-${heroSettings.animation || 'float'}`

  const hasVideo = !!demoVideo.videoUrl

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      <div className="absolute top-20 right-10 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 left-10 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

      <div className={`container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center ${animClass || 'animate-slide-up'}`}>
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 px-4 py-2 rounded-full text-sm font-semibold border border-brand-100">
            <Sparkles className="w-4 h-4" />
            منصة تصميم احترافية
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
            {title}
          </h1>

          <p className="text-lg text-gray-500 leading-relaxed max-w-lg">
            {description}
          </p>

          <div className="flex flex-wrap gap-4">
            <Button size="lg" onClick={() => navigate('/templates')}>
              {cta}
              <ArrowLeft className="w-5 h-5" />
            </Button>
            {hasVideo && (
              <Button variant="secondary" size="lg" onClick={() => setVideoOpen(true)}>
                <Play className="w-5 h-5 fill-current" />
                {secondary}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-500">
            {badges.map(badge => (
              <span key={badge} className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-500" />
                {badge}
              </span>
            ))}
          </div>
        </div>

        <div className="relative hidden md:block">
          <div className="relative w-full aspect-square">
            <div className={`absolute inset-0 bg-gradient-to-br ${gradFrom} ${gradTo} rounded-3xl`} />
            {imageUrl ? (
              <img src={imageUrl} alt="" loading="lazy" className="relative w-full h-full object-cover rounded-3xl" />
            ) : (
              <>
                <div className="absolute top-10 right-10 w-64 h-48 bg-white rounded-2xl shadow-2xl p-4">
                  <div className="w-full h-3 bg-gray-200 rounded mb-3" />
                  <div className="w-3/4 h-3 bg-gray-200 rounded mb-3" />
                  <div className="flex gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-500" />
                    <div className="w-8 h-8 rounded-lg bg-accent-500" />
                    <div className="w-8 h-8 rounded-lg bg-yellow-500" />
                  </div>
                  <div className="w-full h-20 bg-gray-100 rounded-lg" />
                </div>
                <div className="absolute bottom-10 left-10 w-48 h-36 bg-white rounded-2xl shadow-2xl p-4">
                  <div className="flex gap-2 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200" />
                    <div>
                      <div className="w-16 h-3 bg-gray-200 rounded mb-1" />
                      <div className="w-12 h-2 bg-gray-100 rounded" />
                    </div>
                  </div>
                  <div className="w-full h-16 bg-gradient-to-r from-brand-500 to-accent-500 rounded-lg" />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {videoOpen && <VideoModal videoUrl={demoVideo.videoUrl} title={demoVideo.title} onClose={() => setVideoOpen(false)} />}
    </section>
  )
}

function TemplatesPreviewSection() {
  const navigate = useNavigate()

  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['templates-featured'],
    queryFn: () => api.get('/templates', { params: { limit: 3 } }).then(r => r.data),
  })

  const templates = templatesData?.templates || []

  return (
    <section className="py-20 bg-gray-50" id="templates">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">أحدث القوالب</h2>
          <p className="text-gray-500 mt-2">اختر من بين مئات القوالب الاحترافية</p>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-6 h-6 animate-spin text-brand-500" />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {templates.map(t => (
              <div key={t.id} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="h-48 bg-gradient-to-br from-brand-500/20 to-accent-500/20 flex items-center justify-center">
                  {t.previewUrl ? (
                    <img src={t.previewUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-300 text-6xl font-bold">{t.title[0]}</span>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">{t.title}</h3>
                      <span className="text-xs text-gray-400">{t.category}</span>
                    </div>
                    <span className="text-lg font-bold text-brand-600">${t.price}</span>
                  </div>
                  <Button variant="outline" className="w-full mt-4" onClick={() => navigate(`/templates/${t.id}`)}>
                    عرض القالب
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="text-center mt-8">
          <Button variant="primary" size="lg" onClick={() => navigate('/templates')}>
            عرض كل القوالب
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  )
}

function AboutPreviewSection({ content }) {
  const navigate = useNavigate()
  const about = content?.about || {}
  const title = about.title || 'نبذة عن Templyn'
  const description = about.description || 'نحن منصة تصميم احترافية نساعدك على تحويل فكرتك إلى موقع إلكتروني متكامل في أسرع وقت.'
  const stats = about.stats || [
    { num: '500+', label: 'موقع منشور' },
    { num: '50+', label: 'قالب احترافي' },
    { num: '98%', label: 'عملاء سعداء' },
    { num: '24/7', label: 'دعم فني' },
  ]

  return (
    <section className="py-20">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
            <p className="text-gray-500 leading-relaxed mb-6">{description}</p>
            <Button variant="outline" onClick={() => navigate('/about')}>
              اعرف أكثر عنا
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {stats.map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-sm">
                <div className="text-3xl font-extrabold text-brand-600 mb-1">{s.num}</div>
                <p className="text-sm text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function HowItWorksSection({ content }) {
  const steps = (content?.steps || [
    { title: 'اختر قالبك', description: 'تصفح مكتبتنا الواسعة من القوالب الاحترافية واختر ما يناسبك' },
    { title: 'خصص ألوانه', description: 'غير الألوان، أعد ترتيب الأقسام، واجعل القالب يعبر عن هويتك' },
    { title: 'احصل على موقعك', description: 'نسلمك موقعك جاهزاً خلال 48 ساعة مع دعم فني مستمر' },
  ])

  return (
    <section className="py-20" id="how-it-works">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900">كيف يعمل</h2>
          <p className="text-gray-500 mt-2">ثلاث خطوات بسيطة لموقع احترافي</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 relative">
          {steps.map((step, i) => (
            <div key={i} className="text-center relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">{['١','٢','٣'][i] || i + 1}</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeaturesSection({ content }) {
  const features = (content?.features || [
    { icon: 'Palette', title: 'تخصيص بالسحب', description: 'اسحب وأفلت عناصر القالب لتغيير شكله' },
    { icon: 'Zap', title: 'تسليم سريع', description: 'نسلم خلال 48 ساعة من تأكيد الطلب' },
    { icon: 'Shield', title: 'أمان عالي', description: 'نستخدم أحدث معايير الأمان لحماية بياناتك' },
    { icon: 'MessageCircle', title: 'دعم فوري', description: 'فريق دعم متاح على مدار الساعة' },
    { icon: 'Smartphone', title: 'متجاوب 100%', description: 'جميع القوالب متجاوبة مع جميع الأجهزة' },
    { icon: 'Infinity', title: 'تحديثات مجانية', description: 'تحديثات وتحسينات مستمرة بدون رسوم إضافية' },
  ])

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">مميزاتنا</h2>
          <p className="text-gray-500 mt-2">كل ما تحتاجه لبناء موقع احترافي</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const IconComponent = ICON_MAP[f.icon] || Sparkles
            return (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mb-4">
                  <IconComponent className="w-6 h-6 text-brand-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function TestimonialsSection({ content }) {
  const testimonials = content?.testimonials || []

  if (testimonials.length === 0) return null

  return (
    <section className="py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">آراء العملاء</h2>
          <p className="text-gray-500 mt-2">ماذا يقول عملاؤنا عنا</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: t.rating || 5 }, (_, j) => (
                  <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
              <p className="font-semibold text-gray-900">{t.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function LandingPage() {
  const { data: content } = useQuery({
    queryKey: ['landing-content'],
    queryFn: () => api.get('/landing/content').then(r => r.data),
  })

  return (
    <>
      <HeroSection content={content} />
      <TemplatesPreviewSection />
      <AboutPreviewSection content={content} />
      <HowItWorksSection content={content} />
      <FeaturesSection content={content} />
      <TestimonialsSection content={content} />
    </>
  )
}
