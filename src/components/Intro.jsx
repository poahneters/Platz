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
      <line x1="16" y1="5" x2="16" y2="42" stroke="#1a4d2e" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="18" x2="9"  y2="25" stroke="#1a4d2e" strokeWidth="1" strokeLinecap="round" opacity="0.45" />
      <line x1="16" y1="26" x2="23" y2="32" stroke="#1a4d2e" strokeWidth="1" strokeLinecap="round" opacity="0.45" />
      <ellipse cx="11" cy="14" rx="4" ry="6" fill="white" opacity="0.25" />
    </svg>
  )
}

// Top-down jungle canopy corner — leaves viewed from above creeping inward.
// Always drawn as top-left; CSS flip handles the other three corners.
function JungleCanopySVG() {
  return (
    <svg
      viewBox="0 0 440 380"
      fill="none"
      style={{ width: 'min(440px, 52vw)', height: 'min(380px, 52vh)', display: 'block' }}
    >
      {/* ── Vine tendrils reaching toward center ── */}
      <path d="M 55,50  C 148,108 238,172 368,296" stroke="#2d6a4f" strokeWidth="3"   strokeLinecap="round" />
      <path d="M 28,110 C  98,168 182,232 278,320" stroke="#2d6a4f" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 125,28 C 198,84  282,128 402,182" stroke="#2d6a4f" strokeWidth="2.5" strokeLinecap="round" />

      {/* ── Dense leaf cluster at corner (top-left) ── */}
      {/* Large leaves */}
      <ellipse cx="22"  cy="22"  rx="48" ry="34" transform="rotate(-15 22 22)"   fill="#4ade80" stroke="#1a4d2e" strokeWidth="2.8" />
      <ellipse cx="95"  cy="14"  rx="42" ry="26" transform="rotate(8 95 14)"     fill="#52b788" stroke="#1a4d2e" strokeWidth="2.8" />
      <ellipse cx="14"  cy="86"  rx="32" ry="50" transform="rotate(-4 14 86)"    fill="#4ade80" stroke="#1a4d2e" strokeWidth="2.8" />
      <ellipse cx="152" cy="36"  rx="40" ry="26" transform="rotate(18 152 36)"   fill="#86efac" stroke="#1a4d2e" strokeWidth="2.8" />
      <ellipse cx="56"  cy="130" rx="44" ry="30" transform="rotate(-8 56 130)"   fill="#52b788" stroke="#1a4d2e" strokeWidth="2.8" />
      <ellipse cx="172" cy="92"  rx="34" ry="24" transform="rotate(12 172 92)"   fill="#4ade80" stroke="#1a4d2e" strokeWidth="2.8" />

      {/* Medium leaves — mid-reach */}
      <ellipse cx="114" cy="185" rx="36" ry="26" transform="rotate(-12 114 185)" fill="#86efac" stroke="#1a4d2e" strokeWidth="2.6" />
      <ellipse cx="212" cy="58"  rx="28" ry="20" transform="rotate(5 212 58)"    fill="#52b788" stroke="#1a4d2e" strokeWidth="2.6" />
      <ellipse cx="212" cy="158" rx="30" ry="22" transform="rotate(-18 212 158)" fill="#4ade80" stroke="#1a4d2e" strokeWidth="2.6" />
      <ellipse cx="264" cy="112" rx="24" ry="18" transform="rotate(8 264 112)"   fill="#86efac" stroke="#1a4d2e" strokeWidth="2.6" />
      <ellipse cx="178" cy="245" rx="28" ry="20" transform="rotate(15 178 245)"  fill="#52b788" stroke="#1a4d2e" strokeWidth="2.6" />
      <ellipse cx="262" cy="212" rx="22" ry="16" transform="rotate(-5 262 212)"  fill="#4ade80" stroke="#1a4d2e" strokeWidth="2.6" />

      {/* Small leaves at vine tips — furthest inward */}
      <ellipse cx="318" cy="242" rx="16" ry="12" transform="rotate(-10 318 242)" fill="#52b788" stroke="#1a4d2e" strokeWidth="2.2" />
      <ellipse cx="288" cy="308" rx="14" ry="11" transform="rotate(18 288 308)"  fill="#4ade80" stroke="#1a4d2e" strokeWidth="2.2" />
      <ellipse cx="378" cy="184" rx="14" ry="10" transform="rotate(5 378 184)"   fill="#86efac" stroke="#1a4d2e" strokeWidth="2.2" />
      <ellipse cx="362" cy="298" rx="12" ry="9"  transform="rotate(-15 362 298)" fill="#52b788" stroke="#1a4d2e" strokeWidth="2"   />
      <ellipse cx="418" cy="328" rx="10" ry="8"  transform="rotate(10 418 328)"  fill="#4ade80" stroke="#1a4d2e" strokeWidth="2"   />

      {/* ── Highlights (white gloss on large leaves) ── */}
      <ellipse cx="13"  cy="14"  rx="16" ry="10" fill="white" opacity="0.22" />
      <ellipse cx="86"  cy="8"   rx="13" ry="8"  fill="white" opacity="0.22" />
      <ellipse cx="46"  cy="122" rx="14" ry="8"  fill="white" opacity="0.22" />
      <ellipse cx="104" cy="178" rx="12" ry="7"  fill="white" opacity="0.20" />
    </svg>
  )
}

