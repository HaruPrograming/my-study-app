import { createContext, useContext, useState, type ReactNode } from 'react'

interface TutorialContextType {
  tutorialStep: number | null
  setTutorialStep: (step: number | null) => void
}

const TutorialContext = createContext<TutorialContextType | null>(null)

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [tutorialStep, setTutorialStep] = useState<number | null>(null)
  return (
    <TutorialContext.Provider value={{ tutorialStep, setTutorialStep }}>
      {children}
    </TutorialContext.Provider>
  )
}

export function useTutorial() {
  const ctx = useContext(TutorialContext)
  if (!ctx) throw new Error('useTutorial must be used within TutorialProvider')
  return ctx
}
