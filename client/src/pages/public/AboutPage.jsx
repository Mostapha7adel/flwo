import { useNavigate } from 'react-router-dom'
import { Palette, Zap, Shield, MessageCircle, Smartphone, Infinity as InfinityIcon, Sparkles } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useSiteSettings } from '../../hooks/useSiteSettings'

const ICON_MAP = { Palette, Zap, Shield, MessageCircle, Smartphone, Infinity: InfinityIcon, Sparkles, Star }

export default function AboutPage() {
  const navigate = useNavigate()
  const { data: content } = useSiteSettings()

  const aboutPage = content?.aboutPage || {}
  const about = content?.about || {}

  const pageTitle = aboutPage.title || 'عن Templyn'
  const pageDesc = aboutPage.description || 'منصة رائدة في مجال تصميم وتطوير القوالب الإلكترونية. نؤمن بأن كل فكرة تستحق موقعاً احترافياً، ونسعى لتوفير أقصر الطرق لتحويل أفكارك إلى مواقع جاهزة بكل سهولة.'
  const story = aboutPage.story
  const imageUrl = aboutPage.imageUrl
  const stats = about.stats || [
    { num: '500+', label: 'موقع منشور' },
    { num: '50+', label: 'قالب احترافي' },
  ]

  const features = (content?.features || [
    { icon: 'Palette', title: 'تخصيص كامل', description: 'اسحب وأفلت العناصر وغير الألوان لتحصل على تصميم فريد' },
    { icon: 'Zap', title: 'تسليم سريع', description: 'نسلم موقعك خلال 48 ساعة من تأكيد الطلب' },
    { icon: 'Shield', title: 'أمان واحترافية', description: 'أكواد نظيفة ومعايير أمان عالية لضمان جودة موقعك' },
    { icon: 'MessageCircle', title: 'دعم فني متواصل', description: 'فريق دعم متاح 24/7 لمساعدتك في أي استفسار' },
    { icon: 'Smartphone', title: 'متجاوب مع الكل', description: 'جميع قوالبنا متوافقة مع جميع الأجهزة والمتصفحات' },
    { icon: 'Infinity', title: 'تحديثات مجانية', description: 'تحديثات مستمرة وتحسينات بدون أي رسوم إضافية' },
  ])

  return (
    <div className="min-h-screen pt-24">
      <section className="py-16 bg-gradient-to-b from-brand-50/50 to-white">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">{pageTitle}</h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">{pageDesc}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-gray-900">قصتنا</h2>
              {story ? (
                story.split('\n').map((p, i) => (
                  <p key={i} className="text-gray-500 leading-relaxed">{p}</p>
                ))
              ) : (
                <>
                  <p className="text-gray-500 leading-relaxed">
                    بدأنا رحلتنا عندما لاحظنا أن أصحاب المشاريع والشركات الناشئة يواجهون صعوبة في الحصول
                    على مواقع إلكترونية احترافية بتكلفة معقولة. فكرنا في حل يجمع بين الجودة العالية والسرعة
                    في التسليم، وكانت Templyn هي النتيجة.
                  </p>
                  <p className="text-gray-500 leading-relaxed">
                    نقدم اليوم مئات القوالب الاحترافية القابلة للتخصيص بالكامل، مع فريق دعم فني متخصص
                    يساعدك في كل خطوة. تم تصميم أكثر من 500 موقع باستخدام منصتنا، ونفخر بثقة عملائنا بنا.
                  </p>
                </>
              )}
            </div>
            <div className="relative">
              {imageUrl ? (
                <img src={imageUrl} alt={pageTitle} className="w-full aspect-square rounded-3xl object-cover shadow-lg" />
              ) : (
                <div className="aspect-square rounded-3xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 flex items-center justify-center">
                  <div className="text-center p-8">
                    {stats.slice(0, 2).map((s, i) => (
                      <div key={i}>
                        <div className={`text-6xl font-bold ${i === 0 ? 'text-brand-600' : 'text-accent-600'} mb-2`}>{s.num}</div>
                        <p className="text-gray-500">{s.label}</p>
                        {i === 0 && <div className="my-6" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">لماذا Templyn؟</h2>
            <p className="text-gray-500 mt-2">نقدم لك كل ما تحتاجه لبناء موقع احترافي</p>
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

      <section className="py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">استعد لانطلاق موقعك</h2>
          <p className="text-gray-500 mb-8 max-w-lg mx-auto">
            اختر قالبك المفضل، خصصه كما تحب، واحصل على موقع احترافي في أسرع وقت
          </p>
          <Button size="lg" onClick={() => navigate('/templates')}>
            استعرض القوالب الآن
          </Button>
        </div>
      </section>
    </div>
  )
}
