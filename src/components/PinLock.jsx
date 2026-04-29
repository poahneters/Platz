import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const PIN_KEY = 'platz_pin'

async function hashPin(pin) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

const padBtnStyle = {
  width: '76px',
  height: '76px',
  borderRadius: '50%',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  fontSize: '22px',
  fontWeight: 500,
  color: 'var(--text)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'Inter, sans-serif',
  transition: 'background 0.12s',
  userSelect: 'none',
  touchAction: 'manipulation',
}

function PadButton({ onClick, style, children }) {
  return (
    <button
      onClick={onClick}
      style={style}
      onPointerDown={e => e.currentTarget.style.background = 'var(--surface2)'}
      onPointerUp={e => e.currentTarget.style.background = 'var(--surface)'}
      onPointerLeave={e => e.currentTarget.style.background = 'var(--surface)'}
      onPointerCancel={e => e.currentTarget.style.background = 'var(--surface)'}
    >
      {children}
    </button>
  )
}

function Pad({ onDigit, onDelete }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 76px)', gap: '14px' }}>
      {[1,2,3,4,5,6,7,8,9].map(n => (
        <PadButton key={n} onClick={() => onDigit(String(n))} style={padBtnStyle}>{n}</PadButton>
      ))}
      <div />
      <PadButton onClick={() => onDigit('0')} style={padBtnStyle}>0</PadButton>
      <PadButton onClick={onDelete} style={{ ...padBtnStyle, fontSize: '20px', color: 'var(--text-mid)' }}>⌫</PadButton>
    </div>
  )
}

function Dots({ count, shake }) {
  return (
    <div style={{
      display: 'flex', gap: '18px', marginBottom: '12px',
      animation: shake ? 'pinShake 0.45s ease' : 'none',
    }}>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} style={{
          width: '13px', height: '13px', borderRadius: '50%',
          background: i < count ? 'var(--gold)' : 'transparent',
          border: '2px solid ' + (i < count ? 'var(--gold)' : 'var(--border)'),
          transition: 'all 0.14s ease',
        }} />
      ))}
    </div>
  )
}

export default function PinLock({ onVerified }) {
  const stored = localStorage.getItem(PIN_KEY)
  // Migrate plaintext PINs (4 digits) — force re-set
  if (stored && stored.length !== 64) localStorage.removeItem(PIN_KEY)
  const pinExists = !!localStorage.getItem(PIN_KEY)
  const [mode, setMode] = useState(pinExists ? 'enter' : 'set')
  const [pin, setPin] = useState('')
  const [firstPin, setFirstPin] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)

  useEffect(() => {
    function onKey(e) {
      if (e.key >= '0' && e.key <= '9') handleDigit(e.key)
      else if (e.key === 'Backspace') handleDelete()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pin, shake, mode, firstPin])

  function fail(msg) {
    setError(msg)
    setShake(true)
    setTimeout(() => {
      setShake(false)
      setPin('')
      setError('')
    }, 550)
  }

  function handleDigit(d) {
    if (shake || pin.length >= 4) return
    const next = pin + d
    setPin(next)
    setError('')
    if (next.length === 4) {
      setTimeout(() => submit(next), 100)
    }
  }

  function handleDelete() {
    if (!shake) setPin(p => p.slice(0, -1))
  }

  async function submit(p) {
    if (mode === 'enter') {
      const hashed = await hashPin(p)
      if (hashed === localStorage.getItem(PIN_KEY)) {
        onVerified()
      } else {
        fail('Incorrect PIN')
      }
    } else if (mode === 'set') {
      setFirstPin(p)
      setMode('confirm')
      setPin('')
    } else if (mode === 'confirm') {
      if (p === firstPin) {
        localStorage.setItem(PIN_KEY, await hashPin(p))
        onVerified()
      } else {
        setFirstPin('')
        setMode('set')
        fail("PINs don't match, try again")
      }
    }
  }

  async function handleSignOut() {
    localStorage.removeItem(PIN_KEY)
    await supabase.auth.signOut()
  }

  async function handleForgotPin() {
    localStorage.removeItem(PIN_KEY)
    await supabase.auth.signOut()
  }

  const subtitles = {
    enter: 'Enter your PIN to continue',
    set: 'Create a 4-digit PIN',
    confirm: 'Confirm your PIN',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
          Platz
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-mid)' }}>
          {subtitles[mode]}
        </div>
      </div>

      <Dots count={pin.length} shake={shake} />

      <div style={{ height: '20px', marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {error && <span style={{ fontSize: '13px', color: '#c44040' }}>{error}</span>}
      </div>

      <Pad onDigit={handleDigit} onDelete={handleDelete} />

      <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
        {mode === 'enter' ? (
          <>
            <button onClick={handleForgotPin} style={{ fontSize: '12px', color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Forgot PIN? Sign out and reset
            </button>
          </>
        ) : (
          <button onClick={handleSignOut} style={{ fontSize: '12px', color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer' }}>
            Sign out
          </button>
        )}
      </div>

      <style>{`
        @keyframes pinShake {
          0%, 100% { transform: translateX(0) }
          18%  { transform: translateX(-9px) }
          36%  { transform: translateX(9px) }
          54%  { transform: translateX(-6px) }
          72%  { transform: translateX(5px) }
        }
      `}</style>
    </div>
  )
}
