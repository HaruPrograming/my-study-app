import type { Question } from '../types'

export const demoQuestions: Question[] = [
  {
    id: 'demo-1',
    examId: 'tutorial',
    examLabel: 'チュートリアル',
    category: 'コンピュータ基礎',
    number: 1,
    totalCount: 2,
    body: 'CPU（中央処理装置）の主な役割として正しいものはどれか？',
    choices: [
      { label: 'ア', text: 'データを長期的に保存する', isCorrect: false },
      { label: 'イ', text: 'プログラムの命令を解釈し実行する', isCorrect: true },
      { label: 'ウ', text: 'ネットワーク接続を管理する', isCorrect: false },
      { label: 'エ', text: '電力を変換して各部品に供給する', isCorrect: false },
    ],
    illustration: null,
    points: [
      { icon: 'bolt', text: '<b>CPU（中央処理装置）</b>はコンピュータの頭脳。プログラムの命令を1つずつ解釈・実行する演算装置だ。' },
      { icon: 'bulb', text: '<b>長期保存</b>はHDD・SSD（補助記憶装置）、<b>一時保存</b>はRAM（主記憶装置）の役割。' },
    ],
    explanation: [
      { title: '5大装置との関係', body: '制御装置・演算装置（CPUに相当）・主記憶・補助記憶・入出力装置をコンピュータの5大装置と呼ぶ。' },
    ],
  },
  {
    id: 'demo-2',
    examId: 'tutorial',
    examLabel: 'チュートリアル',
    category: 'コンピュータ基礎',
    number: 2,
    totalCount: 2,
    body: 'RAM（主記憶装置）の特徴として正しいものはどれか？',
    choices: [
      { label: 'ア', text: '電源を切っても内容が保持される不揮発性メモリ', isCorrect: false },
      { label: 'イ', text: '電源を切ると内容が消える揮発性メモリ', isCorrect: true },
      { label: 'ウ', text: '大容量で主に動画・写真の保存に使われる', isCorrect: false },
      { label: 'エ', text: '読み取り専用で書き込みはできない', isCorrect: false },
    ],
    illustration: null,
    points: [
      { icon: 'bolt', text: '<b>RAM</b>は揮発性メモリ。プログラム実行中にデータを一時保持するが、電源OFFで消える。' },
      { icon: 'target', text: '<b>ROM</b>（不揮発性・読み取り専用）と <b>RAM</b>（揮発性・読み書き可）の違いを押さえよう。' },
    ],
    explanation: [
      { title: '実際の試験での出題', body: 'RAMとROMの違い、揮発性・不揮発性の定義は頻出。「揮発性＝電源OFFで消える」と覚えておこう。' },
    ],
  },
]
