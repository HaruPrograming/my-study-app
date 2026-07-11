import { BottomNav } from '../components/layout/BottomNav'
import { StatCard } from '../components/common/StatCard'
import { MonitorIcon, AppliedInfoIcon, FireIcon } from '../components/icons'
import { useStudyContext } from '../context/StudyContext'
import { useCalendar } from '../hooks/useCalendar'

const now = new Date()

function ExamProgressCard({ examId, name, color, done, total }: { examId: string; name: string; color: 'green' | 'orange'; done: number; total: number }) {
  const pct = total > 0 ? Math.round(done / total * 100) : 0
  const accent = color === 'green' ? 'var(--accent)' : 'var(--orange)'
  const soft = color === 'green' ? 'var(--accent-soft)' : 'var(--orange-soft)'
  return (
    <div className="flex items-center gap-2.5 rounded-[12px] px-3.5 py-3 mb-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center flex-shrink-0" style={{ background: soft }}>
        {examId === 'fe' ? <MonitorIcon size={20} color={accent} /> : <AppliedInfoIcon size={20} color={accent} />}
      </div>
      <div className="flex-1">
        <div className="text-[12px] font-bold mb-0.5" style={{ color: 'var(--text)' }}>{name}</div>
        <div className="text-[10px] mb-1" style={{ color: 'var(--muted)' }}>
          {done > 0 ? `${done}問 / ${total}問` : '未着手'}
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--surface2)' }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: accent }} />
        </div>
      </div>
      <div className="text-[12px] font-bold flex-shrink-0" style={{ color: pct > 0 ? accent : 'var(--muted)' }}>
        {pct > 0 ? `${pct}%` : 'ー'}
      </div>
    </div>
  )
}

export function RecordPage() {
  const { streakDays, completedQuestions, overallProgress, examProgresses, studyDays } = useStudyContext()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const { blanks, days, toKey } = useCalendar(year, month)
  const today = toKey(now.getDate())

  const weekDays = ['日','月','火','水','木','金','土']

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Hero */}
      <div className="flex-shrink-0 px-5 pb-5" style={{ background: 'linear-gradient(150deg,#2E9E5B,#1A6E3C)' }}>
        <div className="text-[16px] font-black text-white mb-3.5 flex items-center gap-1.5 pt-2">
          学習記録
        </div>
        <div className="flex gap-2">
          <StatCard value={<><FireIcon size={18} color="#F57C2B" /> {streakDays}</>} label="日連続" />
          <StatCard value={completedQuestions} label="問完了" />
          <StatCard value={`${overallProgress}%`} label="進捗" />
        </div>
      </div>

      {/* Scroll */}
      <div className="flex-1 overflow-y-auto px-[18px] pt-[18px] pb-[100px]" style={{ scrollbarWidth: 'none' }}>
        <div className="text-[10px] font-extrabold tracking-[.08em] mb-2" style={{ color: 'var(--muted)' }}>資格別 進捗</div>
        {examProgresses.map(ep => (
          <ExamProgressCard key={ep.examId} {...ep} />
        ))}

        <div className="text-[10px] font-extrabold tracking-[.08em] mt-[18px] mb-2" style={{ color: 'var(--muted)' }}>今月の学習日</div>
        <div className="rounded-[12px] p-3.5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="text-[12px] font-bold mb-2.5" style={{ color: 'var(--text)' }}>
            {year}年 {month}月
          </div>
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map(d => (
              <div key={d} className="aspect-square flex items-center justify-center text-[8px]" style={{ color: 'var(--muted)' }}>{d}</div>
            ))}
            {blanks.map((_, i) => <div key={`b${i}`} className="aspect-square" />)}
            {days.map(day => {
              const key = toKey(day)
              const done = studyDays.has(key)
              const isToday = key === today
              return (
                <div key={day}
                  className="aspect-square rounded-[6px] flex items-center justify-center text-[9px] font-semibold"
                  style={isToday
                    ? { background: 'var(--accent)', color: '#fff', boxShadow: '0 0 0 2px #fff,0 0 0 3px var(--accent)' }
                    : done
                    ? { background: 'var(--accent)', color: '#fff' }
                    : { color: 'var(--muted)' }}>
                  {day}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
