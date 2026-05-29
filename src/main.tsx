import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import FavoritesPage from './components/FavoritesPage.tsx'
import DictionaryPage from './components/DictionaryPage.tsx'
import PronunciationPage from './components/PronunciationPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/words" element={<DictionaryPage />} />
        <Route path="/audio" element={<PronunciationPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
