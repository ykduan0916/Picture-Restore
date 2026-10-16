import { Home, FolderOpen, Clock } from 'lucide-react'

export default function Sidebar() {
  return (
    <div className="w-64 bg-white border-r border-surface-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-surface-200">
        <h1 className="text-xl font-bold text-primary-600">Picture Restore</h1>
        <p className="text-xs text-surface-600 mt-1">智能商品图生成</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <NavItem icon={<Home />} label="工作台" active />
        <NavItem icon={<FolderOpen />} label="我的项目" />
        <NavItem icon={<Clock />} label="最近使用" />
      </nav>

      {/* User */}
      <div className="p-4 border-t border-surface-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-600 font-semibold">U</span>
          </div>
          <div>
            <p className="text-sm font-medium text-surface-900">用户</p>
            <p className="text-xs text-surface-600">免费版</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition ${
        active
          ? 'bg-primary-50 text-primary-600'
          : 'text-surface-700 hover:bg-surface-50'
      }`}
    >
      <span className="w-5 h-5">{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  )
}
