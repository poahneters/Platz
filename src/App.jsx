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

const VIEWS = { journal: Journal, todo: Todo, whiteboard: Whiteboard, about: About, 'about-me': AboutMe }

export default function App() {
  const [authChecked, setAuthChecked] = useState(false)
  const [user, setUser] = useState(null)
  const [introComplete, setIntroComplete] = useState(false)
  const [visible, setVisible] = useState(false)
  const [view, setView] = useState('journal')
  const [tutorialHighlight, setTutorialHighlight] = useState(null)
  const [tutorialStep, setTutorialStep] = useState(null)
  const [tutorialForced, setTutorialForced] = useState(false)
  const [emailConfirmed, setEmailConfirmed] = useState(false)
  const [reflectOnEnter, setReflectOnEnter] = useState(
    localStorage.getItem('platz_reflect_on_enter') === 'true'
  )
  const [userName, setUserName] = useState('')

  useEffect(() => {
    if (!user) { setUserName(''); return }
    supabase.from('about_me').select('name').eq('user_id', user.id).single()
      .then(({ data }) => { if (data?.name) setUserName(data.name) })
  }, [user])

  function handleNameSave(name) {
    setUserName(name)
    supabase.from('about_me').upsert({ user_id: user.id, name }, { onConflict: 'user_id' }).then()
  }

  // Check session on mount, then listen for auth changes
  useEffect(() => {
    const isEmailConfirmation = window.location.hash.includes('type=signup') || window.location.search.includes('type=signup')

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthChecked(true)
      if (session && isEmailConfirmation) {
        setEmailConfirmed(true)
        window.history.replaceState(null, '', window.location.pathname)
        setTimeout(() => setEmailConfirmed(false), 7000)
      }
    })

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

  useEffect(() => {
    if (introComplete) {
      const t = setTimeout(() => setVisible(true), 50)
      return () => clearTimeout(t)
    }
  }, [introComplete])

  // Don't render anything until we know auth state
  if (!authChecked) return null

  return (
    <>
      {(!introComplete || !visible) && <Intro onComplete={() => setIntroComplete(true)} />}

      {/* Auth gate - shown after intro if not signed in */}
      {introComplete && !user && (
        <AuthModal onAuth={() => {}} />
      )}

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

{introComplete && user && <Tutorial onStep={(tabId, stepIdx) => { setTutorialHighlight(tabId); setTutorialStep(stepIdx ?? null) }} forced={tutorialForced} onClose={() => { setTutorialForced(false); setView('about-me'); setTutorialStep(null) }} />}

      {user && introComplete && (
        <div
          style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.6s ease',
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
      )}
    </>
  )
}
