import { useNavigate } from 'react-router-dom'
import { ConfettiIcon, FireIcon } from '../components/icons'
import { StatCard } from '../components/common/StatCard'
import { useStudyContext } from '../context/StudyContext'

export function CompletePage() {
  const navigate = useNavigate()
  const { streakDays, completedQuestions, overallProgress } = useStudyContext()

  return (
    <div className="flex flex-col h-dvh" style={{ background: 'var(--bg)' }}>
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
        <div className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{ background: 'var(--accent)', boxShadow: '0 0 0 16px var(--accent-soft)', animation: 'popIn .4s cubic-bezier(0.34,1.56,0.64,1) both' }}>
          <ConfettiIcon size={52} color="#fff" />
        </div>

        <div className="text-[26px] font-black" style={{ color: 'var(--accent)' }}>お疲れさま！</div>
        <div className="text-[14px] text-center leading-relaxed" style={{ color: 'var(--muted)' }}>
          今日の学習が完了しました。<br />この調子で続けよう！
        </div>

        <div className="flex gap-3 w-full">
          <StatCard variant="white" value={<><FireIcon size={20} color="#F57C2B" /> {streakDays}</>} label="日連続" />
          <StatCard variant="white" value={`+${completedQuestions}`} label="今日の問題" />
          <StatCard variant="white" value={`${overallProgress}%`} label="進捗" />
        </div>

        <button onClick={() => navigate('/')}
          className="w-full h-[52px] rounded-[14px] text-[16px] font-bold text-white mt-2"
          style={{ background: 'var(--accent)', boxShadow: '0 4px 14px var(--accent-glow)' }}>
          ホームに戻る
        </button>
      </div>
    </div>
  )
}
