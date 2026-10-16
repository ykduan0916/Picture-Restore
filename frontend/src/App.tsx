import { useState, useEffect } from 'react'
import {
  Upload, Sparkles, Layers, Download, Settings, Zap, ChevronRight,
  Github, User, LogOut, HelpCircle, FileText, Star, Clock, Folder,
  Image as ImageIcon, Wand2, Package
} from 'lucide-react'

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [repoStats, setRepoStats] = useState({ stars: 0, forks: 0 })

  // 清理 blob URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  // 获取真实的 GitHub 数据
  useEffect(() => {
    fetch('https://api.github.com/repos/ykduan0916/Picture-Restore')
      .then(res => res.json())
      .then(data => {
        setRepoStats({
          stars: data.stargazers_count || 0,
          forks: data.forks_count || 0
        })
      })
      .catch(() => {
        setRepoStats({ stars: 0, forks: 0 })
      })
  }, [])

  const handleFileSelect = (file: File) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  return (
    <div className="min-h-screen bg-[#0A0D12] flex flex-col">
      {/* 顶部导航栏 */}
      <nav className="bg-[#0F131C]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 sticky top-0 z-50" role="navigation" aria-label="主导航">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <a href="/" className="flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-cyan-500 rounded-lg">
              <div className="relative w-10 h-10 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center" aria-hidden="true">
                <Sparkles className="w-5 h-5 text-white" />
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-purple-600/20 rounded-xl blur-xl"></div>
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                  Picture Restore
                </h1>
                <p className="text-xs text-white/40">AI 商品图生成平台</p>
              </div>
            </a>

            {/* 导航链接 */}
            <div className="hidden lg:flex items-center gap-1" role="menubar">
              <NavLink href="/" active>工作台</NavLink>
              <NavLink href="/projects">项目</NavLink>
              <NavLink href="/templates">模板</NavLink>
              <NavLink href="/docs">文档</NavLink>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* GitHub Star 按钮 */}
            <a
              href="https://github.com/ykduan0916/Picture-Restore"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/10 backdrop-blur-sm focus-visible:outline-2 focus-visible:outline-cyan-500"
              aria-label={`在 GitHub 上给项目加星，当前有 ${repoStats.stars} 个星标`}
            >
              <Github className="w-4 h-4 text-white/60" aria-hidden="true" />
              <span className="text-sm font-medium text-white/80">Star</span>
              {repoStats.stars > 0 && (
                <span className="px-2 py-0.5 bg-white/10 rounded-lg text-xs text-white/90 font-semibold" aria-live="polite">
                  {repoStats.stars}
                </span>
              )}
            </a>

            {/* 升级按钮 */}
            <button
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl text-white font-medium transition shadow-lg shadow-cyan-500/20 focus-visible:outline-2 focus-visible:outline-cyan-500"
              aria-label="升级到专业版"
            >
              <Zap className="w-4 h-4" aria-hidden="true" />
              升级专业版
            </button>

            {/* 用户菜单 */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/10 focus-visible:outline-2 focus-visible:outline-cyan-500"
                aria-label="用户菜单"
                aria-expanded={showUserMenu}
                aria-haspopup="true"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-lg flex items-center justify-center" aria-hidden="true">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium text-white">ykduan0916</p>
                  <p className="text-xs text-white/40">免费版</p>
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-[#161D2B] rounded-2xl shadow-2xl border border-white/10 py-2 backdrop-blur-xl" role="menu">
                  <div className="px-4 py-3 border-b border-white/5">
                    <p className="text-sm font-semibold text-white">ykduan0916</p>
                    <p className="text-xs text-white/40">ykduan0916@users.noreply.github.com</p>
                  </div>
                  <MenuItem icon={<User />} text="个人资料" />
                  <MenuItem icon={<Settings />} text="账号设置" />
                  <MenuItem icon={<FileText />} text="使用统计" />
                  <div className="border-t border-white/5 mt-2 pt-2">
                    <MenuItem icon={<LogOut />} text="退出登录" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-1">
        {/* 左侧边栏 */}
        <aside className="w-72 bg-[#0F131C]/40 backdrop-blur-xl border-r border-white/5 flex flex-col" role="complementary" aria-label="侧边栏导航">
          <div className="p-4 space-y-6 flex-1 overflow-y-auto">
            {/* 工作区 */}
            <nav aria-label="工作区">
              <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 px-3">
                工作区
              </h2>
              <div className="space-y-1">
                <SidebarItem icon={<Sparkles />} text="新建项目" badge="New" active />
                <SidebarItem icon={<Clock />} text="最近使用" />
                <SidebarItem icon={<Star />} text="收藏夹" />
              </div>
            </nav>

            {/* 我的项目 */}
            <nav aria-label="我的项目">
              <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 px-3">
                我的项目
              </h2>
              <div className="space-y-1">
                <SidebarItem icon={<Folder />} text="商品白底图" />
                <SidebarItem icon={<Folder />} text="场景图生成" />
                <SidebarItem icon={<Folder />} text="促销海报" />
              </div>
            </nav>

            {/* 模板库 */}
            <nav aria-label="模板库">
              <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 px-3">
                模板库
              </h2>
              <div className="space-y-1">
                <SidebarItem icon={<ImageIcon />} text="电商主图" />
                <SidebarItem icon={<ImageIcon />} text="社交媒体" />
                <SidebarItem icon={<ImageIcon />} text="宣传海报" />
              </div>
            </nav>
          </div>

          {/* 额度卡片 */}
          <div className="p-4 border-t border-white/5">
            <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-xl p-4 border border-cyan-500/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-white">本月额度</span>
                <span className="text-sm font-bold text-cyan-400">
                  <span aria-label="已使用 0 个，总共 100 个">0 / 100</span>
                </span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2 mb-3" role="progressbar" aria-valuenow={0} aria-valuemin={0} aria-valuemax={100}>
                <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
              <button className="w-full text-xs text-cyan-400 hover:text-cyan-300 font-medium transition focus-visible:outline-2 focus-visible:outline-cyan-500 rounded">
                升级获取更多 →
              </button>
            </div>
          </div>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 overflow-y-auto" role="main">
          <div className="max-w-[1600px] mx-auto px-8 py-10">
            {!selectedFile ? (
              <WelcomeScreen onFileSelect={handleFileSelect} repoStats={repoStats} />
            ) : (
              <EditorView file={selectedFile} previewUrl={previewUrl} />
            )}
          </div>
        </main>
      </div>

      {/* 底部信息栏 */}
      <footer className="bg-[#0F131C]/60 backdrop-blur-xl border-t border-white/5 px-6 py-4" role="contentinfo">
        <div className="max-w-[1920px] mx-auto flex items-center justify-between text-xs text-white/40">
          <div className="flex items-center gap-6">
            <span>© 2024 Picture Restore</span>
            <a href="https://github.com/ykduan0916/Picture-Restore" target="_blank" rel="noopener noreferrer" className="hover:text-white/80 flex items-center gap-1.5 transition focus-visible:outline-2 focus-visible:outline-cyan-500 rounded">
              <Github className="w-3.5 h-3.5" aria-hidden="true" />
              开源项目
            </a>
            <a href="#privacy" className="hover:text-white/80 transition focus-visible:outline-2 focus-visible:outline-cyan-500 rounded">隐私政策</a>
            <a href="#terms" className="hover:text-white/80 transition focus-visible:outline-2 focus-visible:outline-cyan-500 rounded">服务条款</a>
          </div>
          <div className="flex items-center gap-6">
            <StatusDot color="green" label="API" />
            <StatusDot color="yellow" label="数据库" />
            <StatusDot color="yellow" label="存储" />
            <span>v0.1.0</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

function NavLink({ href, children, active = false }: { href: string; children: React.ReactNode; active?: boolean }) {
  return (
    <a
      href={href}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-cyan-500 ${
        active
          ? 'bg-white/10 text-white'
          : 'text-white/60 hover:text-white hover:bg-white/5'
      }`}
      aria-current={active ? 'page' : undefined}
      role="menuitem"
    >
      {children}
    </a>
  )
}

function MenuItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <button
      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition focus-visible:outline-2 focus-visible:outline-cyan-500"
      role="menuitem"
    >
      <span className="w-4 h-4 text-white/40" aria-hidden="true">{icon}</span>
      {text}
    </button>
  )
}

function SidebarItem({
  icon,
  text,
  badge,
  active = false
}: {
  icon: React.ReactNode
  text: string
  badge?: string
  active?: boolean
}) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition focus-visible:outline-2 focus-visible:outline-cyan-500 ${
        active
          ? 'bg-gradient-to-r from-cyan-500/10 to-blue-600/10 text-white border border-cyan-500/20'
          : 'text-white/60 hover:text-white hover:bg-white/5'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <span className={`w-4 h-4 ${active ? 'text-cyan-400' : 'text-white/40'}`} aria-hidden="true">
        {icon}
      </span>
      <span className="flex-1 text-left font-medium">{text}</span>
      {badge && (
        <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-lg font-semibold">
          {badge}
        </span>
      )}
    </button>
  )
}

function StatusDot({ color, label }: { color: 'green' | 'yellow' | 'red'; label: string }) {
  const colorClasses = {
    green: 'bg-emerald-400',
    yellow: 'bg-amber-400',
    red: 'bg-red-400'
  }

  const statusText = {
    green: '正常',
    yellow: '待配置',
    red: '离线'
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-1.5 h-1.5 rounded-full ${colorClasses[color]} ${color === 'green' ? 'animate-pulse' : ''}`}
        role="status"
        aria-label={`${label}状态：${statusText[color]}`}
      />
      <span>{label}</span>
    </div>
  )
}

function WelcomeScreen({ onFileSelect, repoStats }: { onFileSelect: (file: File) => void; repoStats: { stars: number; forks: number } }) {
  return (
    <div className="space-y-10">
      {/* Hero 区域 */}
      <header className="text-center space-y-6 py-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 rounded-full border border-cyan-500/20">
          <Sparkles className="w-4 h-4 text-cyan-400" aria-hidden="true" />
          <span className="text-sm font-medium text-cyan-400">AI 驱动的智能商品图生成</span>
        </div>
        <h1 className="text-6xl font-bold bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent leading-tight">
          让每个商品图<br />都成为艺术品
        </h1>
        <p className="text-xl text-white/50 max-w-2xl mx-auto">
          上传商品原图，AI 自动生成白底图、场景图、促销图等多种营销素材<br />
          保持 100% 商品细节，一键导出多平台规格
        </p>
      </header>

      {/* 上传区域 */}
      <div className="max-w-4xl mx-auto">
        <div
          className="relative group"
          onDrop={(e) => {
            e.preventDefault()
            const file = e.dataTransfer.files[0]
            if (file && file.type.startsWith('image/')) {
              onFileSelect(file)
            }
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-3xl blur-3xl opacity-20 group-hover:opacity-30 transition" aria-hidden="true"></div>
          <label className="relative cursor-pointer block">
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onFileSelect(file)
              }}
              aria-label="上传商品图片"
            />
            <div className="bg-[#161D2B] border-2 border-dashed border-white/10 hover:border-cyan-500/50 rounded-3xl p-16 text-center transition">
              <div className="flex flex-col items-center gap-6">
                <div className="relative w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition" aria-hidden="true">
                  <Upload className="w-12 h-12 text-white" />
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 rounded-2xl blur-2xl"></div>
                </div>
                <div className="space-y-3">
                  <p className="text-2xl font-bold text-white">
                    点击上传或拖拽图片到此处
                  </p>
                  <p className="text-white/50">
                    支持 JPG、PNG 格式，最大 10MB
                  </p>
                </div>
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* 功能展示 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
        <FeatureCardV2
          icon={<Layers />}
          title="智能分层编辑"
          description="AI 自动识别商品主体、背景、阴影，分层管理，随时可调整"
          gradient="from-cyan-500 to-blue-600"
        />
        <FeatureCardV2
          icon={<Wand2 />}
          title="AI 场景生成"
          description="一键生成室内、户外、极简等多种场景，符合品牌调性"
          gradient="from-purple-500 to-pink-600"
        />
        <FeatureCardV2
          icon={<Package />}
          title="商品保真技术"
          description="商品像素来自原图，保证色彩、纹理、细节 100% 还原"
          gradient="from-orange-500 to-red-600"
        />
      </div>

      {/* 快速开始 */}
      <article className="bg-gradient-to-br from-[#161D2B] to-[#1E2636] rounded-2xl p-8 border border-white/10 max-w-3xl mx-auto mt-8">
        <h2 className="text-lg font-bold text-white mb-6">快速开始</h2>
        <ol className="space-y-4">
          <StepItem number={1} text="上传商品原图" />
          <StepItem number={2} text="选择生成类型（白底/场景/促销）" />
          <StepItem number={3} text="AI 自动生成，保持商品细节" />
          <StepItem number={4} text="下载或继续编辑" />
        </ol>
      </article>
    </div>
  )
}

function EditorView({ file, previewUrl }: { file: File; previewUrl: string | null }) {
  return (
    <div className="space-y-6">
      {/* 工具栏 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">编辑器</h2>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition border border-white/10 focus-visible:outline-2 focus-visible:outline-cyan-500">
            预览
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg shadow-cyan-500/20 transition focus-visible:outline-2 focus-visible:outline-cyan-500">
            <span className="flex items-center gap-2">
              <Download className="w-4 h-4" aria-hidden="true" />
              导出
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 原图 */}
        <section className="bg-[#161D2B] rounded-2xl p-6 border border-white/10">
          <h3 className="text-sm font-semibold text-white mb-4">原始图片</h3>
          {previewUrl && (
            <img
              src={previewUrl}
              alt={`上传的商品图片：${file.name}`}
              className="w-full rounded-xl border border-white/10 mb-3"
              loading="lazy"
            />
          )}
          <p className="text-xs text-white/40">
            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        </section>

        {/* 生成选项 */}
        <section className="bg-[#161D2B] rounded-2xl p-6 border border-white/10">
          <h3 className="text-sm font-semibold text-white mb-4">生成类型</h3>
          <fieldset className="space-y-3 mb-6">
            <legend className="sr-only">选择生成类型</legend>
            <GenerateOption type="白底图" description="纯白背景，适合电商主图" />
            <GenerateOption type="场景图" description="AI 生成真实场景" />
            <GenerateOption type="促销图" description="添加文案和装饰元素" />
          </fieldset>
          <button className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg shadow-cyan-500/20 transition focus-visible:outline-2 focus-visible:outline-cyan-500">
            开始生成
          </button>
        </section>

        {/* 结果 */}
        <section className="bg-[#161D2B] rounded-2xl p-6 border border-white/10">
          <h3 className="text-sm font-semibold text-white mb-4">生成结果</h3>
          <div className="border-2 border-dashed border-white/10 rounded-xl p-16 text-center" role="status" aria-live="polite">
            <Sparkles className="w-16 h-16 mx-auto mb-3 text-white/20" aria-hidden="true" />
            <p className="text-sm text-white/40">生成结果将显示在这里</p>
          </div>
        </section>
      </div>
    </div>
  )
}

function FeatureCardV2({ icon, title, description, gradient }: {
  icon: React.ReactNode
  title: string
  description: string
  gradient: string
}) {
  return (
    <article className="group relative">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-2xl blur-2xl opacity-0 group-hover:opacity-20 transition`} aria-hidden="true"></div>
      <div className="relative bg-[#161D2B] rounded-2xl p-6 border border-white/10 hover:border-white/20 transition">
        <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center mb-4`} aria-hidden="true">
          <span className="text-white">{icon}</span>
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-white/50">{description}</p>
      </div>
    </article>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white/5 rounded-xl p-4 text-center border border-white/5">
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-white/40">{label}</div>
    </div>
  )
}

function StepItem({ number, text }: { number: number; text: string }) {
  return (
    <li className="flex items-center gap-4">
      <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
        <span className="text-sm font-bold text-white">{number}</span>
      </div>
      <p className="text-sm text-white/70">{text}</p>
      <ChevronRight className="w-4 h-4 text-white/20 ml-auto" aria-hidden="true" />
    </li>
  )
}

function GenerateOption({ type, description }: { type: string; description: string }) {
  return (
    <label className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer transition border border-white/5 hover:border-cyan-500/30 focus-within:outline-2 focus-within:outline-cyan-500">
      <input type="radio" name="generate-type" className="w-4 h-4 accent-cyan-500 focus-visible:outline-2 focus-visible:outline-cyan-500" />
      <div className="flex-1">
        <p className="font-medium text-white text-sm mb-0.5">{type}</p>
        <p className="text-xs text-white/40">{description}</p>
      </div>
    </label>
  )
}

export default App
