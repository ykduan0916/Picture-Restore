import { useRef, useState, type DragEvent } from 'react'
import { ImageUp, Lock } from 'lucide-react'
import type { Inspection } from '../lib/image'
import { DELIVERABLE_NAME, PROMO_REGIONS, type DeliverableId } from '../lib/deliverables'
import { formatPrice } from '../lib/format'

interface StageProps {
  image: Inspection | null
  busy: boolean
  error: string | null
  frame: { id: DeliverableId; width: number; height: number } | null
  productName: string
  priceMinor: number | null
  onFile: (file: File) => void
}

/**
 * 商品原图在中性灰台面上展示，外面叠加当前选中素材的画幅。
 * 商品区域标注为受保护：预览只说明构图，不代表生成结果。
 */
export default function Stage({ image, busy, error, frame, productName, priceMinor, onFile }: StageProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  const picker = (
    <input
      ref={inputRef}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      className="sr-only"
      tabIndex={-1}
      aria-hidden="true"
      onChange={(e) => {
        const file = e.target.files?.[0]
        if (file) onFile(file)
        e.target.value = ''
      }}
    />
  )

  if (!image) {
    return (
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`stage-backdrop relative flex h-full min-h-[420px] items-center justify-center rounded-lg transition-[box-shadow] ${
          dragging ? 'shadow-[inset_0_0_0_2px_theme(colors.mat.DEFAULT)]' : ''
        }`}
      >
        {picker}
        <div className="flex max-w-sm flex-col items-center rounded-lg bg-panel px-8 py-9 text-center shadow-[0_1px_2px_rgba(28,31,35,0.06),0_8px_24px_rgba(28,31,35,0.08)]">
          <ImageUp className="mb-4 h-8 w-8 text-graphite" strokeWidth={1.5} aria-hidden="true" />
          <h2 className="text-base font-semibold">放入一张商品原图</h2>
          <p className="mt-2 text-13 text-graphite">
            拖到这里，或从电脑里选择。原图只读保存，商品本身不会被重新生成。
          </p>
          <button type="button" className="btn-primary mt-5" onClick={() => inputRef.current?.click()} disabled={busy}>
            {busy ? '正在检查图片…' : '选择图片'}
          </button>
          <p className="mt-4 text-xs text-quiet">JPEG、PNG、WebP，20 MB 以内，最长边不超过 8192 px</p>
          {error && (
            <p role="alert" className="mt-4 rounded-md bg-fault-soft px-3 py-2 text-left text-13 text-fault">
              {error}
            </p>
          )}
        </div>
      </div>
    )
  }

  const ratio = frame ? frame.width / frame.height : image.width / image.height
  // 按画幅计算商品所在区域
  const product = frame?.id === 'promo' ? PROMO_REGIONS.product : ([0.12, 0.12, 0.76, 0.76] as const)
  const box = (r: readonly number[]) => ({
    left: `${r[0] * 100}%`,
    top: `${r[1] * 100}%`,
    width: `${r[2] * 100}%`,
    height: `${r[3] * 100}%`,
  })

  return (
    <div
      className="stage-backdrop relative flex h-full flex-col overflow-hidden rounded-lg"
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      {picker}
      <div className="flex min-h-0 flex-1 items-center justify-center p-6 sm:p-10">
        <figure
          className="relative max-h-full max-w-full overflow-hidden bg-white shadow-[0_1px_2px_rgba(28,31,35,0.08),0_12px_32px_rgba(28,31,35,0.12)]"
          style={{ aspectRatio: `${ratio}`, height: ratio >= 1 ? 'auto' : '100%', width: ratio >= 1 ? '100%' : 'auto' }}
        >
          {frame?.id === 'scene' && (
            <div
              className="absolute inset-0"
              style={{
                background:
                  'repeating-linear-gradient(135deg, #EEF0F2 0 10px, #F6F7F8 10px 20px)',
              }}
              aria-hidden="true"
            />
          )}

          <div className="absolute" style={box(product)}>
            <img
              src={image.url}
              alt={`商品原图：${image.fileName}`}
              width={image.width}
              height={image.height}
              className="h-full w-full object-contain"
              draggable={false}
            />
            <span className="pointer-events-none absolute inset-0 rounded-sm border border-dashed border-mat/70" aria-hidden="true" />
            <span className="absolute -top-px left-0 flex -translate-y-full items-center gap-1 rounded-t-sm bg-mat px-1.5 py-0.5 text-[11px] font-medium leading-none text-white">
              <Lock className="h-3 w-3" aria-hidden="true" />
              商品像素保留原图
            </span>
          </div>

          {frame?.id === 'promo' && (
            <>
              <div className="absolute flex items-center" style={box(PROMO_REGIONS.title)}>
                <span className="truncate text-[clamp(14px,3.2vw,30px)] font-semibold text-ink">
                  {productName.trim() || '商品名称'}
                </span>
              </div>
              <div className="absolute flex items-center" style={box(PROMO_REGIONS.price)}>
                <span
                  className={`text-[clamp(14px,3.4vw,32px)] font-semibold tabular-nums ${
                    priceMinor === null ? 'text-quiet' : 'text-fault'
                  }`}
                >
                  {priceMinor === null ? '价格待填写' : formatPrice(priceMinor)}
                </span>
              </div>
            </>
          )}
        </figure>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-black/5 bg-panel/80 px-4 py-2.5 text-xs text-graphite backdrop-blur">
        <span className="truncate">
          {frame ? `${DELIVERABLE_NAME[frame.id]}构图预览，背景和文字在生成时制作。` : '原图预览'}
        </span>
        <button type="button" className="btn-quiet h-7 shrink-0 text-xs" onClick={() => inputRef.current?.click()}>
          更换原图
        </button>
      </div>
    </div>
  )
}
