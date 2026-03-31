import { useEffect, useState } from 'react'

const LETTERS = 'PLATZ'.split('')

// Each vine: path from a scattered edge point curling inward,
// draw duration, stagger delay, and leaves at parametric positions (t=0..1 along path)
const VINES = [
  {
    id: 'v1',
    // From top edge ~14% — curves down-right, looping toward center-left
    d: 'M 138,0 C 105,55 165,95 155,158 C 145,222 88,245 102,308 C 116,368 172,372 178,435 C 184,490 142,520 148,570',
    duration: 2.6, delay: 0.0,
    leaves: [
      { t: 0.18, x: 150, y: 98,  r: 40,  s: 1.1,  c: '#4ade80' },
      { t: 0.42, x: 92,  y: 272, r: -28, s: 0.95, c: '#52b788' },
      { t: 0.65, x: 178, y: 408, r: 52,  s: 1.0,  c: '#4ade80' },
      { t: 0.88, x: 144, y: 548, r: -18, s: 0.85, c: '#86efac' },
    ],
  },
  {
    id: 'v2',
    // From right edge ~22% down — slithers left with wide S
    d: 'M 1000,155 C 935,138 905,195 848,186 C 788,176 768,238 706,228 C 650,220 628,272 568,268 C 515,264 492,312 438,318',
    duration: 2.8, delay: 0.22,
    leaves: [
      { t: 0.20, x: 902, y: 175, r: -35, s: 1.15, c: '#52b788' },
      { t: 0.48, x: 752, y: 215, r: 20,  s: 1.0,  c: '#86efac' },
      { t: 0.74, x: 592, y: 252, r: -42, s: 0.92, c: '#4ade80' },
    ],
  },
  {
    id: 'v3',
    // From bottom edge ~82% — curls upward-left
    d: 'M 822,700 C 808,632 845,595 812,535 C 778,472 718,488 690,428 C 662,370 688,322 650,272 C 618,230 568,228 542,182',
    duration: 2.5, delay: 0.12,
    leaves: [
      { t: 0.22, x: 826, y: 638, r: -18, s: 1.1,  c: '#4ade80' },
      { t: 0.50, x: 705, y: 468, r: 30,  s: 1.0,  c: '#52b788' },
      { t: 0.78, x: 648, y: 252, r: -38, s: 0.9,  c: '#86efac' },
    ],
  },
  {
    id: 'v4',
    // From left edge ~55% — curls right with a loop
    d: 'M 0,388 C 72,365 88,428 148,415 C 210,402 228,342 290,352 C 345,360 362,415 418,405 C 468,396 488,348 542,345',
    duration: 2.4, delay: 0.45,
    leaves: [
      { t: 0.22, x: 88,  y: 395, r: 22,  s: 1.05, c: '#4ade80' },
      { t: 0.52, x: 262, y: 358, r: -30, s: 1.1,  c: '#52b788' },
      { t: 0.82, x: 488, y: 358, r: 40,  s: 0.9,  c: '#4ade80' },
    ],
  },
  {
    id: 'v5',
    // From top edge ~68% — curves down then bends left
    d: 'M 682,0 C 698,72 638,112 648,175 C 658,238 718,252 705,315 C 694,368 640,378 628,430 C 618,472 645,508 628,552',
    duration: 2.2, delay: 0.35,
    leaves: [
      { t: 0.26, x: 645, y: 132, r: -35, s: 1.0,  c: '#86efac' },
      { t: 0.58, x: 710, y: 288, r: 25,  s: 1.15, c: '#52b788' },
      { t: 0.85, x: 632, y: 448, r: -22, s: 0.9,  c: '#4ade80' },
    ],
  },
  {
    id: 'v6',
    // From bottom edge ~22% — curls upward-right
    d: 'M 215,700 C 232,628 192,590 212,528 C 232,465 292,452 300,390 C 308,335 265,298 282,242 C 298,192 348,178 358,128',
    duration: 2.3, delay: 0.18,
    leaves: [
      { t: 0.24, x: 212, y: 632, r: 15,  s: 1.05, c: '#52b788' },
      { t: 0.55, x: 288, y: 458, r: -32, s: 0.95, c: '#4ade80' },
      { t: 0.84, x: 348, y: 188, r: 28,  s: 1.0,  c: '#86efac' },
    ],
  },
  {
    id: 'v7',
    // From right edge ~70% — shorter curl into lower-center
    d: 'M 1000,488 C 942,472 918,528 858,518 C 798,508 782,455 722,452 C 672,448 650,492 598,488',
    duration: 2.0, delay: 0.55,
    leaves: [
      { t: 0.28, x: 915, y: 498, r: -25, s: 1.0,  c: '#4ade80' },
      { t: 0.68, x: 748, y: 462, r: 32,  s: 0.95, c: '#52b788' },
    ],
  },
]

