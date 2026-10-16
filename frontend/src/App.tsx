import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Github } from 'lucide-react'
import { api } from './lib/api'
import { href, useRoute, type Route } from './lib/router'
import Home from './views/Home'
import NewTask from './views/NewTask'
import TaskList from './views/TaskList'
import TaskDetail from './views/TaskDetail'
import Brands from './views/Brands'
import Guide from './views/Guide'

const TITLES: Record<Route['name'], string> = {
  home: '换背景，不换商品',
  new: '新建任务',
  tasks: '任务',
  task: '任务详情',
  brands: '品牌规范',
  guide: '使用说明',
}

export default function App() {
  const route = useRoute()

  useEffect(() => {
    document.title = `${TITLES[route.name]} | Picture Restore`
  }, [route.name])

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        onClick={(e) => {
          e.preventDefault()
          document.getElementById('main')?.focus()
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-panel focus:px-3 focus:py-2"
      >
        跳到主要内容
      </a>
      <Header route={route} />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {route.name === 'home' && <Home />}
        {route.name === 'new' && <NewTask />}
        {route.name === 'tasks' && <TaskList />}
        {route.name === 'task' && <TaskDetail id={route.id} />}
        {route.name === 'brands' && <Brands />}
        {route.name === 'guide' && <Guide />}
      </main>
    </div>
  )
}

const NAV: { route: Route; label: string }[] = [
  { route: { name: 'tasks' }, label: '任务' },
  { route: { name: 'brands' }, label: '品牌规范' },
  { route: { name: 'guide' }, label: '使用说明' },
]

function Header({ route }: { route: Route }) {
  const health = useQuery({ queryKey: ['health'], queryFn: api.health, refetchInterval: 15_000, retry: false })
  const online = health.isSuccess
  const statusText = online ? '处理服务已连接' : health.isLoading ? '正在连接处理服务' : '处理服务未连接'
  const isActive = (r: Route) => r.name === route.name || (r.name === 'tasks' && route.name === 'task')

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-panel/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-3 px-4 sm:gap-8 sm:px-6">
        <a href={href({ name: 'home' })} className="flex shrink-0 items-center gap-2.5 rounded-md" translate="no" aria-label="Picture Restore 首页">
          <Mark />
          <span className="hidden whitespace-nowrap text-[15px] font-semibold tracking-tight sm:inline">Picture Restore</span>
        </a>

        <nav aria-label="主导航" className="flex min-w-0 items-center gap-1 overflow-x-auto">
          {NAV.map((item) => {
            const active = isActive(item.route)
            return (
              <a
                key={item.label}
                href={href(item.route)}
                aria-current={active ? 'page' : undefined}
                className={`flex h-8 items-center whitespace-nowrap rounded-md px-2.5 text-sm transition-colors sm:px-3 ${
                  active ? 'bg-paper font-medium text-ink' : 'text-graphite hover:bg-paper hover:text-ink'
                }`}
              >
                {item.label}
              </a>
            )
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <span className="flex items-center gap-2 whitespace-nowrap text-13 text-graphite" role="status" title={statusText}>
            <span
              className={`h-2 w-2 rounded-full ${online ? 'bg-mat' : health.isLoading ? 'bg-quiet' : 'bg-fault'}`}
              aria-hidden="true"
            />
            <span className="hidden lg:inline">{statusText}</span>
            <span className="sr-only lg:hidden">{statusText}</span>
          </span>
          <a
            href="https://github.com/ykduan0916/Picture-Restore"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden h-8 w-8 items-center justify-center rounded-md text-graphite transition-colors hover:bg-paper hover:text-ink sm:flex"
            aria-label="源代码（GitHub，新窗口打开）"
            title="源代码"
          >
            <Github className="h-4 w-4" aria-hidden="true" />
          </a>
          {route.name !== 'new' && route.name !== 'tasks' && (
            <a href={href({ name: 'new' })} className="btn-primary hidden h-8 px-3 sm:inline-flex">
              新建任务
            </a>
          )}
        </div>
      </div>
    </header>
  )
}

/** 取景框与商品：对应"保留原商品，只换周围" */
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#1F6B52" />
      <path
        d="M8 12.5V8h4.5M19.5 8H24v4.5M24 19.5V24h-4.5M12.5 24H8v-4.5"
        fill="none"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="12.5" y="12.5" width="7" height="7" rx="1.5" fill="#fff" />
    </svg>
  )
}
