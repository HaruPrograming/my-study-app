import { useState, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { BottomNav } from '../components/layout/BottomNav'
import { StatCard } from '../components/common/StatCard'
import { AddYearModal } from '../components/top/AddYearModal'
import { AddExamModal } from '../components/top/AddExamModal'
import { DeleteExamModal } from '../components/top/DeleteExamModal'
import { ProcessingIndicator } from '../components/common/ProcessingIndicator'
import { MonitorIcon, AppliedInfoIcon, LockIcon, BookIcon, SeasonSpringIcon, SeasonAutumnIcon, FireIcon } from '../components/icons'
import { useStudyContext } from '../context/StudyContext'
import type { Exam, ExamColor, YearEntry } from '../types'

const EXAM_COLOR_MAP: Record<ExamColor, { gradient: string; glow: string }> = {
  green:  { gradient: 'linear-gradient(135deg,#2E9E5B,#1A6E3C)', glow: 'rgba(46,158,91,0.35)' },
  orange: { gradient: 'linear-gradient(135deg,#F57C2B,#C05810)', glow: 'rgba(245,124,43,0.3)' },
  blue:   { gradient: 'linear-gradient(135deg,#3B82F6,#1D4ED8)', glow: 'rgba(59,130,246,0.3)' },
  purple: { gradient: 'linear-gradient(135deg,#8B5CF6,#6D28D9)', glow: 'rgba(139,92,246,0.3)' },
  red:    { gradient: 'linear-gradient(135deg,#EF4444,#B91C1C)',  glow: 'rgba(239,68,68,0.3)' },
}

function ExamCardIcon({ color }: { color: ExamColor | 'locked' }) {
  if (color === 'locked') return <LockIcon size={30} color="#9BB0A0" />
  if (color === 'green')  return <MonitorIcon size={30} color="rgba(255,255,255,0.9)" />
  if (color === 'orange') return <AppliedInfoIcon size={30} color="rgba(255,255,255,0.9)" />
  return <BookIcon size={30} color="rgba(255,255,255,0.9)" />
}

function ExamCard({ exam, selected, onClick, onLongPress }: { exam: Exam; selected: boolean; onClick: () => void; onLongPress: () => void }) {
  const totalAll = exam.years.reduce((s, y) => s + y.totalCount, 0)
  const pct = totalAll > 0
    ? Math.min(100, Math.round(exam.years.reduce((s, y) => s + y.completedCount, 0) / totalAll * 100))
    : 0

  const colorKey = exam.color !== 'locked' ? exam.color : 'green'
  const { gradient, glow } = EXAM_COLOR_MAP[colorKey]

  const cardStyle = exam.isLocked
    ? { background: 'var(--surface)', border: '1.5px solid var(--border)' }
    : {
        background: gradient,
        boxShadow: selected
          ? `0 6px 18px rgba(0,0,0,0.22), 0 8px 24px ${glow}`
          : `0 4px 14px ${glow}`,
      }

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handlePressStart = () => {
    longPressTimer.current = setTimeout(() => { onLongPress() }, 600)
  }
  const handlePressEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }

  return (
    <div
      aria-selected={selected}
      onClick={onClick}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      className="flex-1 rounded-[13px] p-3 cursor-pointer transition-transform active:scale-[0.97]"
      style={{ ...cardStyle, transform: selected && !exam.isLocked ? 'scale(1.03)' : undefined }}>
      <div className="mb-1.5">
        <ExamCardIcon color={exam.color} />
      </div>
      <div className="text-[12px] font-extrabold mb-0.5" style={{ color: exam.isLocked ? 'var(--muted)' : '#fff' }}>
        {exam.shortName}
      </div>
      <div className="text-[9px] mb-1.5" style={{ color: exam.isLocked ? 'var(--border)' : 'rgba(255,255,255,0.7)' }}>
        {exam.isLocked ? '準備中' : pct > 0 ? `学習中 · ${pct}%` : '未着手'}
      </div>
      {!exam.isLocked && (
        <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.2)' }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'rgba(255,255,255,0.85)' }} />
        </div>
      )}
    </div>
  )
}

