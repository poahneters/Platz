import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Intro from './components/Intro'
import Nav from './components/Nav'
import Journal from './components/Journal'
import Todo from './components/Todo'
import Whiteboard from './components/Whiteboard'
import About from './components/About'
import AboutMe from './components/AboutMe'
import AuthModal from './components/AuthModal'
import Tutorial from './components/Tutorial'
import ErrorBoundary from './components/ErrorBoundary'

const VIEWS = { journal: Journal, todo: Todo, whiteboard: Whiteboard, about: About, 'about-me': AboutMe }

export default function App() {
  const [user, setUser] = useState(null)
  const [introComplete, setIntroComplete] = useState(false)
  const [view, setView] = useState('journal')
  const [tutorialHighlight, setTutorialHighlight] = useState(null)
  const [tutorialStep, setTutorialStep] = useState(null)
  const [tutorialForced, setTutorialForced] = useState(false)
  const [emailConfirmed, setEmailConfirmed] = useState(false)
  const [reflectOnEnter, setReflectOnEnter] = useState(
    localStorage.getItem('platz_reflect_on_enter') === 'true'
  )
  const [userName, setUserName] = useState('')
  const [nameInput, setNameInput] = useState('')

  useEffect(() => {
    if (!user) { setUserName(''); return }
    supabase.from('about_me').select('name').eq('user_id', user.id).single()
      .then(({ data }) => { if (data?.name) setUserName(data.name) })
  }, [user])

  function handleNameSave(name) {
    setUserName(name)
    supabase.from('about_me').upsert({ user_id: user.id, name }, { onConflict: 'user_id' }).then()
  }

  useEffect(() => {
    const isEmailConfirmation = window.location.hash.includes('type=signup') || window.location.search.includes('type=signup')

    supabase.auth.getSession().then(result => {
      setUser(result?.data?.session?.user ?? null)
      if (result?.data?.session && isEmailConfirmation) {
        setEmailConfirmed(true)
        window.history.replaceState(null, '', window.location.pathname)
        setTimeout(() => setEmailConfirmed(false), 7000)
      }
    }).catch(() => {})

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === 'SIGNED_IN' && isEmailConfirmation) {
        setEmailConfirmed(true)
        window.history.replaceState(null, '', window.location.pathname)
        setTimeout(() => setEmailConfirmed(false), 7000)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <>
      {!introComplete && <Intro onComplete={() => setIntroComplete(true)} />}

      {introComplete && !user && <AuthModal onAuth={() => {}} />}

      {emailConfirmed && (
        <div style={{
          position: 'fixed',
          top: '28px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--surface)',
          border: '1px solid var(--gold)',
          borderRadius: '12px',
          padding: '14px 28px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--gold)',
          zIndex: 9999,
          boxShadow: '0 4px 32px rgba(0,0,0,0.3)',
          whiteSpace: 'nowrap',
          animation: 'fadeSlideIn 0.4s ease',
        }}>
          <span style={{ fontSize: '18px' }}>✓</span>
          Email confirmed! You can now sign in.
        </div>
      )}

      {introComplete && user && !userName && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(15, 35, 20, 0.55)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px',
        }}>
          <div style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: 'clamp(28px, 6vw, 52px)',
            maxWidth: '440px', width: '100%',
          }}>
            <div style={{ width: '28px', height: '2px', background: 'var(--gold)', borderRadius: '1px', marginBottom: '24px', opacity: 0.8 }} />
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2, marginBottom: '10px' }}>
              Before we start
            </p>
            <p style={{ fontSize: '15px', color: 'var(--text-mid)', lineHeight: 1.7, marginBottom: '28px' }}>
              What should Platz call you?
            </p>
            <input
              autoFocus
              value={nameInput}
              onChange={e => setNameInput(e.target.value.slice(0, 20))}
              onKeyDown={e => { if (e.key === 'Enter' && nameInput.trim()) handleNameSave(nameInput.trim()) }}
              placeholder="Your first name"
              style={{
                display: 'block', width: '100%',
                fontSize: '16px', padding: '12px 16px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                color: 'var(--text)',
                marginBottom: '14px',
                outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(45,138,85,0.4)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <button
              onClick={() => { if (nameInput.trim()) handleNameSave(nameInput.trim()) }}
              disabled={!nameInput.trim()}
              style={{
                width: '100%', padding: '12px',
                background: nameInput.trim() ? 'var(--gold)' : 'var(--surface)',
                color: nameInput.trim() ? '#0f2d1a' : 'var(--text-dim)',
                borderRadius: '10px', fontSize: '14px', fontWeight: 600,
                opacity: nameInput.trim() ? 1 : 0.4,
                transition: 'all 0.2s',
              }}
            >
              Let's go
            </button>
          </div>
        </div>
      )}

      {introComplete && user && <Tutorial onStep={(tabId, stepIdx) => { setTutorialHighlight(tabId); setTutorialStep(stepIdx ?? null) }} forced={tutorialForced} onClose={() => { setTutorialForced(false); setView('about-me'); setTutorialStep(null) }} />}

      {introComplete && user && (
        <ErrorBoundary>
        <div
          style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Nav view={view} setView={setView} highlight={tutorialHighlight} tutorialStep={tutorialStep} onAbout={() => setView('about')} userName={userName} />

          <div
            className="mobile-nav-offset"
            style={{
              flex: 1,
              marginTop: '60px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {Object.entries(VIEWS).map(([id, Comp]) => (
              <div
                key={id}
                style={{
                  display: view === id ? 'flex' : 'none',
                  flex: 1,
                  flexDirection: 'column',
                  height: '100%',
                  overflow: 'hidden',
                }}
              >
                <Comp
                  user={user}
                  onReplayTutorial={() => setTutorialForced(true)}
                  reflectOnEnter={reflectOnEnter}
                  onToggleReflectOnEnter={v => { setReflectOnEnter(v); localStorage.setItem('platz_reflect_on_enter', v) }}
                  userName={userName}
                  onNameSave={handleNameSave}
                />
              </div>
            ))}
          </div>
        </div>
        </ErrorBoundary>
      )}
    </>
  )
}
