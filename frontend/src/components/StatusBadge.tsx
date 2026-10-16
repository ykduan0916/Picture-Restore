import type { JobStatus, StepStatus } from '../lib/api'

type Tone = 'neutral' | 'progress' | 'attention' | 'done' | 'fault'

const TONE_CLASS: Record<Tone, string> = {
  neutral: 'bg-paper text-graphite',
  progress: 'bg-paper text-ink',
  attention: 'bg-signal-soft text-signal',
  done: 'bg-mat-soft text-mat-strong',
  fault: 'bg-fault-soft text-fault',
}

// 文案与 docs/02 状态机一一对应；"已接受"只在用户确认后出现
const JOB_LABEL: Record<JobStatus, [string, Tone]> = {
  draft: ['草稿', 'neutral'],
  needs_input: ['待补充信息', 'attention'],
  ready: ['等待处理', 'neutral'],
  running: ['处理中', 'progress'],
  reviewing: ['待审核', 'attention'],
  reconciling: ['核对中', 'attention'],
  cancelling: ['正在取消', 'neutral'],
  accepted: ['已接受', 'done'],
  failed: ['失败', 'fault'],
  cancelled: ['已取消', 'neutral'],
}

const STEP_LABEL: Record<StepStatus, [string, Tone]> = {
  pending: ['未开始', 'neutral'],
  running: ['生成中', 'progress'],
  succeeded: ['已生成', 'done'],
  failed: ['失败', 'fault'],
  unknown: ['结果未知', 'attention'],
  cancelled: ['已取消', 'neutral'],
}

function Badge({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span className={`inline-flex h-6 items-center whitespace-nowrap rounded px-2 text-xs font-medium ${TONE_CLASS[tone]}`}>
      {label}
    </span>
  )
}

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const [label, tone] = JOB_LABEL[status]
  return <Badge label={label} tone={tone} />
}

export function StepStatusBadge({ status }: { status: StepStatus }) {
  const [label, tone] = STEP_LABEL[status]
  return <Badge label={label} tone={tone} />
}
