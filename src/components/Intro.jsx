import { useEffect, useState } from 'react'

const LETTERS = 'PLATZ'.split('')

// Bubbly cartoon leaf — Duolingo-esque thick outline + highlight
function CartoonLeaf({ color = '#52b788', rotate = 0, size = 1 }) {
  const w = Math.round(32 * size)
  const h = Math.round(48 * size)
  return (
    <svg width={w} height={h} viewBox="0 0 32 48" fill="none" style={{ display: 'block', transform: `rotate(${rotate}deg)` }}>
      <path
        d="M16 45 C8 38 2 29 2 18 C2 7 8 1 16 1 C24 1 30 7 30 18 C30 29 24 38 16 45 Z"
        fill={color}
        stroke="#1a4d2e"
        strokeWidth="2.8"
        strokeLinejoin="round"
      />
      {/* center vein */}
      <line x1="16" y1="5" x2="16" y2="42" stroke="#1a4d2e" strokeWidth="1.5" strokeLinecap="round" />
      {/* side veins */}
      <line x1="16" y1="18" x2="9"  y2="25" stroke="#1a4d2e" strokeWidth="1" strokeLinecap="round" opacity="0.45" />
      <line x1="16" y1="26" x2="23" y2="32" stroke="#1a4d2e" strokeWidth="1" strokeLinecap="round" opacity="0.45" />
      {/* highlight */}
      <ellipse cx="11" cy="14" rx="4" ry="6" fill="white" opacity="0.25" />
    </svg>
  )
}

// Cartoon tree that slides in from an edge
function CartoonTree({ side }) {
  const isLeft = side === 'left'
  return (
    <svg width="210" height="360" viewBox="0 0 210 360" fill="none">
      {/* Trunk */}
      <path
        d={isLeft
          ? 'M78,360 C78,360 84,262 90,208 C96,158 77,112 82,68'
          : 'M132,360 C132,360 126,262 120,208 C114,158 133,112 128,68'}
        stroke="#7a5230"
        strokeWidth="22"
        strokeLinecap="round"
      />
      {/* Main branch */}
      <path
        d={isLeft
          ? 'M86,200 C62,176 30,162 6,132'
          : 'M124,200 C148,176 180,162 204,132'}
        stroke="#7a5230"
        strokeWidth="12"
        strokeLinecap="round"
      />
      {/* Upper branch */}
      <path
        d={isLeft
          ? 'M88,144 C114,120 150,128 180,106'
          : 'M122,144 C96,120 60,128 30,106'}
        stroke="#7a5230"
        strokeWidth="12"
        strokeLinecap="round"
      />

      {/* Leaf clusters — big bubbly blobs */}
      {isLeft ? <>
        <ellipse cx="44"  cy="132" rx="50" ry="42" fill="#52b788" stroke="#1a4d2e" strokeWidth="3" />
        <ellipse cx="18"  cy="116" rx="32" ry="27" fill="#4ade80" stroke="#1a4d2e" strokeWidth="3" />
        <ellipse cx="90"  cy="92"  rx="52" ry="44" fill="#4ade80" stroke="#1a4d2e" strokeWidth="3" />
        <ellipse cx="158" cy="98"  rx="46" ry="38" fill="#52b788" stroke="#1a4d2e" strokeWidth="3" />
        <ellipse cx="186" cy="80"  rx="28" ry="24" fill="#4ade80" stroke="#1a4d2e" strokeWidth="3" />
        {/* Highlights */}
        <ellipse cx="36"  cy="122" rx="14" ry="9"  fill="white" opacity="0.22" />
        <ellipse cx="84"  cy="80"  rx="16" ry="10" fill="white" opacity="0.22" />
        <ellipse cx="152" cy="88"  rx="12" ry="8"  fill="white" opacity="0.22" />
      </> : <>
        <ellipse cx="166" cy="132" rx="50" ry="42" fill="#52b788" stroke="#1a4d2e" strokeWidth="3" />
        <ellipse cx="192" cy="116" rx="32" ry="27" fill="#4ade80" stroke="#1a4d2e" strokeWidth="3" />
        <ellipse cx="120" cy="92"  rx="52" ry="44" fill="#4ade80" stroke="#1a4d2e" strokeWidth="3" />
        <ellipse cx="52"  cy="98"  rx="46" ry="38" fill="#52b788" stroke="#1a4d2e" strokeWidth="3" />
        <ellipse cx="24"  cy="80"  rx="28" ry="24" fill="#4ade80" stroke="#1a4d2e" strokeWidth="3" />
        {/* Highlights */}
        <ellipse cx="174" cy="122" rx="14" ry="9"  fill="white" opacity="0.22" />
        <ellipse cx="126" cy="80"  rx="16" ry="10" fill="white" opacity="0.22" />
        <ellipse cx="58"  cy="88"  rx="12" ry="8"  fill="white" opacity="0.22" />
      </>}
    </svg>
  )
}

