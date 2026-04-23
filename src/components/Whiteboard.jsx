import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useUndo } from '../hooks/useUndo'
import UndoToast from './UndoToast'
import ContextMenu from './ContextMenu'

// Marker body / cap color pairs - real whiteboard marker colors
const MARKERS = [
  { body: '#1a4d2e', cap: '#0f2d1a' }, // forest green
  { body: '#1a3d6a', cap: '#0f2040' }, // navy blue
  { body: '#8a1a1a', cap: '#4a0f0f' }, // deep red
  { body: '#6a4020', cap: '#3a2010' }, // brown
  { body: '#2d6a9f', cap: '#1a3d6a' }, // sky blue
]

const BOARD_COLORS = ['#2d8a55', '#4a7ab0', '#a04040', '#9a7030', '#3a8a7a']

export default function Whiteboard({ user }) {
  const [boards, setBoards] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [newItemText, setNewItemText] = useState('')
  const [newBoardTitle, setNewBoardTitle] = useState('')
  const [showNewBoard, setShowNewBoard] = useState(false)
  const [editingTitle, setEditingTitle] = useState(null)
  const [inlineCreate, setInlineCreate] = useState(false)
  const [inlineTitle, setInlineTitle] = useState('')

  useEffect(() => {
    supabase
      .from('boards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          const mapped = data.map((row, i) => ({
            id: row.id,
            title: row.name,
            color: row.color,
            markerIdx: i % MARKERS.length,
            items: row.lines || [],
          }))
          setBoards(mapped)
          setActiveId(mapped[0].id)
        }
      })
  }, [user.id])

  useEffect(() => {
    if (!activeId && boards.length > 0) setActiveId(boards[0].id)
  }, [boards, activeId])

  async function createBoard(title) {
    if (!title.trim()) return
    const color = BOARD_COLORS[boards.length % BOARD_COLORS.length]
    const { data: row } = await supabase
      .from('boards')
      .insert({ user_id: user.id, name: title.trim(), color, lines: [] })
      .select()
      .single()
    if (row) {
      const board = {
        id: row.id,
        title: row.name,
        color: row.color,
        markerIdx: boards.length % MARKERS.length,
        items: [],
      }
      setBoards(prev => [...prev, board])
      setActiveId(row.id)
    }
  }

  async function addBoard() {
    await createBoard(newBoardTitle)
    setNewBoardTitle('')
    setShowNewBoard(false)
  }

  async function addBoardFromInline(title) {
    await createBoard(title)
  }

  async function deleteBoard(id) {
    const board = boards.find(b => b.id === id)
    const remaining = boards.filter(b => b.id !== id)
    setBoards(remaining)
    setActiveId(remaining[0]?.id || null)
    await supabase.from('boards').delete().eq('id', id)
    showUndo('Board erased', async () => {
      const { data: row } = await supabase
        .from('boards')
        .insert({ id: board.id, user_id: user.id, name: board.title, color: board.color, lines: board.items })
        .select().single()
      if (row) {
        setBoards(prev => [...prev, board])
        setActiveId(board.id)
      }
    })
  }

  async function saveItem(boardId, itemId) {
    const text = editItemText.trim()
    setEditingItemId(null)
    if (!text) return
    const board = boards.find(b => b.id === boardId)
    const updatedItems = board.items.map(i => i.id === itemId ? { ...i, text } : i)
    setBoards(prev => prev.map(b => b.id === boardId ? { ...b, items: updatedItems } : b))
    await supabase.from('boards').update({ lines: updatedItems }).eq('id', boardId)
  }

  async function updateTitle(id, title) {
    if (!title) { setEditingTitle(null); return }
    setBoards(prev => prev.map(b => b.id === id ? { ...b, title } : b))
    setEditingTitle(null)
    await supabase.from('boards').update({ name: title }).eq('id', id)
  }

  async function addItem(boardId) {
    if (!newItemText.trim()) return
    const item = { id: crypto.randomUUID(), text: newItemText.trim(), done: false }
    const board = boards.find(b => b.id === boardId)
    const updatedItems = [...board.items, item]
    setBoards(prev => prev.map(b => b.id === boardId ? { ...b, items: updatedItems } : b))
    setNewItemText('')
    await supabase.from('boards').update({ lines: updatedItems }).eq('id', boardId)
  }

  async function toggleItem(boardId, itemId) {
    const board = boards.find(b => b.id === boardId)
    const updatedItems = board.items.map(i => i.id === itemId ? { ...i, done: !i.done } : i)
    setBoards(prev => prev.map(b => b.id === boardId ? { ...b, items: updatedItems } : b))
    await supabase.from('boards').update({ lines: updatedItems }).eq('id', boardId)
  }

  async function removeItem(boardId, itemId) {
    const board = boards.find(b => b.id === boardId)
    const originalItems = board.items
    const updatedItems = board.items.filter(i => i.id !== itemId)
    setBoards(prev => prev.map(b => b.id === boardId ? { ...b, items: updatedItems } : b))
    await supabase.from('boards').update({ lines: updatedItems }).eq('id', boardId)
    showUndo('Item erased', async () => {
      setBoards(prev => prev.map(b => b.id === boardId ? { ...b, items: originalItems } : b))
      await supabase.from('boards').update({ lines: originalItems }).eq('id', boardId)
    })
  }

  const [ctxMenu, setCtxMenu] = useState(null)
  const [editingItemId, setEditingItemId] = useState(null)
  const [editItemText, setEditItemText] = useState('')
  const [mobileView, setMobileView] = useState('list')
  const { undoToast, showUndo } = useUndo()

  const active = boards.find(b => b.id === activeId)
  const markerIdx = active?.markerIdx ?? 0
  const ink = MARKERS[markerIdx]?.body || '#1a4d2e'

  return (
    <>
    <UndoToast toast={undoToast} />
    {ctxMenu && (
      <ContextMenu
        x={ctxMenu.x} y={ctxMenu.y}
        onClose={() => setCtxMenu(null)}
        items={[
          { label: 'Edit item', onClick: () => { const board = boards.find(b => b.id === ctxMenu.boardId); const item = board?.items.find(i => i.id === ctxMenu.itemId); setEditItemText(item?.text ?? ''); setEditingItemId(ctxMenu.itemId) } },
          'separator',
          { label: 'Delete', danger: true, onClick: () => removeItem(ctxMenu.boardId, ctxMenu.itemId) },
        ]}
      />
    )}
    <style>{`
      @media (max-width: 639px) {
        .wb-sidebar { width: 100% !important; flex-shrink: unset !important; }
        .wb-sidebar.mobile-hidden { display: none !important; }
        .wb-main.mobile-hidden { display: none !important; }
        .wb-back { display: flex !important; }
        .wb-main { padding: 16px !important; padding-right: 16px !important; }
      }
      .wb-back { display: none; align-items: center; padding: 8px 16px 0; }
    `}</style>
    <div style={{ display: 'flex', height: '100%', gap: '1px', background: 'var(--border)' }}>

      {/* ── Boards sidebar ── */}
      <aside className={`wb-sidebar${mobileView === 'board' ? ' mobile-hidden' : ''}`} style={{ width: '200px', flexShrink: 0, background: 'var(--bg)', overflowY: 'auto', paddingTop: '20px' }}>
        <div style={{ padding: '0 18px 14px', fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
          Boards
        </div>

        {boards.map(board => (
          <button
            key={board.id}
            onClick={() => { setActiveId(board.id); setMobileView('board') }}
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
              <button onClick={addBoard} style={{ flex: 1, padding: '6px', background: 'var(--gold)', color: '#0f2d1a', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
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

      {/* ── Wall + whiteboard ── */}
      <main className={`wb-main${mobileView === 'list' ? ' mobile-hidden' : ''}`} style={{
        flex: 1,
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '28px 36px 28px',
        paddingRight: 'calc(36px + 200px)',
        overflow: 'hidden',
      }}>
        <div className="wb-back">
          <button onClick={() => setMobileView('list')} style={{ fontSize: '13px', color: 'var(--gold)' }}>
            ← Boards
          </button>
        </div>

        {/* Aluminum frame */}
        <div style={{
          width: '100%',
          maxWidth: '900px',
          height: 'min(calc(100vh - 180px), 680px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: '5px',
          background: 'linear-gradient(160deg, #d2d7dc 0%, #bcc2c8 25%, #b4babf 60%, #c8cdd2 100%)',
          padding: '12px',
          boxShadow: [
            '0 20px 60px rgba(0,0,0,0.28)',
            '0 6px 18px rgba(0,0,0,0.16)',
            'inset 0 1px 0 rgba(255,255,255,0.55)',
            'inset 0 -1px 3px rgba(0,0,0,0.18)',
            'inset 1px 0 0 rgba(255,255,255,0.2)',
            'inset -1px 0 0 rgba(0,0,0,0.08)',
          ].join(', '),
          position: 'relative',
        }}>

          {/* Corner screws */}
          {[
            { top: '5px', left: '5px' },
            { top: '5px', right: '5px' },
          ].map((pos, i) => (
            <div key={i} style={{
              position: 'absolute', ...pos,
              width: '7px', height: '7px', borderRadius: '50%',
              background: 'radial-gradient(circle at 38% 38%, #e4e8ec, #8a9098)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.35)',
              zIndex: 4,
            }} />
          ))}

          {/* Inset shadow over board edge */}
          <div style={{
            position: 'absolute', inset: '12px',
            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.12)',
            pointerEvents: 'none', zIndex: 6, borderRadius: '1px',
          }} />

          {/* ── Board surface ── */}
          <div style={{
            height: '100%',
            background: '#ffffff',
            overflowY: 'auto',
            position: 'relative',
          }}>

            {/* Glare */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10,
              background: 'linear-gradient(128deg, rgba(255,255,255,0.52) 0%, rgba(255,255,255,0.14) 22%, transparent 44%)',
            }} />
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10,
              background: 'linear-gradient(305deg, rgba(255,255,255,0.12) 0%, transparent 35%)',
            }} />

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 5 }}>
              {!active ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  height: '300px', gap: '12px',
                }}>
                  {inlineCreate ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '100%', maxWidth: '340px', padding: '0 24px' }}>
                      <input
                        value={inlineTitle}
                        onChange={e => setInlineTitle(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') { addBoardFromInline(inlineTitle); setInlineCreate(false); setInlineTitle('') }
                          if (e.key === 'Escape') { setInlineCreate(false); setInlineTitle('') }
                        }}
                        placeholder="Name your board..."
                        autoFocus
                        style={{
                          fontFamily: "'Permanent Marker', cursive",
                          fontSize: '22px',
                          color: 'rgba(30,80,50,0.8)',
                          background: 'transparent',
                          border: 'none',
                          borderBottom: '2px solid rgba(30,80,50,0.3)',
                          outline: 'none',
                          width: '100%',
                          textAlign: 'center',
                          padding: '6px 0',
                        }}
                      />
                      <span style={{ fontFamily: "'Permanent Marker', cursive", fontSize: '13px', color: 'rgba(30,80,50,0.3)' }}>
                        press enter to create
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setInlineCreate(true)}
                      style={{
                        fontFamily: "'Permanent Marker', cursive",
                        fontSize: '22px', color: 'rgba(30,80,50,0.35)',
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        transition: 'color 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = 'rgba(30,80,50,0.6)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(30,80,50,0.35)'}
                    >
                      + Create a board
                    </button>
                  )}
                </div>
              ) : (
                <div key={active.id} className="fade-up" style={{ padding: '36px 48px 32px', maxWidth: '820px', margin: '0 auto' }}>

                  {/* Board header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '28px' }}>
                    {editingTitle === active.id ? (
                      <input
                        defaultValue={active.title}
                        autoFocus
                        onBlur={e => updateTitle(active.id, e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') updateTitle(active.id, e.target.value); if (e.key === 'Escape') setEditingTitle(null) }}
                        style={{
                          fontFamily: "'Permanent Marker', cursive",
                          fontSize: 'clamp(26px, 3.8vw, 42px)',
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
                          fontSize: 'clamp(26px, 3.8vw, 42px)',
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
                        marginTop: '6px', fontSize: '11px',
                        color: 'rgba(30,80,50,0.35)',
                        padding: '4px 10px',
                        border: '1px solid rgba(30,80,50,0.18)',
                        borderRadius: '5px',
                        background: 'transparent',
                        flexShrink: 0,
                        transition: 'all 0.2s',
                        fontFamily: 'Inter, sans-serif',
                      }}
                      onMouseEnter={e => e.target.style.color = 'rgba(30,80,50,0.6)'}
                      onMouseLeave={e => e.target.style.color = 'rgba(30,80,50,0.35)'}
                    >
                      Erase board
                    </button>
                  </div>

                  {/* Progress bar */}
                  {active.items.length > 0 && (
                    <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ flex: 1, height: '3px', background: `${ink}22`, borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', background: ink, opacity: 0.5,
                          width: `${(active.items.filter(i => i.done).length / active.items.length) * 100}%`,
                          borderRadius: '2px',
                          transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
                        }} />
                      </div>
                      <span style={{ fontFamily: "'Permanent Marker', cursive", fontSize: '14px', color: `${ink}88`, whiteSpace: 'nowrap' }}>
                        {active.items.filter(i => i.done).length} / {active.items.length}
                      </span>
                    </div>
                  )}

                  {/* Items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '28px' }}>
                    {active.items.length === 0 && (
                      <p style={{ fontFamily: "'Permanent Marker', cursive", fontSize: '20px', color: `${ink}38`, padding: '12px 0' }}>
                        write your first goal below...
                      </p>
                    )}

                    {active.items.map(item => (
                      <div
                        key={item.id}
                        className="board-item"
                        onContextMenu={e => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, boardId: active.id, itemId: item.id }) }}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: '14px',
                          padding: '8px 4px',
                          borderBottom: `1px solid ${ink}14`,
                          opacity: item.done ? 0.42 : 1,
                          transition: 'opacity 0.2s',
                        }}
                      >
                        <button
                          onClick={() => toggleItem(active.id, item.id)}
                          style={{
                            width: '22px', height: '22px',
                            border: `2px solid ${ink}`,
                            borderRadius: '3px',
                            background: item.done ? ink : 'transparent',
                            flexShrink: 0, marginTop: '4px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#f8fffc',
                            fontFamily: "'Permanent Marker', cursive",
                            fontSize: '13px',
                            transition: 'background 0.2s',
                            cursor: 'pointer',
                          }}
                        >
                          {item.done ? '✓' : ''}
                        </button>

                        {editingItemId === item.id ? (
                          <input
                            autoFocus
                            value={editItemText}
                            onChange={e => setEditItemText(e.target.value)}
                            onBlur={() => saveItem(active.id, item.id)}
                            onKeyDown={e => { if (e.key === 'Enter') saveItem(active.id, item.id); if (e.key === 'Escape') setEditingItemId(null) }}
                            style={{
                              flex: 1,
                              fontFamily: "'Permanent Marker', cursive",
                              fontSize: 'clamp(16px, 2.2vw, 21px)',
                              color: ink,
                              background: 'transparent',
                              border: 'none',
                              borderBottom: `2px solid ${ink}`,
                              outline: 'none',
                              padding: '2px 0',
                            }}
                          />
                        ) : (
                          <span style={{
                            fontFamily: "'Permanent Marker', cursive",
                            fontSize: 'clamp(16px, 2.2vw, 21px)',
                            color: ink, lineHeight: 1.4, flex: 1,
                            textDecoration: item.done ? 'line-through' : 'none',
                            textDecorationColor: `${ink}66`,
                            wordBreak: 'break-word',
                          }}>
                            {item.text}
                          </span>
                        )}

                        <button
                          onClick={() => removeItem(active.id, item.id)}
                          className="board-item-delete"
                          style={{
                            fontFamily: 'Inter, sans-serif', fontSize: '18px',
                            color: `${ink}44`, opacity: 0,
                            transition: 'opacity 0.15s', padding: '0 4px',
                            flexShrink: 0, marginTop: '2px',
                            background: 'transparent', border: 'none',
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Write input */}
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', paddingTop: '8px', borderTop: `2px solid ${ink}18` }}>
                    <span style={{ fontFamily: "'Permanent Marker', cursive", fontSize: '20px', color: `${ink}38` }}>+</span>
                    <input
                      value={newItemText}
                      onChange={e => setNewItemText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addItem(active.id)}
                      placeholder="write a goal..."
                      style={{
                        flex: 1,
                        fontFamily: "'Permanent Marker', cursive",
                        fontSize: 'clamp(15px, 2vw, 19px)',
                        color: ink,
                        background: 'transparent',
                        border: 'none', outline: 'none',
                        padding: '8px 0',
                      }}
                    />
                    {newItemText.trim() && (
                      <button
                        onClick={() => addItem(active.id)}
                        style={{
                          fontFamily: 'Inter, sans-serif', fontWeight: 600,
                          fontSize: '13px', letterSpacing: '0.04em',
                          color: '#f8fffc',
                          background: ink,
                          border: 'none', borderRadius: '7px',
                          padding: '8px 16px',
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
            </div>
          </div>

        </div>
      </main>
    </div>
    </>
  )
}
