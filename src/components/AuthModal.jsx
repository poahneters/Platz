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

function getEmailLink(email) {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return null
  if (domain === 'gmail.com') return 'https://mail.google.com'
  if (domain === 'yahoo.com' || domain === 'yahoo.co.uk') return 'https://mail.yahoo.com'
  if (['outlook.com', 'hotmail.com', 'live.com', 'msn.com'].includes(domain)) return 'https://outlook.live.com'
  if (domain === 'icloud.com' || domain === 'me.com') return 'https://www.icloud.com/mail'
  return `mailto:${email}`
}

export default function AuthModal({ onAuth }) {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup' | 'forgot' | 'verify'
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

    if (mode === 'signup') {
      if (password.length < 8) {
        setError('Password must be at least 8 characters.')
        return
      }
      if (!/[A-Z]/.test(password)) {
        setError('Password must include at least one capital letter.')
        return
      }
      if (!/[^A-Za-z0-9]/.test(password)) {
        setError('Password must include at least one special character.')
        return
      }
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

    if (mode === 'signup') {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      })
      setLoading(false)
      if (authError) {
        setError(authError.message)
      } else {
        setMode('verify')
      }
      return
    }

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (authError) {
      setError(authError.message)
      return
    }
    if (!data.user?.email_confirmed_at) {
      await supabase.auth.signOut()
      setMode('verify')
      return
    }
    onAuth()
  }

  // Verify email screen
  if (mode === 'verify') {
    const emailLink = getEmailLink(email)
    return (
      <div style={{
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
      }}>
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: 'clamp(32px, 5vw, 52px)',
          maxWidth: '440px',
          width: '100%',
          textAlign: 'center',
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1)',
        }}>
          {/* Email icon */}
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 28px',
            fontSize: '24px',
          }}>
            ✉️
          </div>

          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(22px, 3.5vw, 28px)',
            fontWeight: 700,
            color: 'var(--text)',
            marginBottom: '12px',
            lineHeight: 1.2,
          }}>
            Verify your email
          </h2>

          <p style={{
            fontSize: '14px',
            color: 'var(--text-mid)',
            lineHeight: 1.7,
            marginBottom: '32px',
          }}>
            We sent a confirmation link to <strong style={{ color: 'var(--text)' }}>{email}</strong>.<br />
            Click the link to activate your account.
          </p>

          {emailLink && (
            <a
              href={emailLink}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'block',
                padding: '13px',
                background: 'var(--gold)',
                color: '#fff',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textDecoration: 'none',
                marginBottom: '16px',
                transition: 'filter 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
              onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
            >
              Open email app
            </a>
          )}

          <button
            onClick={() => switchMode('signin')}
            style={{ fontSize: '13px', color: 'var(--text-mid)', textDecoration: 'underline' }}
          >
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  const titles = {
    signin: 'Welcome back.',
    signup: 'Create your space.',
    forgot: 'Reset your password.',
  }

  const subtitles = {
    signin: 'Sign in to pick up where you left off.',
    signup: 'Your journal, goals, and space — saved across every device.',
    forgot: "Enter your email and we'll send you a reset link.",
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
