import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ArrowRight, Play, RefreshCw, Loader } from 'lucide-react'
import { api } from '../../lib/axios'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { Badge } from '../../components/ui/Badge'
import { PageHeader } from '../../components/shared/PageHeader'
import { Spinner } from '../../components/ui/Spinner'

const STATUS_VARIANTS = {
  PENDING: 'warning',
  PROCESSING: 'info',
  SUCCESS: 'success',
  FAILED: 'danger',
}

const STATUS_LABELS = {
  PENDING: 'قيد الانتظار',
  PROCESSING: 'جاري النشر',
  SUCCESS: 'تم النشر بنجاح',
  FAILED: 'فشل النشر',
}

const DEPLOYMENT_TYPES = [
  { value: 'DOWNLOAD', label: 'تحميل السورس كود' },
  { value: 'MANUAL', label: 'يدوي (بواسطة الإدارة)' },
  { value: 'AUTO_SSH', label: 'نشر تلقائي SSH' },
  { value: 'AUTO_DOCKER', label: 'نشر تلقائي Docker' },
  { value: 'AUTO_GIT', label: 'نشر تلقائي Git' },
]

export default function ClientDeploymentsPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()

  const [deployType, setDeployType] = useState('Auto SSH')
  const [serverId, setServerId] = useState('')
  const [domain, setDomain] = useState('')
  const [useSsl, setUseSsl] = useState(false)
  const [log, setLog] = useState('')

  const { data: serversData } = useQuery({
    queryKey: ['servers'],
    queryFn: () => api.get('/v1/servers').then(r => r.data),
  })

  const servers = serversData?.data ?? []

  const { data: deployData, isLoading: deployLoading, isError: deployError, refetch: refetchDeploy } = useQuery({
    queryKey: ['deployment', orderId],
    queryFn: () => api.get(`/v1/orders/${orderId}/deployment`).then(r => r.data),
    enabled: !!orderId,
  })

  const { data: logData, refetch: refetchLog } = useQuery({
    queryKey: ['deployment-log', orderId],
    queryFn: () => api.get(`/v1/orders/${orderId}/deployment/log`).then(r => r.data),
    enabled: !!orderId,
  })

  useEffect(() => {
    if (logData?.data) {
      setLog(logData.data.log || logData.data || '')
    }
  }, [logData])

  useEffect(() => {
    if (deployData?.data) {
      setDeployType(deployData.data.deploymentType || 'Auto SSH')
      setServerId(deployData.data.serverId || '')
      setDomain(deployData.data.domain || '')
      setUseSsl(deployData.data.useSsl || false)
    }
  }, [deployData])

  const mutation = useMutation({
    mutationFn: (payload) => api.post(`/v1/orders/${orderId}/deployment`, payload),
    onSuccess: () => {
      toast.success('تم بدء عملية النشر')
      refetchDeploy()
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'فشل بدء النشر'),
  })

  const handleDeploy = (e) => {
    e.preventDefault()
    if (!domain.trim()) {
      toast.error('يرجى إدخال النطاق')
      return
    }
    mutation.mutate({
      deploymentType: deployType,
      serverId: serverId || undefined,
      domain: domain.trim(),
      useSsl,
    })
  }

  if (deployLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const deployment = deployData?.data

  return (
    <div>
      <button onClick={() => navigate('/dashboard/orders')} className="flex items-center gap-2 text-gray-500 hover:text-brand-600 mb-4 transition-colors">
        <ArrowRight className="w-4 h-4" />
        العودة للطلبات
      </button>

      <PageHeader title="نشر القالب" />

      {deployError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
          <p className="text-red-700 text-sm font-medium">حدث خطأ أثناء تحميل بيانات النشر</p>
        </div>
      )}

      {deployment && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">حالة النشر</p>
              <Badge variant={STATUS_VARIANTS[deployment.status] || 'subtle'} className="mt-1">
                {STATUS_LABELS[deployment.status] || deployment.status}
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { refetchDeploy(); refetchLog() }}>
              <RefreshCw className="w-4 h-4" /> تحديث
            </Button>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">إعدادات النشر</h3>
          <form onSubmit={handleDeploy} className="space-y-4">
            <Select
              label="نوع النشر"
              value={deployType}
              onChange={(e) => setDeployType(e.target.value)}
              options={DEPLOYMENT_TYPES}
            />
            <Select
              label="السيرفر"
              value={serverId}
              onChange={(e) => setServerId(e.target.value)}
              options={servers.map(s => ({ value: s.id, label: `${s.label} (${s.host})` }))}
              placeholder={servers.length === 0 ? 'لا توجد سيرفات' : 'اختر سيرفر'}
            />
            <Input label="النطاق (Domain)" dir="ltr" placeholder="example.com" value={domain} onChange={(e) => setDomain(e.target.value)} />
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={useSsl} onChange={(e) => setUseSsl(e.target.checked)} className="rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
              تفعيل SSL
            </label>
            <Button type="submit" className="w-full" loading={mutation.isPending}>
              <Play className="w-4 h-4" /> بدء النشر
            </Button>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">سجل النشر</h3>
            <Button variant="ghost" size="sm" onClick={() => refetchLog()}>
              <RefreshCw className="w-3.5 h-3.5" /> تحديث
            </Button>
          </div>
          <Textarea
            rows={16}
            className="font-mono text-xs bg-gray-50 text-gray-800"
            dir="ltr"
            value={log}
            readOnly
            placeholder="لم يتم تشغيل النشر بعد..."
          />
        </div>
      </div>
    </div>
  )
}
