import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Intro from './components/Intro'
import Nav from './components/Nav'
import Journal from './components/Journal'
import Todo from './components/Todo'
import Whiteboard from './components/Whiteboard'
import About from './components/About'
import AboutMe from './components/AboutMe'
import PlatzIntro from './components/PlatzIntro'
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
  const [tutorialForced, setTutorialForced] = useState(false)
  const [emailConfirmed, setEmailConfirmed] = useState(false)

  // Check session on mount, then listen for auth changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthChecked(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === 'SIGNED_IN' && window.location.hash.includes('type=signup')) {
        setEmailConfirmed(true)
        window.history.replaceState(null, '', window.location.pathname)
        setTimeout(() => setEmailConfirmed(false), 4000)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (introComplete) {
      const t = setTimeout(() => setVisible(true), 30)
      return () => clearTimeout(t)
    }
  }, [introComplete])

  const View = VIEWS[view]

  // Don't render anything until we know auth state
  if (!authChecked) return null

  return (
    <>
      {!introComplete && <Intro onComplete={() => setIntroComplete(true)} />}

      {/* Auth gate - shown after intro if not signed in */}
      {introComplete && !user && (
        <AuthModal onAuth={() => {}} />
      )}

      {emailConfirmed && (
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--surface)',
          border: '1px solid var(--gold)',
          borderRadius: '10px',
          padding: '12px 24px',
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--gold)',
          zIndex: 999,
          boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
          animation: 'fadeSlideIn 0.4s ease',
        }}>
          Email confirmed!
        </div>
      )}

      {introComplete && user && <PlatzIntro />}
      {introComplete && user && <Tutorial onStep={setTutorialHighlight} forced={tutorialForced} onClose={() => { setTutorialForced(false); setView('about-me') }} />}

      {introComplete && user && (
        <div
          style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.6s ease',
          }}
        >
          <Nav view={view} setView={setView} highlight={tutorialHighlight} />

          <div
            style={{
              flex: 1,
              marginTop: '60px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <View key={view} user={user} onReplayTutorial={() => setTutorialForced(true)} />
          </div>
        </div>
      )}
    </>
  )
}
