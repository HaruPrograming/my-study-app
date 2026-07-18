import type { Exam } from '../types'

export const exams: Exam[] = [
  {
    id: 'fe',
    dbId: 0,
    name: '基本情報技術者',
    shortName: '基本情報',
    color: 'green',
    isLocked: false,
    years: [],
  },
  {
    id: 'ap',
    dbId: 0,
    name: '応用情報技術者',
    shortName: '応用情報',
    color: 'orange',
    isLocked: false,
    years: [],
  },
  {
    id: 'ip',
    dbId: 0,
    name: 'ITパスポート',
    shortName: 'ITパスポート',
    color: 'locked',
    isLocked: true,
    years: [],
  },
]