// Ovate leaf viewed from above — pointed at both ends, wider in middle, with 3D gloss
function OvateLeaf({ x, y, rotate, scale = 1, color }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      {/* Drop shadow for 3D depth */}
      <path
        d="M0,-22 C10,-13 14,1 12,12 C10,20 5,25 0,26 C-5,25 -10,20 -12,12 C-14,1 -10,-13 0,-22 Z"
        fill="#0f3320"
        opacity="0.20"
        transform="translate(3 4)"
      />
      {/* Leaf body — ovate: wider mid, tapers at top and base */}
      <path
        d="M0,-22 C10,-13 14,1 12,12 C10,20 5,25 0,26 C-5,25 -10,20 -12,12 C-14,1 -10,-13 0,-22 Z"
        fill={color}
        stroke="#1a4d2e"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      {/* 3D highlight — curved crescent near tip, gives the bubbly roundness */}
      <path
        d="M-4,-17 C-1,-20 5,-17 7,-12 C4,-10 -2,-10 -4,-17 Z"
        fill="white"
        opacity="0.40"
      />
      {/* Subtle secondary sheen lower-left */}
      <ellipse cx="-6" cy="4" rx="3.5" ry="5" fill="white" opacity="0.12" />
      {/* Center vein */}
      <line x1="0" y1="-18" x2="0" y2="22" stroke="#1a4d2e" strokeWidth="1.1" strokeLinecap="round" opacity="0.45" />
      {/* Side veins */}
      <line x1="0" y1="-5" x2="-9" y2="5"   stroke="#1a4d2e" strokeWidth="0.9" strokeLinecap="round" opacity="0.32" />
      <line x1="0" y1="4"  x2="9"  y2="13"  stroke="#1a4d2e" strokeWidth="0.9" strokeLinecap="round" opacity="0.32" />
      <line x1="0" y1="-12" x2="8" y2="-4"  stroke="#1a4d2e" strokeWidth="0.7" strokeLinecap="round" opacity="0.22" />
    </g>
  )
}


const VINE_UNDERLINE_LEAVES = [
  { leftPct: '4%',  top: -38, rotate: -28, delay: 0.08, size: 1.10, color: '#4ade80' },
  { leftPct: '17%', top:   2, rotate:  32, delay: 0.22, size: 0.85, color: '#52b788' },
  { leftPct: '32%', top: -44, rotate: -14, delay: 0.12, size: 1.28, color: '#4ade80' },
  { leftPct: '50%', top:   1, rotate:  38, delay: 0.28, size: 0.90, color: '#86efac' },
  { leftPct: '64%', top: -40, rotate: -22, delay: 0.10, size: 1.05, color: '#52b788' },
  { leftPct: '79%', top:   2, rotate:  24, delay: 0.24, size: 1.00, color: '#4ade80' },
  { leftPct: '93%', top: -34, rotate: -32, delay: 0.16, size: 0.92, color: '#52b788' },
]

