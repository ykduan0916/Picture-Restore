import { useState } from 'react'
import { Lock } from 'lucide-react'
import ProductArt from '../components/ProductArt'
import Footer from '../components/Footer'
import { DEFAULT_BRAND } from '../lib/api'
import { PROMO_REGIONS, type DeliverableId } from '../lib/deliverables'
import { formatPrice, parsePriceMinor } from '../lib/format'
import { href } from '../lib/router'

const MODES: { id: DeliverableId; name: string; size: string; note: string }[] = [
  { id: 'white', name: '白底图', size: '2048 × 2048', note: '纯白背景加单独的接触阴影，用作主图和搜索列表。' },
  { id: 'scene', name: '场景图', size: '2048 × 2048', note: '只生成背景，商品角度和光照方向保持原图。' },
  { id: 'promo', name: '促销图', size: '1080 × 1440', note: '标题和价格是文字图层。改价格只重排文字，不重新生成图片。' },
]

export default function Home() {
  return (
    <>
      <Hero />
      <Layers />
      <Workflow />
      <Scope />
      <Closing />
      <Footer />
    </>
  )
}

function Hero() {
  return (
    <section className="border-b border-line bg-panel">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-12 px-5 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:py-20">
        <div className="min-w-0 max-w-[520px]">
          <h1 className="text-[36px] font-semibold leading-[1.15] tracking-[-0.02em] sm:text-[52px]">换背景，不换商品。</h1>
          <p className="mt-6 text-[17px] leading-8 text-graphite">
            上传一张真实商品图，填好名称和价格，得到白底图、场景图和促销图。商品区域的像素全部来自原图，文字和价格是随时能改的独立图层。
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href={href({ name: 'new' })} className="btn-primary h-11 px-6 text-[15px]">
              新建任务
            </a>
            <a href="#layers" className="btn-secondary h-11 px-5 text-[15px]">
              看看怎么做到的
            </a>
          </div>
          <p className="mt-8 max-w-[440px] border-l-2 border-signal/40 pl-3 text-13 leading-6 text-graphite">
            早期版本：上传检查、商品资料、品牌规范和任务契约已经可用，背景生成与合成正在接入。
          </p>
        </div>
        <Demo />
      </div>
    </section>
  )
}