function YearCard({ year, selected, onSelect, onStart, onResume, hasResume, studyMode, onModeChange }: {
  year: YearEntry; selected: boolean; onSelect: () => void; onStart: () => void; onResume: () => void; hasResume?: boolean
  studyMode: 'input' | 'output'; onModeChange: (mode: 'input' | 'output') => void
}) {
  const pct = year.totalCount > 0 ? Math.min(100, Math.round(year.completedCount / year.totalCount * 100)) : 0

  return (
    <div onClick={onSelect}
      className="rounded-[12px] px-3 py-2.5 flex flex-col cursor-pointer transition-colors"
      style={{ background: selected ? 'var(--accent-soft)' : 'var(--surface)', border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--border)'}` }}>
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-[9px] flex-shrink-0 flex flex-col items-center justify-center"
          style={{ background: year.season === 'spring' ? 'var(--orange-soft)' : 'rgba(59,130,246,0.1)' }}>
          {year.season === 'spring'
            ? <SeasonSpringIcon size={16} color="var(--orange)" />
            : <SeasonAutumnIcon size={16} color="#3B82F6" />}
          <span className="text-[7px] font-bold" style={{ color: year.season === 'spring' ? 'var(--orange)' : '#3B82F6' }}>
            {year.season === 'spring' ? '春期' : '秋期'}
          </span>
        </div>
        <div className="flex-1">
          <div className="text-[12px] font-bold mb-0.5" style={{ color: 'var(--text)' }}>
            {year.label}
            {year.isNew && <span className="ml-1 text-[8px] font-bold px-1.5 py-px rounded-full" style={{ background: 'var(--orange-soft)', color: 'var(--orange)' }}>NEW</span>}
          </div>
          <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'var(--surface2)' }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--accent)' }} />
          </div>
        </div>
        <div className="text-[11px] font-bold flex-shrink-0" style={{ color: pct > 0 ? 'var(--accent)' : 'var(--muted)' }}>
          {pct > 0 ? `${pct}%` : '未着手'}
        </div>
      </div>
      {selected && (
        <div className="flex flex-col gap-2 mt-2.5">
          {/* モード切り替えトグル */}
          <div className="flex gap-1 p-1 rounded-[10px]" style={{ background: 'var(--surface2)' }}>
            <button
              aria-pressed={studyMode === 'input'}
              onClick={e => { e.stopPropagation(); onModeChange('input') }}
              className="flex-1 h-7 rounded-[8px] text-[11px] font-bold"
              style={studyMode === 'input'
                ? { background: 'var(--accent)', color: '#fff', border: 'none' }
                : { background: 'transparent', color: 'var(--muted)', border: 'none' }}>
              インプット
            </button>
            <button
              aria-pressed={studyMode === 'output'}
              onClick={e => { e.stopPropagation(); onModeChange('output') }}
              className="flex-1 h-7 rounded-[8px] text-[11px] font-bold"
              style={studyMode === 'output'
                ? { background: 'var(--accent)', color: '#fff', border: 'none' }
                : { background: 'transparent', color: 'var(--muted)', border: 'none' }}>
              アウトプット
            </button>
          </div>
          {/* アクションボタン */}
          <div className="flex gap-2">
            {year.completedCount > 0 && (
              <button onClick={e => { e.stopPropagation(); onStart() }}
                className="flex-1 h-[42px] rounded-[9px] text-[13px] font-bold"
                style={{ background: 'var(--surface)', border: '1.5px solid var(--accent)', color: 'var(--accent)' }}>
                最初から →
              </button>
            )}
            <button onClick={e => { e.stopPropagation(); (hasResume || (year.completedCount > 0 && year.completedCount < year.totalCount)) ? onResume() : onStart() }}
              className="flex-[2] h-[42px] rounded-[9px] text-[13px] font-bold text-white"
              style={{ background: 'var(--accent)', boxShadow: '0 2px 8px var(--accent-glow)' }}>
              {hasResume ? '続きから →' : year.completedCount >= year.totalCount && year.totalCount > 0 ? 'もう一度 →' : year.completedCount > 0 ? '続きから →' : '最初から →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function TopPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { streakDays, completedQuestions, overallProgress, exams, resetProgress } = useStudyContext()
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const locationState = location.state as { examId?: string } | null
  const [selectedExamId, setSelectedExamId] = useState<string | null>(locationState?.examId ?? null)
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null)
  const [studyMode, setStudyMode] = useState<'input' | 'output'>('input')
  const [modalOpen, setModalOpen] = useState(false)
  const [addExamModalOpen, setAddExamModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null)

  const updateStudyOrder = (examId: string) => {
    const raw = localStorage.getItem('exam_study_order')
    const order: string[] = raw ? JSON.parse(raw) : []
    localStorage.setItem('exam_study_order', JSON.stringify([examId, ...order.filter(id => id !== examId)]))
  }

  const sortedExams = useMemo(() => {
    const raw = localStorage.getItem('exam_study_order')
    if (!raw) return exams
    const order: string[] = JSON.parse(raw)
    return [...exams].sort((a, b) => {
      const ai = order.indexOf(a.id)
      const bi = order.indexOf(b.id)
      if (ai === -1 && bi === -1) return 0
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
  }, [exams])

  const activeExamId = selectedExamId ?? sortedExams[0]?.id ?? 'fe'

  const selectedExam = sortedExams.find(e => e.id === activeExamId) ?? sortedExams[0]

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Hero */}
      <div className="flex-shrink-0 px-[22px] pb-[22px] pt-4 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg,#2E9E5B,#1A6E3C)' }}>
        <div className="absolute right-[-20px] bottom-[-30px] w-[140px] h-[140px] rounded-full pointer-events-none"
          style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="flex items-center justify-between mb-0.5">
          <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.7)' }}>おかえり</div>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(prev => !prev)}
              className="text-[12px] font-bold flex items-center gap-1"
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.9)', padding: 0 }}>
              {user?.name ?? ''}
              <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.6)' }}>▼</span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 rounded-[10px] overflow-hidden z-50"
                style={{ background: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', minWidth: '100px' }}>
                <button
                  onClick={() => { setMenuOpen(false); logout() }}
                  className="w-full text-left px-4 py-2.5 text-[13px]"
                  style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}>
                  ログアウト
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="text-[21px] font-black text-white mb-3.5">まなびドリル</div>
        <div className="flex gap-2">
          <StatCard value={<><FireIcon size={20} color="#F57C2B" /> {streakDays}</>} label="日連続" />
          <StatCard value={completedQuestions} label="問完了" />
          <StatCard value={`${overallProgress}%`} label="全体進捗" />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-[18px] pt-[18px] pb-[110px]">
        <div className="text-[10px] font-extrabold tracking-[.08em] mb-2" style={{ color: 'var(--muted)' }}>資格を選ぶ</div>
        <div className="flex gap-2 mb-[22px] overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', marginLeft: '-18px', marginRight: '-18px', paddingLeft: '18px', paddingRight: '18px' }}>
          {sortedExams.map(exam => (
            <div key={exam.id} className="flex-shrink-0" style={{ width: 'calc(33vw - 16px)', minWidth: '90px', maxWidth: '130px' }}>
              <ExamCard exam={exam} selected={activeExamId === exam.id}
                onClick={() => { if (!exam.isLocked) { setSelectedExamId(exam.id); setSelectedYearId(null) } }}
                onLongPress={() => { if (!exam.isLocked) setDeleteTarget({ id: exam.dbId, name: exam.name }) }} />
            </div>
          ))}
          <div className="flex-shrink-0" style={{ width: 'calc(33vw - 16px)', minWidth: '90px', maxWidth: '130px' }}>
            <button
              onClick={() => setAddExamModalOpen(true)}
              className="w-full h-full rounded-[13px] p-3 flex flex-col items-center justify-center gap-1 cursor-pointer"
              style={{ background: 'var(--surface)', border: '1.5px dashed var(--border)', minHeight: '90px' }}>
              <span className="text-[18px]" style={{ color: 'var(--muted)' }}>＋</span>
              <span className="text-[9px] font-bold" style={{ color: 'var(--muted)' }}>資格を追加</span>
            </button>
          </div>
        </div>

        <div className="text-[10px] font-extrabold tracking-[.08em] mb-2" style={{ color: 'var(--muted)' }}>年度・期を選ぶ</div>
        <div className="flex flex-col gap-1.5">
          {(selectedExam?.years ?? []).map(year => (
            <YearCard key={year.id} year={year}
              selected={selectedYearId === year.id}
              onSelect={() => setSelectedYearId(prev => prev === year.id ? null : year.id)}
              onStart={() => {
                  localStorage.removeItem(`study_resume_${activeExamId}_${year.label}`)
                  updateStudyOrder(activeExamId)
                  resetProgress(activeExamId, year.label)
                  navigate(`/study/${activeExamId}/${encodeURIComponent(year.label)}?mode=${studyMode}`)
                }}
              onResume={() => {
                  updateStudyOrder(activeExamId)
                  const saved = localStorage.getItem(`study_resume_${activeExamId}_${year.label}`)
                  const idx = saved !== null ? saved : year.completedCount
                  navigate(`/study/${activeExamId}/${encodeURIComponent(year.label)}?startIndex=${idx}&mode=${studyMode}`)
                }}
              hasResume={localStorage.getItem(`study_resume_${activeExamId}_${year.label}`) !== null}
              studyMode={studyMode}
              onModeChange={setStudyMode} />
          ))}
          <button onClick={() => setModalOpen(true)}
            className="flex items-center justify-center gap-1.5 w-full rounded-[12px] py-2.5 text-[12px] font-bold mt-1.5 cursor-pointer"
            style={{ background: '#fff', border: '1.5px dashed rgba(46,158,91,0.25)', color: 'var(--accent)' }}>
            ＋ 年度を追加
          </button>
        </div>
      </div>

      <BottomNav />
      <ProcessingIndicator />
      {modalOpen && <AddYearModal examId={activeExamId} onClose={() => setModalOpen(false)} />}
      {addExamModalOpen && <AddExamModal onClose={() => setAddExamModalOpen(false)} />}
      {deleteTarget && <DeleteExamModal examId={deleteTarget.id} examName={deleteTarget.name} onClose={() => setDeleteTarget(null)} />}
    </div>
  )
}
