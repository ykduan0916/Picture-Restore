import { useQuery } from '@tanstack/react-query'
import { FilePlus2 } from 'lucide-react'
import { api, previewFor, type Job } from '../lib/api'
import { DELIVERABLE_NAME } from '../lib/deliverables'
import { formatPrice, formatRelative } from '../lib/format'
import { href } from '../lib/router'
import { JobStatusBadge } from '../components/StatusBadge'

export default function TaskList() {
  const jobs = useQuery({ queryKey: ['jobs'], queryFn: api.listJobs })

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">任务</h1>
          <p className="mt-1 text-13 text-graphite">每个任务对应一个 SKU。处理服务重启后，未持久化的任务会丢失。</p>
        </div>
        <a href={href({ name: 'new' })} className="btn-primary">
          <FilePlus2 className="h-4 w-4" aria-hidden="true" />
          新建任务
        </a>
      </div>

      {jobs.isLoading && <TableSkeleton />}

      {jobs.isError && (
        <div role="alert" className="rounded-lg border border-line bg-panel px-5 py-8 text-center">
          <p className="text-sm font-medium">任务列表没有加载出来</p>
          <p className="mt-1 text-13 text-graphite">{jobs.error.message}</p>
          <button type="button" className="btn-secondary mt-4" onClick={() => jobs.refetch()}>
            重新加载
          </button>
        </div>
      )}

      {jobs.isSuccess && jobs.data.length === 0 && (
        <div className="rounded-lg border border-dashed border-line bg-panel px-5 py-14 text-center">
          <p className="text-sm font-medium">还没有任务</p>
          <p className="mx-auto mt-1 max-w-sm text-13 text-graphite">
            上传一张商品原图，填写商品名称和价格，就可以开始第一个任务。
          </p>
          <a href={href({ name: 'new' })} className="btn-primary mt-5">
            新建任务
          </a>
        </div>
      )}

      {jobs.isSuccess && jobs.data.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-line bg-panel">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-paper/60 text-xs text-graphite">
              <tr>
                <th scope="col" className="w-16 px-4 py-2.5 font-medium">
                  <span className="sr-only">原图</span>
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">商品</th>
                <th scope="col" className="px-4 py-2.5 font-medium">素材</th>
                <th scope="col" className="px-4 py-2.5 font-medium">价格</th>
                <th scope="col" className="px-4 py-2.5 font-medium">状态</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">创建时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {jobs.data.map((job) => (
                <Row key={job.job_id} job={job} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Row({ job }: { job: Job }) {
  const preview = previewFor(job)
  const link = href({ name: 'task', id: job.job_id })

  return (
    <tr className="group relative transition-colors hover:bg-paper/60">
      <td className="px-4 py-3">
        <div className="stage-backdrop h-10 w-10 overflow-hidden rounded">
          {preview && <img src={preview} alt="" width={40} height={40} className="h-full w-full object-contain" loading="lazy" />}
        </div>
      </td>
      <td className="min-w-0 px-4 py-3">
        <a href={link} className="block truncate font-medium after:absolute after:inset-0 after:content-['']">
          {job.facts.product_name}
        </a>
        <span className="font-mono text-xs text-graphite" translate="no">
          {job.sku_code}
        </span>
      </td>
      <td className="px-4 py-3 text-13 text-graphite">{job.deliverables.map((d) => DELIVERABLE_NAME[d.id]).join('、')}</td>
      <td className="px-4 py-3 tabular-nums">
        {job.facts.price_minor === null ? <span className="text-quiet">未填写</span> : formatPrice(job.facts.price_minor)}
      </td>
      <td className="px-4 py-3">
        <JobStatusBadge status={job.status} />
      </td>
      <td className="px-4 py-3 text-right text-13 tabular-nums text-graphite">
        <time dateTime={job.created_at}>{formatRelative(job.created_at)}</time>
      </td>
    </tr>
  )
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-panel" aria-busy="true" aria-label="正在加载任务">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-4 border-b border-line px-4 py-3 last:border-0">
          <div className="h-10 w-10 animate-pulse rounded bg-paper" />
          <div className="h-3.5 w-48 animate-pulse rounded bg-paper" />
          <div className="ml-auto h-3.5 w-20 animate-pulse rounded bg-paper" />
        </div>
      ))}
    </div>
  )
}
