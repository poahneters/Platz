import { useState } from 'react'
import { supabase } from '../supabase'
import TermsOfService from './TermsOfService'
import PrivacyPolicy from './PrivacyPolicy'

export default function About({ onReplayTutorial, user }) {
  const [feedback, setFeedback] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)

  async function sendFeedback() {
    if (!feedback.trim()) return
    setSending(true)
    await supabase.from('feedback').insert({ user_id: user?.id ?? null, message: feedback.trim() })
    setSent(true)
    setSending(false)
    setFeedback('')
    setTimeout(() => setSent(false), 4000)
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      {showTerms && <TermsOfService onClose={() => setShowTerms(false)} />}
      {showPrivacy && <PrivacyPolicy onClose={() => setShowPrivacy(false)} />}
      <div className="fade-up" style={{ maxWidth: '680px', margin: '0 auto', padding: '56px 48px' }}>

        {/* Gold bar */}
        <div style={{ width: '36px', height: '2px', background: 'var(--gold)', borderRadius: '1px', marginBottom: '36px', opacity: 0.8 }} />

        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(36px, 5vw, 52px)',
          fontWeight: 700,
          color: 'var(--text)',
          lineHeight: 1.15,
          marginBottom: '48px',
        }}>
          What is<br />
          <em style={{ color: 'var(--gold)' }}>Platz?</em>
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <p style={{ fontSize: '17px', lineHeight: 1.9, color: 'var(--text-mid)' }}>
            As an overthinker who is ambitious, loves journaling, and wants to get called out on his bullshit, creating Platz seemed like the natural next step in my college career. I built Platz to keep you thinking on your feet, to push you toward your goals, and to keep you innovative.
          </p>
          <p style={{ fontSize: '17px', lineHeight: 1.9, color: 'var(--text-mid)' }}>
            This is a place to think out loud and get honest feedback, the kind a sharp friend gives you.
          </p>
          <p style={{ fontSize: '17px', lineHeight: 1.9, color: 'var(--text-mid)' }}>
            I have struggled with mental health throughout my 20s, and journaling has been a beautiful journey that has helped in so many ways. I will leave Platz here as a tool I continue to use for self-improvement and reflection, and as a tool you are welcome to use.
          </p>

          <div style={{ height: '1px', background: 'var(--border)', margin: '8px 0' }} />

          <p style={{ fontSize: '17px', lineHeight: 1.9, color: 'var(--text-mid)' }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: '19px', color: 'var(--gold)' }}>Platz</span> means{' '}
            <span style={{ color: 'var(--text)' }}>Space</span> or{' '}
            <span style={{ color: 'var(--text)' }}>Place</span> in German, and coming from a German family, this word is comforting and makes me feel at home. I want you to know that you have the space to think and grow here.
          </p>

          <blockquote style={{
            fontFamily: "'Playfair Display', serif",
            fontStyle: 'italic',
            fontSize: '22px',
            color: 'var(--text)',
            lineHeight: 1.7,
            borderLeft: '2px solid rgba(45,138,85,0.45)',
            paddingLeft: '24px',
            margin: '8px 0',
          }}>
            Platz is a great friend.
          </blockquote>
        </div>

        {/* Features */}
        <div style={{ marginTop: '64px', paddingBottom: '56px' }}>
          <div style={{
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--text-dim)',
            marginBottom: '24px',
          }}>
            What Platz does
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              ['Journal', 'Write freely. Reflect with Platz when you want a second voice - or just save and move on. Your journal, your pace.'],
              ['To Do', 'Keep your daily tasks in one clean place.'],
              ['Whiteboard', 'Long-term goals, organized by board. Your digital whiteboard.'],
            ].map(([title, desc]) => (
              <div key={title} style={{
                display: 'flex',
                gap: '20px',
                padding: '18px 20px',
                background: 'var(--surface)',
                border: '1px solid var(--border2)',
                borderRadius: '10px',
              }}>
                <span style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '14px',
                  color: 'var(--gold)',
                  fontWeight: 700,
                  flexShrink: 0,
                  width: '88px',
                  paddingTop: '1px',
                }}>
                  {title}
                </span>
                <span style={{ fontSize: '14px', color: 'var(--text-mid)', lineHeight: 1.6 }}>
                  {desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback */}
        <div style={{ marginTop: '64px', paddingTop: '40px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '12px' }}>
            Share an idea
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '16px', lineHeight: 1.6 }}>
            Got a feature idea or something that could be better? I read everything.
          </p>
          {sent ? (
            <p style={{ fontSize: '14px', color: 'var(--gold)', fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}>
              Thanks — got it.
            </p>
          ) : (
            <>
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="What's on your mind..."
                rows={4}
                style={{
                  width: '100%',
                  fontSize: '14px',
                  lineHeight: 1.75,
                  color: 'var(--text)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginBottom: '12px',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(45,138,85,0.35)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <button
                onClick={sendFeedback}
                disabled={!feedback.trim() || sending}
                className="btn-gold"
                style={{
                  padding: '9px 22px',
                  background: feedback.trim() ? 'var(--gold)' : 'var(--surface)',
                  color: feedback.trim() ? '#0f2d1a' : 'var(--text-dim)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  opacity: feedback.trim() ? 1 : 0.4,
                  transition: 'all 0.2s',
                }}
              >
                {sending ? 'Sending…' : 'Send'}
              </button>
            </>
          )}
        </div>

        {/* Replay tutorial */}
        <div style={{ paddingTop: '32px', borderTop: '1px solid var(--border)', marginTop: '40px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '14px' }}>
            New here, or just want a refresher?
          </p>
          <button
            onClick={onReplayTutorial}
            className="btn-ghost"
            style={{
              padding: '10px 22px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '13px',
              color: 'var(--text-mid)',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
          >
            Replay tutorial
          </button>
        </div>

        {/* Legal */}
        <div style={{ paddingTop: '32px', borderTop: '1px solid var(--border)', marginTop: '40px', paddingBottom: '56px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '14px' }}>
            Legal
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowTerms(true)}
              style={{ fontSize: '13px', color: 'var(--text-mid)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Terms and Conditions
            </button>
            <button
              onClick={() => setShowPrivacy(true)}
              style={{ fontSize: '13px', color: 'var(--text-mid)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Privacy Policy
            </button>
          </div>
        </div>

      </div>

    </div>
  )
}
