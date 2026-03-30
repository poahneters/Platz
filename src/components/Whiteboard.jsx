import { useState, useEffect } from 'react'

const STORAGE_KEY = 'platz_boards'
const MARKER_COLORS = ['#1a1a2e', '#1a2e1a', '#2e1a1a', '#1a1e2e', '#2e2a1a']
const BOARD_COLORS  = ['#c9a86c', '#7a9bb5', '#9b7ab5', '#7ab59b', '#b57a7a']
let nextId = Date.now()

function makeBoard(title, color, markerColor) {
  return { id: (++nextId).toString(), title, color, markerColor: markerColor || '#1a1a2e', items: [] }
}

function defaultBoards() {
  return [makeBoard('Long-term Goals', '#c9a86c', '#1a1a2e')]
}

export default function Whiteboard() {
  const [boards, setBoards] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultBoards() } catch { return defaultBoards() }
  })
  const [activeId, setActiveId] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY))?.[0]?.id || null } catch { return null }
  })
  const [newItemText, setNewItemText] = useState('')
  const [newBoardTitle, setNewBoardTitle] = useState('')
  const [showNewBoard, setShowNewBoard] = useState(false)
  const [editingTitle, setEditingTitle] = useState(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(boards))
  }, [boards])

  useEffect(() => {
    if (!activeId && boards.length > 0) setActiveId(boards[0].id)
  }, [boards, activeId])

  function addBoard() {
    if (!newBoardTitle.trim()) return
    const board = makeBoard(
      newBoardTitle.trim(),
      BOARD_COLORS[boards.length % BOARD_COLORS.length],
      MARKER_COLORS[boards.length % MARKER_COLORS.length]
    )
    setBoards(prev => [...prev, board])
    setActiveId(board.id)
    setNewBoardTitle('')
    setShowNewBoard(false)
  }

  function deleteBoard(id) {
    const remaining = boards.filter(b => b.id !== id)
    setBoards(remaining)
    setActiveId(remaining[0]?.id || null)
  }

  function updateTitle(id, title) {
    setBoards(prev => prev.map(b => b.id === id ? { ...b, title: title || b.title } : b))
    setEditingTitle(null)
  }

  function addItem(boardId) {
    if (!newItemText.trim()) return
    const item = { id: (++nextId).toString(), text: newItemText.trim(), done: false }
    setBoards(prev => prev.map(b => b.id === boardId ? { ...b, items: [...b.items, item] } : b))
    setNewItemText('')
  }

  function toggleItem(boardId, itemId) {
    setBoards(prev => prev.map(b => b.id === boardId
      ? { ...b, items: b.items.map(i => i.id === itemId ? { ...i, done: !i.done } : i) }
      : b
    ))
  }

  function removeItem(boardId, itemId) {
    setBoards(prev => prev.map(b => b.id === boardId
      ? { ...b, items: b.items.filter(i => i.id !== itemId) }
      : b
    ))
  }

  const active = boards.find(b => b.id === activeId)
  const ink = active?.markerColor || '#1a1a2e'

  return (
    <div style={{ display: 'flex', height: '100%', gap: '1px', background: 'var(--border)' }}>

      {/* ── Boards sidebar (dark) ── */}
      <aside style={{ width: '200px', flexShrink: 0, background: 'var(--bg)', overflowY: 'auto', paddingTop: '20px' }}>
        <div style={{ padding: '0 18px 14px', fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
          Boards
        </div>

        {boards.map(board => (
          <button
            key={board.id}
            onClick={() => setActiveId(board.id)}
            className="sidebar-btn"
            style={{
              width: '100%', textAlign: 'left', padding: '10px 18px',
              display: 'flex', alignItems: 'center', gap: '10px',
              borderLeft: activeId === board.id ? `2px solid ${board.color}` : '2px solid transparent',
              background: activeId === board.id ? 'var(--gold-dim)' : 'transparent',
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: board.color, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: '13px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {board.title}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
              {board.items.filter(i => !i.done).length}
            </span>
          </button>
        ))}

        {showNewBoard ? (
          <div style={{ padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <input
              value={newBoardTitle}
              onChange={e => setNewBoardTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addBoard(); if (e.key === 'Escape') setShowNewBoard(false) }}
              placeholder="Board name..."
              autoFocus
              style={{ fontSize: '13px', padding: '7px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--text)', width: '100%' }}
            />
            <div style={{ display: 'flex', gap: '5px' }}>
              <button onClick={addBoard} style={{ flex: 1, padding: '6px', background: 'var(--gold)', color: '#0a0908', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                Create
              </button>
              <button onClick={() => { setShowNewBoard(false); setNewBoardTitle('') }} style={{ padding: '6px 9px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-dim)', borderRadius: '6px', fontSize: '13px' }}>
                ×
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowNewBoard(true)} className="sidebar-btn" style={{ width: '100%', textAlign: 'left', padding: '10px 18px', fontSize: '13px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '2px solid transparent', transition: 'all 0.2s' }}>
            <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span> New board
          </button>
        )}
      </aside>

      {/* ── Whiteboard surface ── */}
      <main style={{
        flex: 1,
        background: '#f4f3ee',
        overflowY: 'auto',
        position: 'relative',
        // Subtle whiteboard texture via repeating gradient
        backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, rgba(0,0,0,0.04) 31px, rgba(0,0,0,0.04) 32px)',
        backgroundPositionY: '20px',
      }}>

        {!active ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: "'Permanent Marker', cursive", fontSize: '22px', color: 'rgba(0,0,0,0.2)' }}>
            Pick a board →
          </div>
        ) : (
          <div key={active.id} className="fade-up" style={{ padding: '40px 52px', maxWidth: '820px', margin: '0 auto' }}>

            {/* Board header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '36px' }}>
              {editingTitle === active.id ? (
                <input
                  defaultValue={active.title}
                  autoFocus
                  onBlur={e => updateTitle(active.id, e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') updateTitle(active.id, e.target.value); if (e.key === 'Escape') setEditingTitle(null) }}
                  style={{
                    fontFamily: "'Permanent Marker', cursive",
                    fontSize: 'clamp(28px, 4vw, 44px)',
                    color: ink,
                    background: 'transparent',
                    borderBottom: `2px solid ${ink}`,
                    paddingBottom: '4px',
                    width: '100%',
                    lineHeight: 1.2,
                  }}
                />
              ) : (
                <h2
                  onClick={() => setEditingTitle(active.id)}
                  title="Click to rename"
                  style={{
                    fontFamily: "'Permanent Marker', cursive",
                    fontSize: 'clamp(28px, 4vw, 44px)',
                    color: ink,
                    cursor: 'text',
                    lineHeight: 1.2,
                    flex: 1,
                    wordBreak: 'break-word',
                  }}
                >
                  {active.title}
                </h2>
              )}

              <button
                onClick={() => deleteBoard(active.id)}
                style={{
                  marginTop: '6px',
                  fontSize: '11px',
                  color: 'rgba(0,0,0,0.3)',
                  padding: '4px 10px',
                  border: '1px solid rgba(0,0,0,0.15)',
                  borderRadius: '5px',
                  background: 'transparent',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif',
                }}
                onMouseEnter={e => e.target.style.color = 'rgba(0,0,0,0.5)'}
                onMouseLeave={e => e.target.style.color = 'rgba(0,0,0,0.3)'}
              >
                Erase board
              </button>
            </div>

            {/* Progress */}
            {active.items.length > 0 && (
              <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1, height: '3px', background: 'rgba(0,0,0,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    background: ink,
                    opacity: 0.5,
                    width: `${(active.items.filter(i => i.done).length / active.items.length) * 100}%`,
                    borderRadius: '2px',
                    transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
                  }} />
                </div>
                <span style={{ fontFamily: "'Permanent Marker', cursive", fontSize: '14px', color: `${ink}99`, whiteSpace: 'nowrap' }}>
                  {active.items.filter(i => i.done).length} / {active.items.length}
                </span>
              </div>
            )}

            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '32px' }}>
              {active.items.length === 0 && (
                <p style={{ fontFamily: "'Permanent Marker', cursive", fontSize: '22px', color: `${ink}40`, padding: '12px 0' }}>
                  write your first goal below...
                </p>
              )}

              {active.items.map(item => (
                <div
                  key={item.id}
                  className="board-item"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    padding: '8px 4px',
                    borderBottom: `1px solid rgba(0,0,0,0.06)`,
                    opacity: item.done ? 0.45 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  {/* Hand-drawn checkbox */}
                  <button
                    onClick={() => toggleItem(active.id, item.id)}
                    style={{
                      width: '22px',
                      height: '22px',
                      border: `2px solid ${ink}`,
                      borderRadius: '3px',
                      background: item.done ? ink : 'transparent',
                      flexShrink: 0,
                      marginTop: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#f4f3ee',
                      fontFamily: "'Permanent Marker', cursive",
                      fontSize: '13px',
                      transition: 'background 0.2s',
                      cursor: 'pointer',
                    }}
                  >
                    {item.done ? '✓' : ''}
                  </button>

                  <span style={{
                    fontFamily: "'Permanent Marker', cursive",
                    fontSize: 'clamp(16px, 2.2vw, 22px)',
                    color: ink,
                    lineHeight: 1.4,
                    flex: 1,
                    textDecoration: item.done ? 'line-through' : 'none',
                    textDecorationColor: `${ink}88`,
                    wordBreak: 'break-word',
                  }}>
                    {item.text}
                  </span>

                  <button
                    onClick={() => removeItem(active.id, item.id)}
                    className="board-item-delete"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '18px',
                      color: `${ink}55`,
                      opacity: 0,
                      transition: 'opacity 0.15s',
                      padding: '0 4px',
                      flexShrink: 0,
                      marginTop: '2px',
                      background: 'transparent',
                      border: 'none',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Write input — styled like writing on the board */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', paddingTop: '8px', borderTop: `2px solid ${ink}22` }}>
              <span style={{ fontFamily: "'Permanent Marker', cursive", fontSize: '20px', color: `${ink}40` }}>+</span>
              <input
                value={newItemText}
                onChange={e => setNewItemText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addItem(active.id)}
                placeholder="write a goal..."
                style={{
                  flex: 1,
                  fontFamily: "'Permanent Marker', cursive",
                  fontSize: 'clamp(16px, 2.2vw, 20px)',
                  color: ink,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  padding: '8px 0',
                  letterSpacing: '0.01em',
                }}
              />
              {newItemText.trim() && (
                <button
                  onClick={() => addItem(active.id)}
                  style={{
                    fontFamily: "'Permanent Marker', cursive",
                    fontSize: '15px',
                    color: '#f4f3ee',
                    background: ink,
                    border: 'none',
                    borderRadius: '6px',
                    padding: '7px 14px',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s',
                  }}
                >
                  Add
                </button>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  )
}
