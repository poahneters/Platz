import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabase'

const VIEWS = [
  { id: 'journal',    label: 'Journal' },
  { id: 'todo',       label: 'To Do' },
  { id: 'whiteboard', label: 'Whiteboard' },
  { id: 'about',      label: 'About Platz' },
  { id: 'about-me',   label: 'About Me' },
]


export default function Nav({ view, setView, highlight, tutorialStep }) {
  const navRef = useRef(null)
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })
  const [rustling, setRustling] = useState(false)
  const [rustlingTab, setRustlingTab] = useState(null)

  const tutorialActive = tutorialStep !== null
  const navVisible = !tutorialActive || tutorialStep > 0

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const active = nav.querySelector('[data-active="true"]')
    if (active) setIndicator({ left: active.offsetLeft, width: active.offsetWidth })
  }, [view])

  function triggerRustle() {
    if (rustling) return
    setRustling(true)
    setTimeout(() => setRustling(false), 700)
  }

  function handleSetView(id) {
    setView(id)
    setRustlingTab(id)
    setTimeout(() => setRustlingTab(null), 600)
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <>
      <style>{`
        @keyframes tabDot {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.9; }
          50%       { transform: translateY(-3px) scale(1.2); opacity: 1; }
        }
        @keyframes rustle {
          0%   { transform: rotate(0deg) scale(1); }
          20%  { transform: rotate(-4deg) scale(1.06); }
          40%  { transform: rotate(5deg) scale(1.04); }
          60%  { transform: rotate(-3deg) scale(1.05); }
          80%  { transform: rotate(2deg) scale(1.02); }
          100% { transform: rotate(0deg) scale(1); }
        }
      `}</style>

      <header
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          height: '60px',
          background: 'rgba(244, 250, 240, 0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 36px',
          zIndex: highlight ? 76 : 50,
          opacity: navVisible ? 1 : 0,
          pointerEvents: tutorialActive ? 'none' : 'auto',
          transition: 'opacity 0.5s ease',
        }}
      >
        {/* Wordmark - inline-block so position: absolute children anchor to the text, not the full row */}
        <div style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }} onClick={triggerRustle}>
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--gold)',
              letterSpacing: '0.04em',
              userSelect: 'none',
              display: 'inline-block',
              animation: rustling ? 'rustle 0.6s cubic-bezier(0.36,0.07,0.19,0.97) both' : 'none',
            }}
          >
            Platz
          </span>

        </div>

        {/* Nav */}
        <nav ref={navRef} style={{ position: 'relative', display: 'flex', gap: '2px' }}>
          <div
            style={{
              position: 'absolute',
              bottom: '-6px',
              height: '1.5px',
              background: 'var(--gold)',
              borderRadius: '2px',
              left: `${indicator.left}px`,
              width: `${indicator.width}px`,
              transition: 'left 0.4s cubic-bezier(0.4,0,0.2,1), width 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.5s ease',
              opacity: tutorialActive ? 0 : 1,
            }}
          />

          {VIEWS.map(({ id, label }) => (
            <button
              key={id}
              data-active={view === id ? 'true' : 'false'}
              onClick={() => handleSetView(id)}
              className="nav-link"
              style={{
                padding: '6px 18px',
                fontSize: '11.5px',
                fontWeight: 500,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: view === id ? 'var(--text)' : 'var(--text-dim)',
                transition: 'color 0.25s ease',
                display: 'inline-block',
                animation: rustlingTab === id ? 'rustle 0.6s cubic-bezier(0.36,0.07,0.19,0.97) both' : 'none',
              }}
            >
              {label}
              {highlight === id && (
                <span style={{
                  display: 'block',
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: 'var(--gold)',
                  margin: '3px auto 0',
                  animation: 'tabDot 0.8s ease-in-out infinite',
                }} />
              )}
            </button>
          ))}
        </nav>

        {/* Sign out */}
        <button
          onClick={signOut}
          style={{
            fontSize: '11.5px',
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-dim)',
            padding: '5px 12px',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            transition: 'color 0.2s, border-color 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--border2)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          Sign out
        </button>
      </header>
    </>
  )
}
