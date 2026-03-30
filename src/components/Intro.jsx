import { useEffect, useState } from 'react'

const LETTERS = 'PLATZ'.split('')

export default function Intro({ onComplete }) {
  const [phase, setPhase] = useState('hidden') // hidden → visible → exit

  useEffect(() => {
    const t0 = setTimeout(() => setPhase('visible'), 80)
    const t1 = setTimeout(() => setPhase('exit'), 3200)
    const t2 = setTimeout(() => onComplete(), 4000)
    return () => [t0, t1, t2].forEach(clearTimeout)
  }, [onComplete])

  const visible = phase === 'visible'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(ellipse at 50% 55%, #16100a 0%, #0a0908 65%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        opacity: phase === 'exit' ? 0 : 1,
        transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: phase === 'exit' ? 'none' : 'all',
        userSelect: 'none',
      }}
    >
      {/* Letters */}
      <div style={{ display: 'flex', gap: 'clamp(2px, 0.8vw, 10px)', alignItems: 'baseline' }}>
        {LETTERS.map((letter, i) => (
          <span
            key={i}
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700,
              fontSize: 'clamp(80px, 15vw, 200px)',
              color: '#ede5d5',
              letterSpacing: '0.03em',
              lineHeight: 1,
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0px)' : 'translateY(60px)',
              filter: visible ? 'blur(0px)' : 'blur(16px)',
              transition: [
                `opacity 1s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.06}s`,
                `transform 1s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.06}s`,
                `filter 0.9s ease ${i * 0.06}s`,
              ].join(', '),
            }}
          >
            {letter}
          </span>
        ))}
      </div>

      {/* Underline that draws in */}
      <div
        style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent, #c9a86c, transparent)',
          width: visible ? 'clamp(120px, 22vw, 300px)' : '0px',
          marginTop: '10px',
          opacity: 0.7,
          transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1) 0.5s',
        }}
      />

      {/* Tagline */}
      <p
        style={{
          fontFamily: "'Playfair Display', serif",
          fontStyle: 'italic',
          fontSize: 'clamp(12px, 1.5vw, 16px)',
          color: '#c9a86c',
          letterSpacing: '0.2em',
          marginTop: '18px',
          opacity: visible ? 0.85 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(14px)',
          transition: 'opacity 1s ease 0.85s, transform 1s cubic-bezier(0.4,0,0.2,1) 0.85s',
        }}
      >
        your mind, in motion.
      </p>
    </div>
  )
}
