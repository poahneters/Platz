import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabase'

const VIEWS = [
  { id: 'journal',    label: 'Journal' },
  { id: 'todo',       label: 'To Do' },
  { id: 'whiteboard', label: 'Whiteboard' },
  { id: 'about',      label: 'About Platz' },
  { id: 'about-me',   label: 'About Me' },
]

// Leaves that fly out on click — angle in degrees, distance, color
const BURST_LEAVES = [
  { angle: -80,  dist: 28, color: '#4ade80', size: 0.7,  delay: 0    },
  { angle: -50,  dist: 32, color: '#52b788', size: 0.55, delay: 0.03 },
  { angle: -110, dist: 26, color: '#86efac', size: 0.6,  delay: 0.05 },
  { angle: -25,  dist: 30, color: '#4ade80', size: 0.5,  delay: 0.02 },
  { angle: -140, dist: 24, color: '#52b788', size: 0.65, delay: 0.06 },
  { angle: -90,  dist: 34, color: '#86efac', size: 0.58, delay: 0.01 },
]

function Leaf({ size = 1, color = '#4ade80' }) {
  const w = Math.round(14 * size)
  const h = Math.round(20 * size)
  return (
    <svg width={w} height={h} viewBox="0 0 14 20" fill="none">
      <path
        d="M7,19 C3,15 1,11 1,6 C1,2 3,1 7,1 C11,1 13,2 13,6 C13,11 11,15 7,19 Z"
        fill={color} stroke="#1a4d2e" strokeWidth="1.4"
      />
      <line x1="7" y1="3" x2="7" y2="17" stroke="#1a4d2e" strokeWidth="0.7" strokeLinecap="round" opacity="0.38" />
    </svg>
  )
}

export default function Nav({ view, setView }) {
  const navRef = useRef(null)
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })
  const [rustling, setRustling] = useState(false)

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const active = nav.querySelector('[data-active="true"]')
    if (active) {
      setIndicator({ left: active.offsetLeft, width: active.offsetWidth })
    }
  }, [view])

  function handleLogoClick() {
    if (rustling) return
    setRustling(true)
    setTimeout(() => setRustling(false), 700)
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <>
      <style>{`
        @keyframes rustle {
          0%   { transform: rotate(0deg) scale(1); }
          20%  { transform: rotate(-4deg) scale(1.06); }
          40%  { transform: rotate(5deg) scale(1.04); }
          60%  { transform: rotate(-3deg) scale(1.05); }
          80%  { transform: rotate(2deg) scale(1.02); }
          100% { transform: rotate(0deg) scale(1); }
        }
        ${BURST_LEAVES.map((leaf, i) => {
          const rad = (leaf.angle * Math.PI) / 180
          const tx = Math.round(Math.cos(rad) * leaf.dist)
          const ty = Math.round(Math.sin(rad) * leaf.dist)
          return `
            @keyframes leafBurst${i} {
              0%   { transform: translate(-50%, -50%) rotate(${leaf.angle + 90}deg) scale(0); opacity: 1; }
              65%  { opacity: 1; }
              100% { transform: translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) rotate(${leaf.angle + 110}deg) scale(1); opacity: 0; }
            }
          `
        }).join('')}
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
          zIndex: 50,
        }}
      >
        {/* Wordmark */}
        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={handleLogoClick}>
          <div
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
          </div>

          {/* Burst leaves */}
          {rustling && BURST_LEAVES.map((leaf, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                pointerEvents: 'none',
                animation: `leafBurst${i} 0.6s cubic-bezier(0.2,0,0.4,1) ${leaf.delay}s both`,
              }}
            >
              <Leaf size={leaf.size} color={leaf.color} />
            </div>
          ))}
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
