import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import { useUndo } from '../hooks/useUndo'
import UndoToast from './UndoToast'
import ContextMenu from './ContextMenu'

function formatDue(dueDate, dueTime) {
  if (!dueDate) return null

  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const tomorrowStr = new Date(now.getTime() + 86400000).toISOString().slice(0, 10)

  let dateLabel
  if (dueDate === todayStr) dateLabel = 'Today'
  else if (dueDate === tomorrowStr) dateLabel = 'Tomorrow'
  else {
    const [y, m, d] = dueDate.split('-').map(Number)
    dateLabel = new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  let overdue = false
  if (dueTime) {
    const [h, min] = dueTime.split(':').map(Number)
    const [y, m, d] = dueDate.split('-').map(Number)
    overdue = new Date(y, m - 1, d, h, min) < now
    const t = new Date(0, 0, 0, h, min)
    const timeLabel = t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    return { label: `${dateLabel} at ${timeLabel}`, overdue }
  }

  overdue = dueDate < todayStr
  return { label: dateLabel, overdue }
}

function InlineDuePicker({ initialDate, initialTime, onSave, onCancel }) {
  const [date, setDate] = useState(initialDate)
  const [time, setTime] = useState(initialTime)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
      <input
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        autoFocus
        style={{ fontSize: '12px', color: 'var(--text)', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 8px' }}
      />
      <input
        type="time"
        value={time}
        onChange={e => setTime(e.target.value)}
        disabled={!date}
        style={{ fontSize: '12px', color: 'var(--text)', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 8px', opacity: date ? 1 : 0.4 }}
      />
      <button onClick={() => onSave(date, time)} disabled={!date} style={{ fontSize: '12px', color: 'var(--gold)', opacity: date ? 1 : 0.4 }}>Save</button>
      {initialDate && <button onClick={() => onSave('', '')} style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Remove</button>}
      <button onClick={onCancel} style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Cancel</button>
    </div>
  )
}

export default function Todo({ user }) {
  const [lists, setLists] = useState([])
  const [selectedList, setSelectedList] = useState(null)
  const [todos, setTodos] = useState([])
  const [input, setInput] = useState('')
  const [filter, setFilter] = useState('all')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [showDuePicker, setShowDuePicker] = useState(false)
  const [editingDue, setEditingDue] = useState(null)
  const [newListInput, setNewListInput] = useState('')
  const [addingList, setAddingList] = useState(false)
  const [renamingList, setRenamingList] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [confirmDeleteList, setConfirmDeleteList] = useState(null)
  const [mobileView, setMobileView] = useState('lists')
  const [ctxMenu, setCtxMenu] = useState(null)
  const [editingText, setEditingText] = useState(null)
  const [editTextVal, setEditTextVal] = useState('')
  const { undoToast, showUndo } = useUndo()
  const inputRef = useRef(null)
  const newListRef = useRef(null)
  const renameRef = useRef(null)

  // Load lists, auto-create "My Tasks" if none exist
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('todo_lists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (data && data.length > 0) {
        setLists(data)
        setSelectedList(data[0].id)
      } else {
        const { data: created } = await supabase
          .from('todo_lists')
          .insert({ user_id: user.id, name: 'My Tasks' })
          .select()
          .single()
        if (created) {
          setLists([created])
          setSelectedList(created.id)
        }
      }
    }
    load()
  }, [user.id])

  // Load todos for selected list
  useEffect(() => {
    if (!selectedList) return
    supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)
      .eq('list_id', selectedList)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setTodos(data) })
  }, [user.id, selectedList])

  useEffect(() => {
    if (addingList) newListRef.current?.focus()
  }, [addingList])

  useEffect(() => {
    if (renamingList) renameRef.current?.focus()
  }, [renamingList])

  async function createList() {
    const name = newListInput.trim()
    if (!name) { setAddingList(false); return }
    setNewListInput('')
    setAddingList(false)
    const { data } = await supabase
      .from('todo_lists')
      .insert({ user_id: user.id, name })
      .select()
      .single()
    if (data) {
      setLists(prev => [...prev, data])
      setSelectedList(data.id)
      setMobileView('todos')
    }
  }

  async function renameList(id) {
    const name = renameValue.trim()
    setRenamingList(null)
    if (!name) return
    setLists(prev => prev.map(l => l.id === id ? { ...l, name } : l))
    await supabase.from('todo_lists').update({ name }).eq('id', id)
  }

  async function deleteList(id) {
    if (lists.length === 1) return
    setConfirmDeleteList(null)
    await supabase.from('todos').delete().eq('list_id', id)
    await supabase.from('todo_lists').delete().eq('id', id)
    const remaining = lists.filter(l => l.id !== id)
    setLists(remaining)
    if (selectedList === id) setSelectedList(remaining[0]?.id ?? null)
    if (todos.length > 0) setTodos(prev => prev.filter(t => t.list_id !== id))
  }

  async function add() {
    if (!input.trim() || !selectedList) return
    const text = input.trim()
    const due_date = dueDate || null
    const due_time = (dueDate && dueTime) ? dueTime : null
    setInput('')
    setDueDate('')
    setDueTime('')
    setShowDuePicker(false)
    inputRef.current?.focus()
    const { data } = await supabase
      .from('todos')
      .insert({ user_id: user.id, list_id: selectedList, text, done: false, due_date, due_time })
      .select()
      .single()
    if (data) setTodos(prev => [data, ...prev])
  }

  async function toggle(id) {
    const todo = todos.find(t => t.id === id)
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
    await supabase.from('todos').update({ done: !todo.done }).eq('id', id)
  }

  async function remove(id) {
    const todo = todos.find(t => t.id === id)
    setTodos(prev => prev.filter(t => t.id !== id))
    await supabase.from('todos').delete().eq('id', id)
    showUndo('Task deleted', async () => {
      const { data } = await supabase
        .from('todos')
        .insert({ user_id: todo.user_id, list_id: todo.list_id, text: todo.text, done: todo.done, due_date: todo.due_date, due_time: todo.due_time })
        .select().single()
      if (data) setTodos(prev => [data, ...prev])
    })
  }

  async function clearDone() {
    const doneIds = todos.filter(t => t.done).map(t => t.id)
    setTodos(prev => prev.filter(t => !t.done))
    await supabase.from('todos').delete().in('id', doneIds)
  }

  async function saveDue(id, newDate, newTime) {
    const due_date = newDate || null
    const due_time = (newDate && newTime) ? newTime : null
    setTodos(prev => prev.map(t => t.id === id ? { ...t, due_date, due_time } : t))
    setEditingDue(null)
    await supabase.from('todos').update({ due_date, due_time }).eq('id', id)
  }

  async function saveText(id) {
    const text = editTextVal.trim()
    setEditingText(null)
    if (!text) return
    setTodos(prev => prev.map(t => t.id === id ? { ...t, text } : t))
    await supabase.from('todos').update({ text }).eq('id', id)
  }

  const filtered = todos.filter(t =>
    filter === 'all'    ? true :
    filter === 'active' ? !t.done :
    t.done
  )

  const doneCount = todos.filter(t => t.done).length
  const activeCount = todos.length - doneCount
  const currentList = lists.find(l => l.id === selectedList)

  return (
    <>
      <UndoToast toast={undoToast} />
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x} y={ctxMenu.y}
          onClose={() => setCtxMenu(null)}
          items={[
            { label: 'Edit task', onClick: () => { const t = todos.find(t => t.id === ctxMenu.todoId); setEditTextVal(t.text); setEditingText(ctxMenu.todoId) } },
            'separator',
            { label: 'Delete', danger: true, onClick: () => remove(ctxMenu.todoId) },
          ]}
        />
      )}
      <style>{`
        @media (max-width: 639px) {
          .todo-sidebar { width: 100% !important; flex-shrink: unset !important; }
          .todo-sidebar.mobile-hidden { display: none !important; }
          .todo-main.mobile-hidden { display: none !important; }
          .todo-back { display: flex !important; }
        }
        .todo-back { display: none; align-items: center; padding: 16px 20px 0; }
        .todo-list-btn:hover .todo-list-delete { opacity: 0.5 !important; }
        .todo-list-btn:hover .todo-list-delete:hover { opacity: 1 !important; }
        .todo-row:hover .todo-delete { opacity: 0.5 !important; }
        .todo-row:hover .todo-delete:hover { opacity: 1 !important; color: var(--text-mid) !important; }
        .todo-row:hover .todo-add-due { opacity: 0.6 !important; }
        .todo-row:hover .todo-add-due:hover { opacity: 1 !important; }
      `}</style>

      <div style={{ display: 'flex', height: '100%', gap: '1px', background: 'var(--border)' }}>

        {/* ── Sidebar ── */}
        <aside className={`todo-sidebar${mobileView === 'todos' ? ' mobile-hidden' : ''}`} style={{
          width: '200px',
          flexShrink: 0,
          background: 'var(--bg)',
          overflowY: 'auto',
          paddingTop: '20px',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ padding: '0 18px 14px', fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            Lists
          </div>

          {lists.map(list => (
            <div
              key={list.id}
              className="todo-list-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                borderLeft: selectedList === list.id ? '2px solid var(--gold)' : '2px solid transparent',
                background: selectedList === list.id ? 'var(--gold-dim)' : 'transparent',
                transition: 'all 0.2s ease',
              }}
            >
              {renamingList === list.id ? (
                <input
                  ref={renameRef}
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onBlur={() => renameList(list.id)}
                  onKeyDown={e => { if (e.key === 'Enter') renameList(list.id); if (e.key === 'Escape') setRenamingList(null) }}
                  style={{
                    flex: 1,
                    fontSize: '13px',
                    padding: '10px 18px',
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--text)',
                  }}
                />
              ) : (
                <button
                  onClick={() => { setSelectedList(list.id); setFilter('all'); setMobileView('todos') }}
                  onDoubleClick={() => { setRenamingList(list.id); setRenameValue(list.name) }}
                  className="sidebar-btn"
                  style={{
                    flex: 1,
                    textAlign: 'left',
                    padding: '10px 18px',
                    fontSize: '13px',
                    color: selectedList === list.id ? 'var(--text)' : 'var(--text-mid)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {list.name}
                </button>
              )}
              {lists.length > 1 && (
                confirmDeleteList === list.id ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 8px 0 0', flexShrink: 0 }}>
                    <button onClick={() => deleteList(list.id)} style={{ fontSize: '11px', color: '#c47a7a', fontWeight: 600 }}>Delete</button>
                    <button onClick={() => setConfirmDeleteList(null)} style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Cancel</button>
                  </div>
                ) : (
                  <button
                    className="todo-list-delete"
                    onClick={() => setConfirmDeleteList(list.id)}
                    style={{ fontSize: '16px', color: 'var(--text-dim)', opacity: 0, padding: '0 10px 0 0', transition: 'opacity 0.15s', flexShrink: 0 }}
                  >
                    ×
                  </button>
                )
              )}
            </div>
          ))}

          {addingList ? (
            <input
              ref={newListRef}
              value={newListInput}
              onChange={e => setNewListInput(e.target.value)}
              onBlur={createList}
              onKeyDown={e => { if (e.key === 'Enter') createList(); if (e.key === 'Escape') { setAddingList(false); setNewListInput('') } }}
              placeholder="List name..."
              style={{
                margin: '4px 12px',
                fontSize: '13px',
                padding: '7px 10px',
                background: 'var(--surface)',
                border: '1px solid var(--gold)',
                borderRadius: '7px',
                color: 'var(--text)',
                outline: 'none',
              }}
            />
          ) : (
            <button
              onClick={() => setAddingList(true)}
              className="sidebar-btn"
              style={{ textAlign: 'left', padding: '10px 18px', fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}
            >
              + New list
            </button>
          )}
        </aside>

        {/* ── Main ── */}
        <main className={`todo-main${mobileView === 'lists' ? ' mobile-hidden' : ''}`} style={{ flex: 1, background: 'var(--bg)', overflowY: 'auto' }}>
          <div className="todo-back">
            <button onClick={() => setMobileView('lists')} style={{ fontSize: '13px', color: 'var(--gold)' }}>
              ← Lists
            </button>
          </div>

          <div style={{ maxWidth: '640px', margin: '0 auto', padding: '44px 36px' }} className="fade-up">

            {/* Header */}
            <div style={{ marginBottom: '36px' }}>
              <h1 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '32px',
                fontWeight: 700,
                color: 'var(--text)',
                marginBottom: '6px',
              }}>
                {currentList?.name ?? ''}
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--text-dim)' }}>
                {activeCount} remaining{doneCount > 0 ? ` · ${doneCount} done` : ''}
              </p>
            </div>

            {/* Input */}
            <div style={{ marginBottom: '24px' }}>
              <div
                className="input-row"
                style={{
                  display: 'flex',
                  gap: '8px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: showDuePicker ? '10px 10px 0 0' : '10px',
                  padding: '4px 4px 4px 16px',
                  transition: 'border-color 0.2s',
                }}
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && add()}
                  placeholder="Add a task..."
                  style={{ flex: 1, fontSize: '14px', padding: '9px 0' }}
                />
                <button
                  onClick={() => setShowDuePicker(p => !p)}
                  title="Set due date"
                  style={{
                    padding: '9px 10px',
                    color: showDuePicker || dueDate ? 'var(--gold)' : 'var(--text-dim)',
                    borderRadius: '7px',
                    fontSize: '15px',
                    transition: 'color 0.2s',
                  }}
                >
                  🗓
                </button>
                <button
                  onClick={add}
                  disabled={!input.trim()}
                  className="btn-gold"
                  style={{
                    padding: '9px 18px',
                    background: input.trim() ? 'var(--gold)' : 'var(--surface2)',
                    color: input.trim() ? '#0a0908' : 'var(--text-dim)',
                    borderRadius: '7px',
                    fontSize: '13px',
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                  }}
                >
                  Add
                </button>
              </div>

              {showDuePicker && (
                <div style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderTop: 'none',
                  borderRadius: '0 0 10px 10px',
                  padding: '10px 16px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  flexWrap: 'wrap',
                }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-dim)', flexShrink: 0 }}>Due</span>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    style={{ fontSize: '13px', color: 'var(--text)', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '7px', padding: '6px 10px' }}
                  />
                  <input
                    type="time"
                    value={dueTime}
                    onChange={e => setDueTime(e.target.value)}
                    disabled={!dueDate}
                    style={{ fontSize: '13px', color: 'var(--text)', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '7px', padding: '6px 10px', opacity: dueDate ? 1 : 0.4 }}
                  />
                  {dueDate && (
                    <button onClick={() => { setDueDate(''); setDueTime('') }} style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                      Clear
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Filter */}
            <div style={{
              display: 'flex',
              gap: '2px',
              marginBottom: '20px',
              background: 'var(--surface)',
              borderRadius: '8px',
              padding: '3px',
              width: 'fit-content',
            }}>
              {['all', 'active', 'done'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '5px 16px',
                    fontSize: '11.5px',
                    fontWeight: 500,
                    letterSpacing: '0.04em',
                    textTransform: 'capitalize',
                    borderRadius: '6px',
                    background: filter === f ? 'var(--surface2)' : 'transparent',
                    color: filter === f ? 'var(--text)' : 'var(--text-dim)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Tasks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {filtered.length === 0 && (
                <div style={{ padding: '48px 0', textAlign: 'center', fontSize: '14px', color: 'var(--text-dim)' }}>
                  {filter === 'done' ? 'Nothing completed yet.' :
                   filter === 'active' ? 'All caught up.' :
                   'Nothing here yet.'}
                </div>
              )}

              {filtered.map(todo => {
                const due = formatDue(todo.due_date, todo.due_time)
                return (
                  <div
                    key={todo.id}
                    className="todo-row fade-up"
                    onContextMenu={e => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, todoId: todo.id }) }}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      background: 'var(--surface)',
                      border: `1px solid ${due?.overdue && !todo.done ? 'rgba(180,60,60,0.25)' : 'var(--border2)'}`,
                      opacity: todo.done ? 0.45 : 1,
                      transition: 'opacity 0.25s ease, border-color 0.2s',
                    }}
                  >
                    <button
                      onClick={() => toggle(todo.id)}
                      style={{
                        width: '20px', height: '20px', marginTop: '2px',
                        borderRadius: '50%',
                        border: `1.5px solid ${todo.done ? 'var(--green)' : 'var(--text-dim)'}`,
                        background: todo.done ? 'var(--green)' : 'transparent',
                        flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '10px', color: 'white',
                        transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                      }}
                    >
                      {todo.done ? '✓' : ''}
                    </button>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {editingText === todo.id ? (
                        <input
                          autoFocus
                          value={editTextVal}
                          onChange={e => setEditTextVal(e.target.value)}
                          onBlur={() => saveText(todo.id)}
                          onKeyDown={e => { if (e.key === 'Enter') saveText(todo.id); if (e.key === 'Escape') setEditingText(null) }}
                          style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--text)', width: '100%', background: 'var(--surface2)', border: '1px solid var(--gold)', borderRadius: '4px', padding: '2px 6px' }}
                        />
                      ) : (
                        <span style={{
                          display: 'block', fontSize: '14px', lineHeight: 1.5, color: 'var(--text)',
                          textDecoration: todo.done ? 'line-through' : 'none',
                          textDecorationColor: 'var(--text-dim)',
                          transition: 'all 0.25s ease',
                        }}>
                          {todo.text}
                        </span>
                      )}

                      {editingDue === todo.id ? (
                        <InlineDuePicker
                          initialDate={todo.due_date || ''}
                          initialTime={todo.due_time || ''}
                          onSave={(d, t) => saveDue(todo.id, d, t)}
                          onCancel={() => setEditingDue(null)}
                        />
                      ) : due ? (
                        <button
                          onClick={() => !todo.done && setEditingDue(todo.id)}
                          style={{
                            marginTop: '4px', fontSize: '11px',
                            color: due.overdue && !todo.done ? '#c47a7a' : 'var(--gold)',
                            opacity: 0.85, display: 'flex', alignItems: 'center', gap: '4px',
                          }}
                        >
                          {due.overdue && !todo.done ? '⚠ ' : ''}{due.label}
                        </button>
                      ) : !todo.done ? (
                        <button
                          onClick={() => setEditingDue(todo.id)}
                          className="todo-add-due"
                          style={{ marginTop: '4px', fontSize: '11px', color: 'var(--text-dim)', opacity: 0, transition: 'opacity 0.15s' }}
                        >
                          + Add due date
                        </button>
                      ) : null}
                    </div>

                    <button
                      onClick={() => remove(todo.id)}
                      className="todo-delete"
                      style={{ fontSize: '18px', lineHeight: 1, color: 'var(--text-dim)', opacity: 0, transition: 'opacity 0.15s, color 0.15s', padding: '2px 5px', flexShrink: 0 }}
                    >
                      ×
                    </button>
                  </div>
                )
              })}
            </div>

            {doneCount > 0 && (
              <button
                onClick={clearDone}
                style={{ marginTop: '20px', fontSize: '12px', color: 'var(--text-dim)', letterSpacing: '0.06em', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = 'var(--text-mid)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-dim)'}
              >
                Clear {doneCount} completed
              </button>
            )}
          </div>
        </main>
      </div>
    </>
  )
}
