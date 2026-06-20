import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Upload, Image, Plus, X, FileJson, FileArchive } from 'lucide-react'
import { api } from '../../lib/axios'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { ColorPicker } from '../../components/ui/ColorPicker'
import { Tabs } from '../../components/ui/Tabs'
import { PageHeader } from '../../components/shared/PageHeader'
import { Spinner } from '../../components/ui/Spinner'

const TABS = [
  { key: 'basic', label: 'المعلومات الأساسية' },
  { key: 'colors-sections', label: 'الألوان والأقسام' },
  { key: 'advanced', label: 'الإعدادات المتقدمة' },
  { key: 'publish', label: 'نشر وإصدارات' },
]

export default function AddTemplatePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const { data: editData, isLoading: editLoading, refetch: refetchTemplate } = useQuery({
    queryKey: ['admin-template', id],
    queryFn: () => api.get(`/admin/templates/${id}`).then(r => r.data),
    enabled: isEdit,
  })

  const [activeTab, setActiveTab] = useState('basic')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('')
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [demoUrl, setDemoUrl] = useState('')
  const [colors, setColors] = useState({ primary: '#2563EB', secondary: '#F8FAFC', accent: '#7C3AED', text: '#0F172A' })
  const [components, setComponents] = useState('')
  const [configSchema, setConfigSchema] = useState('')
  const [deploymentType, setDeploymentType] = useState('')
  const [deploymentScript, setDeploymentScript] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [gallery, setGallery] = useState([])
  const [videoUrl, setVideoUrl] = useState('')
  const [features, setFeatures] = useState('')
  const [manifestInfo, setManifestInfo] = useState(null)
  const [manifestUploading, setManifestUploading] = useState(false)
  const [sourceFileName, setSourceFileName] = useState('')
  const [sourceUploading, setSourceUploading] = useState(false)

  useEffect(() => {
    if (editData) {
      setTitle(editData.title || '')
      setDescription(editData.description || '')
      setCategory(editData.category || '')
      setPrice(editData.price != null ? String(editData.price) : '')
      setTags(editData.tags || [])
      setColors(editData.defaultColors || { primary: '#2563EB', secondary: '#F8FAFC', accent: '#7C3AED', text: '#0F172A' })
      setPreviewUrl(editData.previewUrl || '')
      setDemoUrl(editData.demoUrl || '')
      setComponents(editData.components ? JSON.stringify(editData.components, null, 2) : '')
      setConfigSchema(editData.configSchema ? JSON.stringify(editData.configSchema, null, 2) : '')
      setDeploymentType(editData.deploymentType || '')
      setDeploymentScript(editData.deploymentScript || '')
      setSourceUrl(editData.sourceUrl || '')
      setGallery(editData.gallery || [])
      setVideoUrl(editData.videoUrl || '')
      setFeatures(editData.features ? JSON.stringify(editData.features, null, 2) : '')
      if (editData.manifest) setManifestInfo(editData.manifest)
    }
  }, [editData])

  const addTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tag) => setTags(tags.filter(t => t !== tag))

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    try {
      const { data } = await api.post('/admin/upload/media', form)
      setPreviewUrl(data.url)
      toast.success('تم رفع الصورة')
    } catch {
      toast.error('فشل رفع الصورة')
    }
  }

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    for (const file of files) {
      const form = new FormData()
      form.append('file', file)
      try {
        const { data } = await api.post('/admin/upload/media', form)
        setGallery(prev => [...prev, data.url])
        toast.success('تم رفع الصورة')
      } catch {
        toast.error('فشل رفع الصورة')
      }
    }
  }

  const removeGalleryImage = (url) => setGallery(gallery.filter(u => u !== url))

  const handleManifestUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !id) return
    const form = new FormData()
    form.append('manifest', file)
    setManifestUploading(true)
    try {
      const { data } = await api.post(`/admin/templates/${id}/manifest`, form)
      setManifestInfo(data.manifest)
      if (data.templateType) setDeploymentType(data.deploymentType || deploymentType)
      toast.success(`تم رفع manifest.json — ${data.fieldsCount} حقل`)
      refetchTemplate()
    } catch {
      toast.error('فشل رفع manifest.json')
    } finally {
      setManifestUploading(false)
    }
  }

  const handleSourceUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !id) return
    const form = new FormData()
    form.append('source', file)
    setSourceUploading(true)
    try {
      await api.post(`/admin/templates/${id}/source`, form)
      setSourceFileName(file.name)
      toast.success('تم رفع الكود المصدري')
    } catch {
      toast.error('فشل رفع الكود المصدري')
    } finally {
      setSourceUploading(false)
    }
  }

  const mutation = useMutation({
    mutationFn: (payload) => {
      const url = isEdit ? `/admin/templates/${id}` : '/admin/templates'
      const method = isEdit ? 'put' : 'post'
      return api[method](url, payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? 'تم تحديث القالب بنجاح' : 'تم إضافة القالب بنجاح')
      navigate('/x9k2-manage/panel/templates')
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'فشل حفظ القالب')
    },
  })

  const handleSubmit = (e, isPublished = false) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('يرجى إدخال عنوان القالب')
      return
    }

    let parsedComponents
    if (components.trim()) {
      try {
        parsedComponents = JSON.parse(components)
      } catch {
        toast.error('هيكل الأقسام غير صالح (يجب أن يكون JSON صحيح)')
        return
      }
    } else {
      parsedComponents = { sections: [] }
    }

    let parsedConfigSchema = undefined
    if (configSchema.trim()) {
      try {
        parsedConfigSchema = JSON.parse(configSchema)
      } catch {
        toast.error('مخطط الإعدادات غير صالح (يجب أن يكون JSON صحيح)')
        return
      }
    }

    let parsedFeatures = undefined
    if (features.trim()) {
      try {
        parsedFeatures = JSON.parse(features)
      } catch {
        toast.error('ميزات القالب غير صالحة (يجب أن يكون JSON صحيح)')
        return
      }
    }

    mutation.mutate({
      title: title.trim(),
      description: description.trim(),
      category,
      price: price ? Number(price) : null,
      previewUrl: previewUrl || undefined,
      demoUrl: demoUrl.trim() || undefined,
      tags,
      defaultColors: colors,
      components: parsedComponents,
      configSchema: parsedConfigSchema,
      deploymentType: deploymentType || undefined,
      deploymentScript: deploymentScript.trim() || undefined,
      sourceUrl: sourceUrl.trim() || undefined,
      gallery: gallery.length > 0 ? gallery : undefined,
      videoUrl: videoUrl.trim() || undefined,
      features: parsedFeatures,
      isPublished,
    })
  }

  if (isEdit && editLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title={isEdit ? 'تعديل القالب' : 'إضافة قالب جديد'} />
      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
      <form className="max-w-2xl space-y-8">
        {activeTab === 'basic' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-gray-900">المعلومات الأساسية</h3>
            <Input label="عنوان القالب" value={title} onChange={(e) => setTitle(e.target.value)} />
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">صورة المعاينة</label>
              <div className="flex items-center gap-4">
                {previewUrl && (
                  <img src={previewUrl} alt="" className="w-24 h-24 rounded-xl object-cover border" />
                )}
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 text-sm text-gray-600">
                  <Upload className="w-4 h-4" />
                  اختر صورة
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                {previewUrl && (
                  <button onClick={() => setPreviewUrl('')} className="text-sm text-red-500 hover:underline">إزالة</button>
                )}
              </div>
            </div>
            <Textarea label="الوصف" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            <Select
              label="الفئة"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                { value: 'متاجر', label: 'تجارة إلكترونية' },
                { value: 'شركات', label: 'شركات' },
                { value: 'مطاعم', label: 'مطاعم' },
                { value: 'مدونات', label: 'مدونة' },
                { value: 'عقارات', label: 'عقارات' },
                { value: 'رياضة', label: 'رياضة' },
              ]}
            />
            {isEdit && (
              <div className="p-4 bg-brand-50 rounded-xl border border-brand-200">
                <h4 className="font-bold text-sm text-brand-700 mb-2 flex items-center gap-2">
                  <FileJson className="w-4 h-4" /> manifest.json
                </h4>
                {manifestInfo ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="info">{manifestInfo.name}</Badge>
                      <Badge variant="success">v{manifestInfo.version}</Badge>
                      {manifestInfo.type && <Badge variant="subtle">{manifestInfo.type}</Badge>}
                      {manifestInfo.framework && <Badge variant="subtle">{manifestInfo.framework}</Badge>}
                    </div>
                    <p className="text-xs text-gray-500">{manifestInfo.fields?.length || 0} حقل قابل للتخصيص</p>
                    <label className="cursor-pointer inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium">
                      <Upload className="w-3 h-3" /> تغيير الملف
                      <input type="file" accept=".json" className="hidden" onChange={handleManifestUpload} />
                    </label>
                  </div>
                ) : (
                  <label className="cursor-pointer flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium">
                    <Upload className="w-4 h-4" />
                    {manifestUploading ? 'جاري الرفع...' : 'رفع manifest.json'}
                    <input type="file" accept=".json" className="hidden" onChange={handleManifestUpload} disabled={manifestUploading} />
                  </label>
                )}
              </div>
            )}
            <Input label="السعر" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            <Input label="رابط العرض الحي (demo)" type="url" dir="ltr" placeholder="https://..." value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} />
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Tags</label>
              <Input placeholder="أضف tag + Enter" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={addTag} />
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="subtle">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="mr-1 text-gray-400 hover:text-red-500">&times;</button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'colors-sections' && (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-gray-900">الألوان الافتراضية</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(colors).map(([name, hex]) => (
                  <div key={name}>
                    <p className="text-sm text-gray-600 mb-2">{name}</p>
                    <ColorPicker color={hex} onChange={(c) => setColors({ ...colors, [name]: c })} />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-gray-900">هيكل الأقسام</h3>
              <Textarea
                rows={8}
                className="font-mono text-xs"
                value={components}
                onChange={(e) => setComponents(e.target.value)}
              />
            </div>
          </>
        )}

        {activeTab === 'advanced' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-gray-900">الإعدادات المتقدمة</h3>
            <Textarea
              label="مخطط الإعدادات (configSchema)"
              rows={5}
              className="font-mono text-xs"
              hint='مثال: {"fields":[{"key":"siteName","label":"اسم الموقع","type":"text"}]}'
              value={configSchema}
              onChange={(e) => setConfigSchema(e.target.value)}
            />
            <Select
              label="نوع النشر"
              value={deploymentType}
              onChange={(e) => setDeploymentType(e.target.value)}
              options={[
                { value: 'Docker', label: 'Docker' },
                { value: 'Node.js', label: 'Node.js' },
                { value: 'PHP', label: 'PHP' },
                { value: 'Static', label: 'Static' },
                { value: 'Custom', label: 'Custom' },
              ]}
              placeholder="اختر نوع النشر"
            />
            <Textarea
              label="سكريبت النشر (deploymentScript)"
              rows={4}
              className="font-mono text-xs"
              value={deploymentScript}
              onChange={(e) => setDeploymentScript(e.target.value)}
            />
            {isEdit && (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <h4 className="font-bold text-sm text-gray-700 mb-2 flex items-center gap-2">
                  <FileArchive className="w-4 h-4" /> الكود المصدري
                </h4>
                {sourceFileName ? (
                  <p className="text-xs text-gray-500 mb-2">تم الرفع: {sourceFileName}</p>
                ) : editData?.sourceFile ? (
                  <p className="text-xs text-gray-500 mb-2">ملف مصدر مضاف مسبقاً</p>
                ) : null}
                <label className="cursor-pointer inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 font-medium">
                  <Upload className="w-4 h-4" />
                  {sourceUploading ? 'جاري الرفع...' : 'رفع ملف ZIP'}
                  <input type="file" accept=".zip,.gz" className="hidden" onChange={handleSourceUpload} disabled={sourceUploading} />
                </label>
              </div>
            )}
            <Input label="رابط الكود المصدري (sourceUrl)" type="url" dir="ltr" placeholder="https://github.com/..." value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">معرض الصور (gallery)</label>
              <div className="flex flex-wrap gap-3 mb-3">
                {gallery.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt="" className="w-20 h-20 rounded-xl object-cover border" />
                    <button onClick={() => removeGalleryImage(url)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 text-sm text-gray-600">
                <Image className="w-4 h-4" />
                إضافة صور
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} />
              </label>
            </div>
            <Input label="رابط فيديو العرض (videoUrl)" type="url" dir="ltr" placeholder="https://youtube.com/..." value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
            <Textarea
              label="ميزات القالب (features)"
              rows={5}
              className="font-mono text-xs"
              hint='مثال: ["متجاوب", "تحسين SEO", "لوحة تحكم"]'
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
            />
          </div>
        )}

        {activeTab === 'publish' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <h3 className="font-bold text-gray-900">نشر وإصدارات</h3>
            <p className="text-sm text-gray-500">بعد حفظ القالب، يمكنك إدارة إصداراته ونشره.</p>
            {isEdit && (
              <div>
                <Link
                  to={`/x9k2-manage/panel/templates/${id}/versions`}
                  className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700 font-semibold text-sm"
                >
                  إدارة الإصدارات ←
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" type="button" onClick={() => navigate('/x9k2-manage/panel/templates')}>إلغاء</Button>
          <Button variant="secondary" type="submit" loading={mutation.isPending} onClick={(e) => handleSubmit(e, false)}>حفظ كمسودة</Button>
          <Button variant="primary" type="submit" loading={mutation.isPending} onClick={(e) => handleSubmit(e, true)}>نشر القالب</Button>
        </div>
      </form>
    </div>
  )
}
