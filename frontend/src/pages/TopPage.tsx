import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BottomNav } from '../components/layout/BottomNav'
import { StatCard } from '../components/common/StatCard'
import { AddYearModal } from '../components/top/AddYearModal'
import { MonitorIcon, AppliedInfoIcon, LockIcon, SeasonSpringIcon, SeasonAutumnIcon, FireIcon } from '../components/icons'
import { useStudyContext } from '../context/StudyContext'
import type { Exam, YearEntry } from '../types'

function ExamCard({ exam, selected, onClick }: { exam: Exam; selected: boolean; onClick: () => void }) {
  const pct = exam.years.length > 0
    ? Math.round(exam.years.reduce((s, y) => s + y.completedCount, 0) / exam.years.reduce((s, y) => s + y.totalCount, 0) * 100)
    : 0

  const cardStyle = exam.isLocked
    ? { background: 'var(--surface)', border: '1.5px solid var(--border)' }
    : exam.color === 'green'
    ? { background: 'linear-gradient(135deg,#2E9E5B,#1A6E3C)', boxShadow: selected ? '0 0 0 3px rgba(255,255,255,0.6),0 4px 18px var(--accent-glow)' : '0 4px 14px var(--accent-glow)' }
    : { background: 'linear-gradient(135deg,#F57C2B,#C05810)', boxShadow: selected ? '0 0 0 3px rgba(255,255,255,0.6),0 4px 18px rgba(245,124,43,0.3)' : '0 4px 14px rgba(245,124,43,0.22)' }

  return (
    <div onClick={onClick} className="flex-1 rounded-[13px] p-3 cursor-pointer transition-transform active:scale-[0.97]"
      style={{ ...cardStyle, transform: selected && !exam.isLocked ? 'scale(1.03)' : undefined }}>
      <div className="mb-1.5">
        {exam.isLocked ? <LockIcon size={30} color="#9BB0A0" />
          : exam.color === 'green' ? <MonitorIcon size={30} color="rgba(255,255,255,0.9)" />
          : <AppliedInfoIcon size={30} color="rgba(255,255,255,0.9)" />}
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

function YearCard({ year, selected, onSelect, onStart }: {
  year: YearEntry; selected: boolean; onSelect: () => void; onStart: () => void
}) {
  const pct = year.totalCount > 0 ? Math.round(year.completedCount / year.totalCount * 100) : 0

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
        <button onClick={e => { e.stopPropagation(); onStart() }}
          className="w-full h-[42px] rounded-[9px] text-[13px] font-bold text-white mt-2.5"
          style={{ background: 'var(--accent)', boxShadow: '0 2px 8px var(--accent-glow)' }}>
          {year.label} を{pct > 0 ? '続ける' : 'スタート'} →
        </button>
      )}
    </div>
  )
}

export function TopPage() {
  const navigate = useNavigate()
  const { streakDays, completedQuestions, overallProgress, exams } = useStudyContext()
  const [selectedExamId, setSelectedExamId] = useState('fe')
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const selectedExam = exams.find(e => e.id === selectedExamId) ?? exams[0]

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Hero */}
      <div className="flex-shrink-0 px-[22px] pb-[22px] pt-1 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg,#2E9E5B,#1A6E3C)' }}>
        <div className="absolute right-[-20px] bottom-[-30px] w-[140px] h-[140px] rounded-full pointer-events-none"
          style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="text-[11px] mb-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>おかえり</div>
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
        <div className="flex gap-2 mb-[22px]">
          {exams.map(exam => (
            <ExamCard key={exam.id} exam={exam} selected={selectedExamId === exam.id}
              onClick={() => { if (!exam.isLocked) { setSelectedExamId(exam.id); setSelectedYearId(null) } }} />
          ))}
        </div>

        <div className="text-[10px] font-extrabold tracking-[.08em] mb-2" style={{ color: 'var(--muted)' }}>年度・期を選ぶ</div>
        <div className="flex flex-col gap-1.5">
          {selectedExam.years.map(year => (
            <YearCard key={year.id} year={year}
              selected={selectedYearId === year.id}
              onSelect={() => setSelectedYearId(prev => prev === year.id ? null : year.id)}
              onStart={() => navigate(`/study/${selectedExamId}`)} />
          ))}
          <button onClick={() => setModalOpen(true)}
            className="flex items-center justify-center gap-1.5 w-full rounded-[12px] py-2.5 text-[12px] font-bold mt-1.5 cursor-pointer"
            style={{ background: '#fff', border: '1.5px dashed rgba(46,158,91,0.25)', color: 'var(--accent)' }}>
            ＋ 年度を追加
          </button>
        </div>
      </div>

      <BottomNav />
      {modalOpen && <AddYearModal examId={selectedExamId} onClose={() => setModalOpen(false)} />}
    </div>
  )
}
