import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabase'

const VIEWS = [
  { id: 'journal',    label: 'Journal' },
  { id: 'todo',       label: 'To Do' },
  { id: 'whiteboard', label: 'Whiteboard' },
  { id: 'about',      label: 'About Platz' },
  { id: 'about-me',   label: 'About Me' },
]

const BURST_LEAVES = [
  { angle: -90,  dist: 30, color: '#4ade80', size: 0.65, delay: 0    },
  { angle: -55,  dist: 28, color: '#52b788', size: 0.5,  delay: 0.03 },
  { angle: -125, dist: 26, color: '#86efac', size: 0.55, delay: 0.05 },
  { angle: -30,  dist: 25, color: '#4ade80', size: 0.45, delay: 0.02 },
  { angle: -150, dist: 22, color: '#52b788', size: 0.6,  delay: 0.06 },
]

function Leaf({ size = 1, color = '#4ade80' }) {
  const w = Math.round(12 * size)
  const h = Math.round(18 * size)
  return (
    <svg width={w} height={h} viewBox="0 0 12 18" fill="none">
      <path
        d="M6,17 C3,13 1,10 1,5 C1,2 3,1 6,1 C9,1 11,2 11,5 C11,10 9,13 6,17 Z"
        fill={color} stroke="#1a4d2e" strokeWidth="1.2"
      />
      <line x1="6" y1="3" x2="6" y2="15" stroke="#1a4d2e" strokeWidth="0.6" strokeLinecap="round" opacity="0.35" />
    </svg>
  )
}

// Pre-compute leaf keyframe CSS
const leafKeyframeCSS = BURST_LEAVES.map((leaf, i) => {
  const rad = (leaf.angle * Math.PI) / 180
  const tx = Math.round(Math.cos(rad) * leaf.dist)
  const ty = Math.round(Math.sin(rad) * leaf.dist)
  return `
    @keyframes leafBurst${i} {
      0%   { transform: translate(-50%, -50%) scale(0); opacity: 1; }
      100% { transform: translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(1); opacity: 0; }
    }
  `
}).join('')

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
        ${leafKeyframeCSS}
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

          {rustling && BURST_LEAVES.map((leaf, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                pointerEvents: 'none',
                animation: `leafBurst${i} 0.55s ease-out ${leaf.delay}s both`,
              }}
            >
              <Leaf size={leaf.size} color={leaf.color} />
            </div>
          ))}
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
