import { useEffect, useState } from 'react'

const SEEN_KEY = 'platz_intro_seen'

export default function PlatzIntro() {
  const [visible, setVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(SEEN_KEY)) {
      setMounted(true)
      setTimeout(() => setVisible(true), 100)
    }
  }, [])

  function close() {
    setVisible(false)
    localStorage.setItem(SEEN_KEY, '1')
    setTimeout(() => setMounted(false), 500)
  }

  if (!mounted) return null

  return (
    <div
      onClick={close}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20, 50, 30, 0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: 'clamp(32px, 5vw, 56px)',
          maxWidth: '560px',
          width: '100%',
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Gold accent */}
        <div style={{
          width: '32px',
          height: '2px',
          background: 'var(--gold)',
          borderRadius: '1px',
          marginBottom: '28px',
          opacity: 0.8,
        }} />

        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(26px, 4vw, 34px)',
          fontWeight: 700,
          color: 'var(--text)',
          marginBottom: '24px',
          lineHeight: 1.2,
        }}>
          What is Platz?
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '15px', lineHeight: 1.85, color: 'var(--text-mid)' }}>
            I built Platz as the natural next step in my college career. I have struggled with mental health throughout my 20s, and journaling has been a beautiful journey. This is a tool I use for self-improvement and reflection - and one you are welcome to use too.
          </p>
          <p style={{ fontSize: '15px', lineHeight: 1.85, color: 'var(--text-mid)' }}>
            <em style={{ fontFamily: "'Playfair Display', serif", color: 'var(--gold)', fontSize: '16px' }}>Platz</em> means <em>Space</em> or <em>Place</em> in German. Coming from a German family, this word feels like home - and I want you to know that you have the space to think and grow here.
          </p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: '16px', color: 'var(--text)', lineHeight: 1.7 }}>
            Platz is a great friend.
          </p>
        </div>

        <button
          onClick={close}
          style={{
            marginTop: '36px',
            padding: '11px 28px',
            background: 'var(--gold)',
            color: '#0f2d1a',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.06em',
            transition: 'filter 0.2s',
          }}
          onMouseEnter={e => e.target.style.filter = 'brightness(1.1)'}
          onMouseLeave={e => e.target.style.filter = 'brightness(1)'}
        >
          Let's go
        </button>
      </div>
    </div>
  )
}