// Leaves that drift upward and fade out
function FloatingLeaves({ active }) {
  const leaves = [
    { left: '22%', delay: 0.30, color: '#4ade80', rotate: -10 },
    { left: '36%', delay: 0.65, color: '#86efac', rotate:  15 },
    { left: '53%', delay: 0.42, color: '#52b788', rotate:  -8 },
    { left: '68%', delay: 0.78, color: '#4ade80', rotate:  20 },
  ]
  if (!active) return null
  return leaves.map((l, i) => (
    <div
      key={i}
      style={{
        position: 'absolute',
        left: l.left,
        top: '62%',
        pointerEvents: 'none',
        animation: `floatLeaf 2.4s ease-out ${l.delay}s forwards`,
        opacity: 0,
      }}
    >
      <svg width="16" height="24" viewBox="0 0 32 48" fill="none" style={{ transform: `rotate(${l.rotate}deg)` }}>
        <path
          d="M16 45 C8 38 2 29 2 18 C2 7 8 1 16 1 C24 1 30 7 30 18 C30 29 24 38 16 45 Z"
          fill={l.color}
          stroke="#1a4d2e"
          strokeWidth="2.5"
        />
      </svg>
    </div>
  ))
}

// Leaves distributed along the vine
const VINE_LEAVES = [
  { leftPct: '4%',  top: -40, rotate: -28, delay: 0.05, size: 1.10, color: '#4ade80' },
  { leftPct: '17%', top:  -2, rotate:  32, delay: 0.18, size: 0.85, color: '#52b788' },
  { leftPct: '32%', top: -46, rotate: -14, delay: 0.10, size: 1.28, color: '#4ade80' },
  { leftPct: '50%', top:  -3, rotate:  38, delay: 0.24, size: 0.90, color: '#86efac' },
  { leftPct: '64%', top: -42, rotate: -22, delay: 0.08, size: 1.05, color: '#52b788' },
  { leftPct: '79%', top:  -4, rotate:  24, delay: 0.20, size: 1.00, color: '#4ade80' },
  { leftPct: '93%', top: -36, rotate: -32, delay: 0.14, size: 0.92, color: '#52b788' },
]

