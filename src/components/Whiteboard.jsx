import { useState, useEffect } from 'react'

const STORAGE_KEY = 'platz_boards'
const PALETTE = ['#c9a86c', '#7a9bb5', '#9b7ab5', '#7ab59b', '#b57a7a', '#b5a07a']
let nextId = Date.now()

function makeBoard(title, color) {
  return { id: (++nextId).toString(), title, color, items: [] }
}

function defaultBoards() {
  return [makeBoard('Long-term Goals', '#c9a86c')]
}

export default function Whiteboard() {
  const [boards, setBoards] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultBoards() } catch { return defaultBoards() }
  })
  const [activeId, setActiveId] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
      return saved?.[0]?.id || null
    } catch { return null }
  })
  const [newItemText, setNewItemText] = useState('')
  const [newBoardTitle, setNewBoardTitle] = useState('')
  const [showNewBoard, setShowNewBoard] = useState(false)
  const [editingTitle, setEditingTitle] = useState(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(boards))
  }, [boards])

  // Set active to first board if none selected
  useEffect(() => {
    if (!activeId && boards.length > 0) setActiveId(boards[0].id)
  }, [boards, activeId])

  function addBoard() {
    if (!newBoardTitle.trim()) return
    const board = makeBoard(newBoardTitle.trim(), PALETTE[boards.length % PALETTE.length])
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

  return (
    <div style={{ display: 'flex', height: '100%', gap: '1px', background: 'var(--border)' }}>

      {/* ── Boards sidebar ── */}
      <aside style={{ width: '220px', flexShrink: 0, background: 'var(--bg)', overflowY: 'auto', paddingTop: '20px' }}>
        <div style={{
          padding: '0 18px 14px',
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.14em',
          color: 'var(--text-dim)',
          textTransform: 'uppercase',
        }}>
          Boards
        </div>

        {boards.map(board => (
          <button
            key={board.id}
            onClick={() => setActiveId(board.id)}
            className="sidebar-btn"
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '10px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              borderLeft: activeId === board.id ? `2px solid ${board.color}` : '2px solid transparent',
              background: activeId === board.id ? 'var(--gold-dim)' : 'transparent',
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: board.color,
              flexShrink: 0,
            }} />
            <span style={{
              flex: 1,
              fontSize: '13px',
              color: 'var(--text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {board.title}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
              {board.items.filter(i => !i.done).length}
            </span>
          </button>
        ))}

        {/* New board input */}
        {showNewBoard ? (
          <div style={{ padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <input
              value={newBoardTitle}
              onChange={e => setNewBoardTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') addBoard()
                if (e.key === 'Escape') setShowNewBoard(false)
              }}
              placeholder="Board name..."
              autoFocus
              style={{
                fontSize: '13px',
                padding: '7px 10px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '7px',
                color: 'var(--text)',
                width: '100%',
              }}
            />
            <div style={{ display: 'flex', gap: '5px' }}>
              <button
                onClick={addBoard}
                style={{
                  flex: 1,
                  padding: '6px',
                  background: 'var(--gold)',
                  color: '#0a0908',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                Create
              </button>
              <button
                onClick={() => { setShowNewBoard(false); setNewBoardTitle('') }}
                style={{
                  padding: '6px 9px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-dim)',
                  borderRadius: '6px',
                  fontSize: '13px',
                }}
              >
                ×
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowNewBoard(true)}
            className="sidebar-btn"
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '10px 18px',
              fontSize: '13px',
              color: 'var(--text-dim)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderLeft: '2px solid transparent',
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span> New board
          </button>
        )}
      </aside>

      {/* ── Board content ── */}
      <main style={{ flex: 1, background: 'var(--bg)', overflowY: 'auto', padding: '44px 48px' }}>
        {!active ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)', fontSize: '14px' }}>
            Select a board or create a new one
          </div>
        ) : (
          <div key={active.id} className="fade-up" style={{ maxWidth: '700px', margin: '0 auto' }}>

            {/* Board header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '36px' }}>
              <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: active.color, flexShrink: 0 }} />

              {editingTitle === active.id ? (
                <input
                  defaultValue={active.title}
                  autoFocus
                  onBlur={e => updateTitle(active.id, e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') updateTitle(active.id, e.target.value)
                    if (e.key === 'Escape') setEditingTitle(null)
                  }}
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '30px',
                    fontWeight: 700,
                    color: 'var(--text)',
                    borderBottom: `1px solid ${active.color}`,
                    paddingBottom: '2px',
                    width: '100%',
                    background: 'transparent',
                  }}
                />
              ) : (
                <h2
                  onClick={() => setEditingTitle(active.id)}
                  title="Click to rename"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '30px',
                    fontWeight: 700,
                    color: 'var(--text)',
                    cursor: 'text',
                  }}
                >
                  {active.title}
                </h2>
              )}

              <button
                onClick={() => deleteBoard(active.id)}
                className="btn-ghost"
                style={{
                  marginLeft: 'auto',
                  fontSize: '11px',
                  color: 'var(--text-dim)',
                  padding: '4px 10px',
                  border: '1px solid var(--border2)',
                  borderRadius: '5px',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }}
              >
                Delete board
              </button>
            </div>

            {/* Progress bar */}
            {active.items.length > 0 && (
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Progress</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                    {active.items.filter(i => i.done).length} / {active.items.length}
                  </span>
                </div>
                <div style={{ height: '3px', background: 'var(--surface2)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    background: active.color,
                    width: `${(active.items.filter(i => i.done).length / active.items.length) * 100}%`,
                    borderRadius: '2px',
                    transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
                  }} />
                </div>
              </div>
            )}

            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '20px' }}>
              {active.items.length === 0 && (
                <p style={{ padding: '20px 0', fontSize: '14px', color: 'var(--text-dim)' }}>
                  Add your first goal below.
                </p>
              )}

              {active.items.map(item => (
                <div
                  key={item.id}
                  className="board-item fade-up"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '13px 14px',
                    borderRadius: '8px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border2)',
                    opacity: item.done ? 0.4 : 1,
                    transition: 'opacity 0.25s ease',
                  }}
                >
                  <button
                    onClick={() => toggleItem(active.id, item.id)}
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '4px',
                      border: `1.5px solid ${item.done ? active.color : 'var(--text-dim)'}`,
                      background: item.done ? active.color : 'transparent',
                      flexShrink: 0,
                      marginTop: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      color: '#0a0908',
                      fontWeight: 700,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {item.done ? '✓' : ''}
                  </button>

                  <span style={{
                    flex: 1,
                    fontSize: '14px',
                    lineHeight: 1.6,
                    color: 'var(--text)',
                    textDecoration: item.done ? 'line-through' : 'none',
                    textDecorationColor: 'var(--text-dim)',
                    transition: 'all 0.2s',
                  }}>
                    {item.text}
                  </span>

                  <button
                    onClick={() => removeItem(active.id, item.id)}
                    className="board-item-delete"
                    style={{
                      fontSize: '18px',
                      lineHeight: 1,
                      color: 'var(--text-dim)',
                      opacity: 0,
                      transition: 'opacity 0.15s',
                      padding: '0 4px',
                      flexShrink: 0,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Add item */}
            <div
              className="input-row"
              style={{
                display: 'flex',
                gap: '8px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '4px 4px 4px 16px',
                transition: 'border-color 0.2s',
              }}
            >
              <input
                value={newItemText}
                onChange={e => setNewItemText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addItem(active.id)}
                placeholder="Add a goal..."
                style={{ flex: 1, fontSize: '14px', padding: '9px 0' }}
              />
              <button
                onClick={() => addItem(active.id)}
                disabled={!newItemText.trim()}
                style={{
                  padding: '9px 16px',
                  background: newItemText.trim() ? active.color : 'var(--surface2)',
                  color: newItemText.trim() ? '#0a0908' : 'var(--text-dim)',
                  borderRadius: '7px',
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                }}
              >
                Add
              </button>
            </div>

          </div>
        )}
      </main>
    </div>
  )
}
