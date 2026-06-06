import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../firebase.js'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'

export default function CreateSpaceModal({ open, onClose, onSuccess }) {
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const dnRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (open) {
      setDisplayName(''); setUsername(''); setPassword(''); setErrors({})
      setTimeout(() => dnRef.current?.focus(), 100)
    }
  }, [open])

  const handleSubmit = async () => {
    const errs = {}
    if (!displayName.trim()) errs.displayName = true
    if (!username.trim()) errs.username = true
    if (Object.keys(errs).length) { setErrors(errs); return }
    const cleanUser = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
    if (!cleanUser) { setErrors({ username: true }); return }
    setSubmitting(true)
    try {
      await setDoc(doc(db, 'spaces', cleanUser), {
        displayName: displayName.trim(),
        username: cleanUser,
        password: password.trim() || null,
        createdAt: serverTimestamp()
      })
      onSuccess()
      navigate(`/space/${cleanUser}`)
    } catch (err) {
      console.error(err)
      setErrors({ general: true })
    }
    setSubmitting(false)
  }

  return (
    <div className={`modal-overlay ${open ? 'open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><FontAwesomeIcon icon={faXmark} /></button>
        <h2>Create Your Space</h2>
        <p className="sub">A private bridge for your thoughts, or for someone special.</p>
        <div className="form-group">
          <label>Display Name</label>
          <input ref={dnRef} type="text" maxLength={50} placeholder="e.g. Gracy's Space"
            value={displayName} onChange={(e) => { setDisplayName(e.target.value); setErrors(p => ({...p, displayName: false})) }}
            className={errors.displayName ? 'input-error' : ''} />
          <div className={`error-text ${errors.displayName ? 'visible' : ''}`}>Enter a display name</div>
        </div>
        <div className="form-group">
          <label>Username (URL)</label>
          <input type="text" maxLength={30} placeholder="e.g. gracy"
            value={username} onChange={(e) => { setUsername(e.target.value); setErrors(p => ({...p, username: false})) }}
            className={errors.username ? 'input-error' : ''} />
          <div className={`error-text ${errors.username ? 'visible' : ''}`}>Enter a username</div>
        </div>
        <div className="form-group">
          <label>Password (optional)</label>
          <input type="password" placeholder="Leave empty for public access"
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Space'}
          </button>
        </div>
      </div>
    </div>
  )
}
