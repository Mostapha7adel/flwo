import { useState, useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { TemplateCard } from '../../components/shared/TemplateCard'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { CardSkeleton } from '../../components/ui/Skeleton'
import { PageHeader } from '../../components/shared/PageHeader'
import { api } from '../../lib/axios'
import { TEMPLATE_CATEGORIES, SORT_OPTIONS } from '../../utils/constants'

export default function TemplatesPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('newest')

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useInfiniteQuery({
    queryKey: ['templates', category, sort, search],
    queryFn: ({ pageParam = 1 }) =>
      api.get('/templates', { params: { page: pageParam, category: category === 'all' ? undefined : category, sort, search } }).then(res => res.data),
    getNextPageParam: (lastPage) => lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  })

  const templates = useMemo(() => data?.pages.flatMap(p => p.templates) ?? [], [data])

  return (
    <div className="pt-20 pb-12">
      <div className="container mx-auto px-6">
        <PageHeader title="القوالب" />

        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="بحث..."
              icon={<Search className="w-4 h-4" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-44">
            <Select
              options={TEMPLATE_CATEGORIES}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <div className="w-44">
            <Select
              options={SORT_OPTIONS}
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : isError ? (
          <div className="text-center py-20">
            <p className="text-red-500">حدث خطأ في تحميل القوالب</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">لا توجد قوالب تطابق بحثك</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {templates.map(t => (
              <TemplateCard key={t.id} template={t} />
            ))}
          </div>
        )}

        {hasNextPage && (
          <div className="text-center mt-8">
            <Button variant="secondary" size="lg" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
              {isFetchingNextPage ? 'جاري التحميل...' : 'تحميل المزيد'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
