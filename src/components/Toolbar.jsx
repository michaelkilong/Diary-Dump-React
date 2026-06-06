import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faMinus, faHome, faCrosshairs } from '@fortawesome/free-solid-svg-icons'

export default function Toolbar({ scale, onZoomIn, onZoomOut, onReset, onToggleMode, mode }) {
  return (
    <div className="toolbar">
      <button className={`tool-btn primary ${mode === 'place' ? 'active' : ''}`} onClick={onToggleMode}>
        <FontAwesomeIcon icon={mode === 'place' ? faCrosshairs : faPlus} />
        {mode === 'place' ? 'Cancel' : 'Hang Lock'}
      </button>
      <div className="tool-divider" />
      <button className="tool-btn" onClick={onZoomOut}><FontAwesomeIcon icon={faMinus} /></button>
      <span className="zoom-text">{Math.round(scale * 100)}%</span>
      <button className="tool-btn" onClick={onZoomIn}><FontAwesomeIcon icon={faPlus} /></button>
      <div className="tool-divider" />
      <button className="tool-btn" onClick={onReset} title="Reset View"><FontAwesomeIcon icon={faHome} /></button>
    </div>
  )
}
