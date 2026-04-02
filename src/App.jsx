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

const VIEWS = { journal: Journal, todo: Todo, whiteboard: Whiteboard, about: About, 'about-me': AboutMe }

export default function App() {
  const [authChecked, setAuthChecked] = useState(false)
  const [user, setUser] = useState(null)
  const [introComplete, setIntroComplete] = useState(false)
  const [visible, setVisible] = useState(false)
  const [view, setView] = useState('journal')

  // Check session on mount, then listen for auth changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthChecked(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
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

      {/* Auth gate — shown after intro if not signed in */}
      {introComplete && !user && (
        <AuthModal onAuth={() => {}} />
      )}

      {introComplete && user && <PlatzIntro />}

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
          <Nav view={view} setView={setView} />

          <div
            style={{
              flex: 1,
              marginTop: '60px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <View key={view} />
          </div>
        </div>
      )}
    </>
  )
}
