import { useEffect, useState } from 'react'

const SEEN_KEY = 'platz_tutorial_seen'

const STEP_TAB_IDS = [null, 'journal', 'todo', 'whiteboard', 'about-me']

const STEPS = [
  {
    label: 'Welcome',
    title: 'What is Platz?',
    body: `I built Platz as the natural next step in my college career. I have struggled with mental health throughout my 20s, and journaling has been a beautiful journey. This is a tool I use for self-improvement and reflection - and one you are welcome to use too.\n\nPlatz means Space or Place in German. Coming from a German family, this word feels like home - and I want you to know that you have the space to think and grow here.`,
  },
  {
    label: 'Journal',
    title: 'Think out loud.',
    body: `The journal is your main space. Write whatever is on your mind - a problem, a goal, something you can't stop thinking about.\n\nHit Reflect ✦ and Platz will respond. It won't flatter you. It'll push back, ask the right question, and point you somewhere useful. Hit Save if you just want to keep the thought without a response.\n\nYou can keep the conversation going inside any entry.`,
  },
  {
    label: 'To Do',
    title: 'Keep it simple.',
    body: `The to-do list is exactly what it sounds like. Add tasks, check them off, filter by what's left.`,
  },
  {
    label: 'Whiteboard',
    title: 'Put your goals somewhere.',
    body: `Create boards for different areas of your life - long-term goals, a project, anything you want to keep visible.\n\nWrite goals on the board, check them off as you go. The progress bar keeps track.`,
  },
  {
    label: 'About Me',
    title: 'Make Platz yours.',
    body: `The more Platz knows about you, the sharper it gets.\n\nSet your communication style - Direct, Curious, Motivational, or Analytical. Choose how long you want responses to be. Add anything else you want Platz to know about you.\n\nStart here before your first journal entry.`,
  },
]

export default function Tutorial({ onStep, forced = false, onClose }) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (forced || !localStorage.getItem(SEEN_KEY)) {
      setMounted(true)
      setStep(0)
      setTimeout(() => setVisible(true), 100)
      onStep?.(STEP_TAB_IDS[0], 0)
    }
  }, [forced])

  useEffect(() => {
    if (mounted) onStep?.(STEP_TAB_IDS[step], step)
  }, [step])

  function close() {
    setVisible(false)
    localStorage.setItem(SEEN_KEY, '1')
    onStep?.(null, null)
    setTimeout(() => { setMounted(false); onClose?.() }, 500)
  }

  function next() {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else close()
  }

  function back() {
    setStep(s => s - 1)
  }

  if (!mounted) return null

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20, 50, 30, 0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 75,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.5s ease',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: 'clamp(32px, 5vw, 52px)',
          maxWidth: '520px',
          width: '100%',
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Step dots */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '28px' }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                height: '3px',
                flex: 1,
                borderRadius: '2px',
                background: i <= step ? 'var(--gold)' : 'var(--border)',
                transition: 'background 0.3s ease',
              }}
            />
          ))}
        </div>

        {/* Label */}
        <div style={{
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--gold)',
          marginBottom: '10px',
          opacity: 0.8,
        }}>
          {current.label}
        </div>

        {/* Title */}
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(22px, 3.5vw, 28px)',
          fontWeight: 700,
          color: 'var(--text)',
          marginBottom: '20px',
          lineHeight: 1.2,
        }}>
          {current.title}
        </h2>

        {/* Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '36px' }}>
          {current.body.split('\n\n').map((para, i) => (
            <p key={i} style={{ fontSize: '15px', lineHeight: 1.8, color: 'var(--text-mid)' }}>
              {para}
            </p>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={close}
            style={{
              fontSize: '12px',
              color: 'var(--text-dim)',
              letterSpacing: '0.04em',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.target.style.color = 'var(--text-mid)'}
            onMouseLeave={e => e.target.style.color = 'var(--text-dim)'}
          >
            Skip
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            {step > 0 && (
              <button
                onClick={back}
                style={{
                  padding: '10px 20px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-mid)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
              >
                Back
              </button>
            )}
            <button
              onClick={next}
              style={{
                padding: '10px 24px',
                background: 'var(--gold)',
                color: '#0f2d1a',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '0.04em',
                transition: 'filter 0.2s',
              }}
              onMouseEnter={e => e.target.style.filter = 'brightness(1.08)'}
              onMouseLeave={e => e.target.style.filter = 'brightness(1)'}
            >
              {isLast ? "Let's go" : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
