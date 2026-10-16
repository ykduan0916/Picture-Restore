import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, ArrowLeft, Check, ChevronDown, Copy } from 'lucide-react'
import { api, ApiError, previewFor, type Job } from '../lib/api'
import { DELIVERABLE_NAME } from '../lib/deliverables'
import { formatDateTime, formatPrice, parsePriceMinor } from '../lib/format'
import { href } from '../lib/router'
import { JobStatusBadge, StepStatusBadge } from '../components/StatusBadge'

// 与 docs/02 的四角色流程一致；未接入的步骤如实标注
const PIPELINE = [
  { key: 'contract', name: '任务契约', detail: '商品事实、保护范围和交付物已校验' },
  { key: 'plan', name: '任务规划', detail: '拆分步骤与依赖' },
  { key: 'parallel', name: '视觉设计与主体准备', detail: '两项并行，完成后汇合检查可行性' },
  { key: 'retouch', name: '合成与排版', detail: '只替换背景，文字为独立图层' },
  { key: 'qa', name: '质量检查', detail: '对照原图检查商品区域和文字' },
  { key: 'review', name: '你来审核', detail: '确认后才算交付' },
] as const

export default function TaskDetail({ id }: { id: string }) {
  const job = useQuery({ queryKey: ['job', id], queryFn: () => api.getJob(id) })

  if (job.isLoading) {
    return <div className="mx-auto max-w-[1200px] px-6 py-10 text-13 text-graphite" aria-busy="true">正在加载任务…</div>
  }

  if (job.isError || !job.data) {
    return (
      <div className="mx-auto max-w-[1200px] px-6 py-10">
        <BackLink />
        <div role="alert" className="mt-4 rounded-lg border border-line bg-panel px-5 py-8 text-center">
          <p className="text-sm font-medium">找不到这个任务</p>
          <p className="mt-1 text-13 text-graphite">{job.error?.message ?? '任务不存在。'}</p>
        </div>
      </div>
    )
  }

  return <Detail job={job.data} />
}

function BackLink() {
  return (
    <a href={href({ name: 'tasks' })} className="inline-flex items-center gap-1.5 rounded text-13 text-graphite hover:text-ink">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      全部任务
    </a>
  )
}

