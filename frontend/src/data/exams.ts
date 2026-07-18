import type { Exam } from '../types'

export const exams: Exam[] = [
  {
    id: 'fe',
    name: '基本情報技術者',
    shortName: '基本情報',
    color: 'green',
    isLocked: false,
    years: [],
  },
  {
    id: 'ap',
    name: '応用情報技術者',
    shortName: '応用情報',
    color: 'orange',
    isLocked: false,
    years: [],
  },
  {
    id: 'ip',
    name: 'ITパスポート',
    shortName: 'ITパスポート',
    color: 'locked',
    isLocked: true,
    years: [],
  },
]
