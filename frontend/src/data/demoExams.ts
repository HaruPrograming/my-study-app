import type { Exam } from '../types'

export const demoExams: Exam[] = [
  {
    id: 'tutorial',
    dbId: -1,
    name: '基本情報技術者（サンプル）',
    shortName: 'FE',
    color: 'green',
    isLocked: false,
    years: [
      {
        id: 'demo-year-1',
        label: 'デモ学習',
        season: 'spring',
        isNew: true,
        completedCount: 3,
        totalCount: 10,
      },
    ],
  },
]
