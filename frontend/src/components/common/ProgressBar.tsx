type Props = { pct: number; showLabel?: boolean }

export function ProgressBar({ pct, showLabel = false }: Props) {
  return (
    <div className="flex items-center gap-2.5 px-[18px] py-1.5 flex-shrink-0">
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--surface2)' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: 'var(--accent)' }} />
      </div>
      {showLabel && <span className="text-[10px] whitespace-nowrap" style={{ color: 'var(--muted)' }}>{pct}%</span>}
    </div>
  )
}
