import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, ArrowLeft } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

export const TemplateCard = memo(({ template }) => {
  const navigate = useNavigate()

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
      <div className="relative overflow-hidden aspect-video bg-gray-50 flex items-center justify-center">
        {template.previewUrl ? (
          <img
            src={template.previewUrl}
            alt={template.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <span className="text-4xl font-bold text-gray-300">{template.title?.charAt(0)}</span>
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
          <Button size="sm" variant="secondary" onClick={() => navigate(`/templates/${template.id}`)}>
            <Eye className="w-4 h-4" />
            معاينة
          </Button>
          <Button size="sm" onClick={() => navigate(`/templates/${template.id}`)}>
            اشتر الآن
          </Button>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-gray-900">{template.title}</h3>
            <span className="text-xs text-gray-400 mt-0.5">{template.category}</span>
          </div>
          <span className="text-lg font-bold text-brand-600">${template.price}</span>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {template.tags?.slice(0, 3).map(tag => (
            <Badge key={tag} variant="subtle">{tag}</Badge>
          ))}
        </div>

        <Button variant="outline" className="w-full mt-4" onClick={() => navigate(`/templates/${template.id}`)}>
          عرض التفاصيل
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
})
