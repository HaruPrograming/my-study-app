import type { Exam } from '../types'

export const exams: Exam[] = [
  {
    id: 'fe',
    name: '基本情報技術者',
    shortName: '基本情報',
    color: 'green',
    isLocked: false,
    years: [
      { id: 'fe-2024s', label: '2024年 春期', season: 'spring', isNew: true,  completedCount: 0,   totalCount: 80 },
      { id: 'fe-2023a', label: '2023年 秋期', season: 'autumn', isNew: false, completedCount: 54,  totalCount: 80 },
    ],
  },
  {
    id: 'ap',
    name: '応用情報技術者',
    shortName: '応用情報',
    color: 'orange',
    isLocked: false,
    years: [
      { id: 'ap-2023a', label: '2023年 秋期', season: 'autumn', isNew: false, completedCount: 0,   totalCount: 80 },
    ],
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
