import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { StudyProvider } from './context/StudyContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { TutorialProvider } from './context/TutorialContext'
import { TopPage } from './pages/TopPage'
import { StudyPage } from './pages/StudyPage'
import { CompletePage } from './pages/CompletePage'
import { RecordPage } from './pages/RecordPage'
import { LoginPage } from './pages/LoginPage'

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div role="status" className="flex items-center justify-center min-h-screen"
        style={{ background: 'var(--bg)' }}>
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!user) return <LoginPage />

  return (
    <StudyProvider>
      <Routes>
        <Route path="/" element={<TopPage />} />
        <Route path="/study/:examId/:folderId" element={<StudyPage />} />
        <Route path="/study/:examId/:folderId/complete" element={<CompletePage />} />
        <Route path="/record" element={<RecordPage />} />
      </Routes>
    </StudyProvider>
  )
}

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <TutorialProvider>
          <AppContent />
        </TutorialProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
