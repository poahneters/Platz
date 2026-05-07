import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useUndo } from '../hooks/useUndo'
import UndoToast from './UndoToast'
import ContextMenu from './ContextMenu'
import {
  DndContext, DragOverlay,
  MouseSensor, TouchSensor, useSensor, useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ─── Marker / color config ────────────────────────────────────────────────────

const MARKERS = [
  { body: '#1a4d2e', cap: '#0f2d1a' },
  { body: '#1a3d6a', cap: '#0f2040' },
  { body: '#8a1a1a', cap: '#4a0f0f' },
  { body: '#6a4020', cap: '#3a2010' },
  { body: '#2d6a9f', cap: '#1a3d6a' },
]
const BOARD_COLORS = ['#2d8a55', '#4a7ab0', '#a04040', '#9a7030', '#3a8a7a']

// ─── Order helpers ────────────────────────────────────────────────────────────

function applyOrder(items, savedIds) {
  if (!savedIds?.length) return items
  return [...items].sort((a, b) => {
    const ai = savedIds.indexOf(a.id)
    const bi = savedIds.indexOf(b.id)
    return (ai === -1 ? 9999 : ai) - (bi === -1 ? 9999 : bi)
  })
}

function saveBoardOrder(boards, userId) {
  localStorage.setItem(`platz_board_order_${userId}`, JSON.stringify(boards.map(b => b.id)))
}

// ─── Drag handle ──────────────────────────────────────────────────────────────

function DragHandle({ listeners, attributes, ink }) {
  return (
    <span
      {...listeners}
      {...attributes}
      className="drag-handle"
      style={{
        cursor: 'grab',
        color: ink ? `${ink}55` : 'var(--text-dim)',
        opacity: 0,
        fontSize: '15px',
        padding: '0 6px 0 0',
        flexShrink: 0,
        touchAction: 'none',
        userSelect: 'none',
        lineHeight: 1,
        transition: 'opacity 0.15s',
      }}
    >
      ⠿
    </span>
  )
}

// ─── Sortable board item (sidebar) ────────────────────────────────────────────

function SortableBoardItem({ board, active: isActive, onClick, highlighted }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: board.id,
    data: { type: 'board' },
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.35 : 1 }}
    >
      <button
        onClick={onClick}
        className="sidebar-btn"
        style={{
          width: '100%', textAlign: 'left', padding: '10px 10px 10px 14px',
          display: 'flex', alignItems: 'center', gap: '8px',
          borderLeft: highlighted
            ? `2px solid ${board.color}`
            : isActive ? `2px solid ${board.color}` : '2px solid transparent',
          background: highlighted
            ? `${board.color}22`
            : isActive ? 'var(--gold-dim)' : 'transparent',
          transition: 'all 0.2s ease',
        }}
      >
        <DragHandle listeners={listeners} attributes={attributes} />
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: board.color, flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: '13px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {board.title}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
          {board.items.filter(i => !i.done).length}
        </span>
      </button>
    </div>
  )
}

// ─── Sortable goal item ───────────────────────────────────────────────────────

