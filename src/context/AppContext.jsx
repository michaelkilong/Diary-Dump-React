import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
const AppContext = createContext(null)
export function AppProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [createSpaceOpen, setCreateSpaceOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [mode, setMode] = useState('navigate')
  const [toasts, setToasts] = useState([])
  const [selectedNote, setSelectedNote] = useState(null)
  const pendingPos = useRef({ x: 0, y: 0 })
  const toast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }, [])
  return (
    <AppContext.Provider value={{
      sidebarOpen, setSidebarOpen, modalOpen, setModalOpen, detailOpen, setDetailOpen,
      createSpaceOpen, setCreateSpaceOpen, shareOpen, setShareOpen, mode, setMode,
      toasts, toast, selectedNote, setSelectedNote, pendingPos
    }}>{children}</AppContext.Provider>
  )
}
export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}
