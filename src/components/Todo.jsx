import { useState, useEffect, useRef } from 'react'

const STORAGE_KEY = 'platz_todos'
let nextId = Date.now()

export default function Todo() {
  const [todos, setTodos] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] } catch { return [] }
  })
  const [input, setInput] = useState('')
  const [filter, setFilter] = useState('all')
  const inputRef = useRef(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
  }, [todos])

  function add() {
    if (!input.trim()) return
    setTodos(prev => [{ id: (++nextId).toString(), text: input.trim(), done: false }, ...prev])
    setInput('')
    inputRef.current?.focus()
  }

  function toggle(id) {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  function remove(id) {
    setTodos(prev => prev.filter(t => t.id !== id))
  }

  function clearDone() {
    setTodos(prev => prev.filter(t => !t.done))
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
      <div
        className="input-row"
        style={{
          display: 'flex',
          gap: '8px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '4px 4px 4px 16px',
          marginBottom: '24px',
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

        {filtered.map(todo => (
          <div
            key={todo.id}
            className="todo-row fade-up"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'var(--surface)',
              border: '1px solid var(--border2)',
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

            <span style={{
              flex: 1,
              fontSize: '14px',
              lineHeight: 1.5,
              color: 'var(--text)',
              textDecoration: todo.done ? 'line-through' : 'none',
              textDecorationColor: 'var(--text-dim)',
              transition: 'all 0.25s ease',
            }}>
              {todo.text}
            </span>

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
              }}
            >
              ×
            </button>
          </div>
        ))}
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
    </div>
  )
}
