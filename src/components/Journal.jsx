import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'

const BASE_SYSTEM_PROMPT = `You are Platz - a direct, perceptive thinking partner. Not a therapist. Not a cheerleader. A sharp friend who calls things out.

When someone shares their thoughts:
- Cut through the noise and name what's really going on
- Challenge assumptions or blind spots where you see them
- End with one pointed question that pushes them further
- Keep it under 250 words. No bullet lists. No headers. No em dashes. Talk like a person.

If someone asks something that has nothing to do with their thoughts, goals, feelings, or personal growth - like a math problem, coding question, research task, or anything better suited for a general AI - don't answer it. Instead, briefly acknowledge what they asked, tell them that's not what you're here for, and redirect them back to what's actually on their mind.`

const STYLE_INSTRUCTIONS = {
  direct:       'Be blunt and direct. Do not soften your feedback. Honesty over comfort.',
  curious:      'Lead with questions more than answers. Help them think deeper, not just farther.',
  motivational: 'Be encouraging. Help them see what is possible and what they are already doing right.',
  analytical:   'Be logical and structured. Break things down into frameworks and clear reasoning.',
}

const LENGTH_INSTRUCTIONS = {
  spark:    { instruction: 'Respond in one sentence only. Make it count.', maxTokens: 60 },
  brief:    { instruction: 'Respond in 2–3 sentences max.',                maxTokens: 100 },
  short:    { instruction: 'Keep your response under 80 words.',           maxTokens: 180 },
  medium:   { instruction: 'Keep your response under 160 words.',          maxTokens: 320 },
  detailed: { instruction: 'Keep your response under 280 words.',          maxTokens: 520 },
  deep:     { instruction: 'Keep your response under 420 words.',          maxTokens: 750 },
}

