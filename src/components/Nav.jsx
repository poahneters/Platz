import { useEffect, useRef, useState } from 'react'

const VIEWS = [
  { id: 'journal',    label: 'Journal' },
  { id: 'todo',       label: 'To Do' },
  { id: 'whiteboard', label: 'Whiteboard' },
  { id: 'about',      label: 'About' },
  { id: 'about-me',   label: 'About Me' },
]

export default function Nav({ view, setView }) {
  const navRef = useRef(null)
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const active = nav.querySelector('[data-active="true"]')
    if (active) {
      setIndicator({ left: active.offsetLeft, width: active.offsetWidth })
    }
  }, [view])

  return (
    <header
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: '60px',
        background: 'rgba(10, 9, 8, 0.88)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 36px',
        zIndex: 50,
      }}
    >
      {/* Wordmark */}
      <div
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '22px',
          fontWeight: 700,
          color: 'var(--gold)',
          letterSpacing: '0.04em',
          userSelect: 'none',
        }}
      >
        Platz
      </div>

      {/* Nav */}
      <nav ref={navRef} style={{ position: 'relative', display: 'flex', gap: '2px' }}>
        {/* Sliding underline indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: '-6px',
            height: '1.5px',
            background: 'var(--gold)',
            borderRadius: '2px',
            left: `${indicator.left}px`,
            width: `${indicator.width}px`,
            transition: 'left 0.4s cubic-bezier(0.4,0,0.2,1), width 0.4s cubic-bezier(0.4,0,0.2,1)',
          }}
        />

        {VIEWS.map(({ id, label }) => (
          <button
            key={id}
            data-active={view === id ? 'true' : 'false'}
            onClick={() => setView(id)}
            className="nav-link"
            style={{
              padding: '6px 18px',
              fontSize: '11.5px',
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: view === id ? 'var(--text)' : 'var(--text-dim)',
              transition: 'color 0.25s ease',
            }}
          >
            {label}
          </button>
        ))}
      </nav>
    </header>
  )
}
