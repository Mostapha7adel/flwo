import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, CheckCircle, Monitor, Smartphone, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../lib/axios'

export default function TemplatePreviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [view, setView] = useState('desktop')
  const [showLive, setShowLive] = useState(false)

  const { data: template, isLoading, isError } = useQuery({
    queryKey: ['template-preview', id],
    queryFn: () => api.get(`/templates/${id}/preview`).then(res => res.data),
    enabled: !!id,
  })

  const handlePurchase = () => {
    if (!user) return navigate(`/login?redirect=/customize/${id}`)
    navigate(`/customize/${id}`)
  }

  if (isLoading) {
    return (
      <div className="pt-20 pb-12">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !template) {
    return (
      <div className="pt-20 pb-12">
        <div className="container mx-auto px-6">
          <div className="text-center py-20">
            <p className="text-red-500">عفواً، القالب غير موجود</p>
            <Button variant="secondary" className="mt-4" onClick={() => navigate('/templates')}>
              رجوع للقوالب
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-20 pb-12">
      <div className="container mx-auto px-6">
        <button onClick={() => navigate('/templates')} className="flex items-center gap-2 text-gray-500 hover:text-brand-600 mb-6 transition-colors">
          <ArrowRight className="w-4 h-4" />
          رجوع للقوالب
        </button>

        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <div className="bg-gray-100 rounded-2xl overflow-hidden mb-4">
              {showLive && template.demoUrl ? (
                <div className={`${view === 'mobile' ? 'max-w-[375px] mx-auto' : ''}`}>
                  <iframe
                    src={template.demoUrl}
                    className="w-full h-96 border-0"
                    title="معاينة حية"
                    sandbox="allow-scripts allow-same-origin"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="h-96 bg-gradient-to-br from-brand-500/20 to-accent-500/20 flex items-center justify-center">
                  {template.previewUrl ? (
                    <img src={template.previewUrl} alt={template.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-gray-400">
                      <Monitor className="w-16 h-16 mx-auto mb-2" />
                      <span>معاينة القالب</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setView('desktop')} className={`p-2 rounded-lg border transition ${view === 'desktop' ? 'border-brand-500 bg-brand-50' : 'border-gray-200'}`}>
                <Monitor className="w-5 h-5" />
              </button>
              <button onClick={() => setView('mobile')} className={`p-2 rounded-lg border transition ${view === 'mobile' ? 'border-brand-500 bg-brand-50' : 'border-gray-200'}`}>
                <Smartphone className="w-5 h-5" />
              </button>
              {template.demoUrl && (
                <button
                  onClick={() => setShowLive(!showLive)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg border text-sm transition ${showLive ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                >
                  <ExternalLink className="w-4 h-4" />
                  {showLive ? 'إيقاف' : 'عرض حي'}
                </button>
              )}
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{template.title}</h1>
            <p className="text-sm text-gray-400 mb-4">{template.category}</p>
            <p className="text-gray-600 leading-relaxed mb-6">{template.description}</p>

            <div className="flex flex-wrap gap-2 mb-6">
              {template.tags?.map(tag => <Badge key={tag} variant="subtle">{tag}</Badge>)}
            </div>

            {template.defaultColors && (
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-600 mb-2">الألوان الافتراضية:</p>
                <div className="flex gap-3">
                  {[
                    { label: 'أساسي', key: 'primary' },
                    { label: 'ثانوي', key: 'secondary' },
                    { label: 'تمييز', key: 'accent' },
                    { label: 'نص', key: 'text' },
                  ].map(c => (
                    <div key={c.key} className="text-center">
                      <div
                        className="w-10 h-10 rounded-xl border-2 border-gray-200 shadow-sm"
                        style={{ backgroundColor: template.defaultColors[c.key] }}
                      />
                      <p className="text-xs text-gray-400 mt-1">{c.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-2xl p-6 mb-6">
              <p className="text-3xl font-bold text-brand-600 mb-4">${template.price}</p>
              <Button size="lg" className="w-full" onClick={handlePurchase}>
                اشتر وخصص الآن
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-3">
              {template.features?.map(f => (
                <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
