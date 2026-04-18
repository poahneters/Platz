import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'

function formatDue(isoStr) {
  if (!isoStr) return null
  const d = new Date(isoStr)
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrowStart = new Date(todayStart.getTime() + 86400000)
  const dStart = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const overdue = d < now

  let label
  if (dStart.getTime() === todayStart.getTime()) label = `Today at ${timeStr}`
  else if (dStart.getTime() === tomorrowStart.getTime()) label = `Tomorrow at ${timeStr}`
  else label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ` at ${timeStr}`

  return { label, overdue }
}

// Convert local datetime-local value to ISO string
function localToISO(local) {
  if (!local) return null
  return new Date(local).toISOString()
}

// Convert ISO to datetime-local input value
function isoToLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function Todo({ user }) {
  const [todos, setTodos] = useState([])
  const [input, setInput] = useState('')
  const [filter, setFilter] = useState('all')
  const [dueDate, setDueDate] = useState('')
  const [showDuePicker, setShowDuePicker] = useState(false)
  const [editingDue, setEditingDue] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setTodos(data) })
  }, [user.id])

  async function add() {
    if (!input.trim()) return
    const text = input.trim()
    const due_at = dueDate ? localToISO(dueDate) : null
    setInput('')
    setDueDate('')
    setShowDuePicker(false)
    inputRef.current?.focus()
    const { data } = await supabase
      .from('todos')
      .insert({ user_id: user.id, text, done: false, due_at })
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
    setTodos(prev => prev.filter(t => t.id !== id))
    await supabase.from('todos').delete().eq('id', id)
  }

  async function clearDone() {
    const doneIds = todos.filter(t => t.done).map(t => t.id)
    setTodos(prev => prev.filter(t => !t.done))
    await supabase.from('todos').delete().in('id', doneIds)
  }

  async function updateDue(id, localVal) {
    const due_at = localVal ? localToISO(localVal) : null
    setTodos(prev => prev.map(t => t.id === id ? { ...t, due_at } : t))
    setEditingDue(null)
    await supabase.from('todos').update({ due_at }).eq('id', id)
  }

  const filtered = todos.filter(t =>
    filter === 'all'    ? true :
    filter === 'active' ? !t.done :
    t.done
  )

  const doneCount = todos.filter(t => t.done).length
  const activeCount = todos.length - doneCount

  return (
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
          To Do
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
          }}>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)', flexShrink: 0 }}>Due</span>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              style={{
                flex: 1,
                fontSize: '13px',
                color: 'var(--text)',
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: '7px',
                padding: '6px 10px',
              }}
            />
            {dueDate && (
              <button
                onClick={() => setDueDate('')}
                style={{ fontSize: '13px', color: 'var(--text-dim)' }}
              >
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
          const due = formatDue(todo.due_at)
          return (
            <div
              key={todo.id}
              className="todo-row fade-up"
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
              {/* Circle checkbox */}
              <button
                onClick={() => toggle(todo.id)}
                style={{
                  width: '20px',
                  height: '20px',
                  marginTop: '2px',
                  borderRadius: '50%',
                  border: `1.5px solid ${todo.done ? 'var(--green)' : 'var(--text-dim)'}`,
                  background: todo.done ? 'var(--green)' : 'transparent',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: 'white',
                  transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                }}
              >
                {todo.done ? '✓' : ''}
              </button>

              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{
                  display: 'block',
                  fontSize: '14px',
                  lineHeight: 1.5,
                  color: 'var(--text)',
                  textDecoration: todo.done ? 'line-through' : 'none',
                  textDecorationColor: 'var(--text-dim)',
                  transition: 'all 0.25s ease',
                }}>
                  {todo.text}
                </span>

                {/* Due date display / edit */}
                {editingDue === todo.id ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <input
                      type="datetime-local"
                      defaultValue={isoToLocal(todo.due_at)}
                      autoFocus
                      onBlur={e => updateDue(todo.id, e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') updateDue(todo.id, e.target.value); if (e.key === 'Escape') setEditingDue(null) }}
                      style={{
                        fontSize: '12px',
                        color: 'var(--text)',
                        background: 'var(--surface2)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        padding: '4px 8px',
                      }}
                    />
                    <button
                      onClick={() => updateDue(todo.id, '')}
                      style={{ fontSize: '11px', color: 'var(--text-dim)' }}
                    >
                      Remove
                    </button>
                  </div>
                ) : due ? (
                  <button
                    onClick={() => !todo.done && setEditingDue(todo.id)}
                    style={{
                      marginTop: '4px',
                      fontSize: '11px',
                      color: due.overdue ? '#c47a7a' : 'var(--gold)',
                      opacity: 0.85,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'opacity 0.2s',
                    }}
                  >
                    {due.overdue && !todo.done ? '⚠ ' : ''}
                    {due.label}
                  </button>
                ) : !todo.done ? (
                  <button
                    onClick={() => setEditingDue(todo.id)}
                    className="todo-add-due"
                    style={{
                      marginTop: '4px',
                      fontSize: '11px',
                      color: 'var(--text-dim)',
                      opacity: 0,
                      transition: 'opacity 0.15s',
                    }}
                  >
                    + Add due date
                  </button>
                ) : null}
              </div>

              <button
                onClick={() => remove(todo.id)}
                className="todo-delete"
                style={{
                  fontSize: '18px',
                  lineHeight: 1,
                  color: 'var(--text-dim)',
                  opacity: 0,
                  transition: 'opacity 0.15s, color 0.15s',
                  padding: '2px 5px',
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>
          )
        })}
      </div>

      {/* Clear done */}
      {doneCount > 0 && (
        <button
          onClick={clearDone}
          style={{
            marginTop: '20px',
            fontSize: '12px',
            color: 'var(--text-dim)',
            letterSpacing: '0.06em',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.target.style.color = 'var(--text-mid)'}
          onMouseLeave={e => e.target.style.color = 'var(--text-dim)'}
        >
          Clear {doneCount} completed
        </button>
      )}

      <style>{`
        .todo-row:hover .todo-delete { opacity: 0.5 !important; }
        .todo-row:hover .todo-delete:hover { opacity: 1 !important; color: var(--text-mid) !important; }
        .todo-row:hover .todo-add-due { opacity: 0.6 !important; }
        .todo-row:hover .todo-add-due:hover { opacity: 1 !important; }
      `}</style>
    </div>
  )
}
