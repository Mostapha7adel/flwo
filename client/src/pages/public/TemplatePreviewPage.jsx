import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowRight, CheckCircle, Monitor, Smartphone, Loader2, ExternalLink, Star, User } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Textarea } from '../../components/ui/Textarea'
import { Spinner } from '../../components/ui/Spinner'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../lib/axios'
import { formatDate } from '../../utils/formatDate'

export default function TemplatePreviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [view, setView] = useState('desktop')
  const [showLive, setShowLive] = useState(false)

  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')

  const { data: template, isLoading, isError } = useQuery({
    queryKey: ['template-preview', id],
    queryFn: () => api.get(`/templates/${id}/preview`).then(res => res.data),
    enabled: !!id,
  })

  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['template-reviews', id],
    queryFn: () => api.get(`/templates/${id}/reviews`).then(r => r.data),
    enabled: !!id,
  })

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['template-reviews-stats', id],
    queryFn: () => api.get(`/templates/${id}/reviews/stats`).then(r => r.data),
    enabled: !!id,
  })

  const reviews = reviewsData?.reviews ?? reviewsData ?? []
  const stats = statsData?.data ?? statsData ?? {}
  const avgRating = stats.avgRating ?? 0
  const totalReviews = stats.totalReviews ?? 0
  const distribution = stats.distribution ?? {}

  const hasReviewed = Array.isArray(reviews) && user && reviews.some(r => r.userId === user.id || r.user?.id === user.id)

  const submitReviewMutation = useMutation({
    mutationFn: (payload) => api.post(`/templates/${id}/reviews`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-reviews', id] })
      queryClient.invalidateQueries({ queryKey: ['template-reviews-stats', id] })
      toast.success('تم إضافة تقييمك بنجاح')
      setReviewRating(0)
      setReviewComment('')
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'فشل إضافة التقييم'),
  })

  const handleSubmitReview = (e) => {
    e.preventDefault()
    if (reviewRating === 0) {
      toast.error('يرجى اختيار التقييم')
      return
    }
    submitReviewMutation.mutate({ rating: reviewRating, comment: reviewComment.trim() || undefined })
  }

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

        {/* Reviews Section */}
        <div className="mt-16 border-t border-gray-200 pt-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">التقييمات</h2>

          {statsLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8 mb-8">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                <p className="text-5xl font-bold text-gray-900 mb-2">{Number(avgRating).toFixed(1)}</p>
                <div className="flex justify-center gap-0.5 mb-2">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={`w-5 h-5 ${s <= Math.round(avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                  ))}
                </div>
                <p className="text-sm text-gray-500">{totalReviews} تقييم</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:col-span-2">
                <h3 className="font-bold text-gray-900 mb-4">توزيع التقييمات</h3>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map(s => {
                    const count = distribution[s] ?? 0
                    const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0
                    return (
                      <div key={s} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 w-12">{s} نجوم</span>
                        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-sm text-gray-500 w-8 text-left">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {user && !hasReviewed && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8 max-w-xl">
              <h3 className="font-bold text-gray-900 mb-4">أضف تقييمك</h3>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">تقييمك</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button key={s} type="button" onClick={() => setReviewRating(s)} className="transition-colors">
                        <Star className={`w-7 h-7 ${s <= reviewRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 hover:text-yellow-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <Textarea label="التعليق" rows={3} placeholder="اكتب رأيك في القالب..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} />
                <Button type="submit" loading={submitReviewMutation.isPending}>إرسال التقييم</Button>
              </form>
            </div>
          )}

          {user && hasReviewed && (
            <div className="bg-gray-50 rounded-2xl p-4 mb-8 max-w-xl">
              <p className="text-sm text-gray-600">لقد قيمت هذا القالب ✓</p>
            </div>
          )}

          {reviewsLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">لا توجد تقييمات بعد. كن أول من يقيم!</div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review, i) => (
                <div key={review.id || i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                      {review.user?.avatar ? (
                        <img src={review.user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-brand-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-900 text-sm">{review.user?.name || 'مستخدم'}</p>
                        <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
                      </div>
                      <div className="flex gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`w-4 h-4 ${s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  {review.comment && <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
