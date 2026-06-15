import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Upload } from 'lucide-react'
import { api } from '../../lib/axios'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { ColorPicker } from '../../components/ui/ColorPicker'
import { PageHeader } from '../../components/shared/PageHeader'
import { Spinner } from '../../components/ui/Spinner'

export default function AddTemplatePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const { data: editData, isLoading: editLoading } = useQuery({
    queryKey: ['admin-template', id],
    queryFn: () => api.get(`/admin/templates/${id}`).then(r => r.data),
    enabled: isEdit,
  })

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

  /* eslint-disable react-hooks/set-state-in-effect */
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
    }
  }, [editData])
  /* eslint-enable react-hooks/set-state-in-effect */

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
      <form className="max-w-2xl space-y-8">
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

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" type="button" onClick={() => navigate('/x9k2-manage/panel/templates')}>إلغاء</Button>
          <Button variant="secondary" type="submit" loading={mutation.isPending} onClick={(e) => handleSubmit(e, false)}>حفظ كمسودة</Button>
          <Button variant="primary" type="submit" loading={mutation.isPending} onClick={(e) => handleSubmit(e, true)}>نشر القالب</Button>
        </div>
      </form>
    </div>
  )
}
