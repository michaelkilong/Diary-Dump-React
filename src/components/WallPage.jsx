import React, { useEffect, useRef, useCallback, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { db } from '../firebase.js'
import { collection, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore'
import Sidebar from './Sidebar.jsx'
import Toolbar from './Toolbar.jsx'
import NoteModal from './NoteModal.jsx'
import DetailModal from './DetailModal.jsx'
import CreateSpaceModal from './CreateSpaceModal.jsx'
import ShareModal from './ShareModal.jsx'
import ToastContainer from './ToastContainer.jsx'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faShareNodes } from '@fortawesome/free-solid-svg-icons'

const WALL_SIZE = 4000
const DRAG_THRESHOLD = 4
const LOCK_CLASSES = ['lock-gold','lock-rose','lock-silver','lock-copper','lock-brass','lock-iron']

export default function WallPage() {
  const { username } = useParams()
  const isPublic = !username
  const spaceId = username || 'public'

  const {
    sidebarOpen, setSidebarOpen, modalOpen, setModalOpen,
    detailOpen, setDetailOpen, createSpaceOpen, setCreateSpaceOpen,
    shareOpen, setShareOpen, mode, setMode, toast,
    selectedNote, setSelectedNote, pendingPos
  } = useApp()

  const viewportRef = useRef(null)
  const wallRef = useRef(null)
  const ghostRef = useRef(null)
  const transformRef = useRef({ scale: 0.25, x: 0, y: 0 })
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [spaceData, setSpaceData] = useState(null)

  const stateRef = useRef({
    isPanning: false, isDraggingNote: false, draggedNoteId: null,
    dragStartX: 0, dragStartY: 0, panStartX: 0, panStartY: 0,
    noteStartX: 0, noteStartY: 0, hasDragged: false, pinchState: {}
  })

  const initView = useCallback(() => {
    const vw = window.innerWidth, vh = window.innerHeight
    const scale = Math.max(0.15, Math.min(0.4, Math.min(vw, vh) / WALL_SIZE * 0.9))
    const tx = (vw - WALL_SIZE * scale) / 2
    const ty = (vh - WALL_SIZE * scale) / 2
    transformRef.current = { scale, x: tx, y: ty }
    if (wallRef.current) {
      wallRef.current.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`
    }
  }, [])

  const updateTransform = useCallback(() => {
    const { scale, x, y } = transformRef.current
    if (wallRef.current) {
      wallRef.current.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`
    }
  }, [])

  const zoomTo = useCallback((newScale, mx, my) => {
    const clamped = Math.max(0.1, Math.min(2.5, newScale))
    const { scale, x, y } = transformRef.current
    const wx = (mx - x) / scale
    const wy = (my - y) / scale
    transformRef.current = { scale: clamped, x: mx - wx * clamped, y: my - wy * clamped }
    updateTransform()
  }, [updateTransform])

  // Firestore sync
  useEffect(() => {
    setLoading(true)
    let unsubNotes, unsubSpace
    if (isPublic) {
      unsubNotes = onSnapshot(collection(db, 'publicNotes'), (snap) => {
        const arr = []
        snap.forEach(doc => {
          const d = doc.data()
          arr.push({
            id: doc.id, x: d.x, y: d.y,
            name: d.name, message: d.message, for: d.for || '',
            style: d.style || 0, rotation: d.rotation || 0,
            views: d.views || 0,
            reactions: d.reactions || { heart: 0, fire: 0, smile: 0, tear: 0 },
            date: d.createdAt?.toDate?.().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }) || 'Just now'
          })
        })
        setNotes(arr); setLoading(false)
      }, () => { toast('Unable to connect.', 'error'); setLoading(false) })
    } else {
      unsubSpace = onSnapshot(doc(db, 'spaces', username), (snap) => {
        if (snap.exists()) setSpaceData(snap.data())
      })
      unsubNotes = onSnapshot(collection(db, 'spaces', username, 'notes'), (snap) => {
        const arr = []
        snap.forEach(doc => {
          const d = doc.data()
          arr.push({
            id: doc.id, x: d.x, y: d.y,
            name: d.name, message: d.message, for: d.for || '',
            style: d.style || 0, rotation: d.rotation || 0,
            views: d.views || 0,
            reactions: d.reactions || { heart: 0, fire: 0, smile: 0, tear: 0 },
            date: d.createdAt?.toDate?.().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }) || 'Just now'
          })
        })
        setNotes(arr); setLoading(false)
      }, () => { toast('Unable to connect.', 'error'); setLoading(false) })
    }
    return () => { if (unsubNotes) unsubNotes(); if (unsubSpace) unsubSpace() }
  }, [isPublic, username, toast])

  useEffect(() => { initView() }, [initView])

  const setWallMode = useCallback((m) => {
    setMode(m)
    if (m === 'place') {
      viewportRef.current?.classList.add('placing')
      ghostRef.current?.classList.remove('hidden')
    } else {
      viewportRef.current?.classList.remove('placing')
      ghostRef.current?.classList.add('hidden')
    }
  }, [setMode])

  // Input handlers
  useEffect(() => {
    const vp = viewportRef.current
    if (!vp) return
    const s = stateRef.current

    const onMouseDown = (e) => {
      if (e.button !== 0 || modalOpen || detailOpen || createSpaceOpen || shareOpen || sidebarOpen) return
      if (e.target.closest('.lock')) return
      s.isPanning = true; s.hasDragged = false
      s.dragStartX = e.clientX; s.dragStartY = e.clientY
      s.panStartX = transformRef.current.x; s.panStartY = transformRef.current.y
      vp.classList.add('panning')
    }
    const onMouseMove = (e) => {
      if (s.isPanning) {
        const dx = e.clientX - s.dragStartX, dy = e.clientY - s.dragStartY
        if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) s.hasDragged = true
        transformRef.current.x = s.panStartX + dx
        transformRef.current.y = s.panStartY + dy
        updateTransform()
      }
      if (s.isDraggingNote) {
        const dx = e.clientX - s.dragStartX, dy = e.clientY - s.dragStartY
        if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) s.hasDragged = true
        const note = notes.find(n => n.id === s.draggedNoteId)
        if (note) {
          note.x = s.noteStartX + dx / transformRef.current.scale
          note.y = s.noteStartY + dy / transformRef.current.scale
          const el = document.getElementById(note.id)
          if (el) { el.style.left = note.x + 'px'; el.style.top = note.y + 'px' }
        }
      }
      if (mode === 'place' && !modalOpen && !detailOpen && !createSpaceOpen && !shareOpen && !sidebarOpen) {
        if (ghostRef.current) { ghostRef.current.style.left = e.clientX + 'px'; ghostRef.current.style.top = e.clientY + 'px' }
      }
    }
    const onMouseUp = (e) => {
      if (s.isPanning) { s.isPanning = false; vp.classList.remove('panning') }
      if (s.isDraggingNote) {
        const el = document.getElementById(s.draggedNoteId)
        if (el) { el.classList.remove('dragging'); el.style.transition = '' }
        s.isDraggingNote = false; s.draggedNoteId = null
      }
      if (!s.hasDragged && !modalOpen && !detailOpen && !createSpaceOpen && !shareOpen && !sidebarOpen) {
        const noteEl = e.target.closest('.lock')
        if (noteEl) {
          const note = notes.find(n => n.id === noteEl.id)
          if (note) {
            setSelectedNote(note); setDetailOpen(true)
            const col = isPublic ? 'publicNotes' : `spaces/${username}/notes`
            updateDoc(doc(db, col, note.id), { views: increment(1) }).catch(() => {})
          }
        } else if (mode === 'place' && !e.target.closest('.ui-layer')) {
          pendingPos.current = {
            x: (e.clientX - transformRef.current.x) / transformRef.current.scale,
            y: (e.clientY - transformRef.current.y) / transformRef.current.scale
          }
          setModalOpen(true)
        }
      }
      s.hasDragged = false
    }
    const onWheel = (e) => {
      if (modalOpen || detailOpen || createSpaceOpen || shareOpen || sidebarOpen) return
      e.preventDefault()
      zoomTo(transformRef.current.scale * (e.deltaY > 0 ? 0.92 : 1.08), e.clientX, e.clientY)
    }
    const onTouchStart = (e) => {
      if (modalOpen || detailOpen || createSpaceOpen || shareOpen || sidebarOpen) return
      if (e.touches.length === 2) {
        e.preventDefault()
        const t1 = e.touches[0], t2 = e.touches[1]
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
        const center = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 }
        s.pinchState = {
          startDistance: dist, startScale: transformRef.current.scale,
          wallAnchorX: (center.x - transformRef.current.x) / transformRef.current.scale,
          wallAnchorY: (center.y - transformRef.current.y) / transformRef.current.scale
        }
      } else if (e.touches.length === 1) {
        const t = e.touches[0]
        const target = document.elementFromPoint(t.clientX, t.clientY)
        if (!target || !target.closest('.lock')) {
          s.isPanning = true; s.hasDragged = false
          s.dragStartX = t.clientX; s.dragStartY = t.clientY
          s.panStartX = transformRef.current.x; s.panStartY = transformRef.current.y
        }
      }
    }
    const onTouchMove = (e) => {
      if (modalOpen || detailOpen || createSpaceOpen || shareOpen || sidebarOpen) return
      if (e.touches.length === 2 && s.pinchState.startDistance) {
        e.preventDefault()
        const t1 = e.touches[0], t2 = e.touches[1]
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
        const factor = dist / s.pinchState.startDistance
        const newScale = Math.max(0.1, Math.min(2.5, s.pinchState.startScale * factor))
        const center = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 }
        transformRef.current.scale = newScale
        transformRef.current.x = center.x - s.pinchState.wallAnchorX * newScale
        transformRef.current.y = center.y - s.pinchState.wallAnchorY * newScale
        updateTransform()
      } else if (e.touches.length === 1 && s.isPanning) {
        e.preventDefault()
        const t = e.touches[0]
        const dx = t.clientX - s.dragStartX, dy = t.clientY - s.dragStartY
        if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) s.hasDragged = true
        transformRef.current.x = s.panStartX + dx
        transformRef.current.y = s.panStartY + dy
        updateTransform()
      }
    }
    const onTouchEnd = (e) => {
      if (e.touches.length < 2) s.pinchState = {}
      if (e.touches.length === 0) {
        s.isPanning = false
        if (!s.hasDragged && mode === 'place' && !modalOpen && !detailOpen && !createSpaceOpen && !shareOpen && !sidebarOpen) {
          const t = e.changedTouches[0]
          if (t && !t.target.closest('.ui-layer')) {
            pendingPos.current = {
              x: (t.clientX - transformRef.current.x) / transformRef.current.scale,
              y: (t.clientY - transformRef.current.y) / transformRef.current.scale
            }
            setModalOpen(true)
          }
        }
        s.hasDragged = false
      }
    }
    const onContextMenu = (e) => { if (!e.target.closest('.lock')) e.preventDefault() }

    vp.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    vp.addEventListener('wheel', onWheel, { passive: false })
    vp.addEventListener('touchstart', onTouchStart, { passive: false })
    vp.addEventListener('touchmove', onTouchMove, { passive: false })
    vp.addEventListener('touchend', onTouchEnd)
    vp.addEventListener('contextmenu', onContextMenu)
    return () => {
      vp.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      vp.removeEventListener('wheel', onWheel)
      vp.removeEventListener('touchstart', onTouchStart)
      vp.removeEventListener('touchmove', onTouchMove)
      vp.removeEventListener('touchend', onTouchEnd)
      vp.removeEventListener('contextmenu', onContextMenu)
    }
  }, [mode, modalOpen, detailOpen, createSpaceOpen, shareOpen, sidebarOpen, notes, zoomTo, updateTransform, setModalOpen, setDetailOpen, setSelectedNote, isPublic, username, toast, pendingPos])

  const onNoteMouseDown = useCallback((e, note) => {
    if (mode === 'place' || e.button !== 0 || modalOpen || detailOpen || createSpaceOpen || shareOpen || sidebarOpen) return
    e.stopPropagation()
    const s = stateRef.current
    s.isDraggingNote = true; s.draggedNoteId = note.id; s.hasDragged = false
    s.dragStartX = e.clientX; s.dragStartY = e.clientY
    s.noteStartX = note.x; s.noteStartY = note.y
    const el = document.getElementById(note.id)
    if (el) { el.classList.add('dragging'); el.style.transition = 'none' }
  }, [mode, modalOpen, detailOpen, createSpaceOpen, shareOpen, sidebarOpen])

  const onReact = useCallback(async (noteId, reactionType) => {
    const col = isPublic ? 'publicNotes' : `spaces/${username}/notes`
    const field = `reactions.${reactionType}`
    try { await updateDoc(doc(db, col, noteId), { [field]: increment(1) }); toast('Reaction added', 'success') }
    catch (err) { toast('Failed to react', 'error') }
  }, [isPublic, username, toast])

  const wallTitle = isPublic ? 'Diary Dump' : (spaceData?.displayName || `${username}'s Space`)
  const wallSubtitle = isPublic ? 'The public bridge' : 'A personal space'

  return (
    <>
      <Sidebar spaceData={spaceData} username={username} />
      <div className="viewport" ref={viewportRef}>
        <div className="wall-container" ref={wallRef}>
          {notes.length === 0 && !loading && (
            <div className="empty-state"><h3>The bridge is quiet</h3><p>Be the first to hang a lock</p></div>
          )}
          {loading && <div className="loader" />}
          {notes.map(note => (
            <div key={note.id} id={note.id}
              className={`lock ${LOCK_CLASSES[note.style % LOCK_CLASSES.length]}`}
              style={{ left: note.x + 'px', top: note.y + 'px', '--r': (note.rotation || 0) + 'deg', zIndex: Math.floor(note.y / 10) }}
              onMouseDown={(e) => onNoteMouseDown(e, note)}>
              <div className="lock-name">{note.name}</div>
              <div className="lock-message">{note.message}</div>
              {note.for && <div className="lock-for">For {note.for}</div>}
              <div className="lock-meta">
                <span><FontAwesomeIcon icon={['fas', 'eye']} size="xs" /> {note.views}</span>
                <span><FontAwesomeIcon icon={['fas', 'heart']} size="xs" /> {(note.reactions?.heart || 0)}</span>
                <span>{note.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className={`ghost-lock lock lock-gold ${mode === 'place' && !modalOpen && !detailOpen ? '' : 'hidden'}`} ref={ghostRef} style={{'--r': '0deg'}}>
        <div className="lock-name">Your Name</div>
        <div className="lock-message">Preview</div>
      </div>
      <div className="ui-layer">
        <div className="top-bar">
          <div className="top-bar-left">
            <button className="hamburger" onClick={() => setSidebarOpen(true)}>
              <FontAwesomeIcon icon={faBars} />
            </button>
            <div>
              <div className="wall-title">{wallTitle}</div>
              <div className="wall-subtitle">{wallSubtitle}</div>
            </div>
          </div>
          <button className="share-btn" onClick={() => setShareOpen(true)}>
            <FontAwesomeIcon icon={faShareNodes} />
          </button>
        </div>
        <div className={`place-hint ${mode === 'place' && !modalOpen ? '' : 'hidden'}`}>
          Click anywhere on the bridge to hang your lock
        </div>
        <Toolbar scale={transformRef.current.scale}
          onZoomIn={() => zoomTo(transformRef.current.scale * 1.3, window.innerWidth / 2, window.innerHeight / 2)}
          onZoomOut={() => zoomTo(transformRef.current.scale * 0.7, window.innerWidth / 2, window.innerHeight / 2)}
          onReset={initView}
          onToggleMode={() => setWallMode(mode === 'place' ? 'navigate' : 'place')}
          mode={mode} />
      </div>
      <NoteModal open={modalOpen} onClose={() => { setModalOpen(false); setWallMode('navigate') }}
        onSubmit={async (data) => {
          const pos = pendingPos.current
          const col = isPublic ? 'publicNotes' : `spaces/${username}/notes`
          try {
            await addDoc(collection(db, col), {
              x: pos.x, y: pos.y, name: data.name, message: data.message, for: data.for || '',
              style: Math.floor(Math.random() * LOCK_CLASSES.length),
              rotation: (Math.random() - 0.5) * 5,
              views: 0, reactions: { heart: 0, fire: 0, smile: 0, tear: 0 },
              createdAt: serverTimestamp()
            })
            toast('Your lock has been hung', 'success')
            setModalOpen(false); setWallMode('navigate')
          } catch (err) { toast('Failed to hang lock. Try again.', 'error') }
        }} />
      <DetailModal open={detailOpen} note={selectedNote} onClose={() => setDetailOpen(false)} onReact={onReact} />
      <CreateSpaceModal open={createSpaceOpen} onClose={() => setCreateSpaceOpen(false)}
        onSuccess={() => { toast('Space created!', 'success'); setCreateSpaceOpen(false) }} />
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)}
        url={typeof window !== 'undefined' ? window.location.origin + (isPublic ? '/' : `/space/${username}`) : ''} />
      <ToastContainer />
    </>
  )
}
