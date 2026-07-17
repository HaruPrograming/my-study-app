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
  explanation?: Array<{ title: string; body: string }> | null
}

export type YearEntry = {
  id: string
  label: string
  season: 'spring' | 'autumn'
  isNew: boolean
  completedCount: number
  totalCount: number
}

export type ExamColor = 'green' | 'orange' | 'blue' | 'purple' | 'red'

export type Exam = {
  id: string
  dbId: number
  name: string
  shortName: string
  color: ExamColor | 'locked'
  isLocked: boolean
  years: YearEntry[]
}

export type ExamProgress = {
  examId: string
  name: string
  color: ExamColor
  done: number
  total: number
}

export type ProcessingUpload = {
  uploadId: number
  examId: string
  examLabel: string
}
