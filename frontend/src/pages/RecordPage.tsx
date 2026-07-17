import { useState, useEffect } from 'react'
import { BottomNav } from '../components/layout/BottomNav'
import { StatCard } from '../components/common/StatCard'
import { MonitorIcon, AppliedInfoIcon, BookIcon, FireIcon } from '../components/icons'
import { useStudyContext } from '../context/StudyContext'
import { useCalendar } from '../hooks/useCalendar'
import type { ExamColor } from '../types'

const now = new Date()

const PROGRESS_COLOR_MAP: Record<ExamColor, { accent: string; soft: string }> = {
  green:  { accent: 'var(--accent)',  soft: 'var(--accent-soft)' },
  orange: { accent: 'var(--orange)',  soft: 'var(--orange-soft)' },
  blue:   { accent: '#3B82F6', soft: 'rgba(59,130,246,0.12)' },
  purple: { accent: '#8B5CF6', soft: 'rgba(139,92,246,0.12)' },
  red:    { accent: '#EF4444', soft: 'rgba(239,68,68,0.12)' },
}

function ExamProgressCard({ examId, name, color, done, total }: { examId: string; name: string; color: ExamColor; done: number; total: number }) {
  const pct = total > 0 ? Math.round(done / total * 100) : 0
  const { accent, soft } = PROGRESS_COLOR_MAP[color] ?? PROGRESS_COLOR_MAP.green
  return (
    <div className="flex items-center gap-2.5 rounded-[12px] px-3.5 py-3 mb-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center flex-shrink-0" style={{ background: soft }}>
        {examId === 'fe' ? <MonitorIcon size={20} color={accent} />
          : examId === 'ap' ? <AppliedInfoIcon size={20} color={accent} />
          : <BookIcon size={20} color={accent} />}
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
  const { streakDays, completedQuestions, overallProgress, examProgresses, studyDays, studyHistory, refreshData } = useStudyContext()

  useEffect(() => {
    refreshData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const { blanks, days, toKey } = useCalendar(year, month)
  const today = toKey(now.getDate())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const weekDays = ['日','月','火','水','木','金','土']

  const handleDayClick = (key: string, studied: boolean) => {
    if (!studied) return
    setSelectedDate(prev => prev === key ? null : key)
  }

  const selectedHistory = studyHistory.find(h => h.date === selectedDate)

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
              const isSelected = key === selectedDate
              return (
                <div
                  key={day}
                  data-studied={done ? 'true' : undefined}
                  onClick={() => handleDayClick(key, done)}
                  className="aspect-square rounded-[6px] flex items-center justify-center text-[9px] font-semibold"
                  style={
                    isSelected
                      ? { background: 'var(--accent)', color: '#fff', boxShadow: '0 0 0 2px #fff,0 0 0 4px var(--accent)', cursor: 'pointer' }
                      : isToday
                      ? { background: 'var(--accent)', color: '#fff', boxShadow: '0 0 0 2px #fff,0 0 0 3px var(--accent)', cursor: done ? 'pointer' : 'default' }
                      : done
                      ? { background: 'var(--accent)', color: '#fff', cursor: 'pointer' }
                      : { color: 'var(--muted)' }
                  }>
                  {day}
                </div>
              )
            })}
          </div>

          {/* 日別詳細 */}
          {selectedHistory && (
            <div data-testid="day-detail" className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="text-[10px] font-bold mb-1.5" style={{ color: 'var(--muted)' }}>
                {selectedDate} の学習
              </div>
              {selectedHistory.exams.map((e, i) => (
                <div key={i} className="flex items-center justify-between text-[11px] py-0.5" style={{ color: 'var(--text)' }}>
                  <span>{e.exam_label}</span>
                  <span className="font-bold" style={{ color: 'var(--accent)' }}>{e.count}問</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