export default function Intro({ onComplete }) {
  const [phase, setPhase] = useState('hidden')

  useEffect(() => {
    const t0 = setTimeout(() => setPhase('letters'),  80)
    const t1 = setTimeout(() => setPhase('leafing'),  1900)
    const t2 = setTimeout(() => setPhase('exit'),     5000)
    const t3 = setTimeout(() => onComplete(),         6000)
    return () => [t0, t1, t2, t3].forEach(clearTimeout)
  }, [onComplete])

  const lettersVisible = phase !== 'hidden'
  const leafing        = phase === 'leafing' || phase === 'exit'
  const isExit         = phase === 'exit'

  return (
    <>
      <style>{`
        @keyframes vineSlither {
          from { stroke-dashoffset: 1; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes leafPop {
          0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
          60%  { transform: scale(1.2) rotate(5deg);  opacity: 1; }
          100% { transform: scale(1)   rotate(0deg);  opacity: 1; }
        }
        @keyframes underlineGrow {
          from { stroke-dashoffset: 920; }
          to   { stroke-dashoffset: 0; }
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

        {/* ── Full-screen SVG vine layer ── */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          viewBox="0 0 1000 700"
          preserveAspectRatio="xMidYMid slice"
        >
          {VINES.map((vine) => {
            const animStart = vine.delay
            return (
              <g key={vine.id}>
                {/* Vine shadow — slightly offset, gives depth */}
                <path
                  d={vine.d}
                  stroke="#0f3320"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  opacity="0.18"
                  transform="translate(2 3)"
                  pathLength="1"
                  strokeDasharray="1"
                  strokeDashoffset={leafing ? undefined : '1'}
                  style={leafing ? {
                    strokeDashoffset: 0,
                    animation: `vineSlither ${vine.duration}s cubic-bezier(0.3, 0.0, 0.4, 1) ${animStart}s both`,
                  } : { strokeDashoffset: 1 }}
                />
                {/* Main vine body */}
                <path
                  d={vine.d}
                  stroke="#2d6a4f"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  pathLength="1"
                  strokeDasharray="1"
                  style={leafing ? {
                    animation: `vineSlither ${vine.duration}s cubic-bezier(0.3, 0.0, 0.4, 1) ${animStart}s both`,
                  } : { strokeDashoffset: 1 }}
                />
                {/* Highlight stripe — thinner, lighter, gives the rounded 3D vine look */}
                <path
                  d={vine.d}
                  stroke="#86efac"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  opacity="0.45"
                  pathLength="1"
                  strokeDasharray="1"
                  style={leafing ? {
                    animation: `vineSlither ${vine.duration}s cubic-bezier(0.3, 0.0, 0.4, 1) ${animStart}s both`,
                  } : { strokeDashoffset: 1 }}
                />

                {/* Leaves — pop in as the vine tip passes each one */}
                {leafing && vine.leaves.map((leaf, li) => {
                  const leafDelay = animStart + leaf.t * vine.duration
                  return (
                    <g
                      key={li}
                      style={{
                        transformOrigin: `${leaf.x}px ${leaf.y}px`,
                        animation: `leafPop 0.55s cubic-bezier(0.34,1.5,0.64,1) ${leafDelay}s both`,
                      }}
                    >
                      <OvateLeaf
                        x={leaf.x} y={leaf.y}
                        rotate={leaf.r} scale={leaf.s}
                        color={leaf.c}
                      />
                    </g>
                  )
                })}
              </g>
            )
          })}
        </svg>

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

          {/* Underline vine + leaves */}
          <div
            style={{
              position: 'relative',
              width: 'clamp(270px, 46vw, 660px)',
              height: '72px',
              marginTop: '-4px',
            }}
          >
            <svg
              width="100%" height="72"
              viewBox="0 0 700 72"
              preserveAspectRatio="none"
              fill="none"
              style={{ position: 'absolute', inset: 0 }}
            >
              <path
                d="M0,36 C50,20 100,52 150,36 C200,20 250,52 300,36 C350,20 400,52 450,36 C500,20 550,52 600,36 C645,22 675,44 700,36"
                stroke="#2d6a4f"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray="920"
                strokeDashoffset="920"
                style={{
                  animation: leafing ? 'underlineGrow 1.4s cubic-bezier(0.3,0,0.4,1) 0s forwards' : 'none',
                }}
              />
              <path
                d="M0,36 C50,20 100,52 150,36 C200,20 250,52 300,36 C350,20 400,52 450,36 C500,20 550,52 600,36 C645,22 675,44 700,36"
                stroke="#86efac"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeDasharray="920"
                strokeDashoffset="920"
                opacity="0.5"
                style={{
                  animation: leafing ? 'underlineGrow 1.4s cubic-bezier(0.3,0,0.4,1) 0s forwards' : 'none',
                }}
              />
            </svg>

            {leafing && VINE_UNDERLINE_LEAVES.map((leaf, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: leaf.leftPct,
                  top: `${leaf.top}px`,
                  transformOrigin: 'bottom center',
                  animation: `leafPop 0.55s cubic-bezier(0.34,1.5,0.64,1) ${leaf.delay + 0.35}s both`,
                }}
              >
                <svg
                  width={Math.round(30 * leaf.size)}
                  height={Math.round(46 * leaf.size)}
                  viewBox="0 0 30 46"
                  fill="none"
                  style={{ transform: `rotate(${leaf.rotate}deg)` }}
                >
                  <path d="M15,43 C7,35 2,26 2,16 C2,6 7,1 15,1 C23,1 28,6 28,16 C28,26 23,35 15,43 Z"
                    fill={leaf.color} stroke="#1a4d2e" strokeWidth="2.4" />
                  <path d="M10,-1 C12,-3 18,0 19,4 C16,5 9,5 10,-1 Z" fill="white" opacity="0.35" transform="translate(0 4)" />
                  <line x1="15" y1="4" x2="15" y2="40" stroke="#1a4d2e" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
                </svg>
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
              marginTop: '12px',
              opacity: leafing ? 0.82 : 0,
              transform: leafing ? 'translateY(0)' : 'translateY(10px)',
              transition: 'opacity 1s ease 0.7s, transform 1s ease 0.7s',
            }}
          >
            A Space to Grow
          </p>
        </div>


      </div>
    </>
  )
}