// Positions one corner cluster and mirrors it for the four corners
function JungleCorner({ corner, active }) {
  const isRight  = corner === 'tr' || corner === 'br'
  const isBottom = corner === 'bl' || corner === 'br'

  // Outer div: handles CSS position at corner
  // Inner div: mirrors the SVG for right/bottom corners
  const flipX = isRight  ? 'scaleX(-1)' : ''
  const flipY = isBottom ? 'scaleY(-1)' : ''
  const flip  = [flipX, flipY].filter(Boolean).join(' ') || 'none'

  // Slide-in direction: push off-screen toward the corner on hide
  const dx = isRight  ? '110%' : '-110%'
  const dy = isBottom ? '110%' : '-110%'

  return (
    <div
      style={{
        position: 'absolute',
        top:    isBottom ? undefined : 0,
        bottom: isBottom ? 0 : undefined,
        left:   isRight  ? undefined : 0,
        right:  isRight  ? 0 : undefined,
        pointerEvents: 'none',
        transform: active ? 'translate(0, 0)' : `translate(${dx}, ${dy})`,
        transition: `transform 2s cubic-bezier(0.22, 0.1, 0.36, 1) 0.25s`,
      }}
    >
      <div style={{ transform: flip }}>
        <JungleCanopySVG />
      </div>
    </div>
  )
}

// Small leaves that drift upward and fade
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
        animation: `floatLeaf 3s ease-out ${l.delay + 0.4}s forwards`,
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
    const t1 = setTimeout(() => setPhase('leafing'),  1900)
    const t2 = setTimeout(() => setPhase('exit'),     4600)
    const t3 = setTimeout(() => onComplete(),         5500)
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
          100% { transform: translateY(-180px) rotate(28deg); opacity: 0;    }
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
          transition: 'opacity 1s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: isExit ? 'none' : 'all',
          userSelect: 'none',
          overflow: 'hidden',
        }}
      >
        {/* ── Four jungle canopy corners creeping inward ── */}
        <JungleCorner corner="tl" active={leafing} />
        <JungleCorner corner="tr" active={leafing} />
        <JungleCorner corner="bl" active={leafing} />
        <JungleCorner corner="br" active={leafing} />

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
                    `opacity 0.85s ease ${i * 0.1}s`,
                    `transform 0.85s cubic-bezier(0.16,1,0.3,1) ${i * 0.1}s`,
                  ].join(', '),
                }}
              >
                {letter}
              </span>
            ))}
          </div>

          {/* Vine + leaves under the word */}
          <div
            style={{
              position: 'relative',
              width: 'clamp(270px, 46vw, 660px)',
              height: '80px',
              marginTop: '-6px',
            }}
          >
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
                  animation: leafing ? 'vineGrow 1.2s ease-out forwards' : 'none',
                }}
              />
            </svg>

            {leafing && VINE_LEAVES.map((leaf, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: leaf.leftPct,
                  top: `${leaf.top}px`,
                  transformOrigin: 'bottom center',
                  animation: `leafPop 0.6s cubic-bezier(0.34,1.56,0.64,1) ${leaf.delay + 0.3}s both`,
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
              transition: 'opacity 1s ease 0.7s, transform 1s ease 0.7s',
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
