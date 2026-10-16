import { useState } from 'react'
import { Upload, Image, Sparkles, Layers, Download, Settings, Zap, ChevronRight } from 'lucide-react'

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* 顶部导航栏 */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Picture Restore</h1>
              <p className="text-xs text-slate-500">AI 商品图生成平台</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition">
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">设置</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">升级专业版</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {!selectedFile ? (
          <WelcomeScreen onFileSelect={handleFileSelect} />
        ) : (
          <EditorView file={selectedFile} previewUrl={previewUrl} />
        )}
      </div>
    </div>
  )
}

function WelcomeScreen({ onFileSelect }: { onFileSelect: (file: File) => void }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
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

        {/* 系统状态 */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 text-white">
          <h3 className="text-sm font-semibold mb-4">系统状态</h3>
          <div className="space-y-2 text-sm">
            <StatusItem label="前端服务" status="running" url="http://localhost:5175" />
            <StatusItem label="后端 API" status="running" url="http://localhost:8888" />
            <StatusItem label="数据库" status="pending" />
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
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white group-hover:scale-110 transition`}>
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

function StatusItem({ label, status, url }: { label: string; status: 'running' | 'pending'; url?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-300">{label}</span>
      {status === 'running' ? (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          {url ? (
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline text-xs">
              运行中
            </a>
          ) : (
            <span className="text-green-400 text-xs">运行中</span>
          )}
        </div>
      ) : (
        <span className="text-yellow-400 text-xs">待配置</span>
      )}
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
