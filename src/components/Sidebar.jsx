import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { db } from '../firebase.js'
import { collection, onSnapshot } from 'firebase/firestore'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGlobe, faLock, faPlus, faGear, faXmark } from '@fortawesome/free-solid-svg-icons'

export default function Sidebar({ spaceData, username }) {
  const { sidebarOpen, setSidebarOpen, setCreateSpaceOpen } = useApp()
  const [spaces, setSpaces] = useState([])
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'spaces'), (snap) => {
      const arr = []
      snap.forEach(doc => {
        const d = doc.data()
        arr.push({ username: doc.id, displayName: d.displayName || doc.id })
      })
      setSpaces(arr)
    })
    return () => unsub()
  }, [])

  const isPublic = location.pathname === '/'

  return (
    <>
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-avatar">D</div>
          <div className="sidebar-title">
            <h2>Diary Dump</h2>
            <span>write it down</span>
          </div>
        </div>

        <div className="sidebar-section-title">Spaces</div>
        <div className="sidebar-item" onClick={() => { navigate('/'); setSidebarOpen(false) }}>
          <div className={`icon ${isPublic ? 'gold' : ''}`}><FontAwesomeIcon icon={faGlobe} /></div>
          <span>Public Wall</span>
          {isPublic && <span className="badge">Live</span>}
        </div>
        {spaces.map(s => (
          <div key={s.username} className="sidebar-item" onClick={() => { navigate(`/space/${s.username}`); setSidebarOpen(false) }}>
            <div className={`icon ${username === s.username ? 'gold' : ''}`}><FontAwesomeIcon icon={faLock} /></div>
            <span>{s.displayName}</span>
            <span className="arrow">›</span>
          </div>
        ))}

        <div className="sidebar-create-btn" onClick={() => { setCreateSpaceOpen(true); setSidebarOpen(false) }}>
          <FontAwesomeIcon icon={faPlus} /> Create Your Space
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-footer-item" onClick={() => setSidebarOpen(false)}>
            <FontAwesomeIcon icon={faXmark} /> Close Menu
          </div>
        </div>
      </div>
    </>
  )
}
