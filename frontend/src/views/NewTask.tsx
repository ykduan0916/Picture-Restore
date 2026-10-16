import { useEffect, useId, useState, type FormEvent, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Check, X } from 'lucide-react'
import Stage from '../components/Stage'
import { api, ApiError, sessionPreviews, type JobCreateInput } from '../lib/api'
import { DELIVERABLES, type DeliverableId } from '../lib/deliverables'
import { formatBytes, FORMAT_LABEL, inspectImage, InspectionError, megapixels, type Inspection } from '../lib/image'
import { normalizeSku, parsePriceMinor } from '../lib/format'
import { href, navigate } from '../lib/router'

type Selection = Record<DeliverableId, { on: boolean; size: number }>

const INITIAL_SELECTION: Selection = {
  white: { on: true, size: 0 },
  scene: { on: true, size: 0 },
  promo: { on: true, size: 0 },
}

export default function NewTask() {
  const queryClient = useQueryClient()
  const [image, setImage] = useState<Inspection | null>(null)
  const [inspecting, setInspecting] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)

  const [skuCode, setSkuCode] = useState('')
  const [productName, setProductName] = useState('')
  const [price, setPrice] = useState('')
  const [unit, setUnit] = useState('')
  const [points, setPoints] = useState<string[]>([])
  const [pointDraft, setPointDraft] = useState('')
  const [sceneBrief, setSceneBrief] = useState('')
  const [selection, setSelection] = useState<Selection>(INITIAL_SELECTION)
  const [focusId, setFocusId] = useState<DeliverableId>('white')
  const [rights, setRights] = useState(false)
  const [brandId, setBrandId] = useState<string>('')
  const brands = useQuery({ queryKey: ['brands'], queryFn: api.listBrands })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  // 离开页面时释放未提交图片的预览地址
  useEffect(() => {
    return () => {
      if (image && !sessionPreviews.has(image.sha256)) URL.revokeObjectURL(image.url)
    }
  }, [image])

  const handleFile = async (file: File) => {
    setInspecting(true)
    setImageError(null)
    try {
      const result = await inspectImage(file)
      setImage(result)
      setErrors((e) => withoutKey(e, 'assets'))
    } catch (error) {
      setImageError(error instanceof InspectionError ? error.message : '图片检查失败，请换一张图片再试。')
    } finally {
      setInspecting(false)
    }
  }

  const priceMinor = price.trim() ? parsePriceMinor(price) : null
  const selected = DELIVERABLES.filter((d) => selection[d.id].on)
  const promoOn = selection.promo.on

  const focusSpec = DELIVERABLES.find((d) => d.id === focusId && selection[d.id].on) ?? selected[0]
  const frame = focusSpec
    ? {
        id: focusSpec.id,
        width: focusSpec.sizes[selection[focusSpec.id].size][0],
        height: focusSpec.sizes[selection[focusSpec.id].size][1],
      }
    : null

  const validate = (): Record<string, string> => {
    const next: Record<string, string> = {}
    if (!image) next.assets = '先放入一张商品原图。'
    if (!skuCode.trim()) next.sku_code = '填写 SKU 编号。'
    else if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(skuCode.trim()) || !normalizeSku(skuCode))
      next.sku_code = '只能包含字母、数字、短横线和下划线。'
    if (!productName.trim()) next.product_name = '填写商品名称。'
    if (price.trim() && priceMinor === null) next.price_minor = '写成 199 或 199.90 这样的金额。'
    if (selected.length === 0) next.deliverables = '至少选择一种素材。'
    if (!rights) next.rights_confirmed = '确认你有权使用这张图片。'
    return next
  }

  const create = useMutation({
    mutationFn: (input: JobCreateInput) => api.createJob(input),
    onSuccess: (job) => {
      if (image) sessionPreviews.set(image.sha256, image.url)
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.setQueryData(['job', job.job_id], job)
      navigate({ name: 'task', id: job.job_id })
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        setErrors(error.fields)
        if (error.fields.brand_id) queryClient.invalidateQueries({ queryKey: ['brands'] })
      }
    },
  })

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0 || !image) {
      const first = document.querySelector<HTMLElement>(`[data-field="${Object.keys(next)[0]}"]`)
      first?.focus()
      return
    }
    create.mutate({
      sku_code: skuCode.trim(),
      product_name: productName.trim(),
      price_minor: priceMinor,
      unit: unit.trim() || null,
      selling_points: points,
      scene_brief: selection.scene.on && sceneBrief.trim() ? sceneBrief.trim() : null,
      brand_id: promoOn && brandId ? brandId : null,
      deliverables: selected.map((d) => ({
        id: d.id,
        width: d.sizes[selection[d.id].size][0],
        height: d.sizes[selection[d.id].size][1],
      })),
      assets: [
        {
          sha256: image.sha256,
          purpose: 'product_original',
          file_name: image.fileName,
          mime_type: image.mime,
          byte_size: image.byteSize,
          width: image.width,
          height: image.height,
        },
      ],
      rights_confirmed: rights,
    })
  }

  // 提交过一次后，修改即时重新校验
  useEffect(() => {
    if (submitted) setErrors((prev) => ({ ...(prev.brand_id ? { brand_id: prev.brand_id } : {}), ...validate() }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image, skuCode, productName, price, selection, rights])

  const addPoint = () => {
    const text = pointDraft.trim()
    if (!text || points.length >= 3 || points.includes(text)) return
    setPoints([...points, text.slice(0, 16)])
    setPointDraft('')
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto grid max-w-[1440px] grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <section aria-label="商品原图" className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-[80px] lg:h-[calc(100vh-104px)]">
        <div className="h-[460px] min-h-0 lg:h-auto lg:flex-1" data-field="assets" tabIndex={-1}>
          <Stage
            image={image}
            busy={inspecting}
            error={imageError ?? (submitted ? errors.assets ?? null : null)}
            frame={image ? frame : null}
            productName={productName}
            priceMinor={priceMinor}
            onFile={handleFile}
          />
        </div>
        {image && <ImageFacts image={image} />}
      </section>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="pt-1">
          <h1 className="text-xl font-semibold tracking-tight">新建任务</h1>
          <p className="mt-1 text-13 text-graphite">
            一个 SKU 一个任务。这里填写的内容就是图上会用到的事实，系统不会补充没有填写的信息。
          </p>
        </div>

        <Panel title="商品资料">
          <Field label="SKU 编号" error={errors.sku_code} hint={skuCode.trim() && !errors.sku_code ? `导出文件以 ${normalizeSku(skuCode)} 开头` : undefined}>
            {(id, describedBy) => (
              <input
                id={id}
                data-field="sku_code"
                className={`field ${errors.sku_code ? 'field-invalid' : ''}`}
                value={skuCode}
                onChange={(e) => setSkuCode(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                placeholder="例如 EB-2041"
                aria-invalid={!!errors.sku_code}
                aria-describedby={describedBy}
              />
            )}
          </Field>

          <Field label="商品名称" error={errors.product_name} counter={`${productName.length}/60`}>
            {(id, describedBy) => (
              <input
                id={id}
                data-field="product_name"
                className={`field ${errors.product_name ? 'field-invalid' : ''}`}
                value={productName}
                maxLength={60}
                onChange={(e) => setProductName(e.target.value)}
                autoComplete="off"
                placeholder="例如 无线降噪耳机 Pro"
                aria-invalid={!!errors.product_name}
                aria-describedby={describedBy}
              />
            )}
          </Field>

          <div className="grid grid-cols-[1fr_96px] gap-3">
            <Field
              label="活动价格"
              optional={!promoOn}
              error={errors.price_minor}
              hint={promoOn && !price.trim() ? '促销图需要价格。不填也能创建，任务会停在待补充。' : undefined}
            >
              {(id, describedBy) => (
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-quiet">¥</span>
                  <input
                    id={id}
                    data-field="price_minor"
                    className={`field pl-7 tabular-nums ${errors.price_minor ? 'field-invalid' : ''}`}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="199.00"
                    aria-invalid={!!errors.price_minor}
                    aria-describedby={describedBy}
                  />
                </div>
              )}
            </Field>
            <Field label="单位" optional>
              {(id) => (
                <input
                  id={id}
                  className="field"
                  value={unit}
                  maxLength={8}
                  onChange={(e) => setUnit(e.target.value)}
                  autoComplete="off"
                  placeholder="件"
                />
              )}
            </Field>
          </div>

          <Field label="卖点" optional counter={`${points.length}/3`} hint="每条 16 字以内。只写能证明的内容，例如参数，不写销量和认证。">
            {(id, describedBy) => (
              <div>
                {points.length > 0 && (
                  <ul className="mb-2 flex flex-wrap gap-1.5">
                    {points.map((p) => (
                      <li key={p} className="flex h-7 items-center gap-1 rounded bg-paper pl-2.5 pr-1 text-13">
                        {p}
                        <button
                          type="button"
                          className="flex h-5 w-5 items-center justify-center rounded text-quiet hover:bg-line hover:text-ink"
                          onClick={() => setPoints(points.filter((x) => x !== p))}
                          aria-label={`删除卖点：${p}`}
                        >
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex gap-2">
                  <input
                    id={id}
                    className="field"
                    value={pointDraft}
                    maxLength={16}
                    disabled={points.length >= 3}
                    onChange={(e) => setPointDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                        e.preventDefault()
                        addPoint()
                      }
                    }}
                    autoComplete="off"
                    placeholder={points.length >= 3 ? '最多三条' : '例如 40 小时续航'}
                    aria-describedby={describedBy}
                  />
                  <button type="button" className="btn-secondary shrink-0" onClick={addPoint} disabled={!pointDraft.trim() || points.length >= 3}>
                    添加
                  </button>
                </div>
              </div>
            )}
          </Field>
        </Panel>

        <Panel title="要做的素材" error={errors.deliverables}>
          <fieldset className="space-y-2" data-field="deliverables" tabIndex={-1}>
            <legend className="sr-only">选择素材和尺寸</legend>
            {DELIVERABLES.map((d) => {
              const state = selection[d.id]
              const active = state.on && frame?.id === d.id
              return (
                <div
                  key={d.id}
                  className={`rounded-md border transition-colors ${
                    state.on ? (active ? 'border-mat bg-mat-soft/40' : 'border-line bg-panel') : 'border-line bg-paper/60'
                  }`}
                >
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <input
                      id={`d-${d.id}`}
                      type="checkbox"
                      checked={state.on}
                      onChange={(e) => {
                        setSelection({ ...selection, [d.id]: { ...state, on: e.target.checked } })
                        if (e.target.checked) setFocusId(d.id)
                      }}
                      className="h-4 w-4 accent-mat"
                    />
                    <label htmlFor={`d-${d.id}`} className="flex-1 cursor-pointer">
                      <span className="block text-sm font-medium">{d.name}</span>
                      <span className="block text-xs text-graphite">{d.use}</span>
                    </label>
                    <select
                      aria-label={`${d.name}尺寸`}
                      value={state.size}
                      disabled={!state.on}
                      onChange={(e) => {
                        setSelection({ ...selection, [d.id]: { ...state, size: Number(e.target.value) } })
                        setFocusId(d.id)
                      }}
                      onFocus={() => state.on && setFocusId(d.id)}
                      className="h-8 rounded-md border border-line bg-panel px-2 text-13 tabular-nums text-ink disabled:text-quiet"
                    >
                      {d.sizes.map(([w, h], i) => (
                        <option key={`${w}x${h}`} value={i}>
                          {w} × {h}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className={`hidden rounded px-1.5 py-1 text-xs sm:block ${
                        active ? 'text-mat-strong' : 'text-graphite hover:bg-paper hover:text-ink'
                      } ${state.on ? '' : 'invisible'}`}
                      onClick={() => setFocusId(d.id)}
                      aria-pressed={active}
                      disabled={!state.on || !image}
                    >
                      {active ? '预览中' : '预览'}
                    </button>
                  </div>
                  {d.id === 'promo' && state.on && (
                    <div className="border-t border-line px-3 pb-3 pt-2.5">
                      <label htmlFor="brand" className="mb-1.5 block text-xs text-graphite">
                        品牌规范
                      </label>
                      <select
                        id="brand"
                        value={brandId}
                        onChange={(e) => {
                          setBrandId(e.target.value)
                          setErrors((prev) => withoutKey(prev, 'brand_id'))
                        }}
                        className="field h-8 text-13"
                      >
                        <option value="">默认模板</option>
                        {brands.data?.map((b) => (
                          <option key={b.brand_id} value={b.brand_id}>
                            {b.name}（第 {b.version} 版）
                          </option>
                        ))}
                      </select>
                      {errors.brand_id && <p className="mt-1.5 text-xs text-fault">{errors.brand_id}</p>}
                      {brands.isSuccess && brands.data.length === 0 && (
                        <p className="mt-1.5 text-xs text-quiet">
                          还没有品牌规范。<a href={href({ name: 'brands' })} className="text-mat-strong underline-offset-2 hover:underline">去设置</a>，或先用默认模板。
                        </p>
                      )}
                    </div>
                  )}
                  {d.id === 'scene' && state.on && (
                    <div className="border-t border-line px-3 pb-3 pt-2.5">
                      <label htmlFor="scene-brief" className="mb-1.5 block text-xs text-graphite">
                        场景描述（可选）
                      </label>
                      <input
                        id="scene-brief"
                        className="field h-8 text-13"
                        value={sceneBrief}
                        maxLength={200}
                        onChange={(e) => setSceneBrief(e.target.value)}
                        autoComplete="off"
                        placeholder="例如 浅色木桌面，自然光，背景简洁"
                      />
                      <p className="mt-1.5 text-xs text-quiet">只改变背景。商品角度和光照方向保持原图。</p>
                    </div>
                  )}
                </div>
              )
            })}
          </fieldset>
        </Panel>

        <div className="rounded-lg border border-line bg-panel p-4">
          <label className="flex cursor-pointer items-start gap-3" data-field="rights_confirmed" tabIndex={-1}>
            <input
              type="checkbox"
              checked={rights}
              onChange={(e) => setRights(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-mat"
              aria-invalid={!!errors.rights_confirmed}
            />
            <span className="text-13 text-graphite">
              我有权使用这张商品图片和填写的商品资料。图片只用于本任务的处理，不会公开。
            </span>
          </label>
          {errors.rights_confirmed && <p className="mt-2 pl-7 text-xs text-fault">{errors.rights_confirmed}</p>}
        </div>

        {create.error && !(create.error instanceof ApiError && Object.keys(create.error.fields).length > 0) && (
          <p role="alert" className="flex items-start gap-2 rounded-md bg-fault-soft px-3 py-2.5 text-13 text-fault">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {create.error.message}
          </p>
        )}

        <div className="flex items-center justify-between gap-4 pb-6">
          <p className="text-xs text-quiet">创建后可以在任务页查看任务契约。</p>
          <button type="submit" className="btn-primary min-w-[120px]" disabled={create.isPending || inspecting}>
            {create.isPending ? '正在创建…' : '创建任务'}
          </button>
        </div>
      </div>
    </form>
  )
}

function ImageFacts({ image }: { image: Inspection }) {
  const rows: [string, ReactNode][] = [
    ['格式', FORMAT_LABEL[image.format]],
    ['尺寸', `${image.width} × ${image.height} px（${megapixels(image.width, image.height)}）`],
    ['大小', formatBytes(image.byteSize)],
    ['方向', image.orientation === 1 ? '无需校正' : '已按拍摄方向校正'],
    [
      '原图指纹',
      <span className="font-mono text-xs" title={image.sha256} translate="no">
        {image.sha256.slice(0, 12)}…
      </span>,
    ],
  ]
  return (
    <div className="rounded-lg border border-line bg-panel px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5">
        <span className="flex items-center gap-1.5 text-13 font-medium text-mat-strong">
          <Check className="h-4 w-4" aria-hidden="true" />
          已通过上传检查
        </span>
        <dl className="flex flex-wrap gap-x-5 gap-y-1 text-13">
          {rows.map(([k, v]) => (
            <div key={k} className="flex gap-1.5">
              <dt className="text-graphite">{k}</dt>
              <dd className="tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      {image.warnings.map((w) => (
        <p key={w} className="mt-2 flex items-start gap-1.5 text-13 text-signal">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {w}
        </p>
      ))}
    </div>
  )
}

function Panel({ title, error, children }: { title: string; error?: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-panel p-4">
      <h2 className="mb-3.5 text-sm font-semibold">{title}</h2>
      <div className="space-y-3.5">{children}</div>
      {error && <p className="mt-2 text-xs text-fault">{error}</p>}
    </section>
  )
}

function Field({
  label,
  optional,
  error,
  hint,
  counter,
  children,
}: {
  label: string
  optional?: boolean
  error?: string
  hint?: string
  counter?: string
  children: (id: string, describedBy: string | undefined) => ReactNode
}) {
  const id = useId()
  const messageId = `${id}-msg`
  const message = error ?? hint
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label htmlFor={id} className="text-13 font-medium">
          {label}
          {optional && <span className="ml-1 font-normal text-quiet">可选</span>}
        </label>
        {counter && <span className="text-xs tabular-nums text-quiet">{counter}</span>}
      </div>
      {children(id, message ? messageId : undefined)}
      {message && (
        <p id={messageId} className={`mt-1.5 text-xs ${error ? 'text-fault' : 'text-graphite'}`}>
          {message}
        </p>
      )}
    </div>
  )
}

function withoutKey(obj: Record<string, string>, key: string) {
  const next = { ...obj }
  delete next[key]
  return next
}
