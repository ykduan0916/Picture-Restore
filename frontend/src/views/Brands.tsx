import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Plus } from 'lucide-react'
import ProductArt from '../components/ProductArt'
import { api, ApiError, DEFAULT_BRAND, type Brand, type BrandFont, type BrandInput } from '../lib/api'
import { PROMO_REGIONS } from '../lib/deliverables'
import { formatPrice, formatRelative } from '../lib/format'

const FONT_LABEL: Record<BrandFont, string> = { system_sans: '无衬线', system_serif: '衬线' }
const FONT_STACK: Record<BrandFont, string> = {
  system_sans: '"IBM Plex Sans", "PingFang SC", "Noto Sans SC", sans-serif',
  system_serif: '"Songti SC", "Noto Serif SC", "STSong", serif',
}

export default function Brands() {
  const queryClient = useQueryClient()
  const brands = useQuery({ queryKey: ['brands'], queryFn: api.listBrands })
  const [editing, setEditing] = useState<string | 'new' | null>(null)

  useEffect(() => {
    if (editing === null && brands.isSuccess) setEditing(brands.data[0]?.brand_id ?? 'new')
  }, [brands.isSuccess, brands.data, editing])

  const current = brands.data?.find((b) => b.brand_id === editing) ?? null

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-6">
      <div className="mb-5">
        <h1 className="text-xl font-semibold tracking-tight">品牌规范</h1>
        <p className="mt-1 max-w-[640px] text-13 text-graphite">
          促销图的底色、强调色和字体按这里排版。每次保存都会生成新版本，已经创建的任务继续使用当时的版本。没有设置时使用标明“默认”的模板。
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav aria-label="品牌规范列表" className="space-y-1">
          {brands.isLoading && <p className="px-3 py-2 text-13 text-graphite">正在加载…</p>}
          {brands.isError && <p className="px-3 py-2 text-13 text-fault">{brands.error.message}</p>}
          {brands.data?.map((b) => (
            <button
              key={b.brand_id}
              type="button"
              onClick={() => setEditing(b.brand_id)}
              aria-current={editing === b.brand_id ? 'true' : undefined}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors ${
                editing === b.brand_id ? 'bg-panel shadow-[0_0_0_1px_theme(colors.line)]' : 'hover:bg-panel/70'
              }`}
            >
              <Swatches brand={b} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{b.name}</span>
                <span className="block text-xs text-quiet">
                  第 {b.version} 版，{formatRelative(b.updated_at)}
                </span>
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setEditing('new')}
            aria-current={editing === 'new' ? 'true' : undefined}
            className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
              editing === 'new' ? 'bg-panel font-medium shadow-[0_0_0_1px_theme(colors.line)]' : 'text-graphite hover:bg-panel/70 hover:text-ink'
            }`}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            新建品牌规范
          </button>
        </nav>

        {editing !== null && (
          <Editor
            key={editing}
            brand={current}
            onSaved={(b) => {
              queryClient.setQueryData<Brand[]>(['brands'], (list = []) => [b, ...list.filter((x) => x.brand_id !== b.brand_id)])
              setEditing(b.brand_id)
            }}
          />
        )}
      </div>
    </div>
  )
}

function Swatches({ brand }: { brand: BrandInput }) {
  return (
    <span className="flex shrink-0 -space-x-1" aria-hidden="true">
      {[brand.primary_color, brand.accent_color, brand.text_color].map((c, i) => (
        <span key={i} className="h-4 w-4 rounded-full border border-black/10" style={{ background: c }} />
      ))}
    </span>
  )
}

function Editor({ brand, onSaved }: { brand: Brand | null; onSaved: (b: Brand) => void }) {
  const [draft, setDraft] = useState<BrandInput>(() =>
    brand ? { ...brand } : { ...DEFAULT_BRAND, name: '' },
  )
  const [fields, setFields] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)
  const dirty = !brand || (Object.keys(DEFAULT_BRAND) as (keyof BrandInput)[]).some((k) => draft[k] !== brand[k])

  const save = useMutation({
    mutationFn: () => (brand ? api.updateBrand(brand.brand_id, draft) : api.createBrand(draft)),
    onSuccess: (b) => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      onSaved(b)
    },
    onError: (e) => {
      if (e instanceof ApiError) setFields(e.fields)
    },
  })

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!draft.name.trim()) {
      setFields({ name: '填写品牌名称。' })
      return
    }
    setFields({})
    save.mutate()
  }

  const set = <K extends keyof BrandInput>(key: K, value: BrandInput[K]) => setDraft((d) => ({ ...d, [key]: value }))

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 rounded-lg border border-line bg-panel p-5 md:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-5">
        <div>
          <label htmlFor="brand-name" className="mb-1.5 block text-13 font-medium">品牌名称</label>
          <input
            id="brand-name"
            className={`field ${fields.name ? 'field-invalid' : ''}`}
            value={draft.name}
            maxLength={40}
            onChange={(e) => set('name', e.target.value)}
            autoComplete="organization"
            placeholder="例如 声乐数码"
            aria-invalid={!!fields.name}
            aria-describedby={fields.name ? 'brand-name-err' : undefined}
          />
          {fields.name && <p id="brand-name-err" className="mt-1.5 text-xs text-fault">{fields.name}</p>}
        </div>

        <fieldset>
          <legend className="mb-2 text-13 font-medium">颜色</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            <ColorField label="底色" value={draft.primary_color} onChange={(v) => set('primary_color', v)} />
            <ColorField label="强调色" hint="用于价格" value={draft.accent_color} onChange={(v) => set('accent_color', v)} />
            <ColorField label="文字色" value={draft.text_color} onChange={(v) => set('text_color', v)} />
          </div>
          <ContrastNote bg={draft.primary_color} fg={draft.text_color} accent={draft.accent_color} />
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-13 font-medium">字体</legend>
          <div className="inline-flex rounded-lg bg-paper p-1">
            {(Object.keys(FONT_LABEL) as BrandFont[]).map((f) => (
              <label
                key={f}
                className={`flex h-8 cursor-pointer items-center rounded-md px-3.5 text-13 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-mat ${
                  draft.font === f ? 'bg-panel font-medium shadow-[0_1px_2px_rgba(28,31,35,0.1)]' : 'text-graphite'
                }`}
                style={{ fontFamily: FONT_STACK[f] }}
              >
                <input type="radio" name="font" value={f} checked={draft.font === f} onChange={() => set('font', f)} className="sr-only" />
                {FONT_LABEL[f]}
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-quiet">只提供系统已授权的字体。上传自有字体需要先确认授权，正在开发中。</p>
        </fieldset>

        <div className="flex items-center gap-3 border-t border-line pt-4">
          <button type="submit" className="btn-primary" disabled={save.isPending || !dirty}>
            {save.isPending ? '正在保存…' : brand ? `保存为第 ${brand.version + 1} 版` : '保存品牌规范'}
          </button>
          {saved && (
            <span role="status" className="flex items-center gap-1 text-13 text-mat-strong">
              <Check className="h-4 w-4" aria-hidden="true" />
              已保存
            </span>
          )}
          {save.error && !(save.error instanceof ApiError && Object.keys(save.error.fields).length) && (
            <span role="alert" className="text-13 text-fault">{save.error.message}</span>
          )}
        </div>
      </div>

      <div>
        <p className="mb-2 text-13 font-medium">促销图预览</p>
        <PromoPreview brand={draft} />
        <p className="mt-2 text-xs text-quiet">示例商品与价格，仅用于查看配色。</p>
      </div>
    </form>
  )
}

function ColorField({ label, hint, value, onChange }: { label: string; hint?: string; value: string; onChange: (v: string) => void }) {
  const [text, setText] = useState(value)
  useEffect(() => setText(value), [value])
  const valid = /^#[0-9A-Fa-f]{6}$/.test(text)
  return (
    <div>
      <span className="mb-1 block text-xs text-graphite">
        {label}
        {hint && <span className="text-quiet">（{hint}）</span>}
      </span>
      <div className={`flex h-9 items-center gap-2 rounded-md border bg-panel pl-1.5 pr-2 focus-within:border-mat focus-within:ring-2 focus-within:ring-mat/20 ${valid ? 'border-line' : 'border-fault'}`}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
          aria-label={`${label}取色`}
        />
        <input
          value={text}
          onChange={(e) => {
            const v = e.target.value.trim()
            setText(v)
            if (/^#[0-9A-Fa-f]{6}$/.test(v)) onChange(v.toUpperCase())
          }}
          spellCheck={false}
          autoComplete="off"
          className="w-full min-w-0 bg-transparent font-mono text-13 uppercase outline-none"
          aria-label={`${label}色值`}
          aria-invalid={!valid}
        />
      </div>
    </div>
  )
}

function luminance(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}

function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}

function ContrastNote({ bg, fg, accent }: { bg: string; fg: string; accent: string }) {
  const text = contrast(bg, fg)
  const price = contrast(bg, accent)
  const low = [text < 4.5 && `文字色对比度 ${text.toFixed(1)}`, price < 3 && `强调色对比度 ${price.toFixed(1)}`].filter(Boolean)
  if (low.length === 0) {
    return <p className="mt-2 text-xs text-graphite">对比度：文字 {text.toFixed(1)}，价格 {price.toFixed(1)}，在手机上可读。</p>
  }
  return <p className="mt-2 text-xs text-signal">{low.join('，')}，偏低，小屏上可能看不清。</p>
}

function PromoPreview({ brand }: { brand: BrandInput }) {
  const pos = (r: readonly number[]) => ({ left: `${r[0] * 100}%`, top: `${r[1] * 100}%`, width: `${r[2] * 100}%`, height: `${r[3] * 100}%` })
  return (
    <div
      className="relative w-full overflow-hidden rounded-md border border-line"
      style={{ aspectRatio: '3 / 4', background: brand.primary_color, fontFamily: FONT_STACK[brand.font] }}
    >
      <div className="absolute flex items-center" style={pos(PROMO_REGIONS.title)}>
        <span className="text-[19px] font-semibold" style={{ color: brand.text_color }}>
          {brand.name.trim() || '品牌名称'} 无线耳机
        </span>
      </div>
      <div className="absolute" style={pos(PROMO_REGIONS.product)}>
        <ProductArt className="h-full w-full" />
      </div>
      <div className="absolute flex items-baseline gap-2" style={pos(PROMO_REGIONS.price)}>
        <span className="text-[22px] font-semibold tabular-nums" style={{ color: brand.accent_color }}>
          {formatPrice(19900)}
        </span>
        <span className="text-xs" style={{ color: brand.text_color, opacity: 0.7 }}>活动价</span>
      </div>
    </div>
  )
}
