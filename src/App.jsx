import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext.jsx'
import WallPage from './components/WallPage.jsx'
export default function App() {
  return (
    <AppProvider>
      <div className="app-bg" />
      <div className="wire-mesh" />
      <Routes>
        <Route path="/" element={<WallPage />} />
        <Route path="/space/:username" element={<WallPage />} />
      </Routes>
    </AppProvider>
  )
}