function buildSystemPrompt(about) {
  const parts = [BASE_SYSTEM_PROMPT]
  const lengthKey = about.response_length || 'short'
  parts.push(`\nLength: ${LENGTH_INSTRUCTIONS[lengthKey]?.instruction ?? LENGTH_INSTRUCTIONS.short.instruction}`)
  if (about.communication_style && STYLE_INSTRUCTIONS[about.communication_style]) {
    parts.push(`\nCommunication style: ${STYLE_INSTRUCTIONS[about.communication_style]}`)
  }
  if (about.personality_type) {
    parts.push(`\nUser's personality type: ${about.personality_type}. Use this as silent background context to inform how you engage — never mention or reference their type directly.`)
  }
  if (about.life_story?.trim()) {
    parts.push(`\nUser's background: ${about.life_story.slice(0, 500)}`)
  }
  if (about.custom_instructions?.trim()) {
    parts.push(`\nAdditional context: ${about.custom_instructions.slice(0, 300)}`)
  }
  return parts.join('\n')
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

// First ~180 chars, ending at a word boundary
function excerpt(text, max = 180) {
  if (text.length <= max) return text
  const cut = text.lastIndexOf(' ', max)
  return text.slice(0, cut > 0 ? cut : max) + '…'
}

export default function Journal({ user }) {
  const [entries, setEntries] = useState([])
  const [aboutMe, setAboutMe] = useState({})
  const [text, setText] = useState('')
  const [reply, setReply] = useState('')
  const [selected, setSelected] = useState(null)
  const [reflecting, setReflecting] = useState(false)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState({})
  const bottomRef = useRef(null)

  useEffect(() => {
    async function load() {
      const [entriesRes, aboutRes] = await Promise.all([
        supabase
          .from('journal_entries')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('about_me')
          .select('*')
          .eq('user_id', user.id)
          .single(),
      ])
      if (entriesRes.data) {
        setEntries(entriesRes.data.map(row => ({
          id: row.id,
          createdAt: row.created_at,
          thread: row.messages || [],
        })))
      }
      if (aboutRes.data) setAboutMe(aboutRes.data)
    }
    load()
  }, [user.id])

  // Scroll to bottom when thread updates
  useEffect(() => {
    if (selected) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries, selected])

  // Build API messages array from a thread
  function buildMessages(thread, newUserContent) {
    const context = entries
      .filter(e => e.id !== selected)
      .slice(0, 3)
      .map(e => `[${formatDate(e.createdAt)}]: ${e.thread[0]?.content?.slice(0, 250) || ''}`)
      .join('\n\n')

    const messages = []

    if (context && thread.length === 0) {
      messages.push({
        role: 'user',
        content: `Recent context:\n${context}\n\n---\n\n${newUserContent}`,
      })
    } else if (thread.length === 0) {
      messages.push({ role: 'user', content: newUserContent })
    } else {
      thread.forEach((msg, i) => {
        const role = msg.role === 'user' ? 'user' : 'assistant'
        const content = (i === 0 && context)
          ? `Recent context:\n${context}\n\n---\n\n${msg.content}`
          : msg.content
        messages.push({ role, content })
      })
      messages.push({ role: 'user', content: newUserContent })
    }

    return messages
  }

  async function sendMessage(isReply = false) {
    const content = isReply ? reply.trim() : text.trim()
    if (!content || reflecting) return

    setReflecting(true)
    setError(null)

    try {
      let targetEntry
      let updatedThread

      if (!isReply) {
        // New entry - insert to Supabase first to get real UUID
        const thread = [{ id: crypto.randomUUID(), role: 'user', content }]
        const { data: row, error: insertErr } = await supabase
          .from('journal_entries')
          .insert({ user_id: user.id, messages: thread, title: '' })
          .select()
          .single()
        if (insertErr) throw new Error(insertErr.message)

        targetEntry = { id: row.id, createdAt: row.created_at, thread }
        setEntries(prev => [targetEntry, ...prev])
        setSelected(row.id)
        setText('')
        updatedThread = thread
      } else {
        // Reply - add user message to existing thread
        const newUserMsg = { id: crypto.randomUUID(), role: 'user', content }
        const currentEntry = entries.find(e => e.id === selected)
        updatedThread = [...currentEntry.thread, newUserMsg]
        setEntries(prev => prev.map(e =>
          e.id === selected ? { ...e, thread: updatedThread } : e
        ))
        setReply('')
        targetEntry = currentEntry
      }

      const messages = buildMessages(
        isReply ? updatedThread.slice(0, -1) : [],
        content
      )

      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          system: buildSystemPrompt(aboutMe),
          messages,
          max_tokens: LENGTH_INSTRUCTIONS[aboutMe.response_length || 'short']?.maxTokens ?? 180,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')

      const platzMsg = { id: crypto.randomUUID(), role: 'platz', content: data.content[0].text }
      const finalThread = [...updatedThread, platzMsg]

      setEntries(prev => prev.map(e =>
        e.id === targetEntry.id ? { ...e, thread: finalThread } : e
      ))

      await supabase
        .from('journal_entries')
        .update({ messages: finalThread, updated_at: new Date().toISOString() })
        .eq('id', targetEntry.id)

    } catch (e) {
      setError(e.message)
    }

    setReflecting(false)
  }

  async function deleteEntry(id) {
    setEntries(prev => prev.filter(e => e.id !== id))
    if (selected === id) setSelected(null)
    await supabase.from('journal_entries').delete().eq('id', id)
  }

  function toggleExpanded(msgId) {
    setExpanded(prev => ({ ...prev, [msgId]: !prev[msgId] }))
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
              {e.thread[0]?.content || ''}
            </div>
            {e.thread.length > 1 && (
              <span style={{ fontSize: '10px', color: 'var(--gold)', marginTop: '4px', display: 'block', opacity: 0.6 }}>
                {Math.floor(e.thread.length / 2)} exchange{e.thread.length > 2 ? 's' : ''}
              </span>
            )}
          </button>
        ))}
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, background: 'var(--bg)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        {selectedEntry ? (
          /* ── Thread view ── */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '36px 48px 24px', maxWidth: '740px', width: '100%', margin: '0 auto', flex: 1 }}>

              {/* Entry header */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '32px' }}>
                <div style={{ fontSize: '12px', color: 'var(--gold)', letterSpacing: '0.06em' }}>
                  {formatDate(selectedEntry.createdAt)} · {formatTime(selectedEntry.createdAt)}
                </div>
                <button
                  onClick={() => deleteEntry(selectedEntry.id)}
                  style={{
                    marginLeft: 'auto',
                    fontSize: '11px',
                    color: 'var(--text-dim)',
                    padding: '3px 9px',
                    border: '1px solid var(--border2)',
                    borderRadius: '5px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.target.style.color = 'var(--text-mid)'; e.target.style.borderColor = 'var(--border)' }}
                  onMouseLeave={e => { e.target.style.color = 'var(--text-dim)'; e.target.style.borderColor = 'var(--border2)' }}
                >
                  Delete
                </button>
              </div>

              {/* Thread messages */}
              {selectedEntry.thread.map((msg, i) => {
                const isLastPlatz = msg.role === 'platz' && i === selectedEntry.thread.length - 1
                const isCollapsible = msg.role === 'platz' && !isLastPlatz
                const isExpanded = expanded[msg.id]
                const showFull = !isCollapsible || isExpanded

                return (
                  <div key={msg.id} style={{ marginBottom: '32px' }} className="fade-up">
                    {msg.role === 'user' ? (
                      <p style={{
                        fontSize: '16px',
                        lineHeight: 1.85,
                        color: 'var(--text)',
                        whiteSpace: 'pre-wrap',
                      }}>
                        {msg.content}
                      </p>
                    ) : (
                      <div style={{
                        borderLeft: '2px solid rgba(45,138,85,0.4)',
                        paddingLeft: '20px',
                        marginTop: '8px',
                      }}>
                        <div style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          letterSpacing: '0.14em',
                          color: 'var(--gold)',
                          textTransform: 'uppercase',
                          marginBottom: '10px',
                          opacity: 0.8,
                        }}>
                          Platz
                        </div>
                        <p style={{
                          fontSize: isCollapsible ? '14px' : '15px',
                          lineHeight: 1.85,
                          color: isCollapsible ? 'var(--text-dim)' : 'var(--text-mid)',
                          whiteSpace: 'pre-wrap',
                          transition: 'color 0.2s',
                        }}>
                          {showFull ? msg.content : excerpt(msg.content)}
                        </p>
                        {isCollapsible && (
                          <button
                            onClick={() => toggleExpanded(msg.id)}
                            style={{
                              marginTop: '6px',
                              fontSize: '11px',
                              color: 'var(--gold)',
                              letterSpacing: '0.04em',
                              opacity: 0.7,
                              transition: 'opacity 0.2s',
                            }}
                            onMouseEnter={e => e.target.style.opacity = '1'}
                            onMouseLeave={e => e.target.style.opacity = '0.7'}
                          >
                            {isExpanded ? 'Show less ↑' : 'Read more ↓'}
                          </button>
                        )}
                      </div>
                    )}

                    {msg.role === 'platz' && i < selectedEntry.thread.length - 1 && (
                      <div style={{ height: '1px', background: 'var(--border2)', margin: '24px 0 0' }} />
                    )}
                  </div>
                )
              })}

              {/* Loading state */}
              {reflecting && (
                <div style={{
                  borderLeft: '2px solid rgba(45,138,85,0.25)',
                  paddingLeft: '20px',
                  marginBottom: '32px',
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '10px', opacity: 0.5 }}>
                    Platz
                  </div>
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center', padding: '4px 0' }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{
                        width: '5px', height: '5px',
                        borderRadius: '50%',
                        background: 'var(--gold)',
                        opacity: 0.4,
                        animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                      }} />
                    ))}
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Reply input */}
            {!reflecting && (
              <div style={{
                borderTop: '1px solid var(--border)',
                padding: '16px 48px 24px',
                maxWidth: '740px',
                width: '100%',
                margin: '0 auto',
                background: 'var(--bg)',
              }}>
                {error && (
                  <div style={{ marginBottom: '12px', padding: '9px 14px', background: 'rgba(140,90,90,0.08)', border: '1px solid rgba(140,90,90,0.15)', borderRadius: '7px', fontSize: '13px', color: '#c47a7a' }}>
                    {error}
                  </div>
                )}
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  placeholder="Continue the thought..."
                  rows={2}
                  style={{
                    flex: 1,
                    fontSize: '14px',
                    lineHeight: 1.7,
                    color: 'var(--text)',
                    padding: '0 0 10px',
                    maxHeight: '120px',
                    overflowY: 'auto',
                    width: '100%',
                  }}
                />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={async () => {
                      if (!reply.trim()) return
                      const msg = { id: crypto.randomUUID(), role: 'user', content: reply.trim() }
                      const currentEntry = entries.find(e => e.id === selected)
                      const updatedThread = [...currentEntry.thread, msg]
                      setEntries(prev => prev.map(e =>
                        e.id === selected ? { ...e, thread: updatedThread } : e
                      ))
                      setReply('')
                      await supabase
                        .from('journal_entries')
                        .update({ messages: updatedThread, updated_at: new Date().toISOString() })
                        .eq('id', selected)
                    }}
                    disabled={!reply.trim()}
                    className="btn-ghost"
                    style={{
                      padding: '8px 16px',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-mid)',
                      borderRadius: '8px',
                      fontSize: '13px',
                      opacity: !reply.trim() ? 0.35 : 1,
                      transition: 'all 0.2s',
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => sendMessage(true)}
                    disabled={!reply.trim()}
                    className="btn-gold"
                    style={{
                      padding: '8px 18px',
                      background: reply.trim() ? 'var(--gold)' : 'var(--surface)',
                      color: reply.trim() ? '#0f2d1a' : 'var(--text-dim)',
                      border: reply.trim() ? 'none' : '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      transition: 'all 0.2s ease',
                      opacity: reply.trim() ? 1 : 0.35,
                    }}
                  >
                    Reflect  ✦
                  </button>
                </div>
              </div>
            )}
          </div>

        ) : (
          /* ── New entry ── */
          <div
            key="new"
            className="fade-up"
            style={{
              padding: '40px 48px',
              maxWidth: '740px',
              margin: '0 auto',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', letterSpacing: '0.06em', marginBottom: '28px' }}>
              {formatDate(new Date().toISOString())}
            </div>

            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.stopPropagation()
                }
              }}
              placeholder="What's on your mind..."
              autoFocus
              style={{
                flex: 1,
                minHeight: '300px',
                fontSize: '16px',
                lineHeight: 1.85,
                color: 'var(--text)',
                width: '100%',
                background: 'transparent',
              }}
            />

            {error && (
              <div style={{ marginTop: '14px', padding: '10px 14px', background: 'rgba(140,90,90,0.08)', border: '1px solid rgba(140,90,90,0.15)', borderRadius: '8px', fontSize: '13px', color: '#c47a7a' }}>
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
                onClick={() => sendMessage(false)}
                disabled={reflecting || !text.trim()}
                className="btn-gold"
                style={{
                  padding: '10px 22px',
                  background: 'var(--gold)',
                  color: '#0f2d1a',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  opacity: reflecting || !text.trim() ? 0.35 : 1,
                  transition: 'opacity 0.2s, transform 0.15s, filter 0.2s',
                }}
              >
                {reflecting ? 'Thinking…' : 'Reflect  ✦'}
              </button>

              <button
                onClick={async () => {
                  if (!text.trim()) return
                  const thread = [{ id: crypto.randomUUID(), role: 'user', content: text.trim() }]
                  const { data: row } = await supabase
                    .from('journal_entries')
                    .insert({ user_id: user.id, messages: thread, title: '' })
                    .select()
                    .single()
                  if (row) {
                    setEntries(prev => [{ id: row.id, createdAt: row.created_at, thread }, ...prev])
                    setSelected(row.id)
                    setText('')
                  }
                }}
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
