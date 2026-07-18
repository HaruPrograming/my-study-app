import { render, screen } from '@testing-library/react'
import App from './App'
import { vi, describe, it, expect } from 'vitest'

vi.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: vi.fn(),
}))

vi.mock('./context/StudyContext', () => ({
  StudyProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useStudyContext: () => ({
    streakDays: 0, completedQuestions: 0, overallProgress: 0,
    exams: [], processingUploads: [], failedUploads: [], studyDays: new Set(), studyHistory: [],
    completeQuestion: vi.fn(), resetProgress: vi.fn(),
    addStudyDay: vi.fn(), addYearEntry: vi.fn(), startProcessing: vi.fn(), dismissFailedUpload: vi.fn(), refreshData: vi.fn(),
  }),
}))

import { useAuth } from './contexts/AuthContext'

describe('App - 認証ガード', () => {
  it('loading 中はスピナーが表示される', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, loading: true, login: vi.fn(), logout: vi.fn() })
    render(<App />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('未ログインの場合は LoginPage が表示される', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, loading: false, login: vi.fn(), logout: vi.fn() })
    render(<App />)
    expect(screen.getByText('まなびドリル')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Google/ })).toBeInTheDocument()
  })

  it('ログイン済みの場合はアプリ（TopPage）が表示される', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, name: 'テスト', email: 'test@example.com', avatar: null },
      loading: false, login: vi.fn(), logout: vi.fn(),
    })
    render(<App />)
    expect(screen.getByText('まなびドリル')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Google/ })).not.toBeInTheDocument()
  })
})
