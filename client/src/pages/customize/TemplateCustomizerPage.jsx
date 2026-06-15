import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, ArrowRight, CheckCircle, Loader, ExternalLink, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Button } from '../../components/ui/Button'
import { ColorPicker } from '../../components/ui/ColorPicker'
import { useTemplateStore } from '../../store/templateStore'
import { api } from '../../lib/axios'

function SortableSection({ section }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 cursor-grab ${
        isDragging ? 'shadow-lg scale-105 opacity-75 z-50' : 'hover:border-brand-300'
      }`}
      {...attributes}
    >
      <div {...listeners} className="text-gray-400 hover:text-gray-600">
        <GripVertical className="w-4 h-4" />
      </div>
      <span className="text-sm font-medium text-gray-700">{section.label}</span>
    </div>
  )
}

function ColorTokenPicker({ token, value, onChange }) {
  const labels = { primary: 'اللون الرئيسي', secondary: 'اللون الثانوي', accent: 'لون التمييز', text: 'لون النص' }

  return (
    <div>
      <p className="text-sm text-gray-600 mb-2">{labels[token] || token}</p>
      <ColorPicker color={value} onChange={(color) => onChange(token, color)} />
    </div>
  )
}

export default function TemplateCustomizerPage() {
  const { templateId } = useParams()
  const navigate = useNavigate()
  const { sections, colorTokens, updateColor, reorderSections, initCustomizer } = useTemplateStore()
  const [showDemo, setShowDemo] = useState(false)

  const { data: template, isLoading } = useQuery({
    queryKey: ['template', templateId],
    queryFn: () => api.get(`/templates/${templateId}`).then(r => r.data),
    enabled: !!templateId,
  })

  useEffect(() => {
    if (template) {
      initCustomizer(template)
    }
  }, [template, initCustomizer])

  useEffect(() => {
    const preview = document.getElementById('template-preview')
    if (!preview) return
    Object.entries(colorTokens).forEach(([token, value]) => {
      preview.style.setProperty(`--color-${token}`, value)
    })
  }, [colorTokens])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    )
  }

  if (!template) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-gray-500">القالب غير موجود</p>
      </div>
    )
  }

  const handleDragEnd = ({ active, over }) => {
    if (active.id !== over?.id) {
      const oldIdx = sections.findIndex(s => s.id === active.id)
      const newIdx = sections.findIndex(s => s.id === over.id)
      reorderSections(arrayMove(sections, oldIdx, newIdx))
    }
  }

  const handleSubmitOrder = async () => {
    try {
      const { data } = await api.post('/orders', { templateId, colors: colorTokens })
      navigate(`/dashboard/orders/${data.id}?success=true`)
      toast.success('تم إرسال طلبك بنجاح!')
    } catch (err) {
      toast.error(err?.response?.data?.error || 'حدث خطأ، حاول مجدداً')
    }
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="h-14 bg-white border-b flex items-center justify-between px-6 shrink-0">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowRight className="w-4 h-4" />
          رجوع
        </button>
        <h1 className="font-bold text-gray-900">تخصيص القالب</h1>
        <div className="flex items-center gap-2">
          {template.demoUrl && (
            <button
              onClick={() => setShowDemo(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              معاينة حية
            </button>
          )}
          <Button onClick={handleSubmitOrder} size="sm">
            <CheckCircle className="w-4 h-4" />
            طلب الآن
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-72 bg-gray-50 border-l p-4 overflow-y-auto space-y-6 shrink-0">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">ترتيب الأقسام</h3>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sections} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {sections.map(s => <SortableSection key={s.id} section={s} />)}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">الألوان</h3>
            <div className="space-y-4">
              {Object.entries(colorTokens).map(([token, value]) => (
                <ColorTokenPicker key={token} token={token} value={value} onChange={updateColor} />
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 bg-gray-200 overflow-auto p-4">
          <div className="bg-white rounded-xl overflow-hidden shadow-lg min-h-full p-8" id="template-preview">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center py-16 bg-gray-50 rounded-2xl" style={{ backgroundColor: colorTokens.secondary }}>
                <h2 className="text-4xl font-bold mb-4" style={{ color: colorTokens.text }}>معاينة القالب</h2>
                <p className="text-lg" style={{ color: colorTokens.text, opacity: 0.7 }}>التغييرات تظهر فوراً</p>
                <button className="px-6 py-3 rounded-xl text-white font-semibold mt-4" style={{ backgroundColor: colorTokens.primary }}>
                  زر تجريبي
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-32 rounded-xl" style={{ backgroundColor: colorTokens.primary, opacity: 0.2 - i * 0.05 }} />
                ))}
              </div>
              <div className="h-24 rounded-xl flex items-center justify-center" style={{ backgroundColor: colorTokens.accent, opacity: 0.1 }}>
                <span style={{ color: colorTokens.accent }}>قسم تجريبي</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDemo && template.demoUrl && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
              <span className="font-semibold text-gray-900">معاينة حية — {template.title}</span>
              <button onClick={() => setShowDemo(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <iframe
              src={template.demoUrl}
              className="flex-1 w-full border-0"
              title="Demo Preview"
              sandbox="allow-scripts allow-same-origin"
              loading="lazy"
            />
          </div>
        </div>
      )}
    </div>
  )
}
