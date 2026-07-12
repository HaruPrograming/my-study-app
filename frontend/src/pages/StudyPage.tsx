import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChartIcon, PauseIcon, CheckIcon, TargetIcon, BoltIcon, BulbIcon } from '../components/icons'
import { ProgressBar } from '../components/common/ProgressBar'
import { IllustBlock } from '../components/study/IllustBlock'
import { useStudyContext } from '../context/StudyContext'
import type { Question, Point } from '../types'

function PointIcon({ icon }: { icon: Point['icon'] }) {
  switch (icon) {
    case 'target': return <TargetIcon size={14} color="var(--orange)" />
    case 'bolt':   return <BoltIcon   size={14} color="var(--orange)" />
    case 'bulb':   return <BulbIcon   size={14} color="var(--orange)" />
  }
}

export function StudyPage() {
  const { examId } = useParams<{ examId: string }>()
  const navigate = useNavigate()
  const { completeQuestion } = useStudyContext()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [examQuestions, setExamQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/questions/${examId}`)
      .then(res => {
        if (!res.ok) throw new Error('fetch failed')
        return res.json()
      })
      .then((data: Question[]) => setExamQuestions(data))
      .catch(() => setExamQuestions([]))
      .finally(() => setLoading(false))
  }, [examId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-dvh" role="status">
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  const q = examQuestions[currentIndex]

  if (!q) return <div className="p-4">問題が見つかりません</div>

  const pct = Math.round(q.number / q.totalCount * 100)

  const handleNext = () => {
    completeQuestion(examId ?? '')
    if (currentIndex < examQuestions.length - 1) {
      setCurrentIndex(i => i + 1)
    } else {
      navigate(`/study/${examId}/complete`)
    }
  }

  return (
    <div className="flex flex-col h-dvh" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex items-center px-[18px] py-2 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => navigate('/')}
          className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0 text-[14px] font-bold"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--accent)' }}>
          ←
        </button>
        <div className="flex-1 text-center">
          <div className="text-[10px]" style={{ color: 'var(--muted)' }}>
            {q.examLabel.replace(' ', ' · ')}
          </div>
          <div className="text-[12px] font-bold" style={{ color: 'var(--text)' }}>
            Q{q.number} / {q.totalCount}
          </div>
        </div>
        <button onClick={() => navigate('/record')}
          className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <ChartIcon size={16} color="var(--accent)" />
        </button>
      </div>

      <ProgressBar pct={pct} showLabel />

      {/* Scroll content */}
      <div className="flex-1 overflow-y-auto px-[18px] pt-4 pb-[110px]" style={{ scrollbarWidth: 'none' }}>
        {/* Tags */}
        <div className="flex gap-1.5 mb-3">
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'var(--orange-soft)', border: '1px solid rgba(245,124,43,0.3)', color: 'var(--orange)' }}>
            {q.examLabel}
          </span>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'var(--accent-soft)', border: '1px solid rgba(46,158,91,0.3)', color: 'var(--accent)' }}>
            {q.category}
          </span>
        </div>

        {/* Question */}
        <div className="text-[15px] font-bold leading-relaxed mb-4" style={{ color: 'var(--text)' }}>{q.body}</div>

        {/* Choices */}
        <div className="flex flex-col gap-2 mb-5">
          {q.choices.map(choice => (
            <div key={choice.label}
              className="flex items-center gap-2.5 rounded-[12px] px-3.5 py-3"
              style={choice.isCorrect
                ? { border: '2px solid var(--accent)', background: 'var(--accent-soft)' }
                : { border: '2px solid transparent', background: 'var(--surface)', opacity: 0.55 }}>
              <div className="w-[26px] h-[26px] rounded-[7px] flex-shrink-0 flex items-center justify-center text-[12px] font-extrabold"
                style={choice.isCorrect
                  ? { background: 'var(--accent)', color: '#fff' }
                  : { background: '#E0E8E2', color: 'var(--muted)' }}>
                {choice.label}
              </div>
              <div className="text-[13px] leading-[1.45] flex-1"
                style={{ color: choice.isCorrect ? 'var(--text)' : 'var(--muted)', fontWeight: choice.isCorrect ? 600 : 400 }}>
                {choice.text}
              </div>
              {choice.isCorrect && <CheckIcon size={18} color="var(--accent)" />}
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center mb-[18px]" style={{ height: '1px', background: 'var(--border)' }}>
          <span className="absolute bg-white px-2.5 text-[10px] font-bold tracking-[.08em]" style={{ color: 'var(--muted)' }}>POINT</span>
        </div>

        {/* Illustration */}
        <IllustBlock
          nodes={q.illustration.nodes}
          subNodes={q.illustration.subNodes}
          caption={q.illustration.caption}
        />

        {/* Points */}
        <div className="flex flex-col gap-1.5">
          {q.points.map((pt, i) => (
            <div key={i} className="flex items-start gap-2 rounded-[10px] px-3 py-2.5"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="w-[22px] h-[22px] rounded-[6px] flex-shrink-0 flex items-center justify-center"
                style={{ background: 'var(--orange-soft)' }}>
                <PointIcon icon={pt.icon} />
              </div>
              <div className="text-[12px] leading-relaxed" style={{ color: 'var(--text)' }}
                dangerouslySetInnerHTML={{ __html: pt.text.replace(/<b>/g, '<strong style="color:var(--orange);font-weight:700">').replace(/<\/b>/g, '</strong>') }} />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 w-full flex gap-2 px-[18px] pt-2.5"
        style={{ background: 'linear-gradient(to top,#fff 65%,transparent)', paddingBottom: 'calc(1.75rem + env(safe-area-inset-bottom))' }}>
        <button onClick={() => navigate('/')}
          className="flex-1 h-[50px] rounded-[13px] text-[12px] font-semibold flex items-center justify-center gap-1.5"
          style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--muted)' }}>
          <PauseIcon size={14} color="var(--muted)" /> 中断
        </button>
        <button onClick={handleNext}
          className="flex-[2] h-[50px] rounded-[13px] text-[15px] font-bold text-white"
          style={{ background: 'var(--accent)', boxShadow: '0 4px 12px var(--accent-glow)' }}>
          次へ →
        </button>
      </div>
    </div>
  )
}
