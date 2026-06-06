import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faEye, faHeart, faFire, faFaceSmile, faFaceSadTear } from '@fortawesome/free-solid-svg-icons'

const LOCK_CLASSES = ['lock-gold','lock-rose','lock-silver','lock-copper','lock-brass','lock-iron']
const REACTIONS = [
  { key: 'heart', icon: faHeart, label: 'Heart' },
  { key: 'fire', icon: faFire, label: 'Fire' },
  { key: 'smile', icon: faFaceSmile, label: 'Smile' },
  { key: 'tear', icon: faFaceSadTear, label: 'Tear' },
]

export default function DetailModal({ open, note, onClose, onReact }) {
  if (!note) return null
  return (
    <div className={`modal-overlay ${open ? 'open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className={`detail-card ${LOCK_CLASSES[note.style % LOCK_CLASSES.length]}`}
        style={{'--r': (note.rotation || 0) + 'deg'}}
        onClick={(e) => e.stopPropagation()}>
        <button className="detail-close" onClick={onClose}><FontAwesomeIcon icon={faXmark} /></button>
        <div className="detail-name">{note.name}</div>
        <div className="detail-message">{note.message}</div>
        {note.for && <div className="detail-for">For {note.for}</div>}
        <div className="detail-date">{note.date}</div>
        <div className="detail-stats">
          <span><FontAwesomeIcon icon={faEye} /> {note.views || 0} views</span>
          <span><FontAwesomeIcon icon={faHeart} /> {(note.reactions?.heart || 0)} hearts</span>
        </div>
        <div className="detail-reactions">
          {REACTIONS.map(r => (
            <button key={r.key} className="reaction-btn" onClick={() => onReact(note.id, r.key)}>
              <FontAwesomeIcon icon={r.icon} /> {r.label} {(note.reactions?.[r.key] || 0)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
