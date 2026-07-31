import { useState, useEffect } from 'react'
import { BottomNav } from '../components/layout/BottomNav'
import type { Goal } from '../types'

export function GoalPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [inputBody, setInputBody] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/goals', { credentials: 'include' })
      .then(r => r.json())
      .then((data: Goal[]) => { setGoals(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleAdd = async () => {
    const body = inputBody.trim()
    if (!body) return
    const res = await fetch('/api/goals', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ body }),
    })
    if (!res.ok) return
    const newGoal: Goal = await res.json()
    setGoals(prev => [newGoal, ...prev])
    setInputBody('')
  }

  const handleToggle = async (goal: Goal) => {
    const res = await fetch(`/api/goals/${goal.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ is_done: !goal.is_done }),
    })
    if (!res.ok) return
    const updated: Goal = await res.json()
    setGoals(prev => prev.map(g => g.id === goal.id ? updated : g))
  }

  const handleDelete = async (goal: Goal) => {
    const res = await fetch(`/api/goals/${goal.id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Accept': 'application/json' },
    })
    if (!res.ok) return
    setGoals(prev => prev.filter(g => g.id !== goal.id))
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex-shrink-0 px-5 pb-5" style={{ background: 'linear-gradient(150deg,#2E9E5B,#1A6E3C)' }}>
        <div className="text-[16px] font-black text-white mb-3.5 flex items-center gap-1.5 pt-2">
          🎯 目標管理
        </div>
        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="目標を入力してください"
            value={inputBody}
            onChange={e => setInputBody(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
            className="flex-1 rounded-[10px] px-3.5 py-2.5 text-[13px] outline-none"
            style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.3)' }}
          />
          <button
            onClick={handleAdd}
            className="px-4 py-2.5 rounded-[10px] text-[13px] font-bold flex-shrink-0"
            style={{ background: '#fff', color: 'var(--accent)' }}
            aria-label="目標を追加"
          >
            追加
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-[18px] pt-[18px] pb-[100px]" style={{ scrollbarWidth: 'none' }}>
        {loading && (
          <div className="text-center py-10 text-[13px]" style={{ color: 'var(--muted)' }}>読み込み中…</div>
        )}
        {!loading && goals.length === 0 && (
          <div className="text-center py-10 text-[13px]" style={{ color: 'var(--muted)' }}>
            目標がまだありません。上のフォームから追加しましょう！
          </div>
        )}
        {goals.map(goal => (
          <div
            key={goal.id}
            onClick={() => handleToggle(goal)}
            className="flex items-center gap-3 rounded-[12px] px-3.5 py-3 mb-2 cursor-pointer"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', opacity: goal.is_done ? 0.6 : 1 }}
          >
            <input
              type="checkbox"
              checked={goal.is_done}
              onChange={() => handleToggle(goal)}
              onClick={e => e.stopPropagation()}
              className="w-4 h-4 rounded flex-shrink-0 cursor-pointer"
              style={{ accentColor: 'var(--accent)' }}
              aria-label={`目標を完了にする: ${goal.body}`}
            />
            <span
              className="flex-1 text-[13px]"
              style={{
                color: 'var(--text)',
                textDecoration: goal.is_done ? 'line-through' : 'none',
              }}
            >
              {goal.body}
            </span>
            <button
              onClick={e => { e.stopPropagation(); handleDelete(goal) }}
              className="text-[11px] px-2 py-1 rounded-[6px] flex-shrink-0"
              style={{ color: 'var(--muted)', border: '1px solid var(--border)' }}
              aria-label={`目標を削除: ${goal.body}`}
            >
              削除
            </button>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  )
}
