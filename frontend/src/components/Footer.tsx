import { href } from '../lib/router'

export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-6 py-8 text-13 text-graphite">
        <span translate="no">Picture Restore v0.1.0</span>
        <nav aria-label="页脚" className="flex flex-wrap gap-5">
          <a href={href({ name: 'guide' })} className="hover:text-ink">使用说明</a>
          <a href={href({ name: 'brands' })} className="hover:text-ink">品牌规范</a>
          <a
            href="https://github.com/ykduan0916/Picture-Restore"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ink"
          >
            源代码
          </a>
        </nav>
      </div>
    </footer>
  )
}
