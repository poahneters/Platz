import { useState } from 'react'
import { supabase } from '../supabase'

export default function AuthModal({ onAuth }) {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [visible] = useState(true)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: authError } = mode === 'signup'
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)

    if (authError) {
      setError(authError.message)
    } else {
      onAuth()
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20, 50, 30, 0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 90,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: 'clamp(32px, 5vw, 52px)',
          maxWidth: '440px',
          width: '100%',
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Green accent bar */}
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
          fontSize: 'clamp(22px, 3.5vw, 28px)',
          fontWeight: 700,
          color: 'var(--text)',
          marginBottom: '8px',
          lineHeight: 1.2,
        }}>
          {mode === 'signin' ? 'Welcome back.' : 'Create your space.'}
        </h2>

        <p style={{
          fontSize: '14px',
          color: 'var(--text-mid)',
          marginBottom: '32px',
          lineHeight: 1.6,
        }}>
          {mode === 'signin'
            ? 'Sign in to pick up where you left off.'
            : 'Your journal, goals, and space — saved across every device.'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="input-row" style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '0 16px',
            height: '48px',
            transition: 'border-color 0.2s',
          }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ flex: 1, fontSize: '14px', background: 'none', outline: 'none', border: 'none' }}
            />
          </div>

          <div className="input-row" style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '0 16px',
            height: '48px',
            transition: 'border-color 0.2s',
          }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ flex: 1, fontSize: '14px', background: 'none', outline: 'none', border: 'none' }}
            />
          </div>

          {error && (
            <p style={{ fontSize: '13px', color: '#c0392b', lineHeight: 1.5 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-gold"
            style={{
              marginTop: '8px',
              padding: '13px',
              background: 'var(--gold)',
              color: '#fff',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              transition: 'filter 0.2s, transform 0.2s',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? '...' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p style={{ marginTop: '24px', fontSize: '13px', color: 'var(--text-mid)', textAlign: 'center' }}>
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError('') }}
            style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '13px', textDecoration: 'underline' }}
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
