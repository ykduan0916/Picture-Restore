import { href } from '../lib/router'

// 内容摘自 docs/01-product-requirements.md，面向使用者改写
export default function Guide() {
  return (
    <article className="mx-auto max-w-[720px] px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Picture Restore 能做什么</h1>
      <p className="mt-3 text-[15px] leading-7 text-graphite">
        把一个 SKU 的真实商品图和商品资料，做成白底图、场景图和促销图各一张。每张都可以审核，促销文字可以单独修改，确认后整套导出。
      </p>

      <Section title="商品不会被重新画">
        <p>
          商品区域的像素直接取自你上传的原图，只允许缩放、移动和边缘修整。形状、颜色、Logo、接口和数量不会被模型重新理解或修改。场景图只生成背景，接触阴影是单独一层。
        </p>
      </Section>

      <Section title="图上的文字只来自你填写的内容">
        <p>
          商品名、价格、单位和卖点都按你的填写排版，是独立的文字图层。改价格不需要重新生成图片。系统不会推断销量、优惠幅度、功效或认证。缺少促销图需要的价格时，任务会停下来等你补充。
        </p>
      </Section>

      <Section title="一个任务会经过哪些步骤">
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>检查图片格式、大小和方向，原图只读保存。</li>
          <li>根据你的资料生成任务契约，写明要保护什么、允许做什么。</li>
          <li>设计版式和准备商品主体同时进行，再合成并排版。</li>
          <li>对照原图检查商品区域和文字，有问题会在限定次数内修复。</li>
          <li>你审核并确认后，才算交付完成。</li>
        </ol>
      </Section>

      <Section title="适合的商品">
        <p>首版适合轮廓清楚、不透明、完整拍摄的硬质商品，例如非镜面的数码配件。</p>
        <p className="mt-3">
          暂不支持：透明玻璃、强反光表面、复杂毛发、细小珠宝镶嵌、服装上身、虚拟试穿、改变拍摄角度和大幅重新打光。遇到这些情况，系统会说明限制，不会生成一个近似的商品。
        </p>
      </Section>

      <Section title="上传要求">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>JPEG、PNG 或 WebP，按文件内容识别，不看扩展名。</li>
          <li>单张不超过 20 MB、2000 万像素，最长边不超过 8192 px。</li>
          <li>分辨率低或商品被遮挡时会给出提示，看不见的细节无法补回来。</li>
        </ul>
      </Section>

      <Section title="现在的进度">
        <p>
          这是早期版本。上传检查、商品资料和任务契约已经可用；背景生成、合成和质量检查还在接入中，所以任务创建后暂时不会自动生成图片。
        </p>
      </Section>

      <div className="mt-10 border-t border-line pt-6">
        <a href={href({ name: 'new' })} className="btn-primary">
          新建任务
        </a>
      </div>
    </article>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-9">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="mt-2.5 text-[15px] leading-7 text-graphite">{children}</div>
    </section>
  )
}
