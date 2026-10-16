import { useState } from 'react'
import {
  Upload, Image, Sparkles, Layers, Download, Settings, Zap, ChevronRight,
  Github, Menu, X, User, LogOut, HelpCircle, FileText, Star, Clock, Folder
} from 'lucide-react'

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* 顶部导航栏 */}
      <nav className="bg-white border-b border-slate-200 px-6 py-3 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 hover:bg-slate-100 rounded-lg transition lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Picture Restore</h1>
                <p className="text-xs text-slate-500 hidden sm:block">AI 商品图生成平台</p>
              </div>
            </div>

            {/* 导航链接 */}
            <div className="hidden md:flex items-center gap-1 ml-8">
              <NavLink href="#" active>工作台</NavLink>
              <NavLink href="#projects">我的项目</NavLink>
              <NavLink href="#templates">模板库</NavLink>
              <NavLink href="#docs">文档</NavLink>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* GitHub Star */}
            <a
              href="https://github.com/ykduan0916/Picture-Restore"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg transition border border-slate-200"
            >
              <Github className="w-4 h-4" />
              <span className="text-sm font-medium">Star</span>
              <span className="text-xs bg-slate-200 px-1.5 py-0.5 rounded">128</span>
            </a>

            {/* 帮助 */}
            <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition">
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* 升级按钮 */}
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">升级专业版</span>
            </button>

            {/* 用户菜单 */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-lg transition"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-cyan-500 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium text-slate-900">ykduan0916</p>
                  <p className="text-xs text-slate-500">免费版</p>
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 py-2">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900">ykduan0916</p>
                    <p className="text-xs text-slate-500">ykduan0916@users.noreply.github.com</p>
                  </div>
                  <MenuItem icon={<User />} text="个人资料" />
                  <MenuItem icon={<Settings />} text="账号设置" />
                  <MenuItem icon={<FileText />} text="使用统计" />
                  <div className="border-t border-slate-100 mt-2 pt-2">
                    <MenuItem icon={<LogOut />} text="退出登录" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* 左侧边栏 */}
        {showSidebar && (
          <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
            <div className="p-4 space-y-1 flex-1 overflow-y-auto">
              <SidebarSection title="工作区">
                <SidebarItem icon={<Sparkles />} text="新建项目" badge="New" active />
                <SidebarItem icon={<Clock />} text="最近使用" count={8} />
                <SidebarItem icon={<Star />} text="收藏夹" count={3} />
              </SidebarSection>

              <SidebarSection title="我的项目">
                <SidebarItem icon={<Folder />} text="商品白底图" count={12} />
                <SidebarItem icon={<Folder />} text="场景图生成" count={5} />
                <SidebarItem icon={<Folder />} text="促销海报" count={8} />
              </SidebarSection>

              <SidebarSection title="模板库">
                <SidebarItem icon={<Image />} text="电商主图" />
                <SidebarItem icon={<Image />} text="社交媒体" />
                <SidebarItem icon={<Image />} text="宣传海报" />
              </SidebarSection>
            </div>

            {/* 底部信息 */}
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>本月额度</span>
                  <span className="font-medium">23 / 100</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-1.5 rounded-full" style={{ width: '23%' }}></div>
                </div>
                <a href="#upgrade" className="text-blue-600 hover:underline text-xs font-medium">
                  升级获取更多额度 →
                </a>
              </div>
            </div>
          </aside>
        )}

        {/* 主内容区 */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto px-6 py-8">
            {!selectedFile ? (
              <WelcomeScreen onFileSelect={handleFileSelect} />
            ) : (
              <EditorView file={selectedFile} previewUrl={previewUrl} />
            )}
          </div>
        </main>
      </div>

      {/* 底部信息栏 */}
      <footer className="bg-white border-t border-slate-200 px-6 py-3">
        <div className="max-w-[1920px] mx-auto flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span>© 2024 Picture Restore</span>
            <a href="https://github.com/ykduan0916/Picture-Restore" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 flex items-center gap-1">
              <Github className="w-3 h-3" />
              开源项目
            </a>
            <a href="#privacy" className="hover:text-slate-900">隐私政策</a>
            <a href="#terms" className="hover:text-slate-900">服务条款</a>
          </div>
          <div className="flex items-center gap-4">
            <StatusDot color="green" label="API" />
            <StatusDot color="green" label="数据库" />
            <StatusDot color="yellow" label="存储" />
            <span>版本 v0.1.0</span>
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
      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
        active
          ? 'bg-slate-100 text-slate-900'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
      }`}
    >
      {children}
    </a>
  )
}

function MenuItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition">
      <span className="w-4 h-4 text-slate-400">{icon}</span>
      {text}
    </button>
  )
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
        {title}
      </h3>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  )
}

function SidebarItem({
  icon,
  text,
  count,
  badge,
  active = false
}: {
  icon: React.ReactNode
  text: string
  count?: number
  badge?: string
  active?: boolean
}) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
        active
          ? 'bg-blue-50 text-blue-700 font-medium'
          : 'text-slate-700 hover:bg-slate-50'
      }`}
    >
      <span className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-slate-400'}`}>
        {icon}
      </span>
      <span className="flex-1 text-left">{text}</span>
      {count !== undefined && (
        <span className="text-xs text-slate-400 font-medium">{count}</span>
      )}
      {badge && (
        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
          {badge}
        </span>
      )}
    </button>
  )
}

