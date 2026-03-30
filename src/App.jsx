import { useState, useEffect } from 'react'
import Intro from './components/Intro'
import Nav from './components/Nav'
import Journal from './components/Journal'
import Todo from './components/Todo'
import Whiteboard from './components/Whiteboard'
import About from './components/About'
import PlatzIntro from './components/PlatzIntro'

const VIEWS = { journal: Journal, todo: Todo, whiteboard: Whiteboard, about: About }

export default function App() {
  const [introComplete, setIntroComplete] = useState(false)
  const [visible, setVisible] = useState(false)
  const [view, setView] = useState('journal')

  useEffect(() => {
    if (introComplete) {
      // Tiny delay so React paints the shell before fading it in
      const t = setTimeout(() => setVisible(true), 30)
      return () => clearTimeout(t)
    }
  }, [introComplete])

  const View = VIEWS[view]

  return (
    <>
      {!introComplete && <Intro onComplete={() => setIntroComplete(true)} />}

      {introComplete && <PlatzIntro />}

      {introComplete && (
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