function SortableGoalItem({ item, ink, editingItemId, editItemText, setEditItemText, onSave, onToggle, onRemove, onEditStart, onContextMenu }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { type: 'goal' },
  })

  return (
    <div
      ref={setNodeRef}
      className="board-item"
      onContextMenu={onContextMenu}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : item.done ? 0.42 : 1,
        display: 'flex', alignItems: 'flex-start', gap: '10px',
        padding: '8px 4px',
        borderBottom: `1px solid ${ink}14`,
      }}
    >
      <DragHandle listeners={listeners} attributes={attributes} ink={ink} />

      <button
        onClick={() => onToggle(item.id)}
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
          onBlur={() => onSave(item.id)}
          onKeyDown={e => { if (e.key === 'Enter') onSave(item.id); if (e.key === 'Escape') onEditStart(null, '') }}
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
        <span
          onDoubleClick={() => onEditStart(item.id, item.text)}
          title="Double-click to edit"
          style={{
            fontFamily: "'Permanent Marker', cursive",
            fontSize: 'clamp(16px, 2.2vw, 21px)',
            color: ink, lineHeight: 1.4, flex: 1,
            textDecoration: item.done ? 'line-through' : 'none',
            textDecorationColor: `${ink}66`,
            wordBreak: 'break-word',
            cursor: 'text',
          }}
        >
          {item.text}
        </span>
      )}

      <button
        onClick={() => onEditStart(item.id, item.text)}
        className="board-item-edit"
        style={{
          fontFamily: 'Inter, sans-serif', fontSize: '13px',
          color: `${ink}55`, opacity: 0,
          transition: 'opacity 0.15s', padding: '0 4px',
          flexShrink: 0, marginTop: '4px',
          background: 'transparent', border: 'none', cursor: 'pointer',
        }}
      >✎</button>

      <button
        onClick={() => onRemove(item.id)}
        className="board-item-delete"
        style={{
          fontFamily: 'Inter, sans-serif', fontSize: '18px',
          color: `${ink}44`, opacity: 0,
          transition: 'opacity 0.15s', padding: '0 4px',
          flexShrink: 0, marginTop: '2px',
          background: 'transparent', border: 'none',
        }}
      >×</button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Whiteboard({ user }) {
  const [boards, setBoards] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [newItemText, setNewItemText] = useState('')
  const [newBoardTitle, setNewBoardTitle] = useState('')
  const [showNewBoard, setShowNewBoard] = useState(false)
  const [editingTitle, setEditingTitle] = useState(null)
  const [inlineCreate, setInlineCreate] = useState(false)
  const [inlineTitle, setInlineTitle] = useState('')
  const [editingItemId, setEditingItemId] = useState(null)
  const [editItemText, setEditItemText] = useState('')
  const [mobileView, setMobileView] = useState('list')
  const [ctxMenu, setCtxMenu] = useState(null)
  // DnD state
  const [activeDrag, setActiveDrag] = useState(null)
  const [dragOverBoardId, setDragOverBoardId] = useState(null)

  const { undoToast, showUndo } = useUndo()

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  )

  // ── Load boards ─────────────────────────────────────────────────────────────

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
          const savedIds = JSON.parse(localStorage.getItem(`platz_board_order_${user.id}`) || '[]')
          const ordered = applyOrder(mapped, savedIds)
          setBoards(ordered)
          setActiveId(ordered[0].id)
        }
      })
  }, [user.id])

  useEffect(() => {
    if (!activeId && boards.length > 0) setActiveId(boards[0].id)
  }, [boards, activeId])

  // ── Board operations ────────────────────────────────────────────────────────

  async function createBoard(title) {
    if (!title.trim()) return
    const color = BOARD_COLORS[boards.length % BOARD_COLORS.length]
    const { data: row } = await supabase
      .from('boards')
      .insert({ user_id: user.id, name: title.trim(), color, lines: [] })
      .select()
      .single()
    if (row) {
      const board = { id: row.id, title: row.name, color: row.color, markerIdx: boards.length % MARKERS.length, items: [] }
      setBoards(prev => {
        const next = [...prev, board]
        saveBoardOrder(next, user.id)
        return next
      })
      setActiveId(row.id)
    }
  }

  async function addBoard() { await createBoard(newBoardTitle); setNewBoardTitle(''); setShowNewBoard(false) }
  async function addBoardFromInline(title) { await createBoard(title) }

  async function deleteBoard(id) {
    const board = boards.find(b => b.id === id)
    const remaining = boards.filter(b => b.id !== id)
    setBoards(remaining)
    saveBoardOrder(remaining, user.id)
    setActiveId(remaining[0]?.id || null)
    await supabase.from('boards').delete().eq('id', id)
    showUndo('Board erased', async () => {
      const { data: row } = await supabase
        .from('boards')
        .insert({ id: board.id, user_id: user.id, name: board.title, color: board.color, lines: board.items })
        .select().single()
      if (row) {
        setBoards(prev => {
          const next = [...prev, board]
          saveBoardOrder(next, user.id)
          return next
        })
        setActiveId(board.id)
      }
    })
  }

  async function updateTitle(id, title) {
    if (!title) { setEditingTitle(null); return }
    setBoards(prev => prev.map(b => b.id === id ? { ...b, title } : b))
    setEditingTitle(null)
    await supabase.from('boards').update({ name: title }).eq('id', id)
  }

  // ── Goal operations ─────────────────────────────────────────────────────────

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

  async function saveItem(boardId, itemId) {
    const text = editItemText.trim()
    setEditingItemId(null)
    setEditItemText('')
    if (!text) return
    const board = boards.find(b => b.id === boardId)
    const updatedItems = board.items.map(i => i.id === itemId ? { ...i, text } : i)
    setBoards(prev => prev.map(b => b.id === boardId ? { ...b, items: updatedItems } : b))
    await supabase.from('boards').update({ lines: updatedItems }).eq('id', boardId)
  }

  // ── DnD handlers ────────────────────────────────────────────────────────────

  function handleDragStart({ active }) {
    const type = active.data.current?.type
    if (type === 'goal') {
      const board = boards.find(b => b.items.some(i => i.id === active.id))
      setActiveDrag({ type: 'goal', item: board?.items.find(i => i.id === active.id), boardId: board?.id })
    } else if (type === 'board') {
      setActiveDrag({ type: 'board', item: boards.find(b => b.id === active.id) })
    }
  }

  function handleDragOver({ active, over }) {
    if (!over) { setDragOverBoardId(null); return }
    if (active.data.current?.type === 'goal' && over.data.current?.type === 'board') {
      setDragOverBoardId(over.id)
    } else {
      setDragOverBoardId(null)
    }
  }

  function handleDragEnd({ active, over }) {
    setActiveDrag(null)
    setDragOverBoardId(null)
    if (!over || active.id === over.id) return

    const activeType = active.data.current?.type
    const overType = over.data.current?.type

    if (activeType === 'board' && overType === 'board') {
      // Reorder boards in sidebar
      setBoards(prev => {
        const oldIdx = prev.findIndex(b => b.id === active.id)
        const newIdx = prev.findIndex(b => b.id === over.id)
        const next = arrayMove(prev, oldIdx, newIdx)
        saveBoardOrder(next, user.id)
        return next
      })
    } else if (activeType === 'goal' && overType === 'goal') {
      // Reorder goals within the active board
      const board = boards.find(b => b.id === activeId)
      if (!board) return
      const oldIdx = board.items.findIndex(i => i.id === active.id)
      const newIdx = board.items.findIndex(i => i.id === over.id)
      if (oldIdx === -1 || newIdx === -1) return
      const updatedItems = arrayMove(board.items, oldIdx, newIdx)
      setBoards(prev => prev.map(b => b.id === activeId ? { ...b, items: updatedItems } : b))
      supabase.from('boards').update({ lines: updatedItems }).eq('id', activeId).then()
    } else if (activeType === 'goal' && overType === 'board') {
      // Move goal to a different board
      const targetBoardId = over.id
      if (targetBoardId === activeId) return
      const sourceBoard = boards.find(b => b.id === activeId)
      const targetBoard = boards.find(b => b.id === targetBoardId)
      const item = sourceBoard?.items.find(i => i.id === active.id)
      if (!item || !sourceBoard || !targetBoard) return

      const newSourceItems = sourceBoard.items.filter(i => i.id !== active.id)
      const newTargetItems = [...targetBoard.items, item]

      setBoards(prev => prev.map(b => {
        if (b.id === activeId) return { ...b, items: newSourceItems }
        if (b.id === targetBoardId) return { ...b, items: newTargetItems }
        return b
      }))

      supabase.from('boards').update({ lines: newSourceItems }).eq('id', activeId).then()
      supabase.from('boards').update({ lines: newTargetItems }).eq('id', targetBoardId).then()

      showUndo(`Moved to "${targetBoard.title}"`, async () => {
        const revertSource = [...newSourceItems, item]  // approximate restore
        const revertTarget = targetBoard.items
        setBoards(prev => prev.map(b => {
          if (b.id === activeId) return { ...b, items: revertSource }
          if (b.id === targetBoardId) return { ...b, items: revertTarget }
          return b
        }))
        await supabase.from('boards').update({ lines: revertSource }).eq('id', activeId)
        await supabase.from('boards').update({ lines: revertTarget }).eq('id', targetBoardId)
      })
    }
  }

  // ── Derived ─────────────────────────────────────────────────────────────────

  const active = boards.find(b => b.id === activeId)
  const markerIdx = active?.markerIdx ?? 0
  const ink = MARKERS[markerIdx]?.body || '#1a4d2e'

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <UndoToast toast={undoToast} />
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x} y={ctxMenu.y}
          onClose={() => setCtxMenu(null)}
          items={ctxMenu.itemId ? [
            { label: 'Edit item', onClick: () => { setEditItemText(ctxMenu.itemText ?? ''); setEditingItemId(ctxMenu.itemId) } },
            'separator',
            { label: 'Delete', danger: true, onClick: () => removeItem(ctxMenu.boardId, ctxMenu.itemId) },
          ] : [
            { label: 'Rename board', onClick: () => setEditingTitle(ctxMenu.boardId) },
            'separator',
            { label: 'Erase board', danger: true, onClick: () => deleteBoard(ctxMenu.boardId) },
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
        .board-item:hover .board-item-delete { opacity: 1 !important; }
        .board-item:hover .board-item-edit { opacity: 1 !important; }
        .board-item:hover .drag-handle { opacity: 0.4 !important; }
        .sidebar-btn:hover .drag-handle { opacity: 0.4 !important; }
      `}</style>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div style={{ display: 'flex', height: '100%', gap: '1px', background: 'var(--border)' }}>

          {/* ── Boards sidebar ── */}
          <aside className={`wb-sidebar${mobileView === 'board' ? ' mobile-hidden' : ''}`} style={{ width: '200px', flexShrink: 0, background: 'var(--bg)', overflowY: 'auto', paddingTop: '20px' }}>
            <div style={{ padding: '0 18px 14px', fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Boards
            </div>

            <SortableContext items={boards.map(b => b.id)} strategy={verticalListSortingStrategy}>
              {boards.map(board => (
                <SortableBoardItem
                  key={board.id}
                  board={board}
                  active={activeId === board.id}
                  highlighted={dragOverBoardId === board.id}
                  onClick={() => { setActiveId(board.id); setMobileView('board') }}
                />
              ))}
            </SortableContext>

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
                  <button onClick={addBoard} style={{ flex: 1, padding: '6px', background: 'var(--gold)', color: '#0f2d1a', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>Create</button>
                  <button onClick={() => { setShowNewBoard(false); setNewBoardTitle('') }} style={{ padding: '6px 9px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-dim)', borderRadius: '6px', fontSize: '13px' }}>×</button>
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
            flex: 1, background: 'var(--bg)', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '28px 36px 28px', paddingRight: 'calc(36px + 200px)', overflow: 'hidden',
          }}>
            <div className="wb-back">
              <button onClick={() => setMobileView('list')} style={{ fontSize: '13px', color: 'var(--gold)' }}>← Boards</button>
            </div>

            {/* Aluminum frame */}
            <div style={{
              width: '100%', maxWidth: '900px',
              height: 'min(calc(100vh - 180px), 680px)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              borderRadius: '5px',
              background: 'linear-gradient(160deg, #d2d7dc 0%, #bcc2c8 25%, #b4babf 60%, #c8cdd2 100%)',
              padding: '12px',
              boxShadow: [
                '0 20px 60px rgba(0,0,0,0.28)', '0 6px 18px rgba(0,0,0,0.16)',
                'inset 0 1px 0 rgba(255,255,255,0.55)', 'inset 0 -1px 3px rgba(0,0,0,0.18)',
                'inset 1px 0 0 rgba(255,255,255,0.2)', 'inset -1px 0 0 rgba(0,0,0,0.08)',
              ].join(', '),
              position: 'relative',
            }}>
              <div style={{ position: 'absolute', inset: '12px', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.12)', pointerEvents: 'none', zIndex: 6, borderRadius: '1px' }} />

              {/* Board surface */}
              <div style={{ height: '100%', background: '#ffffff', overflowY: 'auto', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10, background: 'linear-gradient(128deg, rgba(255,255,255,0.52) 0%, rgba(255,255,255,0.14) 22%, transparent 44%)' }} />
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10, background: 'linear-gradient(305deg, rgba(255,255,255,0.12) 0%, transparent 35%)' }} />

                <div style={{ position: 'relative', zIndex: 5 }}>
                  {!active ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '12px' }}>
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
                            style={{ fontFamily: "'Permanent Marker', cursive", fontSize: '22px', color: 'rgba(30,80,50,0.8)', background: 'transparent', border: 'none', borderBottom: '2px solid rgba(30,80,50,0.3)', outline: 'none', width: '100%', textAlign: 'center', padding: '6px 0' }}
                          />
                          <span style={{ fontFamily: "'Permanent Marker', cursive", fontSize: '13px', color: 'rgba(30,80,50,0.3)' }}>press enter to create</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => setInlineCreate(true)}
                          style={{ fontFamily: "'Permanent Marker', cursive", fontSize: '22px', color: 'rgba(30,80,50,0.35)', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
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
                            style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 'clamp(26px, 3.8vw, 42px)', color: ink, background: 'transparent', borderBottom: `2px solid ${ink}`, paddingBottom: '4px', width: '100%', lineHeight: 1.2 }}
                          />
                        ) : (
                          <h2
                            onClick={() => setEditingTitle(active.id)}
                            title="Click to rename"
                            style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 'clamp(26px, 3.8vw, 42px)', color: ink, cursor: 'text', lineHeight: 1.2, flex: 1, wordBreak: 'break-word' }}
                          >
                            {active.title}
                          </h2>
                        )}
                        <button
                          onClick={() => deleteBoard(active.id)}
                          style={{ marginTop: '6px', fontSize: '11px', color: 'rgba(30,80,50,0.35)', padding: '4px 10px', border: '1px solid rgba(30,80,50,0.18)', borderRadius: '5px', background: 'transparent', flexShrink: 0, transition: 'all 0.2s', fontFamily: 'Inter, sans-serif' }}
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
                            <div style={{ height: '100%', background: ink, opacity: 0.5, width: `${(active.items.filter(i => i.done).length / active.items.length) * 100}%`, borderRadius: '2px', transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)' }} />
                          </div>
                          <span style={{ fontFamily: "'Permanent Marker', cursive", fontSize: '14px', color: `${ink}88`, whiteSpace: 'nowrap' }}>
                            {active.items.filter(i => i.done).length} / {active.items.length}
                          </span>
                        </div>
                      )}

                      {/* Goals */}
                      <SortableContext items={active.items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '28px' }}>
                          {active.items.map(item => (
                            <SortableGoalItem
                              key={item.id}
                              item={item}
                              ink={ink}
                              editingItemId={editingItemId}
                              editItemText={editItemText}
                              setEditItemText={setEditItemText}
                              onSave={(itemId) => saveItem(active.id, itemId)}
                              onToggle={(itemId) => toggleItem(active.id, itemId)}
                              onRemove={(itemId) => removeItem(active.id, itemId)}
                              onEditStart={(id, text) => { setEditingItemId(id); setEditItemText(text ?? '') }}
                              onContextMenu={e => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, boardId: active.id, itemId: item.id, itemText: item.text }) }}
                            />
                          ))}
                        </div>
                      </SortableContext>

                      {/* Add goal input */}
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', paddingTop: '8px', borderTop: `2px solid ${ink}18` }}>
                        <span style={{ fontFamily: "'Permanent Marker', cursive", fontSize: '20px', color: `${ink}38` }}>+</span>
                        <input
                          value={newItemText}
                          onChange={e => setNewItemText(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && addItem(active.id)}
                          placeholder="write a goal..."
                          style={{ flex: 1, fontFamily: "'Permanent Marker', cursive", fontSize: 'clamp(15px, 2vw, 19px)', color: ink, background: 'transparent', border: 'none', outline: 'none', padding: '8px 0' }}
                        />
                        {newItemText.trim() && (
                          <button
                            onClick={() => addItem(active.id)}
                            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', letterSpacing: '0.04em', color: '#f8fffc', background: ink, border: 'none', borderRadius: '7px', padding: '8px 16px', cursor: 'pointer', transition: 'opacity 0.2s' }}
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

        {/* Drag overlay */}
        <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
          {activeDrag?.type === 'goal' && activeDrag.item && (
            <div style={{
              fontFamily: "'Permanent Marker', cursive",
              fontSize: '18px', color: ink,
              background: 'rgba(255,255,255,0.95)',
              padding: '8px 12px', borderRadius: '6px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              cursor: 'grabbing',
            }}>
              {activeDrag.item.text}
            </div>
          )}
          {activeDrag?.type === 'board' && activeDrag.item && (
            <div style={{
              padding: '10px 18px', borderRadius: '6px',
              background: 'var(--surface)', border: `1px solid ${activeDrag.item.color}`,
              fontSize: '13px', color: 'var(--text)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
              cursor: 'grabbing',
            }}>
              {activeDrag.item.title}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </>
  )
}