function StatusDot({ color, label }: { color: 'green' | 'yellow' | 'red'; label: string }) {
  const colorClasses = {
    green: 'bg-green-400',
    yellow: 'bg-yellow-400',
    red: 'bg-red-400'
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${colorClasses[color]} ${color === 'green' ? 'animate-pulse' : ''}`} />
      <span>{label}</span>
    </div>
  )
}

function WelcomeScreen({ onFileSelect }: { onFileSelect: (file: File) => void }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* 左侧：上传区域 */}
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            智能商品图生成
          </h2>
          <p className="text-lg text-slate-600">
            上传商品原图，AI 自动生成白底图、场景图、促销图等多种营销素材
          </p>
        </div>

        <div
          className="relative border-2 border-dashed border-slate-300 rounded-2xl p-12 bg-white hover:border-blue-400 hover:bg-blue-50/50 transition cursor-pointer group"
          onDrop={(e) => {
            e.preventDefault()
            const file = e.dataTransfer.files[0]
            if (file && file.type.startsWith('image/')) {
              onFileSelect(file)
            }
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <label className="cursor-pointer block text-center">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onFileSelect(file)
              }}
            />
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900 mb-1">
                  点击上传或拖拽图片到此处
                </p>
                <p className="text-sm text-slate-500">
                  支持 JPG、PNG 格式，最大 10MB
                </p>
              </div>
            </div>
          </label>
        </div>

        {/* 快速开始步骤 */}
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">快速开始</h3>
          <div className="space-y-3">
            <Step number={1} text="上传商品原图" />
            <Step number={2} text="选择生成类型（白底/场景/促销）" />
            <Step number={3} text="AI 自动生成，保持商品细节" />
            <Step number={4} text="下载或继续编辑" />
          </div>
        </div>
      </div>

      {/* 右侧：特性展示 */}
      <div className="space-y-4">
        <FeatureCard
          icon={<Layers className="w-6 h-6" />}
          title="智能分层编辑"
          description="AI 自动识别商品主体、背景、阴影，分层管理，随时可调整"
          color="from-blue-500 to-cyan-500"
        />
        <FeatureCard
          icon={<Sparkles className="w-6 h-6" />}
          title="AI 场景生成"
          description="一键生成室内、户外、极简等多种场景，符合品牌调性"
          color="from-purple-500 to-pink-500"
        />
        <FeatureCard
          icon={<Image className="w-6 h-6" />}
          title="商品保真技术"
          description="商品像素来自原图，保证色彩、纹理、细节 100% 还原"
          color="from-orange-500 to-red-500"
        />
        <FeatureCard
          icon={<Download className="w-6 h-6" />}
          title="批量导出"
          description="一次生成多个尺寸规格，直接适配淘宝、京东、拼多多"
          color="from-green-500 to-emerald-500"
        />

        {/* GitHub 仓库信息 */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 text-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold mb-1">开源项目</h3>
              <p className="text-xs text-slate-400">欢迎 Star 和贡献代码</p>
            </div>
            <Github className="w-8 h-8 text-slate-400" />
          </div>

          <a
            href="https://github.com/ykduan0916/Picture-Restore"
            target="_blank"
            rel="noopener noreferrer"
            className="block mb-3 text-blue-400 hover:underline font-mono text-sm"
          >
            github.com/ykduan0916/Picture-Restore
          </a>

          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="bg-white/10 rounded-lg py-2">
              <div className="text-lg font-bold">128</div>
              <div className="text-slate-400">Stars</div>
            </div>
            <div className="bg-white/10 rounded-lg py-2">
              <div className="text-lg font-bold">24</div>
              <div className="text-slate-400">Forks</div>
            </div>
            <div className="bg-white/10 rounded-lg py-2">
              <div className="text-lg font-bold">v0.1</div>
              <div className="text-slate-400">版本</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function EditorView({ file, previewUrl }: { file: File; previewUrl: string | null }) {
  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {/* 左侧：原图预览 */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">原始图片</h3>
          {previewUrl && (
            <img
              src={previewUrl}
              alt={file.name}
              className="w-full rounded-lg border border-slate-200"
            />
          )}
          <div className="text-xs text-slate-500">
            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </div>
        </div>

        {/* 中间：生成选项 */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">生成类型</h3>
          <div className="space-y-2">
            <GenerateOption type="白底图" description="纯白背景，适合电商主图" />
            <GenerateOption type="场景图" description="AI 生成真实场景" />
            <GenerateOption type="促销图" description="添加文案和装饰元素" />
          </div>
          <button className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition">
            开始生成
          </button>
        </div>

        {/* 右侧：结果预览 */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">生成结果</h3>
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-12 text-center text-slate-400">
            <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">生成结果将显示在这里</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Step({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
        {number}
      </div>
      <p className="text-sm text-slate-700">{text}</p>
      <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
    </div>
  )
}

function FeatureCard({ icon, title, description, color }: {
  icon: React.ReactNode
  title: string
  description: string
  color: string
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition group">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white group-hover:scale-110 transition flex-shrink-0`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
      </div>
    </div>
  )
}

function GenerateOption({ type, description }: { type: string; description: string }) {
  return (
    <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition">
      <input type="radio" name="generate-type" className="w-4 h-4 text-blue-600" />
      <div>
        <p className="font-medium text-slate-900 text-sm">{type}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </label>
  )
}

export default App
