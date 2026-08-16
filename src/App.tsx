import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { PrefsProvider } from './lib/prefs'
import { DifferencesPage } from './pages/DifferencesPage'
import { EditPage } from './pages/EditPage'
import { GlossaryPage } from './pages/GlossaryPage'
import { HomePage } from './pages/HomePage'
import { LawDetailPage } from './pages/LawDetailPage'
import { LawsPage } from './pages/LawsPage'
import { QuizPage } from './pages/QuizPage'
import { TermDetailPage } from './pages/TermDetailPage'

export default function App() {
  return (
    <PrefsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/glosario" element={<GlossaryPage />} />
          <Route path="/termino/:id" element={<TermDetailPage />} />
          <Route path="/leyes" element={<LawsPage />} />
          <Route path="/ley/:id" element={<LawDetailPage />} />
          <Route path="/diferencias" element={<DifferencesPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/editar" element={<EditPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </PrefsProvider>
  )
}
