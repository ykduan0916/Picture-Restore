/** 首页演示用的示意商品（自绘耳机充电盒），不是任何真实商品或生成结果 */
export default function ProductArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="pa-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4A5058" />
          <stop offset="1" stopColor="#2B2F34" />
        </linearGradient>
        <linearGradient id="pa-lid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5A616A" />
          <stop offset="1" stopColor="#40464D" />
        </linearGradient>
      </defs>
      <rect x="34" y="58" width="132" height="100" rx="44" fill="url(#pa-body)" />
      <path d="M34 98a44 44 0 0 1 44-40h44a44 44 0 0 1 44 40z" fill="url(#pa-lid)" />
      <path d="M36 98h128" stroke="#23272B" strokeWidth="1.5" />
      <path d="M62 68c10-5 24-6 38-6" stroke="#fff" strokeOpacity=".22" strokeWidth="3" strokeLinecap="round" fill="none" />
      <rect x="92" y="104" width="16" height="4" rx="2" fill="#7FD1A8" />
      <text x="100" y="138" textAnchor="middle" fontSize="11" fontWeight="600" fill="#8A929C" letterSpacing="1.5">
        L7
      </text>
    </svg>
  )
}
