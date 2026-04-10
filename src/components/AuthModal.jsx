import { useState } from 'react'
import { supabase } from '../supabase'

const inputRowStyle = {
  display: 'flex',
  alignItems: 'center',
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  padding: '0 16px',
  height: '48px',
  transition: 'border-color 0.2s',
}

const inputStyle = {
  flex: 1,
  fontSize: '14px',
  background: 'none',
  outline: 'none',
  border: 'none',
}

export default function AuthModal({ onAuth }) {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [visible] = useState(true)

  function switchMode(next) {
    setMode(next)
    setError('')
    setMessage('')
    setPassword('')
    setConfirm('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')

    if (mode === 'signup' && password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    if (mode === 'signup' && password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    if (mode === 'forgot') {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      })
      setLoading(false)
      if (resetError) {
        setError(resetError.message)
      } else {
        setMessage('Check your email for a password reset link.')
      }
      return
    }

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

  const titles = {
    signin: 'Welcome back.',
    signup: 'Create your space.',
    forgot: 'Reset your password.',
  }

  const subtitles = {
    signin: 'Sign in to pick up where you left off.',
    signup: 'Your journal, goals, and space — saved across every device.',
    forgot: 'Enter your email and we\'ll send you a reset link.',
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
        {/* Gold accent bar */}
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
          {titles[mode]}
        </h2>

        <p style={{
          fontSize: '14px',
          color: 'var(--text-mid)',
          marginBottom: '32px',
          lineHeight: 1.6,
        }}>
          {subtitles[mode]}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={inputRowStyle}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          {mode !== 'forgot' && (
            <div style={inputRowStyle}>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
          )}

          {mode === 'signup' && (
            <div style={{
              ...inputRowStyle,
              borderColor: confirm && password !== confirm ? '#c0392b' : 'var(--border)',
            }}>
              <input
                type="password"
                placeholder="Confirm password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
          )}

          {error && (
            <p style={{ fontSize: '13px', color: '#c0392b', lineHeight: 1.5 }}>{error}</p>
          )}

          {message && (
            <p style={{ fontSize: '13px', color: 'var(--green, #4caf50)', lineHeight: 1.5 }}>{message}</p>
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
            {loading ? '...' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
          </button>
        </form>

        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          {mode === 'signin' && (
            <>
              <p style={{ fontSize: '13px', color: 'var(--text-mid)' }}>
                Don't have an account?{' '}
                <button
                  onClick={() => switchMode('signup')}
                  style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '13px', textDecoration: 'underline' }}
                >
                  Sign up
                </button>
              </p>
              <button
                onClick={() => switchMode('forgot')}
                style={{ fontSize: '13px', color: 'var(--text-mid)', textDecoration: 'underline' }}
              >
                Forgot password?
              </button>
            </>
          )}

          {mode === 'signup' && (
            <p style={{ fontSize: '13px', color: 'var(--text-mid)' }}>
              Already have an account?{' '}
              <button
                onClick={() => switchMode('signin')}
                style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '13px', textDecoration: 'underline' }}
              >
                Sign in
              </button>
            </p>
          )}

          {mode === 'forgot' && (
            <button
              onClick={() => switchMode('signin')}
              style={{ fontSize: '13px', color: 'var(--text-mid)', textDecoration: 'underline' }}
            >
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
