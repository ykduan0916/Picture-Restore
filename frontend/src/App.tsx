import { useState } from 'react'
import {
  Upload, Search, Filter, MoreHorizontal, Play, Check, AlertCircle,
  Clock, Layers, Image as ImageIcon, Settings, ChevronRight, Plus,
  FileText, Download, Trash2, Copy, Eye, Grid, List
} from 'lucide-react'

type View = 'grid' | 'list'
type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed'

interface Task {
  id: string
  name: string
  thumbnail: string
  type: 'white-bg' | 'scene' | 'promo'
  status: TaskStatus
  created: string
  size: string
}

function App() {
  const [view, setView] = useState<View>('grid')
  const [selectedTask, setSelectedTask] = useState<string | null>(null)

  const tasks: Task[] = [
    {
      id: '1',
      name: '商品_SKU_8492.jpg',
      thumbnail: '/placeholder.jpg',
      type: 'white-bg',
      status: 'completed',
      created: '2分钟前',
      size: '2.4 MB'
    },
    {
      id: '2',
      name: '商品_SKU_8493.jpg',
      thumbnail: '/placeholder.jpg',
      type: 'scene',
      status: 'processing',
      created: '5分钟前',
      size: '3.1 MB'
    }
  ]

  return (
    <div className="h-screen flex flex-col bg-[#F8F9FA]">
      {/* 顶部工具栏 */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#F59E0B] rounded flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-900">Picture Restore</span>
        </div>

        <div className="h-6 w-px bg-gray-200" />

        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索任务..."
              className="w-full h-8 pl-9 pr-3 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button className="h-8 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md flex items-center gap-2">
            <Filter className="w-4 h-4" />
            筛选
          </button>
          <button className="h-8 px-4 text-sm font-medium text-white bg-[#F59E0B] hover:bg-[#D97706] rounded-md flex items-center gap-2">
            <Plus className="w-4 h-4" />
            新建任务
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 左侧任务列表 */}
        <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="h-12 px-4 flex items-center justify-between border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">任务列表</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setView('grid')}
                className={`p-1.5 rounded ${view === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              >
                <Grid className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-1.5 rounded ${view === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              >
                <List className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                view={view}
                selected={selectedTask === task.id}
                onClick={() => setSelectedTask(task.id)}
              />
            ))}
          </div>

          <div className="h-16 px-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              共 {tasks.length} 个任务
            </div>
            <button className="text-xs text-[#F59E0B] hover:underline">
              查看全部
            </button>
          </div>
        </aside>

        {/* 中央画布 */}
        <main className="flex-1 flex flex-col">
          {selectedTask ? (
            <TaskEditor task={tasks.find(t => t.id === selectedTask)!} />
          ) : (
            <EmptyState />
          )}
        </main>

        {/* 右侧属性面板 */}
        {selectedTask && (
          <aside className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
            <PropertiesPanel task={tasks.find(t => t.id === selectedTask)!} />
          </aside>
        )}
      </div>
    </div>
  )
}

function TaskCard({ task, view, selected, onClick }: {
  task: Task
  view: View
  selected: boolean
  onClick: () => void
}) {
  const statusConfig = {
    pending: { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-100', label: '等待中' },
    processing: { icon: Play, color: 'text-[#F59E0B]', bg: 'bg-[#FEF3C7]', label: '处理中' },
    completed: { icon: Check, color: 'text-[#10B981]', bg: 'bg-[#D1FAE5]', label: '已完成' },
    failed: { icon: AlertCircle, color: 'text-[#EC4899]', bg: 'bg-[#FCE7F3]', label: '失败' }
  }

  const config = statusConfig[task.status]
  const StatusIcon = config.icon

  if (view === 'list') {
    return (
      <button
        onClick={onClick}
        className={`w-full p-3 rounded-lg border text-left transition ${
          selected
            ? 'border-[#F59E0B] bg-[#FFFBEB]'
            : 'border-gray-200 hover:border-gray-300 bg-white'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
            <ImageIcon className="w-6 h-6 text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{task.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.color}`}>
                <StatusIcon className="w-3 h-3" />
                {config.label}
              </span>
              <span className="text-xs text-gray-500">{task.created}</span>
            </div>
          </div>
        </div>
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg border overflow-hidden text-left transition ${
        selected
          ? 'border-[#F59E0B] ring-2 ring-[#FEF3C7]'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="aspect-video bg-gray-100 flex items-center justify-center">
        <ImageIcon className="w-8 h-8 text-gray-400" />
      </div>
      <div className="p-3 bg-white">
        <p className="text-xs font-medium text-gray-900 truncate mb-2">{task.name}</p>
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${config.bg} ${config.color}`}>
            <StatusIcon className="w-3 h-3" />
            {config.label}
          </span>
          <span className="text-xs text-gray-500">{task.size}</span>
        </div>
      </div>
    </button>
  )
}

function TaskEditor({ task }: { task: Task }) {
  return (
    <>
      <div className="h-12 px-4 bg-white border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-900">{task.name}</h3>
          <span className="text-xs text-gray-500 font-mono">{task.size}</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-8 px-3 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
            预览
          </button>
          <button className="h-8 px-3 text-sm text-white bg-[#10B981] hover:bg-[#059669] rounded-md flex items-center gap-2">
            <Download className="w-4 h-4" />
            导出
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="aspect-[4/3] bg-white rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
            <div className="text-center">
              <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-sm text-gray-500">画布加载中...</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Upload className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          上传商品图开始处理
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          支持 JPG、PNG 格式，自动识别商品主体并生成白底图、场景图
        </p>
        <label className="inline-flex items-center gap-2 h-10 px-6 text-sm font-medium text-white bg-[#F59E0B] hover:bg-[#D97706] rounded-md cursor-pointer">
          <Upload className="w-4 h-4" />
          选择文件
          <input type="file" className="sr-only" accept="image/*" />
        </label>
      </div>
    </div>
  )
}

function PropertiesPanel({ task }: { task: Task }) {
  return (
    <div className="p-4 space-y-6">
      <section>
        <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
          任务信息
        </h4>
        <div className="space-y-3">
          <Property label="文件名" value={task.name} />
          <Property label="大小" value={task.size} />
          <Property label="创建时间" value={task.created} />
          <Property label="状态" value="已完成" />
        </div>
      </section>

      <section>
        <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
          生成设置
        </h4>
        <div className="space-y-3">
          <Property label="类型" value="白底图" />
          <Property label="尺寸" value="1200 × 1200 px" />
          <Property label="格式" value="PNG" />
          <Property label="质量" value="无损" />
        </div>
      </section>

      <section>
        <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
          图层
        </h4>
        <div className="space-y-2">
          <LayerItem name="商品主体" visible locked />
          <LayerItem name="背景" visible />
          <LayerItem name="阴影" visible />
        </div>
      </section>
    </div>
  )
}

function Property({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs font-medium text-gray-900">{value}</span>
    </div>
  )
}

function LayerItem({ name, visible, locked }: { name: string; visible?: boolean; locked?: boolean }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded hover:bg-gray-50">
      <Layers className="w-4 h-4 text-gray-400" />
      <span className="flex-1 text-xs text-gray-700">{name}</span>
      {visible && <Eye className="w-3.5 h-3.5 text-gray-400" />}
      {locked && <span className="text-xs text-gray-400">🔒</span>}
    </div>
  )
}

export default App
