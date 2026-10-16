import { useState } from 'react'
import { Upload, Layers, Sparkles, Image as ImageIcon, Download } from 'lucide-react'
import Canvas from './components/Canvas'
import Sidebar from './components/Sidebar'
import Toolbar from './components/Toolbar'

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  return (
    <div className="flex h-screen bg-surface-50">
      {/* 左侧边栏 - 工作区列表 */}
      <Sidebar />

      {/* 主工作区 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部工具栏 */}
        <Toolbar />

        {/* 中央画布区 */}
        <div className="flex-1 flex items-center justify-center bg-surface-100 p-8">
          {selectedFile ? (
            <Canvas file={selectedFile} />
          ) : (
            <EmptyState onFileSelect={setSelectedFile} />
          )}
        </div>
      </div>

      {/* 右侧属性面板 */}
      <div className="w-80 bg-white border-l border-surface-200 p-6">
        <PropertiesPanel />
      </div>
    </div>
  )
}

function EmptyState({ onFileSelect }: { onFileSelect: (file: File) => void }) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      onFileSelect(file)
    }
  }

  return (
    <div
      className="w-full max-w-2xl p-12 border-2 border-dashed border-surface-300 rounded-2xl bg-white text-center"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <div className="flex justify-center mb-6">
        <div className="p-6 bg-primary-50 rounded-full">
          <Upload className="w-12 h-12 text-primary-600" />
        </div>
      </div>

      <h2 className="text-2xl font-semibold text-surface-900 mb-3">
        上传商品图片开始创作
      </h2>
      <p className="text-surface-600 mb-8">
        拖拽图片到此处，或点击选择文件
      </p>

      <label className="inline-block">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onFileSelect(file)
          }}
        />
        <span className="px-6 py-3 bg-primary-600 text-white rounded-lg cursor-pointer hover:bg-primary-700 transition inline-block">
          选择文件
        </span>
      </label>

      <div className="mt-12 grid grid-cols-3 gap-6 text-left">
        <FeatureCard
          icon={<Layers className="w-6 h-6" />}
          title="智能分层"
          description="自动识别商品主体和背景"
        />
        <FeatureCard
          icon={<Sparkles className="w-6 h-6" />}
          title="AI 生成"
          description="一键生成多种场景效果"
        />
        <FeatureCard
          icon={<ImageIcon className="w-6 h-6" />}
          title="保真处理"
          description="保持商品细节完整"
        />
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-4 bg-surface-50 rounded-lg">
      <div className="text-primary-600 mb-2">{icon}</div>
      <h3 className="font-semibold text-surface-900 mb-1">{title}</h3>
      <p className="text-sm text-surface-600">{description}</p>
    </div>
  )
}

function PropertiesPanel() {
  return (
    <div>
      <h3 className="text-lg font-semibold text-surface-900 mb-4">图层属性</h3>
      <div className="space-y-4 text-surface-600 text-sm">
        <p>选择图层以编辑属性</p>
      </div>
    </div>
  )
}

export default App
