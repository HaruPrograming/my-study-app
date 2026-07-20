import type { CSSProperties } from 'react'

export type TutorialStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11

type CalloutPos = 'top-fixed' | 'top' | 'mid' | 'bot'

interface StepDef {
  title: string
  desc: string
  pos: CalloutPos
}

const STEPS: Record<TutorialStep, StepDef> = {
  1: {
    title: '① 資格を選ぶ',
    desc: '学習したい資格のカードをタップしてください。\nIT系の人気資格が揃っています。',
    pos: 'mid',
  },
  2: {
    title: '② 年度カードを確認する',
    desc: '選んだ資格の年度カードが表示されます。\n年度をタップすると学習をスタートできます。',
    pos: 'bot',
  },
  3: {
    title: '③ 年度・問題を追加する',
    desc: '「＋ 年度を追加」をタップして問題を追加しましょう。\nPDFアップロードまたはAI自動生成が選べます。',
    pos: 'bot',
  },
  4: {
    title: '④ 問題の追加方法',
    desc: '「PDFタブ」→ 問題PDFを選んで保存\n「AI生成タブ」→ 指示を入力して自動生成\n\n処理完了後に年度カードが追加されます。',
    pos: 'top-fixed',
  },
  5: {
    title: '⑤ 学習をスタート！',
    desc: '年度カードをタップするとボタンが展開します。\n「最初から」または「続きから」を押して学習開始！',
    pos: 'bot',
  },
  6: {
    title: '⑥ 問題を解いてみよう',
    desc: '問題文と4つの選択肢が表示されます。\nインプットモードでは正解を確認しながら\n理解を深めることができます。',
    pos: 'bot',
  },
  7: {
    title: '⑦ ポイント・解説を読む',
    desc: '選択肢の下にはポイントと詳しい解説が表示されます。\n重要な用語・概念をここでしっかり理解しましょう。',
    pos: 'top',
  },
  8: {
    title: '⑧ AI に質問する',
    desc: '分からないことはAIに直接質問できます。\n「AI質問」タブをタップして\n気になることを何でも聞いてみましょう。',
    pos: 'bot',
  },
  9: {
    title: '⑨ アウトプットで実力確認',
    desc: 'アウトプットモードでは答えを自分で選んで\n正解/不正解を確認できます。\nインプット後はアウトプットで定着度を測りましょう！',
    pos: 'bot',
  },
  10: {
    title: '⑩ 学習記録を確認する',
    desc: '記録画面では学習状況が一目でわかります。\n🔥 連続学習日数（ストリーク）\n📊 試験別の進捗バー',
    pos: 'bot',
  },
  11: {
    title: '⑪ 今月の学習カレンダー',
    desc: '学習した日が緑でマークされます。\nカレンダーで継続状況を確認しながら\nモチベーションを維持しましょう！',
    pos: 'top',
  },
}

const ALL_STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as TutorialStep[]

interface Props {
  step: TutorialStep
  onNext: () => void
  onBack: () => void
  onClose: () => void
  highlightStyle?: CSSProperties
}

export function TutorialOverlay({ step, onNext, onBack, onClose, highlightStyle }: Props) {
  const { title, desc, pos } = STEPS[step]
  const isLast = step === 11
  const isFirst = step === 1

  const calloutStyle: CSSProperties = (pos === 'top-fixed' || pos === 'top')
    ? { top: 8 }
    : pos === 'mid'
    ? { top: '48%' }
    : { bottom: 120 }

  return (
    <div className="fixed inset-0 z-[200]" style={{ pointerEvents: 'none' }}>
      {/* 暗いオーバーレイ: step4はAddYearModal自身のbackdropを使う */}
      {!highlightStyle && step !== 4 && (
        <div
          className="absolute inset-0"
          style={{ background: 'rgba(0,0,0,0.6)', pointerEvents: 'auto' }}
          onClick={onClose}
        />
      )}

      {/* スポットライト: 透明背景＋外側box-shadowで周囲を暗くする */}
      {highlightStyle && (
        <div
          className="absolute rounded-[14px]"
          style={{
            ...highlightStyle,
            background: 'transparent',
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
            pointerEvents: 'auto',
            zIndex: 201,
          }}
          onClick={onClose}
        />
      )}

      {/* 吹き出し */}
      <div
        className="absolute left-4 right-4 rounded-[16px] p-4"
        style={{
          ...calloutStyle,
          background: '#fff',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          pointerEvents: 'auto',
          zIndex: step === 4 ? 310 : 202,
        }}
      >
        <div className="text-[13px] font-extrabold mb-1" style={{ color: 'var(--text)' }}>{title}</div>
        <div className="text-[12px] mb-3 whitespace-pre-line" style={{ color: 'var(--muted)', lineHeight: 1.7 }}>{desc}</div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="h-9 px-3 rounded-[9px] text-[12px] font-bold"
            style={{ background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
            閉じる
          </button>
          {!isFirst && (
            <button
              onClick={onBack}
              className="h-9 px-3 rounded-[9px] text-[12px] font-bold"
              style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}>
              ← 戻る
            </button>
          )}
          <button
            onClick={onNext}
            className="flex-1 h-9 rounded-[9px] text-[12px] font-bold text-white"
            style={{ background: 'var(--accent)' }}>
            {isLast ? '完了 🎉' : '次へ →'}
          </button>
        </div>

        {/* ドット（11個） */}
        <div className="flex justify-center gap-1 mt-3">
          {ALL_STEPS.map(s => (
            <div
              key={s}
              className="rounded-full"
              style={{
                width: s === step ? 6 : 4,
                height: s === step ? 6 : 4,
                background: s === step ? 'var(--accent)' : 'var(--border)',
                transition: 'all 0.2s',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
