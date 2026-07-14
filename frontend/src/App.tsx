import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { StudyProvider } from './context/StudyContext'
import { TopPage } from './pages/TopPage'
import { StudyPage } from './pages/StudyPage'
import { CompletePage } from './pages/CompletePage'
import { RecordPage } from './pages/RecordPage'

function App() {
  return (
    <BrowserRouter>
      <StudyProvider>
        <Routes>
          <Route path="/" element={<TopPage />} />
          <Route path="/study/:examId/:examLabel" element={<StudyPage />} />
          <Route path="/study/:examId/:examLabel/complete" element={<CompletePage />} />
          <Route path="/record" element={<RecordPage />} />
        </Routes>
      </StudyProvider>
    </BrowserRouter>
  )
}

export default App
