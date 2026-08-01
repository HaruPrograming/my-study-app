import type { Question } from '../types'

export const questions: Question[] = [
  {
    id: 'fe-2023a-55',
    dbId: 0,
    examId: 'fe',
    folderId: 0,
    folderName: '2023年 秋期',
    category: 'コンピュータ構成',
    number: 55,
    totalCount: 80,
    body: 'コンピュータの5大装置の組み合わせとして，適切なものはどれか。',
    choices: [
      { label: 'ア', text: '制御・演算・記憶・入力・出力装置',     isCorrect: true  },
      { label: 'イ', text: '制御・論理・記憶・入力・通信装置',     isCorrect: false },
      { label: 'ウ', text: '演算・論理・主記憶・入力・出力装置',   isCorrect: false },
      { label: 'エ', text: '制御・演算・補助記憶・入力・出力装置', isCorrect: false },
    ],
    illustration: {
      nodes: [
        { icon: 'keyboard', label: '入力装置' },
        { icon: 'cpu',      label: '制御装置\n演算装置', highlight: true },
        { icon: 'monitor',  label: '出力装置' },
      ],
      subNodes: [
        { icon: 'memory',   label: '主記憶（RAM）' },
        { icon: 'storage',  label: '補助記憶（SSD）' },
      ],
      caption: '<b>制御装置＋演算装置</b> をまとめたのが CPU。<br><span class="oi">記憶装置</span>は主記憶（RAM）と補助記憶（SSD）の2種類あるよ。',
    },
    points: [
      { icon: 'target', text: '<b>5大装置</b>：制御・演算・記憶・入力・出力' },
      { icon: 'bolt',   text: 'CPU ＝ <b>制御装置 ＋ 演算装置</b>' },
      { icon: 'bulb',   text: '主記憶（RAM）と補助記憶（SSD）は<b>別物</b>' },
    ],
  },
  {
    id: 'fe-2023a-56',
    dbId: 0,
    examId: 'fe',
    folderId: 0,
    folderName: '2023年 秋期',
    category: 'コンピュータ構成',
    number: 56,
    totalCount: 80,
    body: 'CPUのクロック周波数を2倍にした場合，処理速度はどうなるか。ただし，処理は演算のみで構成され，メモリアクセスは無視できるものとする。',
    choices: [
      { label: 'ア', text: '約2倍になる',   isCorrect: true  },
      { label: 'イ', text: '約4倍になる',   isCorrect: false },
      { label: 'ウ', text: '変わらない',     isCorrect: false },
      { label: 'エ', text: '約0.5倍になる', isCorrect: false },
    ],
    illustration: {
      nodes: [
        { icon: 'cpu', label: 'CPU', highlight: true },
      ],
      caption: 'クロック周波数は CPU が1秒間に実行できるサイクル数。<br><b>2倍</b>にすれば処理速度も<b>約2倍</b>になる。',
    },
    points: [
      { icon: 'target', text: 'クロック周波数 ＝ <b>1秒あたりのサイクル数</b>' },
      { icon: 'bolt',   text: 'クロック周波数を<b>n倍</b>→処理速度も<b>n倍</b>' },
      { icon: 'bulb',   text: 'メモリボトルネックがある場合は比例しないこともある' },
    ],
  },
]
