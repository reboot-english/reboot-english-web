import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import FavoritesPage from './components/FavoritesPage.tsx'
import DictionaryPage from './components/DictionaryPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/words" element={<DictionaryPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
