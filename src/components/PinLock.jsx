import { useState } from 'react'
import { supabase } from '../supabase'

const PIN_KEY = 'platz_pin'

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
}

function Pad({ onDigit, onDelete }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 76px)', gap: '14px' }}>
      {[1,2,3,4,5,6,7,8,9].map(n => (
        <button key={n} onClick={() => onDigit(String(n))} style={padBtnStyle}
          onMouseDown={e => e.currentTarget.style.background = 'var(--surface2)'}
          onMouseUp={e => e.currentTarget.style.background = 'var(--surface)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
        >{n}</button>
      ))}
      <div />
      <button onClick={() => onDigit('0')} style={padBtnStyle}
        onMouseDown={e => e.currentTarget.style.background = 'var(--surface2)'}
        onMouseUp={e => e.currentTarget.style.background = 'var(--surface)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
      >0</button>
      <button onClick={onDelete} style={{ ...padBtnStyle, fontSize: '20px', color: 'var(--text-mid)' }}
        onMouseDown={e => e.currentTarget.style.background = 'var(--surface2)'}
        onMouseUp={e => e.currentTarget.style.background = 'var(--surface)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
      >⌫</button>
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
  const pinExists = !!localStorage.getItem(PIN_KEY)
  const [mode, setMode] = useState(pinExists ? 'enter' : 'set')
  const [pin, setPin] = useState('')
  const [firstPin, setFirstPin] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)

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

  function submit(p) {
    if (mode === 'enter') {
      if (p === localStorage.getItem(PIN_KEY)) {
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
        localStorage.setItem(PIN_KEY, p)
        onVerified()
      } else {
        setFirstPin('')
        setMode('set')
        fail("PINs don't match — try again")
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