export default function Intro({ onComplete }) {
  const [phase, setPhase] = useState('hidden') // hidden → letters → leafing → exit

  useEffect(() => {
    const t0 = setTimeout(() => setPhase('letters'),  80)
    const t1 = setTimeout(() => setPhase('leafing'),  1400)
    const t2 = setTimeout(() => setPhase('exit'),     3500)
    const t3 = setTimeout(() => onComplete(),         4300)
    return () => [t0, t1, t2, t3].forEach(clearTimeout)
  }, [onComplete])

  const lettersVisible = phase !== 'hidden'
  const leafing        = phase === 'leafing'
  const isExit         = phase === 'exit'

  return (
    <>
      <style>{`
        @keyframes leafPop {
          0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
          65%  { transform: scale(1.18) rotate(4deg); opacity: 1; }
          100% { transform: scale(1)   rotate(0deg);  opacity: 1; }
        }
        @keyframes vineGrow {
          from { stroke-dashoffset: 920; }
          to   { stroke-dashoffset: 0;   }
        }
        @keyframes floatLeaf {
          0%   { transform: translateY(0)      rotate(0deg);  opacity: 0;    }
          12%  {                                               opacity: 0.85; }
          100% { transform: translateY(-160px) rotate(28deg); opacity: 0;    }
        }
      `}</style>

      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#f0f8ee',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          opacity: isExit ? 0 : 1,
          transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: isExit ? 'none' : 'all',
          userSelect: 'none',
          overflow: 'hidden',
        }}
      >
        {/* ── Left tree ── */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            pointerEvents: 'none',
            transform: leafing ? 'translateX(0)' : 'translateX(-112%)',
            transition: 'transform 1.1s cubic-bezier(0.34, 1.1, 0.64, 1) 0.3s',
          }}
        >
          <CartoonTree side="left" />
        </div>

        {/* ── Right tree ── */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            transform: leafing ? 'translateX(0)' : 'translateX(112%)',
            transition: 'transform 1.1s cubic-bezier(0.34, 1.1, 0.64, 1) 0.3s',
          }}
        >
          <CartoonTree side="right" />
        </div>

        {/* ── Center content ── */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>

          {/* PLATZ letters */}
          <div style={{ display: 'flex', gap: 'clamp(2px, 1vw, 10px)', alignItems: 'center' }}>
            {LETTERS.map((letter, i) => (
              <span
                key={i}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 900,
                  fontSize: 'clamp(68px, 13.5vw, 172px)',
                  color: '#2d8a55',
                  WebkitTextStroke: '2.5px #1a4d2e',
                  letterSpacing: '0.03em',
                  lineHeight: 1,
                  opacity: lettersVisible ? 1 : 0,
                  transform: lettersVisible ? 'translateY(0) scale(1)' : 'translateY(44px) scale(0.88)',
                  transition: [
                    `opacity 0.65s ease ${i * 0.08}s`,
                    `transform 0.65s cubic-bezier(0.16,1,0.3,1) ${i * 0.08}s`,
                  ].join(', '),
                }}
              >
                {letter}
              </span>
            ))}
          </div>

          {/* Vine + leaves row */}
          <div
            style={{
              position: 'relative',
              width: 'clamp(270px, 46vw, 660px)',
              height: '80px',
              marginTop: '-6px',
            }}
          >
            {/* Growing vine SVG */}
            <svg
              width="100%"
              height="80"
              viewBox="0 0 700 80"
              preserveAspectRatio="none"
              fill="none"
              style={{ position: 'absolute', inset: 0 }}
            >
              <path
                d="M0,40 C50,22 100,58 150,40 C200,22 250,58 300,40 C350,22 400,58 450,40 C500,22 550,58 600,40 C645,24 675,46 700,40"
                stroke="#2d6a4f"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray="920"
                strokeDashoffset="920"
                style={{
                  animation: leafing ? 'vineGrow 0.9s ease-out forwards' : 'none',
                }}
              />
            </svg>

            {/* Cartoon leaves along vine */}
            {leafing && VINE_LEAVES.map((leaf, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: leaf.leftPct,
                  top: `${leaf.top}px`,
                  transformOrigin: 'bottom center',
                  animation: `leafPop 0.45s cubic-bezier(0.34,1.56,0.64,1) ${leaf.delay}s both`,
                }}
              >
                <CartoonLeaf color={leaf.color} rotate={leaf.rotate} size={leaf.size} />
              </div>
            ))}
          </div>

          {/* Tagline */}
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
              fontSize: 'clamp(12px, 1.35vw, 16px)',
              color: '#2d6a4f',
              letterSpacing: '0.22em',
              marginTop: '14px',
              opacity: leafing ? 0.82 : 0,
              transform: leafing ? 'translateY(0)' : 'translateY(10px)',
              transition: 'opacity 0.9s ease 0.5s, transform 0.9s ease 0.5s',
            }}
          >
            grow through it.
          </p>
        </div>

        {/* ── Floating leaves ── */}
        <FloatingLeaves active={leafing} />
      </div>
    </>
  )
}