function Demo() {
  const [mode, setMode] = useState<DeliverableId>('white')
  const [price, setPrice] = useState('199')
  const priceMinor = parsePriceMinor(price)
  const current = MODES.find((m) => m.id === mode)!
  const promo = mode === 'promo'

  const product = promo ? PROMO_REGIONS.product : ([0.17, 0.17, 0.66, 0.66] as const)
  const pos = (r: readonly number[]) => ({
    left: `${r[0] * 100}%`,
    top: `${r[1] * 100}%`,
    width: `${r[2] * 100}%`,
    height: `${r[3] * 100}%`,
  })

  return (
    <figure className="w-full min-w-0">
      <div className="stage-backdrop flex h-[360px] items-center justify-center rounded-xl sm:h-[500px]">
        <div
          className="relative overflow-hidden bg-white shadow-[0_1px_2px_rgba(28,31,35,0.08),0_16px_40px_rgba(28,31,35,0.14)] transition-[width] duration-300 ease-out"
          style={{ width: promo ? 300 : 380, aspectRatio: promo ? '3 / 4' : '1 / 1', maxWidth: '86%' }}
        >
          <SceneBackdrop visible={mode === 'scene'} />
          <div
            className="absolute inset-0 transition-opacity duration-300"
            style={{ background: DEFAULT_BRAND.primary_color, opacity: promo ? 1 : 0 }}
            aria-hidden="true"
          />

          <div className="absolute transition-all duration-300 ease-out" style={pos(product)}>
            {/* 接触阴影是单独一层 */}
            <div
              className="absolute bottom-[14%] left-1/2 h-[9%] w-[70%] -translate-x-1/2 rounded-[50%] bg-black/25 blur-[6px] transition-opacity duration-300"
              style={{ opacity: promo ? 0.5 : 1 }}
              aria-hidden="true"
            />
            <ProductArt className="relative h-full w-full" />
            <span className="pointer-events-none absolute inset-0 rounded-sm border border-dashed border-mat/70" aria-hidden="true" />
            <span className="absolute left-0 top-0 flex -translate-y-full items-center gap-1 rounded-t-sm bg-mat px-1.5 py-0.5 text-[11px] font-medium leading-none text-white">
              <Lock className="h-3 w-3" aria-hidden="true" />
              原图像素
            </span>
          </div>

          <div className="absolute flex items-center transition-opacity duration-300" style={{ ...pos(PROMO_REGIONS.title), opacity: promo ? 1 : 0 }}>
            <span className="text-[22px] font-semibold" style={{ color: DEFAULT_BRAND.text_color }}>
              无线降噪耳机
            </span>
          </div>
          <div className="absolute flex items-baseline gap-2 transition-opacity duration-300" style={{ ...pos(PROMO_REGIONS.price), opacity: promo ? 1 : 0 }}>
            <span className="text-[26px] font-semibold tabular-nums" style={{ color: DEFAULT_BRAND.accent_color }}>
              {priceMinor === null ? '¥ —' : formatPrice(priceMinor)}
            </span>
            <span className="text-xs text-graphite">活动价</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="切换素材类型" className="inline-flex rounded-lg bg-paper p-1">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={mode === m.id}
              onClick={() => setMode(m.id)}
              className={`h-8 rounded-md px-3.5 text-13 font-medium transition-colors ${
                mode === m.id ? 'bg-panel text-ink shadow-[0_1px_2px_rgba(28,31,35,0.1)]' : 'text-graphite hover:text-ink'
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
        {promo ? (
          <label className="flex items-center gap-2 text-13 text-graphite">
            试着改价格
            <span className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-quiet">¥</span>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="decimal"
                autoComplete="off"
                className="field h-8 w-24 pl-6 tabular-nums"
                aria-invalid={priceMinor === null}
              />
            </span>
          </label>
        ) : (
          <span className="text-13 tabular-nums text-quiet">{current.size} px</span>
        )}
      </div>
      <figcaption className="mt-3 text-13 leading-6 text-graphite" aria-live="polite">
        {current.note}
        <span className="text-quiet">（示意图，商品为绘制的示例。）</span>
      </figcaption>
    </figure>
  )
}

function SceneBackdrop({ visible }: { visible: boolean }) {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sb-wall" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#EEF1EC" />
          <stop offset="1" stopColor="#DCE2DA" />
        </linearGradient>
        <linearGradient id="sb-desk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D9C4A6" />
          <stop offset="1" stopColor="#C4AB88" />
        </linearGradient>
        <linearGradient id="sb-light" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity=".55" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#sb-wall)" />
      <path d="M8 0h30L18 62H0V12z" fill="url(#sb-light)" />
      <rect y="68" width="100" height="32" fill="url(#sb-desk)" />
      <rect y="68" width="100" height="1.2" fill="#B39672" opacity=".6" />
      <ellipse cx="86" cy="62" rx="7" ry="9" fill="#8FA88E" opacity=".55" />
      <rect x="84" y="62" width="4" height="7" rx="1" fill="#A88F72" opacity=".7" />
    </svg>
  )
}

function SectionHead({ title, body }: { title: string; body: string }) {
  return (
    <div className="max-w-[620px]">
      <h2 className="text-[28px] font-semibold leading-tight tracking-[-0.01em]">{title}</h2>
      <p className="mt-3 text-[15px] leading-7 text-graphite">{body}</p>
    </div>
  )
}

const LAYERS = [
  { name: '文字层', desc: '商品名、价格、卖点，全部来自你的填写，随时可改。', tone: 'text' },
  { name: '商品层', desc: '原图像素，只允许缩放、移动和边缘修整，锁定不重绘。', tone: 'product' },
  { name: '阴影层', desc: '单独生成的接触阴影，不改动商品本身。', tone: 'shadow' },
  { name: '背景层', desc: '白底或生成的场景，不满意可以单独重做。', tone: 'bg' },
] as const

function Layers() {
  return (
    <section id="layers" className="scroll-mt-16 border-b border-line">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-12 px-5 py-16 sm:px-6 sm:py-20 lg:grid-cols-2">
        <div>
          <SectionHead
            title="每张图都拆成四层"
            body="生成模型只碰背景和阴影。商品层直接取自原图，导出前会在相同的缩放下对照原图检查受保护区域，边缘被切掉的接口、Logo 会被标出来。"
          />
          <dl className="mt-8 space-y-4">
            {LAYERS.map((l) => (
              <div key={l.name} className="flex gap-4">
                <dt className={`w-16 shrink-0 text-sm font-semibold ${l.tone === 'product' ? 'text-mat-strong' : ''}`}>{l.name}</dt>
                <dd className="text-sm leading-6 text-graphite">{l.desc}</dd>
              </div>
            ))}
          </dl>
        </div>
        <LayerStack />
      </div>
    </section>
  )
}

function LayerStack() {
  // 四块倾斜的图层板，自上而下：文字、商品、阴影、背景
  const plate = 'M60 0h220l-60 64H0z'
  return (
    <svg viewBox="0 0 320 330" className="mx-auto w-full max-w-[420px]" role="img" aria-label="图层示意：文字层、商品层、阴影层、背景层自上而下叠放">
      <g transform="translate(10 246)">
        <path d={plate} fill="#DCE2DA" stroke="#C9D1C7" />
        <path d="M40 40h200l-14 16H26z" fill="#C4AB88" opacity=".7" />
      </g>
      <g transform="translate(10 166)">
        <path d={plate} fill="#FFFFFF" fillOpacity=".7" stroke="#D5D8DC" />
        <ellipse cx="140" cy="40" rx="46" ry="8" fill="#1C1F23" opacity=".18" />
      </g>
      <g transform="translate(10 86)">
        <path d={plate} fill="#E3F0EB" fillOpacity=".85" stroke="#1F6B52" strokeDasharray="4 3" />
        <g transform="translate(100 2) skewX(-43) scale(1 .32)">
          <rect x="20" y="20" width="80" height="62" rx="26" fill="#3A3F45" />
        </g>
      </g>
      <g transform="translate(10 6)">
        <path d={plate} fill="#FFFFFF" fillOpacity=".6" stroke="#D5D8DC" />
        <rect x="70" y="16" width="120" height="7" rx="3.5" fill="#1C1F23" opacity=".7" transform="skewX(-43)" />
        <rect x="58" y="34" width="60" height="9" rx="4.5" fill="#B3261E" opacity=".85" transform="skewX(-43)" />
      </g>
    </svg>
  )
}

const STEPS = [
  ['上传原图', '检查格式、尺寸和方向，记录原图指纹，之后的修改都不会覆盖它。'],
  ['填写商品资料', 'SKU、名称、价格和卖点。缺少促销图需要的价格时，任务会停下来等你补。'],
  ['生成任务契约', '写明要保护什么、允许做什么、做哪几张图，所有步骤都按它执行。'],
  ['制作与检查', '设计版式和准备商品主体同时进行，合成后对照原图检查，问题在限定次数内修复。'],
  ['审核并导出', '你确认后才算交付。导出文件按 SKU 和用途命名，未通过的不会混进合格包。'],
]

function Workflow() {
  return (
    <section className="border-b border-line bg-panel">
      <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-6 sm:py-20">
        <SectionHead title="一个 SKU 从上传到交付" body="每一步都有记录。你随时能看到任务停在哪里、为什么停。" />
        <ol className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map(([title, body], i) => (
            <li key={title} className="border-t-2 border-ink/80 pt-4">
              <span className="text-13 tabular-nums text-quiet">第 {i + 1} 步</span>
              <h3 className="mt-1 text-[15px] font-semibold">{title}</h3>
              <p className="mt-2 text-13 leading-6 text-graphite">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Scope() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-6 sm:py-20">
        <SectionHead
          title="先把一类商品做好"
          body="首版只承诺能做好的范围。遇到不适合的素材，会直接说明限制，不会生成一个看起来差不多的商品。"
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-line bg-panel p-6">
            <h3 className="text-[15px] font-semibold text-mat-strong">适合</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-graphite">
              <li>轮廓清楚、不透明、完整拍摄的硬质商品</li>
              <li>非镜面的数码配件，例如耳机、充电器、数据线</li>
              <li>正面或常规角度拍摄，光线均匀的原图</li>
            </ul>
          </div>
          <div className="rounded-lg border border-line bg-panel p-6">
            <h3 className="text-[15px] font-semibold">暂不支持</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-graphite">
              <li>透明玻璃、强反光表面、复杂毛发、细小珠宝镶嵌</li>
              <li>服装上身和虚拟试穿</li>
              <li>改变拍摄角度、补出看不见的部分、大幅重新打光</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

function Closing() {
  return (
    <section className="bg-panel">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-6 px-6 py-16">
        <div>
          <h2 className="text-[24px] font-semibold tracking-[-0.01em]">从一张商品图开始</h2>
          <p className="mt-2 text-[15px] text-graphite">准备好原图、商品名称和活动价格就够了。</p>
        </div>
        <div className="flex gap-3">
          <a href={href({ name: 'brands' })} className="btn-secondary h-11 px-5 text-[15px]">
            先设置品牌规范
          </a>
          <a href={href({ name: 'new' })} className="btn-primary h-11 px-6 text-[15px]">
            新建任务
          </a>
        </div>
      </div>
    </section>
  )
}
