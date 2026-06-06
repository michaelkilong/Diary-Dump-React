import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faCopy, faCheck } from '@fortawesome/free-solid-svg-icons'

export default function ShareModal({ open, onClose, url }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className={`modal-overlay ${open ? 'open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><FontAwesomeIcon icon={faXmark} /></button>
        <h2>Share This Bridge</h2>
        <p className="sub">Copy the link and send it to anyone.</p>
        <div className="share-url-box">
          <input type="text" value={url} readOnly onClick={(e) => e.target.select()} />
          <button onClick={copy}>
            <FontAwesomeIcon icon={copied ? faCheck : faCopy} /> {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  )
}
