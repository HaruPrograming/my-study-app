export type Choice = {
  label: string
  text: string
  isCorrect: boolean
}

export type IllustNode = {
  icon: string
  label: string
  highlight?: boolean
}

export type Point = {
  icon: 'target' | 'bolt' | 'bulb'
  text: string
}

export type Question = {
  id: string
  examId: string
  examLabel: string
  category: string
  number: number
  totalCount: number
  body: string
  choices: Choice[]
  illustration: {
    nodes: IllustNode[]
    subNodes?: IllustNode[]
    caption: string
  } | null
  points: Point[]
}

export type YearEntry = {
  id: string
  label: string
  season: 'spring' | 'autumn'
  isNew: boolean
  completedCount: number
  totalCount: number
}

export type Exam = {
  id: string
  name: string
  shortName: string
  color: 'green' | 'orange' | 'locked'
  isLocked: boolean
  years: YearEntry[]
}

export type ExamProgress = {
  examId: string
  name: string
  color: 'green' | 'orange'
  done: number
  total: number
}
