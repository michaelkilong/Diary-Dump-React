import React, { useState, useRef, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'

export default function NoteModal({ open, onClose, onSubmit }) {
  const [name, setName] = useState('')
  const [forWho, setForWho] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const nameRef = useRef(null)

  useEffect(() => {
    if (open) {
      setName(''); setForWho(''); setMessage(''); setErrors({})
      setTimeout(() => nameRef.current?.focus(), 100)
    }
  }, [open])

  const handleSubmit = async () => {
    const errs = {}
    if (!name.trim()) errs.name = true
    if (!message.trim()) errs.message = true
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSubmitting(true)
    await onSubmit({ name: name.trim(), message: message.trim(), for: forWho.trim() })
    setSubmitting(false)
  }

  return (
    <div className={`modal-overlay ${open ? 'open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><FontAwesomeIcon icon={faXmark} /></button>
        <h2>Hang a Lock</h2>
        <p className="sub">Leave a thought, a memory, or a secret.</p>
        <div className="form-group">
          <label>Your Name</label>
          <input ref={nameRef} type="text" maxLength={50} placeholder="Enter your name"
            value={name} onChange={(e) => { setName(e.target.value); setErrors(p => ({...p, name: false})) }}
            className={errors.name ? 'input-error' : ''} />
          <div className={`error-text ${errors.name ? 'visible' : ''}`}>Please enter your name</div>
        </div>
        <div className="form-group">
          <label>This lock is for (optional)</label>
          <input type="text" maxLength={50} placeholder="Who are you thinking of?"
            value={forWho} onChange={(e) => setForWho(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Your Message</label>
          <textarea maxLength={500} placeholder="Write your message here..."
            value={message} onChange={(e) => { setMessage(e.target.value); setErrors(p => ({...p, message: false})) }}
            className={errors.message ? 'input-error' : ''} />
          <div className="char-count">{message.length}/500</div>
          <div className={`error-text ${errors.message ? 'visible' : ''}`}>Please write a message</div>
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Hanging...' : 'Hang Lock'}
          </button>
        </div>
      </div>
    </div>
  )
}
