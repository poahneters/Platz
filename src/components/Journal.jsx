import { useState, useEffect, useRef } from 'react'

const STORAGE_KEY = 'platz_journal'

const SYSTEM_PROMPT = `You are a perceptive personal journaling companion. When someone shares their thoughts:
- Reflect back with genuine insight and warmth
- Identify patterns, themes, or tensions worth exploring
- Suggest 1–2 specific resources (articles, books, thinkers) with real URLs where possible
- Ask one meaningful follow-up question at the end
- Be direct, not generic. Write as if you know this person.
Keep your response under 280 words. Write in plain paragraphs — no bullet points or headers.`

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

let nextId = Date.now()

export default function Journal() {
  const [entries, setEntries] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] } catch { return [] }
  })
  const [text, setText] = useState('')
  const [selected, setSelected] = useState(null)
  const [reflecting, setReflecting] = useState(false)
  const [error, setError] = useState(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  }, [entries])

  async function reflect() {
    if (!text.trim() || reflecting) return
    setReflecting(true)
    setError(null)

    const entry = {
      id: (++nextId).toString(),
      createdAt: new Date().toISOString(),
      content: text.trim(),
      reflection: null,
    }

    try {
      const context = entries.slice(0, 4).map(e =>
        `[${formatDate(e.createdAt)}]: ${e.content.slice(0, 300)}`
      ).join('\n\n')

      const userMessage = context
        ? `Previous entries (for context):\n${context}\n\n---\n\nToday:\n${text.trim()}`
        : text.trim()

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userMessage }],
          model: 'claude-sonnet-4-6',
          max_tokens: 600,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      entry.reflection = data.content[0].text
    } catch (e) {
      setError(e.message)
    }

    setEntries(prev => [entry, ...prev])
    setSelected(entry.id)
    setText('')
    setReflecting(false)
  }

  function saveOnly() {
    if (!text.trim()) return
    const entry = {
      id: (++nextId).toString(),
      createdAt: new Date().toISOString(),
      content: text.trim(),
      reflection: null,
    }
    setEntries(prev => [entry, ...prev])
    setSelected(entry.id)
    setText('')
  }

  function deleteEntry(id, e) {
    e.stopPropagation()
    setEntries(prev => prev.filter(en => en.id !== id))
    if (selected === id) setSelected(null)
  }

  const selectedEntry = entries.find(e => e.id === selected)

  return (
    <div style={{ display: 'flex', height: '100%', gap: '1px', background: 'var(--border)' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: '230px',
        flexShrink: 0,
        background: 'var(--bg)',
        overflowY: 'auto',
        paddingTop: '20px',
      }}>
        <div style={{
          padding: '0 18px 14px',
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.14em',
          color: 'var(--text-dim)',
          textTransform: 'uppercase',
        }}>
          Entries
        </div>

        <button
          onClick={() => setSelected(null)}
          className="sidebar-btn"
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '10px 18px',
            borderLeft: !selected ? '2px solid var(--gold)' : '2px solid transparent',
            background: !selected ? 'var(--gold-dim)' : 'transparent',
            transition: 'all 0.2s ease',
          }}
        >
          <span style={{ fontSize: '13px', color: !selected ? 'var(--text)' : 'var(--text-mid)' }}>
            + New entry
          </span>
        </button>

        {entries.length === 0 && (
          <p style={{ padding: '16px 18px', fontSize: '12px', color: 'var(--text-dim)', lineHeight: 1.6 }}>
            Your entries will appear here.
          </p>
        )}

        {entries.map(e => (
          <button
            key={e.id}
            onClick={() => setSelected(e.id)}
            className="sidebar-btn"
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '12px 18px',
              borderLeft: selected === e.id ? '2px solid var(--gold)' : '2px solid transparent',
              background: selected === e.id ? 'var(--gold-dim)' : 'transparent',
              transition: 'all 0.2s ease',
              position: 'relative',
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--gold)', marginBottom: '4px', letterSpacing: '0.04em' }}>
              {formatDate(e.createdAt)}
            </div>
            <div style={{
              fontSize: '12px',
              color: 'var(--text-mid)',
              lineHeight: 1.5,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}>
              {e.content}
            </div>
            {e.reflection && (
              <span style={{ fontSize: '10px', color: 'var(--gold)', marginTop: '4px', display: 'block', opacity: 0.7 }}>
                ✦ reflected
              </span>
            )}
          </button>
        ))}
      </aside>

      {/* ── Main area ── */}
      <main style={{ flex: 1, background: 'var(--bg)', overflowY: 'auto' }}>
        {selectedEntry ? (
          /* View an entry */
          <div
            key={selectedEntry.id}
            className="fade-up"
            style={{ padding: '40px 48px', maxWidth: '740px', margin: '0 auto' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--gold)', letterSpacing: '0.06em', marginBottom: '2px' }}>
                  {formatDate(selectedEntry.createdAt)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                  {formatTime(selectedEntry.createdAt)}
                </div>
              </div>
              <button
                onClick={(e) => deleteEntry(selectedEntry.id, e)}
                className="btn-ghost"
                style={{
                  marginLeft: 'auto',
                  fontSize: '11px',
                  color: 'var(--text-dim)',
                  padding: '4px 10px',
                  border: '1px solid var(--border2)',
                  borderRadius: '5px',
                  transition: 'all 0.2s',
                }}
              >
                Delete
              </button>
            </div>

            <p style={{
              fontSize: '16px',
              lineHeight: 1.85,
              color: 'var(--text)',
              whiteSpace: 'pre-wrap',
              marginBottom: '40px',
            }}>
              {selectedEntry.content}
            </p>

            {selectedEntry.reflection && (
              <div style={{
                borderTop: '1px solid var(--border)',
                paddingTop: '28px',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px',
                }}>
                  <span style={{ color: 'var(--gold)', fontSize: '13px' }}>✦</span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--text-dim)',
                  }}>
                    Reflection
                  </span>
                </div>
                <p style={{
                  fontSize: '15px',
                  lineHeight: 1.85,
                  color: 'var(--text-mid)',
                  whiteSpace: 'pre-wrap',
                }}>
                  {selectedEntry.reflection}
                </p>
              </div>
            )}
          </div>

        ) : (
          /* New entry */
          <div
            key="new"
            className="fade-up"
            style={{
              padding: '40px 48px',
              maxWidth: '740px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '100%',
            }}
          >
            <div style={{
              fontSize: '12px',
              color: 'var(--text-dim)',
              letterSpacing: '0.06em',
              marginBottom: '28px',
            }}>
              {formatDate(new Date().toISOString())}
            </div>

            <textarea
              ref={textareaRef}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="What's on your mind..."
              autoFocus
              style={{
                flex: 1,
                minHeight: '320px',
                fontSize: '16px',
                lineHeight: 1.85,
                color: 'var(--text)',
                width: '100%',
                background: 'transparent',
              }}
            />

            {error && (
              <div style={{
                marginTop: '14px',
                padding: '10px 14px',
                background: 'rgba(140,90,90,0.08)',
                border: '1px solid rgba(140,90,90,0.2)',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#c47a7a',
              }}>
                {error}
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: '10px',
              marginTop: '28px',
              paddingTop: '20px',
              borderTop: '1px solid var(--border)',
            }}>
              <button
                onClick={reflect}
                disabled={reflecting || !text.trim()}
                className="btn-gold"
                style={{
                  padding: '10px 22px',
                  background: 'var(--gold)',
                  color: '#0a0908',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  opacity: reflecting || !text.trim() ? 0.35 : 1,
                  transition: 'opacity 0.2s, transform 0.15s, filter 0.2s',
                }}
              >
                {reflecting ? 'Reflecting…' : 'Reflect  ✦'}
              </button>

              <button
                onClick={saveOnly}
                disabled={!text.trim()}
                className="btn-ghost"
                style={{
                  padding: '10px 20px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-mid)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  opacity: !text.trim() ? 0.35 : 1,
                  transition: 'opacity 0.2s, color 0.2s, border-color 0.2s',
                }}
              >
                Save
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