function Detail({ job }: { job: Job }) {
  const assets = job.contract.input_assets as { asset_id: string; original_dimensions: [number, number] }[]
  const original = assets[0]
  const preview = previewFor(job)

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <BackLink />

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="truncate text-xl font-semibold tracking-tight">{job.facts.product_name}</h1>
            <JobStatusBadge status={job.status} />
          </div>
          <p className="mt-1 text-13 text-graphite">
            <span className="font-mono" translate="no">{job.sku_code}</span>
            <span className="mx-2 text-line">|</span>
            创建于 <time dateTime={job.created_at}>{formatDateTime(job.created_at)}</time>
            <span className="mx-2 text-line">|</span>
            契约第 {job.revision} 版
          </p>
        </div>
        <button type="button" className="btn-primary" disabled title="生成服务接入后可用">
          开始生成
        </button>
      </div>

      {job.missing_facts.includes('price') && <PricePrompt job={job} />}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section aria-labelledby="deliverables-title" className="rounded-lg border border-line bg-panel">
            <h2 id="deliverables-title" className="border-b border-line px-4 py-3 text-sm font-semibold">交付物</h2>
            <ul className="grid gap-4 p-4 sm:grid-cols-3">
              {job.deliverables.map((d) => {
                const blocked = d.id === 'promo' && job.missing_facts.includes('price')
                return (
                  <li key={d.id}>
                    <div className="stage-backdrop flex h-[220px] items-center justify-center rounded-md p-4">
                      <div
                        className="relative flex h-full max-w-full items-center justify-center bg-white shadow-[0_1px_2px_rgba(28,31,35,0.08)]"
                        style={{ aspectRatio: `${d.width} / ${d.height}` }}
                      >
                        {preview ? (
                          <img src={preview} alt="" className="h-[70%] w-[70%] object-contain" />
                        ) : (
                          <span className="px-2 text-center text-xs text-quiet">原图只在上传它的浏览器中预览</span>
                        )}
                        <span className="absolute inset-x-0 bottom-0 bg-panel/90 py-1 text-center text-[11px] text-graphite">
                          未生成，显示原图
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">{DELIVERABLE_NAME[d.id]}</span>
                        <span className="block text-xs tabular-nums text-quiet">{d.width} × {d.height} px</span>
                      </span>
                      {blocked ? (
                        <span className="inline-flex h-6 items-center rounded bg-signal-soft px-2 text-xs font-medium text-signal">缺价格</span>
                      ) : (
                        <StepStatusBadge status={d.status} />
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>

          <ContractViewer contract={job.contract} />
        </div>

        <div className="space-y-6">
          <section aria-labelledby="facts-title" className="rounded-lg border border-line bg-panel">
            <h2 id="facts-title" className="border-b border-line px-4 py-3 text-sm font-semibold">商品事实</h2>
            <dl className="divide-y divide-line text-13">
              <Fact label="商品名称" value={job.facts.product_name} />
              <Fact
                label="活动价格"
                value={job.facts.price_minor === null ? null : `${formatPrice(job.facts.price_minor)}${job.facts.unit ? ` / ${job.facts.unit}` : ''}`}
              />
              <Fact label="卖点" value={job.facts.selling_points.length ? job.facts.selling_points.join('，') : null} />
              {job.deliverables.some((d) => d.id === 'promo') && (
                <Fact label="品牌规范" value={job.brand ? `${job.brand.name}（第 ${job.brand.version} 版）` : '默认模板'} />
              )}
              <Fact label="原图" value={`${original.original_dimensions[0]} × ${original.original_dimensions[1]} px`} />
            </dl>
            <p className="border-t border-line px-4 py-2.5 text-xs text-quiet">全部来自你的填写，没有补充其他信息。</p>
          </section>

          <section aria-labelledby="pipeline-title" className="rounded-lg border border-line bg-panel">
            <h2 id="pipeline-title" className="border-b border-line px-4 py-3 text-sm font-semibold">处理步骤</h2>
            <ol className="px-4 py-3">
              {PIPELINE.map((step, i) => {
                const done = step.key === 'contract'
                return (
                  <li key={step.key} className="relative flex gap-3 pb-4 last:pb-0">
                    {i < PIPELINE.length - 1 && <span className="absolute left-[9px] top-6 h-[calc(100%-16px)] w-px bg-line" aria-hidden="true" />}
                    <span
                      className={`relative mt-0.5 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border ${
                        done ? 'border-mat bg-mat text-white' : 'border-line bg-panel'
                      }`}
                      aria-hidden="true"
                    >
                      {done && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    <div className="min-w-0">
                      <p className={`text-13 font-medium ${done ? '' : 'text-graphite'}`}>{step.name}</p>
                      <p className="text-xs text-quiet">{done ? step.detail : `${step.detail}。生成服务尚未接入。`}</p>
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>
        </div>
      </div>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex gap-4 px-4 py-2.5">
      <dt className="w-16 shrink-0 text-graphite">{label}</dt>
      <dd className={`min-w-0 break-words tabular-nums ${value === null ? 'text-quiet' : ''}`}>{value ?? '未填写'}</dd>
    </div>
  )
}

function ContractViewer({ contract }: { contract: Record<string, unknown> }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const text = JSON.stringify(contract, null, 2)

  return (
    <section className="rounded-lg border border-line bg-panel">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          className="flex items-center gap-2 rounded text-sm font-semibold"
          aria-expanded={open}
          aria-controls="contract-json"
          onClick={() => setOpen(!open)}
        >
          <ChevronDown className={`h-4 w-4 text-graphite transition-transform ${open ? '' : '-rotate-90'}`} aria-hidden="true" />
          任务契约
          <span className="font-normal text-quiet">TaskContract v{String(contract.schema_version)}</span>
        </button>
        {open && (
          <button
            type="button"
            className="btn-quiet text-xs"
            onClick={async () => {
              await navigator.clipboard.writeText(text)
              setCopied(true)
              setTimeout(() => setCopied(false), 1500)
            }}
          >
            {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
            {copied ? '已复制' : '复制'}
          </button>
        )}
      </div>
      {open && (
        <pre id="contract-json" className="max-h-[420px] overflow-auto border-t border-line bg-paper/60 px-4 py-3 font-mono text-xs leading-relaxed text-ink" translate="no">
          {text}
        </pre>
      )}
    </section>
  )
}

function PricePrompt({ job }: { job: Job }) {
  const queryClient = useQueryClient()
  const [price, setPrice] = useState('')
  const [unit, setUnit] = useState(job.facts.unit ?? '')
  const [error, setError] = useState<string | null>(null)

  const save = useMutation({
    mutationFn: (priceMinor: number) => api.updateFacts(job.job_id, { price_minor: priceMinor, unit: unit.trim() || null }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['job', job.job_id], updated)
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : '保存失败，请重试。'),
  })

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const minor = parsePriceMinor(price)
    if (minor === null) {
      setError('写成 199 或 199.90 这样的金额。')
      return
    }
    setError(null)
    save.mutate(minor)
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-5 rounded-lg border border-signal/30 bg-signal-soft px-4 py-3">
      <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
        <div className="flex min-w-[260px] flex-1 items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-signal" aria-hidden="true" />
          <div className="text-13">
            <p className="font-medium text-signal">促销图缺少价格</p>
            <p className="mt-0.5 text-graphite">价格只能来自你填写的内容。补上后任务契约会更新一版；白底图和场景图不受影响。</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <div>
            <label htmlFor="fix-price" className="sr-only">活动价格</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-quiet">¥</span>
              <input
                id="fix-price"
                className={`field w-32 pl-7 tabular-nums ${error ? 'field-invalid' : ''}`}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="decimal"
                autoComplete="off"
                placeholder="199.00"
                aria-invalid={!!error}
                aria-describedby={error ? 'fix-price-err' : undefined}
              />
            </div>
            {error && <p id="fix-price-err" className="mt-1.5 text-xs text-fault">{error}</p>}
          </div>
          <label htmlFor="fix-unit" className="sr-only">单位</label>
          <input id="fix-unit" className="field w-20" value={unit} maxLength={8} onChange={(e) => setUnit(e.target.value)} autoComplete="off" placeholder="单位" />
          <button type="submit" className="btn-primary" disabled={save.isPending}>
            {save.isPending ? '正在保存…' : '保存价格'}
          </button>
        </div>
      </div>
    </form>
  )
}
