import { Undo, Redo, ZoomIn, ZoomOut, Download, Share2 } from 'lucide-react'

export default function Toolbar() {
  return (
    <div className="h-16 bg-white border-b border-surface-200 flex items-center justify-between px-6">
      {/* 左侧操作 */}
      <div className="flex items-center gap-2">
        <ToolButton icon={<Undo />} tooltip="撤销" />
        <ToolButton icon={<Redo />} tooltip="重做" />
        <div className="w-px h-6 bg-surface-200 mx-2" />
        <ToolButton icon={<ZoomIn />} tooltip="放大" />
        <ToolButton icon={<ZoomOut />} tooltip="缩小" />
      </div>

      {/* 中间标题 */}
      <div className="text-center">
        <input
          type="text"
          defaultValue="未命名项目"
          className="text-surface-900 font-medium bg-transparent border-none focus:outline-none focus:border-b-2 focus:border-primary-500 px-2 py-1"
        />
      </div>

      {/* 右侧操作 */}
      <div className="flex items-center gap-3">
        <button className="px-4 py-2 text-surface-700 hover:bg-surface-50 rounded-lg transition flex items-center gap-2">
          <Share2 className="w-4 h-4" />
          分享
        </button>
        <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center gap-2">
          <Download className="w-4 h-4" />
          导出
        </button>
      </div>
    </div>
  )
}

function ToolButton({ icon, tooltip }: { icon: React.ReactNode; tooltip: string }) {
  return (
    <button
      title={tooltip}
      className="p-2 text-surface-700 hover:bg-surface-50 rounded-lg transition"
    >
      {icon}
    </button>
  )
}
