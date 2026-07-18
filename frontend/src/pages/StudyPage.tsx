import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ChartIcon, PauseIcon, CheckIcon, TargetIcon, BoltIcon, BulbIcon } from '../components/icons'
import { ProgressBar } from '../components/common/ProgressBar'
import { IllustBlock } from '../components/study/IllustBlock'
import { AiChatPanel } from '../components/study/AiChatPanel'
import { useStudyContext } from '../context/StudyContext'
import type { Question, Point } from '../types'

type StudyTab = 'point' | 'ai'
type StudyMode = 'input' | 'output'

function PointIcon({ icon }: { icon: Point['icon'] }) {
  switch (icon) {
    case 'target': return <TargetIcon size={14} color="var(--orange)" />
    case 'bolt':   return <BoltIcon   size={14} color="var(--orange)" />
    case 'bulb':   return <BulbIcon   size={14} color="var(--orange)" />
  }
}

export function StudyPage() {
  const { examId, examLabel } = useParams<{ examId: string; examLabel: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { completeQuestion } = useStudyContext()
  const [currentIndex, setCurrentIndex] = useState(Number(searchParams.get('startIndex') ?? 0))
  const [examQuestions, setExamQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [studyTab, setStudyTab] = useState<StudyTab>('point')
  const [studyMode, setStudyMode] = useState<StudyMode>(
    searchParams.get('mode') === 'output' ? 'output' : 'input'
  )
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/questions/${examId}/${examLabel}`)
      .then(res => {
        if (!res.ok) throw new Error('fetch failed')
        return res.json()
      })
      .then((data: Question[]) => setExamQuestions(data))
      .catch(() => setExamQuestions([]))
      .finally(() => setLoading(false))
  }, [examId, examLabel])

  // 問題が切り替わったら選択状態をリセット
  useEffect(() => {
    setSelectedChoice(null)
  }, [currentIndex])

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
  const resumeKey = `study_resume_${examId}_${examLabel}`

  const canProceed = studyMode === 'input' || selectedChoice !== null

  const handleNext = () => {
    completeQuestion(examId ?? '', examLabel ?? '', q.number)
    if (currentIndex < examQuestions.length - 1) {
      setCurrentIndex(i => i + 1)
    } else {
      localStorage.removeItem(resumeKey)
      navigate(`/study/${examId}/${examLabel}/complete`)
    }
  }

  const handlePrev = () => {
    setCurrentIndex(i => i - 1)
  }

  const handleInterrupt = () => {
    localStorage.setItem(resumeKey, String(currentIndex))
    navigate('/', { state: { examId } })
  }

  const handleChoiceClick = (label: string) => {
    if (studyMode === 'output' && selectedChoice === null) {
      setSelectedChoice(label)
    }
  }

  const getChoiceStyle = (isCorrect: boolean, label: string) => {
    if (studyMode === 'input') {
      return isCorrect
        ? { border: '2px solid var(--accent)', background: 'var(--accent-soft)' }
        : { border: '2px solid transparent', background: 'var(--surface)', opacity: 0.55 }
    }
    // アウトプットモード
    if (selectedChoice === null) {
      return { border: '2px solid transparent', background: 'var(--surface)', cursor: 'pointer' }
    }
    if (isCorrect) {
      return { border: '2px solid var(--accent)', background: 'var(--accent-soft)' }
    }
    if (label === selectedChoice) {
      return { border: '2px solid #EF4444', background: 'rgba(239,68,68,0.08)' }
    }
    return { border: '2px solid transparent', background: 'var(--surface)', opacity: 0.55 }
  }

  const showCorrect = (isCorrect: boolean) =>
    studyMode === 'input' ? isCorrect : (selectedChoice !== null && isCorrect)

  const showWrong = (isCorrect: boolean, label: string) =>
    studyMode === 'output' && selectedChoice !== null && label === selectedChoice && !isCorrect

  return (
    <div className="flex flex-col h-dvh" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex items-center px-[18px] py-2 flex-shrink-0 gap-2"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <button onClick={handleInterrupt}
          className="h-8 px-2.5 rounded-[9px] flex items-center justify-center flex-shrink-0 gap-1 text-[11px] font-bold"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
          <PauseIcon size={12} color="var(--muted)" /> 中断
        </button>

        {/* モード切り替えトグル */}
        <div className="flex gap-0.5 flex-1 p-0.5 rounded-[8px]" style={{ background: 'var(--surface)' }}>
          <button
            aria-pressed={studyMode === 'input'}
            onClick={() => setStudyMode('input')}
            className="flex-1 h-7 rounded-[7px] text-[10px] font-bold"
            style={studyMode === 'input'
              ? { background: 'var(--accent)', color: '#fff', border: 'none' }
              : { background: 'transparent', color: 'var(--muted)', border: 'none' }}>
            インプット
          </button>
          <button
            aria-pressed={studyMode === 'output'}
            onClick={() => setStudyMode('output')}
            className="flex-1 h-7 rounded-[7px] text-[10px] font-bold"
            style={studyMode === 'output'
              ? { background: 'var(--accent)', color: '#fff', border: 'none' }
              : { background: 'transparent', color: 'var(--muted)', border: 'none' }}>
            アウトプット
          </button>
        </div>

        <button onClick={() => navigate('/record')}
          className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <ChartIcon size={16} color="var(--accent)" />
        </button>
      </div>

      <div className="text-center text-[10px] py-0.5" style={{ color: 'var(--muted)' }}>
        {q.examLabel.replace(' ', ' · ')} &nbsp;·&nbsp; Q{q.number} / {q.totalCount}
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
          {q.choices.map(choice => {
            const correct = showCorrect(choice.isCorrect)
            const wrong = showWrong(choice.isCorrect, choice.label)
            return (
              <div
                key={choice.label}
                data-testid={`choice-${choice.label}`}
                data-correct={correct ? 'true' : 'false'}
                data-wrong={wrong ? 'true' : 'false'}
                onClick={() => handleChoiceClick(choice.label)}
                className="flex items-center gap-2.5 rounded-[12px] px-3.5 py-3"
                style={getChoiceStyle(choice.isCorrect, choice.label)}>
                <div className="w-[26px] h-[26px] rounded-[7px] flex-shrink-0 flex items-center justify-center text-[12px] font-extrabold"
                  style={correct
                    ? { background: 'var(--accent)', color: '#fff' }
                    : wrong
                    ? { background: '#EF4444', color: '#fff' }
                    : { background: '#E0E8E2', color: 'var(--muted)' }}>
                  {choice.label}
                </div>
                <div className="text-[13px] leading-[1.45] flex-1"
                  style={{ color: correct ? 'var(--text)' : 'var(--muted)', fontWeight: correct ? 600 : 400 }}>
                  {choice.text}
                </div>
                {correct && <CheckIcon size={18} color="var(--accent)" />}
              </div>
            )
          })}
        </div>

        {/* アウトプットモードで解答後のみ解説タブを表示 */}
        {(studyMode === 'input' || selectedChoice !== null) && (
          <>
            {/* Tab switcher */}
            <div className="flex gap-1 mb-4 p-1 rounded-[10px]" style={{ background: 'var(--surface)' }}>
              <button
                role="tab"
                aria-selected={studyTab === 'point'}
                onClick={() => setStudyTab('point')}
                className="flex-1 h-8 rounded-[8px] text-[12px] font-bold"
                style={studyTab === 'point'
                  ? { background: 'var(--accent)', color: '#fff', border: 'none' }
                  : { background: 'transparent', color: 'var(--muted)', border: 'none' }}>
                ポイント・解説
              </button>
              <button
                role="tab"
                aria-selected={studyTab === 'ai'}
                onClick={() => setStudyTab('ai')}
                className="flex-1 h-8 rounded-[8px] text-[12px] font-bold"
                style={studyTab === 'ai'
                  ? { background: 'var(--accent)', color: '#fff', border: 'none' }
                  : { background: 'transparent', color: 'var(--muted)', border: 'none' }}>
                AI質問
              </button>
            </div>

            {studyTab === 'point' ? (
              <>
                {q.illustration && (
                  <IllustBlock
                    nodes={q.illustration.nodes}
                    subNodes={q.illustration.subNodes}
                    caption={q.illustration.caption}
                  />
                )}
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
                {q.explanation && q.explanation.length > 0 && (
                  <>
                    <div className="relative flex items-center justify-center mt-[18px] mb-[14px]" style={{ height: '1px', background: 'var(--border)' }}>
                      <span className="absolute bg-white px-2.5 text-[10px] font-bold tracking-[.08em]" style={{ color: 'var(--muted)' }}>解説</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {q.explanation.map((item, i) => (
                        <div key={i} className="rounded-[10px] px-3.5 py-3"
                          style={{ background: 'var(--accent-soft)', border: '1px solid rgba(46,158,91,0.2)' }}>
                          <div className="text-[11px] font-bold mb-0.5" style={{ color: 'var(--accent)' }}>{item.title}</div>
                          <div className="text-[12px] leading-relaxed" style={{ color: 'var(--text)' }}>{item.body}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <AiChatPanel key={q.id} question={q} />
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 w-full flex gap-2 px-[18px] pt-2.5"
        style={{ background: 'linear-gradient(to top,#fff 65%,transparent)', paddingBottom: 'calc(1.75rem + env(safe-area-inset-bottom))' }}>
        {currentIndex > 0 && (
          <button onClick={handlePrev} aria-label="前へ"
            className="flex-1 h-[50px] rounded-[13px] text-[13px] font-bold"
            style={{ background: 'var(--surface)', border: '1.5px solid var(--accent)', color: 'var(--accent)' }}>
            ← 前へ
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="flex-[2] h-[50px] rounded-[13px] text-[15px] font-bold text-white"
          style={{
            background: canProceed ? 'var(--accent)' : 'var(--muted)',
            boxShadow: canProceed ? '0 4px 12px var(--accent-glow)' : 'none',
            opacity: canProceed ? 1 : 0.5,
          }}>
          次へ →
        </button>
      </div>
    </div>
  )
}
