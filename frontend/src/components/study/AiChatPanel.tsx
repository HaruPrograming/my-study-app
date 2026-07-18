import { useState, useEffect, useRef } from 'react'
import type { Question } from '../../types'

type UserMessage = { role: 'user'; text: string }
type AiMessage   = { role: 'ai'; point: string; explanation: string }
type ChatMessage = UserMessage | AiMessage

type Props = { question: Question }

export function AiChatPanel({ question }: Props) {
  const storageKey = `chat_history_${question.id}`
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      return stored ? (JSON.parse(stored) as ChatMessage[]) : []
    } catch {
      return []
    }
  })
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(messages))
  }, [messages, storageKey])

  useEffect(() => {
    if (typeof bottomRef.current?.scrollIntoView === 'function') {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending) return

    const userMsg: ChatMessage = { role: 'user', text }
    const history = [...messages]
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setSending(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: text,
          context: {
            body: question.body,
            choices: question.choices,
            points: question.points,
            explanation: question.explanation,
          },
          history,
        }),
      })
      const data = await res.json() as { point: string; explanation: string }
      setMessages(prev => [...prev, { role: 'ai', point: data.point, explanation: data.explanation }])
    } catch {
      setMessages(prev => [...prev, { role: 'ai', point: '', explanation: '通信エラーが発生しました。' }])
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col" style={{ minHeight: 220 }}>
      {/* Chat history */}
      <div className="flex-1 flex flex-col gap-2 mb-3" style={{ maxHeight: 320, overflowY: 'auto' }}>
        {messages.length === 0 && (
          <div className="text-center text-[12px] py-6" style={{ color: 'var(--muted)' }}>
            この問題についての疑問を質問してください
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'user' ? (
              <div
                className="max-w-[85%] rounded-[12px] px-3.5 py-2.5 text-[12px] leading-relaxed whitespace-pre-wrap"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                {msg.text}
              </div>
            ) : (
              <div className="w-full flex flex-col gap-2">
                {msg.point && (
                  <div className="rounded-[10px] px-3 py-2.5"
                    style={{ background: 'var(--orange-soft)', border: '1px solid rgba(245,124,43,0.25)' }}>
                    <div className="text-[10px] font-bold mb-1" style={{ color: 'var(--orange)' }}>ポイント</div>
                    <div className="text-[12px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text)' }}>
                      {msg.point}
                    </div>
                  </div>
                )}
                <div className="rounded-[10px] px-3 py-2.5"
                  style={{ background: 'var(--accent-soft)', border: '1px solid rgba(46,158,91,0.2)' }}>
                  <div className="text-[10px] font-bold mb-1" style={{ color: 'var(--accent)' }}>解説</div>
                  <div className="text-[12px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text)' }}>
                    {msg.explanation}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-[12px] px-3.5 py-2.5 text-[12px]"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
              考え中…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="flex gap-2 items-end">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="質問を入力してください（Ctrl+Enter で送信）"
          disabled={sending}
          rows={3}
          className="flex-1 rounded-[10px] px-3 py-2.5 text-[13px] outline-none resize-none disabled:opacity-50"
          style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text)' }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          aria-label="送信"
          className="w-10 h-10 rounded-[10px] flex items-center justify-center font-bold text-white disabled:opacity-40"
          style={{ background: 'var(--accent)', flexShrink: 0 }}
        >
          ↑
        </button>
      </div>
    </div>
  )
}
