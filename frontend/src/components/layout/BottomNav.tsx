import { Link, useLocation } from 'react-router-dom'
import { HomeIcon, ChartIcon, TargetIcon } from '../icons'

export function BottomNav() {
  const { pathname } = useLocation()
  const isRecord = pathname === '/record'
  const isGoal = pathname === '/goals'

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t pt-2 flex z-10"
      style={{ borderColor: 'var(--border)', paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
      <Link to="/" className="flex-1 flex flex-col items-center gap-0.5 text-[9px] no-underline"
        style={{ color: (!isRecord && !isGoal) ? 'var(--accent)' : 'var(--muted)' }}>
        <HomeIcon size={22} color="currentColor" />
        <span>ホーム</span>
      </Link>
      <Link to="/record" className="flex-1 flex flex-col items-center gap-0.5 text-[9px] no-underline"
        style={{ color: isRecord ? 'var(--accent)' : 'var(--muted)' }}>
        <ChartIcon size={22} color="currentColor" />
        <span>記録</span>
      </Link>
      <Link to="/goals" className="flex-1 flex flex-col items-center gap-0.5 text-[9px] no-underline"
        style={{ color: isGoal ? 'var(--accent)' : 'var(--muted)' }}>
        <TargetIcon size={22} color="currentColor" />
        <span>目標</span>
      </Link>
    </nav>
  )
}
