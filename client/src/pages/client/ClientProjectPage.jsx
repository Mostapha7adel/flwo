import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ArrowRight, Eye, Rocket, Upload, Save, Download, RefreshCw, AlertTriangle } from 'lucide-react'
import { api } from '../../lib/axios'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { Tabs } from '../../components/ui/Tabs'
import { PageHeader } from '../../components/shared/PageHeader'
import { Spinner } from '../../components/ui/Spinner'
import { Badge } from '../../components/ui/Badge'

const TABS = [
  { key: 'brand', label: 'العلامة التجارية' },
  { key: 'theme', label: 'السمات' },
  { key: 'content', label: 'المحتوى' },
  { key: 'seo', label: 'تحسين محركات البحث' },
]

function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          className={`text-2xl transition-colors ${star <= value ? 'text-yellow-400' : 'text-gray-200'} ${onChange ? 'hover:text-yellow-400' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export default function ClientProjectPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('brand')

  const [config, setConfig] = useState({
    logo: '',
    favicon: '',
    siteName: '',
    primaryColor: '#2563eb',
    secondaryColor: '#1e293b',
    backgroundColor: '#ffffff',
    typography: 'Inter',
    email: '',
    phone: '',
    address: '',
    facebook: '',
    twitter: '',
    instagram: '',
    linkedin: '',
    footerText: '',
    metaTitle: '',
    metaDescription: '',
    keywords: '',
    ogImage: '',
  })

  const [projectId, setProjectId] = useState(null)
  const [sourceDownloading, setSourceDownloading] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [livePreviewUrl, setLivePreviewUrl] = useState(null)

  const { data: orderData, isLoading: orderLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => api.get(`/orders/${orderId}`).then(r => r.data),
    enabled: !!orderId,
  })

  const { data: projectData, isLoading: projectLoading, refetch: refetchProject } = useQuery({
    queryKey: ['project', orderId],
    queryFn: () => api.get(`/orders/${orderId}/project`).then(r => r.data),
    enabled: !!orderId,
  })

  const { data: fieldsData } = useQuery({
    queryKey: ['template-fields', orderData?.template?.id],
    queryFn: () => api.get(`/templates/${orderData.template.id}/fields`).then(r => r.data),
    enabled: !!orderData?.template?.id,
  })

  const templateFields = fieldsData?.data ?? fieldsData ?? []

  useEffect(() => {
    if (projectData?.id) {
      setProjectId(projectData.id)
    }
    if (projectData?.config) {
      setConfig(prev => ({ ...prev, ...projectData.config }))
    }
    if (projectData?.publishedUrl) {
      setLivePreviewUrl(projectData.publishedUrl)
    }
  }, [projectData])

  useEffect(() => {
    const projectVersion = projectData?.currentVersion
    const latestVersion = projectData?.template?.versions?.[0]?.version
    if (projectVersion && latestVersion) {
      setUpdateAvailable(projectVersion !== latestVersion)
    }
  }, [projectData])

  const handleSourceDownload = async () => {
    setSourceDownloading(true)
    try {
      const { data } = await api.get(`/orders/${orderId}/project/source`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `project-${projectId}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success('تم تحميل الكود المصدري')
    } catch {
      toast.error('فشل تحميل الكود المصدري')
    } finally {
      setSourceDownloading(false)
    }
  }

  const handleApplyUpdate = () => {
    updateMutation.mutate()
  }

  const createMutation = useMutation({
    mutationFn: () => api.post(`/orders/${orderId}/project`),
    onSuccess: (data) => {
      setProjectId(data.id || data?.data?.id)
      toast.success('تم إنشاء المشروع')
      refetchProject()
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'فشل إنشاء المشروع'),
  })

  const saveMutation = useMutation({
    mutationFn: (payload) => api.put(`/orders/${orderId}/project/config`, { config: payload }),
    onSuccess: () => {
      toast.success('تم حفظ التغييرات')
      refetchProject()
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'فشل حفظ التغييرات'),
  })

  const updateMutation = useMutation({
    mutationFn: () => api.post(`/orders/${orderId}/project/apply-update`),
    onSuccess: () => {
      toast.success('تم تطبيق التحديث بنجاح')
      setUpdateAvailable(false)
      refetchProject()
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'فشل تطبيق التحديث'),
  })

  const handleSave = () => {
    saveMutation.mutate(config)
  }

  const handleImageUpload = async (field) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = e.target.files?.[0]
      if (!file) return
      const form = new FormData()
      form.append('file', file)
      try {
        const { data } = await api.post('/upload/media', form)
        setConfig(prev => ({ ...prev, [field]: data.url }))
        toast.success('تم رفع الصورة')
      } catch {
        toast.error('فشل رفع الصورة')
      }
    }
    input.click()
  }

  const renderField = (field) => {
    const { key, label, type, required, defaultValue, options } = field
    const value = config[key] ?? defaultValue ?? ''

    switch (type) {
      case 'color':
        return (
          <div key={key}>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">{label}</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={value}
                onChange={(e) => setConfig(prev => ({ ...prev, [key]: e.target.value }))}
                className="w-10 h-10 rounded-xl border border-gray-300 cursor-pointer"
              />
              <Input
                dir="ltr"
                value={value}
                onChange={(e) => setConfig(prev => ({ ...prev, [key]: e.target.value }))}
              />
            </div>
          </div>
        )
      case 'image':
        return (
          <div key={key}>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">{label}</label>
            <div className="flex items-center gap-4">
              {value && (
                <img src={value} alt="" className="w-20 h-20 rounded-xl object-cover border" />
              )}
              <Button variant="secondary" type="button" onClick={() => handleImageUpload(key)}>
                <Upload className="w-4 h-4" /> {value ? 'تغيير' : 'رفع'}
              </Button>
              {value && (
                <button onClick={() => setConfig(prev => ({ ...prev, [key]: '' }))} className="text-sm text-red-500 hover:underline">إزالة</button>
              )}
            </div>
          </div>
        )
      case 'boolean':
        return (
          <div key={key}>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={!!value}
                onChange={(e) => setConfig(prev => ({ ...prev, [key]: e.target.checked }))}
                className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              {label}
            </label>
          </div>
        )
      case 'select':
        return (
          <Select
            key={key}
            label={label}
            value={value}
            onChange={(e) => setConfig(prev => ({ ...prev, [key]: e.target.value }))}
            options={(options || []).map(o => ({ value: o, label: o }))}
            required={required}
          />
        )
      default:
        return (
          <Input
            key={key}
            label={label}
            value={value}
            onChange={(e) => setConfig(prev => ({ ...prev, [key]: e.target.value }))}
            required={required}
          />
        )
    }
  }

  const isLoading = orderLoading || projectLoading

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!orderData) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">الطلب غير موجود</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/dashboard/orders')}>العودة للطلبات</Button>
      </div>
    )
  }

  return (
    <div>
      <button onClick={() => navigate(`/dashboard/orders/${orderId}`)} className="flex items-center gap-2 text-gray-500 hover:text-brand-600 mb-4 transition-colors">
        <ArrowRight className="w-4 h-4" />
        رجوع
      </button>

      <PageHeader
        title={`تخصيص ${orderData.template?.title || 'القالب'}`}
        description={!projectId ? 'المشروع غير منشأ بعد' : undefined}
        action={
          <div className="flex gap-2">
            {!projectId ? (
              <Button variant="secondary" onClick={() => createMutation.mutate()} loading={createMutation.isPending}>
                إنشاء المشروع
              </Button>
            ) : (
              <>
                <Button variant="secondary" onClick={handleSave} loading={saveMutation.isPending}>
                  <Save className="w-4 h-4" /> حفظ
                </Button>
                <Button variant="secondary" onClick={handleSourceDownload} loading={sourceDownloading}>
                  <Download className="w-4 h-4" /> المصدر
                </Button>
                <Button variant="outline" onClick={() => window.open(livePreviewUrl || `/preview/${projectId}`, '_blank')}>
                  <Eye className="w-4 h-4" /> معاينة
                </Button>
                <Button variant="primary" onClick={() => navigate(`/dashboard/orders/${orderId}/deploy`)}>
                  <Rocket className="w-4 h-4" /> نشر
                </Button>
              </>
            )}
          </div>
        }
      />

      {updateAvailable && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-amber-800 text-sm">يتوفر تحديث للقالب</p>
            <p className="text-xs text-amber-600">يمكنك تطبيق آخر التحديثات على مشروعك</p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleApplyUpdate}>
            <RefreshCw className="w-4 h-4" /> تطبيق التحديث
          </Button>
        </div>
      )}

      {!projectId ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <p className="text-gray-500 mb-4">لم يتم إنشاء المشروع بعد. اضغط على "إنشاء المشروع" للبدء.</p>
        </div>
      ) : (
        <>
          <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 max-w-2xl">
            {activeTab === 'brand' && (
              <>
                <h3 className="font-bold text-gray-900 mb-3">العلامة التجارية</h3>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">الشعار</label>
                  <div className="flex items-center gap-4">
                    {config.logo ? (
                      <img src={config.logo} alt="" className="h-16 w-auto rounded-xl border p-2" />
                    ) : (
                      <div className="h-16 w-36 rounded-xl border border-dashed flex items-center justify-center text-sm text-gray-400">لا يوجد شعار</div>
                    )}
                    <Button variant="secondary" type="button" onClick={() => handleImageUpload('logo')}>
                      <Upload className="w-4 h-4" /> {config.logo ? 'تغيير' : 'رفع'}
                    </Button>
                    {config.logo && (
                      <button onClick={() => setConfig(prev => ({ ...prev, logo: '' }))} className="text-sm text-red-500 hover:underline">إزالة</button>
                    )}
                  </div>
                </div>
                <Input label="اسم الشركة" value={config.siteName} onChange={(e) => setConfig(prev => ({ ...prev, siteName: e.target.value }))} />
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">الفافيكون</label>
                  <div className="flex items-center gap-4">
                    {config.favicon && (
                      <img src={config.favicon} alt="" className="w-10 h-10 rounded-lg border" />
                    )}
                    <Button variant="secondary" type="button" onClick={() => handleImageUpload('favicon')}>
                      <Upload className="w-4 h-4" /> {config.favicon ? 'تغيير' : 'رفع'}
                    </Button>
                  </div>
                </div>
                {templateFields.filter(f => !['logo', 'siteName', 'favicon'].includes(f.key)).map(renderField)}
              </>
            )}

            {activeTab === 'theme' && (
              <>
                <h3 className="font-bold text-gray-900 mb-3">السمات</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">اللون الأساسي</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={config.primaryColor} onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))} className="w-10 h-10 rounded-xl border border-gray-300 cursor-pointer" />
                      <Input dir="ltr" value={config.primaryColor} onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">اللون الثانوي</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={config.secondaryColor} onChange={(e) => setConfig(prev => ({ ...prev, secondaryColor: e.target.value }))} className="w-10 h-10 rounded-xl border border-gray-300 cursor-pointer" />
                      <Input dir="ltr" value={config.secondaryColor} onChange={(e) => setConfig(prev => ({ ...prev, secondaryColor: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">لون الخلفية</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={config.backgroundColor} onChange={(e) => setConfig(prev => ({ ...prev, backgroundColor: e.target.value }))} className="w-10 h-10 rounded-xl border border-gray-300 cursor-pointer" />
                      <Input dir="ltr" value={config.backgroundColor} onChange={(e) => setConfig(prev => ({ ...prev, backgroundColor: e.target.value }))} />
                    </div>
                  </div>
                  <Select
                    label="نوع الخط"
                    value={config.typography}
                    onChange={(e) => setConfig(prev => ({ ...prev, typography: e.target.value }))}
                    options={[
                      { value: 'Inter', label: 'Inter' },
                      { value: 'Cairo', label: 'Cairo' },
                      { value: 'Noto Sans Arabic', label: 'Noto Sans Arabic' },
                      { value: 'Tajawal', label: 'Tajawal' },
                      { value: 'Almarai', label: 'Almarai' },
                    ]}
                  />
                </div>
              </>
            )}

            {activeTab === 'content' && (
              <>
                <h3 className="font-bold text-gray-900 mb-3">المحتوى</h3>
                <Input label="البريد الإلكتروني" type="email" dir="ltr" value={config.email} onChange={(e) => setConfig(prev => ({ ...prev, email: e.target.value }))} />
                <Input label="رقم الهاتف" dir="ltr" value={config.phone} onChange={(e) => setConfig(prev => ({ ...prev, phone: e.target.value }))} />
                <Textarea label="العنوان" rows={2} value={config.address} onChange={(e) => setConfig(prev => ({ ...prev, address: e.target.value }))} />
                <h4 className="font-semibold text-gray-700 text-sm mt-4 mb-2">روابط التواصل الاجتماعي</h4>
                <Input label="Facebook" dir="ltr" value={config.facebook} onChange={(e) => setConfig(prev => ({ ...prev, facebook: e.target.value }))} />
                <Input label="Twitter / X" dir="ltr" value={config.twitter} onChange={(e) => setConfig(prev => ({ ...prev, twitter: e.target.value }))} />
                <Input label="Instagram" dir="ltr" value={config.instagram} onChange={(e) => setConfig(prev => ({ ...prev, instagram: e.target.value }))} />
                <Input label="LinkedIn" dir="ltr" value={config.linkedin} onChange={(e) => setConfig(prev => ({ ...prev, linkedin: e.target.value }))} />
                <Textarea label="نص التذييل" rows={2} value={config.footerText} onChange={(e) => setConfig(prev => ({ ...prev, footerText: e.target.value }))} />
              </>
            )}

            {activeTab === 'seo' && (
              <>
                <h3 className="font-bold text-gray-900 mb-3">تحسين محركات البحث</h3>
                <Input label="عنوان الميتا (Meta Title)" value={config.metaTitle} onChange={(e) => setConfig(prev => ({ ...prev, metaTitle: e.target.value }))} />
                <Textarea label="وصف الميتا (Meta Description)" rows={3} value={config.metaDescription} onChange={(e) => setConfig(prev => ({ ...prev, metaDescription: e.target.value }))} />
                <Textarea label="الكلمات المفتاحية (Keywords)" rows={2} hint="مفصولة بفواصل" value={config.keywords} onChange={(e) => setConfig(prev => ({ ...prev, keywords: e.target.value }))} />
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">صورة OG</label>
                  <div className="flex items-center gap-4">
                    {config.ogImage && (
                      <img src={config.ogImage} alt="" className="w-24 h-16 rounded-xl object-cover border" />
                    )}
                    <Button variant="secondary" type="button" onClick={() => handleImageUpload('ogImage')}>
                      <Upload className="w-4 h-4" /> {config.ogImage ? 'تغيير' : 'رفع'}
                    </Button>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={handleSave} loading={saveMutation.isPending}>
                <Save className="w-4 h-4" /> حفظ التغييرات
              </Button>
            </div>
          </div>

          {livePreviewUrl && (
            <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Eye className="w-5 h-5 text-brand-500" /> المعاينة المباشرة
              </h3>
              <div className="rounded-xl overflow-hidden border border-gray-200">
                <iframe
                  src={livePreviewUrl}
                  title="Live preview"
                  className="w-full h-[600px]"
                  sandbox="allow-scripts allow-same-origin allow-forms"
                  loading="lazy"
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
