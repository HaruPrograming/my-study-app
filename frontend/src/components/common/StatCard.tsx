type Props = { value: React.ReactNode; label: string; variant?: 'hero' | 'white' }

export function StatCard({ value, label, variant = 'hero' }: Props) {
  if (variant === 'hero') {
    return (
      <div className="flex-1 text-center rounded-[10px] py-2 px-1.5"
        style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.22)' }}>
        <div className="text-[17px] font-black text-white flex items-center justify-center gap-1">{value}</div>
        <div className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>{label}</div>
      </div>
    )
  }
  return (
    <div className="flex-1 text-center rounded-[12px] py-3.5 px-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="text-[22px] font-black flex items-center justify-center gap-1" style={{ color: 'var(--accent)' }}>{value}</div>
      <div className="text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>{label}</div>
    </div>
  )
}
