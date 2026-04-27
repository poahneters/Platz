import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'

const QUESTIONS = [
  // E/I - higher score = more E
  { id: 'e1', dim: 'EI', text: 'I feel recharged after spending time with groups of people' },
  { id: 'e2', dim: 'EI', text: 'I prefer talking things through with someone rather than thinking alone' },
  { id: 'e3', dim: 'EI', text: 'I enjoy meeting new people and building new connections easily' },
  { id: 'e4', dim: 'EI', text: "I'm comfortable speaking up in groups or taking charge of conversations" },
  // S/N - higher score = more S
  { id: 's1', dim: 'SN', text: 'I focus on what is real and present rather than what could be' },
  { id: 's2', dim: 'SN', text: 'I trust hands-on experience more than theories or gut feelings' },
  { id: 's3', dim: 'SN', text: 'I prefer proven, practical solutions over innovative but untested ideas' },
  { id: 's4', dim: 'SN', text: 'I notice concrete details in my environment more than abstract patterns' },
  // T/F - higher score = more T
  { id: 't1', dim: 'TF', text: 'When making decisions, logic matters more to me than how people will feel' },
  { id: 't2', dim: 'TF', text: 'I stay objective and analytical even in emotionally charged situations' },
  { id: 't3', dim: 'TF', text: "I'd rather give someone a hard truth than protect their feelings" },
  { id: 't4', dim: 'TF', text: 'I analyze situations thoroughly before acting on intuition' },
  // J/P - higher score = more J
  { id: 'j1', dim: 'JP', text: 'I prefer having a clear plan rather than keeping my options open' },
  { id: 'j2', dim: 'JP', text: 'I feel most at ease when things are decided and settled' },
  { id: 'j3', dim: 'JP', text: 'I make to-do lists and find real satisfaction in checking things off' },
  { id: 'j4', dim: 'JP', text: 'Open-ended or unfinished situations make me restless' },
]

const DIM_LABELS = { EI: ['E', 'I'], SN: ['S', 'N'], TF: ['T', 'F'], JP: ['J', 'P'] }
const DIM_NAMES  = { EI: ['Extraversion', 'Introversion'], SN: ['Sensing', 'Intuition'], TF: ['Thinking', 'Feeling'], JP: ['Judging', 'Perceiving'] }

const TYPES = {
  INTJ: { name: 'The Waymaker',    desc: 'Strategic, independent, and driven. You see the world as a system to be optimized and have the vision to back it up.' },
  INTP: { name: 'The Seeker',      desc: 'Analytical, inventive, and endlessly curious. You love ideas for their own sake and question everything.' },
  ENTJ: { name: 'The Trailblazer', desc: 'Decisive, ambitious, and direct. You lead by seeing what needs to happen and making it so.' },
  ENTP: { name: 'The Spark',       desc: "Quick-witted, curious, and unafraid to challenge. You thrive on intellectual sparring and don't back down easily." },
  INFJ: { name: 'The Lantern',     desc: 'Principled, insightful, and purposeful. You want everything you do to mean something.' },
  INFP: { name: 'The Dreamer',     desc: 'Idealistic, empathetic, and fiercely authentic. You lead with values even when it costs you.' },
  ENFJ: { name: 'The Gardener',    desc: 'Charismatic, inspiring, and deeply invested in people. You naturally pull others forward.' },
  ENFP: { name: 'The Wildflower',  desc: 'Enthusiastic, creative, and full of energy. You connect ideas and people in ways nobody else sees.' },
  ISTJ: { name: 'The Foundation',  desc: 'Reliable, methodical, and thorough. You deliver on your word and expect the same.' },
  ISFJ: { name: 'The Shelter',     desc: 'Warm, conscientious, and deeply loyal. You protect what and who matters to you.' },
  ESTJ: { name: 'The Anchor',      desc: 'Organized, principled, and action-oriented. You cut through noise and get things done.' },
  ESFJ: { name: 'The Hearth',      desc: 'Caring, sociable, and committed to harmony. You make sure people feel seen.' },
  ISTP: { name: 'The Stone',       desc: 'Practical, observant, and coolly self-sufficient. You figure things out by doing them.' },
  ISFP: { name: 'The Wanderer',    desc: 'Spontaneous, sensitive, and quietly creative. You experience life before you analyze it.' },
  ESTP: { name: 'The Surge',       desc: 'Bold, direct, and action-first. You move fast, break things, and course-correct later.' },
  ESFP: { name: 'The Sunlight',    desc: 'Energetic, warm, and spontaneous. You make everything better just by showing up.' },
}

const STYLES = [
  { id: 'direct',       label: 'Direct',       desc: 'Call me out. Be blunt. I want honesty over comfort.' },
  { id: 'curious',      label: 'Curious',      desc: 'Ask me questions. Help me think deeper rather than giving answers.' },
  { id: 'motivational', label: 'Motivational', desc: 'Encourage me. Help me see what\'s possible and push forward.' },
  { id: 'analytical',   label: 'Analytical',   desc: 'Break it down logically. Give me frameworks and structure.' },
]

const LENGTHS = [
  { id: 'spark',    label: 'Spark',    desc: 'One sentence. The sharpest possible point.' },
  { id: 'brief',    label: 'Brief',    desc: '2–3 sentences. Cut to what matters.' },
  { id: 'short',    label: 'Short',    desc: 'A tight paragraph. Enough to chew on.' },
  { id: 'medium',   label: 'Medium',   desc: 'A few paragraphs. Balanced and clear.' },
  { id: 'detailed', label: 'Detailed', desc: 'Full thoughts. Don\'t leave anything out.' },
  { id: 'deep',     label: 'Deep',     desc: 'Go all in. I want the whole picture.' },
]

function calcMBTI(answers) {
  const dims = {
    EI: ['e1','e2','e3','e4'],
    SN: ['s1','s2','s3','s4'],
    TF: ['t1','t2','t3','t4'],
    JP: ['j1','j2','j3','j4'],
  }
  const percentages = {}
  let type = ''
  for (const [dim, keys] of Object.entries(dims)) {
    const sum = keys.reduce((acc, k) => acc + (answers[k] || 3), 0)
    const pct = Math.round(((sum - 4) / 16) * 100)
    percentages[dim] = pct
    type += pct >= 50 ? DIM_LABELS[dim][0] : DIM_LABELS[dim][1]
  }
  return { type, percentages }
}

const TABS = [
  { id: 'story',       label: 'Life Story' },
  { id: 'personality', label: 'Personality' },
  { id: 'style',       label: 'Platz Style' },
  { id: 'memory',      label: 'What Platz Knows' },
]

const MEMORY_SECTIONS = [
  { key: 'people',    label: 'People' },
  { key: 'goals',     label: 'Goals' },
  { key: 'struggles', label: 'Struggles' },
  { key: 'patterns',  label: 'Patterns' },
  { key: 'life',      label: 'Life' },
]

export default function AboutMe({ user, reflectOnEnter, onToggleReflectOnEnter, userName, onNameSave }) {
  const [data, setData] = useState({})
  const [tab, setTab] = useState('story')
  const [saveStatus, setSaveStatus] = useState('idle') // 'idle' | 'saving' | 'saved'
  const autosaveTimer = useRef(null)
  const initializedRef = useRef(false)
  const dataRef = useRef({})

  useEffect(() => { dataRef.current = data }, [data])

  useEffect(() => {
    supabase
      .from('about_me')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data: row }) => {
        if (row) {
          const quizAnswers = row.quiz_answers || {}
          setData({
            lifeStory: row.life_story || '',
            quizAnswers,
            mbtiType: row.personality_type || '',
            mbtiPercentages: Object.keys(quizAnswers).length ? calcMBTI(quizAnswers).percentages : {},
            platzStyle: row.communication_style || '',
            responseLength: row.response_length || 'short',
            customInstructions: row.custom_instructions || '',
            memory: row.memory || {},
          })
        }
        requestAnimationFrame(() => { initializedRef.current = true })
      })
  }, [user.id])

  useEffect(() => {
    if (tab !== 'memory') return
    supabase
      .from('about_me')
      .select('memory')
      .eq('user_id', user.id)
      .single()
      .then(({ data: row }) => {
        if (row?.memory) setData(prev => ({ ...prev, memory: row.memory }))
      })
  }, [tab, user.id])

  useEffect(() => {
    if (!initializedRef.current) return
    setSaveStatus('saving')
    clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(async () => {
      const d = dataRef.current
      await supabase.from('about_me').upsert({
        user_id: user.id,
        life_story: d.lifeStory || '',
        quiz_answers: d.quizAnswers || {},
        personality_type: d.mbtiType || '',
        communication_style: d.platzStyle || '',
        response_length: d.responseLength || 'short',
        custom_instructions: d.customInstructions || '',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }, 800)
    return () => clearTimeout(autosaveTimer.current)
  }, [data.lifeStory, data.quizAnswers, data.mbtiType, data.platzStyle, data.responseLength, data.customInstructions])

  function update(patch) {
    setData(prev => ({ ...prev, ...patch }))
  }

  function runQuiz() {
    const result = calcMBTI(data.quizAnswers || {})
    update({ mbtiType: result.type, mbtiPercentages: result.percentages })
  }

  const allAnswered = QUESTIONS.every(q => (data.quizAnswers || {})[q.id])
  const result = data.mbtiType ? TYPES[data.mbtiType] : null

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div className="fade-up" style={{ maxWidth: '700px', margin: '0 auto', padding: 'clamp(24px, 6vw, 48px) clamp(16px, 6vw, 48px) 72px' }}>

        <div style={{ marginBottom: '36px' }}>
          <div style={{ width: '36px', height: '2px', background: 'var(--gold)', borderRadius: '1px', marginBottom: '28px', opacity: 0.8 }} />
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: 'var(--text)' }}>
            About Me
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-dim)', marginTop: '8px' }}>
            Help Platz get to know you. The more context you give, the sharper the feedback.
          </p>
        </div>

        {/* Internal tabs + autosave indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '36px' }}>
        <div style={{ display: 'flex', gap: '2px', flex: 1, background: 'var(--surface)', borderRadius: '9px', padding: '3px' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1,
                padding: '7px 8px',
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '0.04em',
                borderRadius: '7px',
                background: tab === t.id ? 'var(--surface2)' : 'transparent',
                color: tab === t.id ? 'var(--text)' : 'var(--text-dim)',
                transition: 'all 0.2s ease',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        {saveStatus !== 'idle' && (
          <span style={{ fontSize: '11px', color: saveStatus === 'saved' ? 'var(--gold)' : 'var(--text-dim)', whiteSpace: 'nowrap', transition: 'color 0.3s' }}>
            {saveStatus === 'saving' ? 'Saving...' : 'Saved'}
          </span>
        )}
        </div>

        {/* ── Life Story ── */}
        {tab === 'story' && (
          <div className="fade-up">
            <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-dim)', display: 'block', marginBottom: '12px' }}>
              Your name
            </label>
            <input
              value={userName || ''}
              onChange={e => onNameSave(e.target.value.slice(0, 20))}
              placeholder="First name"
              style={{
                fontSize: '15px',
                padding: '10px 14px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text)',
                width: '220px',
                marginBottom: '32px',
                display: 'block',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(45,138,85,0.35)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-dim)', display: 'block', marginBottom: '12px' }}>
              Your story
            </label>
            <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '16px', lineHeight: 1.6 }}>
              Introduce yourself to Platz. Who are you? What drives you? What are you working toward? What do you struggle with? Write as much or as little as you like.
            </p>
            <textarea
              value={data.lifeStory || ''}
              onChange={e => update({ lifeStory: e.target.value })}
              placeholder="I'm someone who..."
              rows={12}
              style={{
                width: '100%',
                fontSize: '15px',
                lineHeight: 1.8,
                color: 'var(--text)',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '18px 20px',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(45,138,85,0.3)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
        )}

        {/* ── Personality Quiz ── */}
        {tab === 'personality' && (
          <div className="fade-up">

            {/* Result banner */}
            {result && (
              <div style={{
                padding: '20px 24px',
                background: 'var(--gold-dim)',
                border: '1px solid rgba(45,138,85,0.2)',
                borderRadius: '10px',
                marginBottom: '32px',
                display: 'flex',
                gap: '20px',
                alignItems: 'flex-start',
              }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '36px', fontWeight: 700, color: 'var(--gold)', lineHeight: 1, flexShrink: 0 }}>
                  {data.mbtiType}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>{result.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-mid)', lineHeight: 1.6 }}>{result.desc}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '14px' }}>
                    {Object.entries(data.mbtiPercentages || {}).map(([dim, pct]) => {
                      const [a, b] = DIM_LABELS[dim]
                      const [an, bn] = DIM_NAMES[dim]
                      const isFirst = pct >= 50
                      return (
                        <div key={dim} style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                          <span style={{ color: isFirst ? 'var(--gold)' : 'var(--text-mid)', fontWeight: 600 }}>{isFirst ? a : b}</span>
                          <span style={{ opacity: 0.5 }}> ({isFirst ? an : bn} {isFirst ? pct : 100 - pct}%)</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            <p style={{ fontSize: '13px', color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: '28px' }}>
              Rate each statement from <strong style={{ color: 'var(--text-mid)' }}>1</strong> (strongly disagree) to <strong style={{ color: 'var(--text-mid)' }}>5</strong> (strongly agree).
            </p>

            {['EI','SN','TF','JP'].map(dim => (
              <div key={dim} style={{ marginBottom: '32px' }}>
                <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '14px', opacity: 0.8 }}>
                  {DIM_NAMES[dim][0]} vs {DIM_NAMES[dim][1]}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {QUESTIONS.filter(q => q.dim === dim).map(q => (
                    <div key={q.id} style={{
                      padding: '14px 16px',
                      background: 'var(--surface)',
                      border: '1px solid var(--border2)',
                      borderRadius: '9px',
                    }}>
                      <p style={{ fontSize: '14px', color: 'var(--text-mid)', lineHeight: 1.5, marginBottom: '12px' }}>{q.text}</p>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {[1,2,3,4,5].map(n => {
                          const active = (data.quizAnswers || {})[q.id] === n
                          return (
                            <button
                              key={n}
                              onClick={() => update({ quizAnswers: { ...(data.quizAnswers || {}), [q.id]: n } })}
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '8px',
                                background: active ? 'var(--gold)' : 'var(--surface2)',
                                color: active ? '#0a0908' : 'var(--text-dim)',
                                fontSize: '13px',
                                fontWeight: active ? 700 : 400,
                                border: '1px solid transparent',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              {n}
                            </button>
                          )
                        })}
                        <span style={{ fontSize: '11px', color: 'var(--text-dim)', alignSelf: 'center', marginLeft: '4px' }}>
                          {[,'Disagree','','Neutral','','Agree'][(data.quizAnswers || {})[q.id]] || ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button
              onClick={runQuiz}
              disabled={!allAnswered}
              className="btn-gold"
              style={{
                padding: '11px 28px',
                background: allAnswered ? 'var(--gold)' : 'var(--surface)',
                color: allAnswered ? '#0a0908' : 'var(--text-dim)',
                border: allAnswered ? 'none' : '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                opacity: allAnswered ? 1 : 0.5,
                transition: 'all 0.2s',
              }}
            >
              {data.mbtiType ? 'Recalculate' : 'See my type'}
            </button>
          </div>
        )}

        {/* ── Platz Style ── */}
        {tab === 'style' && (
          <div className="fade-up">

            <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-dim)', display: 'block', marginBottom: '16px' }}>
              How should Platz talk to you?
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '36px' }}>
              {STYLES.map(s => {
                const active = data.platzStyle === s.id
                return (
                  <button
                    key={s.id}
                    onClick={() => update({ platzStyle: s.id })}
                    style={{
                      textAlign: 'left',
                      padding: '16px 18px',
                      borderRadius: '10px',
                      background: active ? 'var(--gold-dim)' : 'var(--surface)',
                      border: `1px solid ${active ? 'rgba(45,138,85,0.3)' : 'var(--border2)'}`,
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      gap: '14px',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: `2px solid ${active ? 'var(--gold)' : 'var(--text-dim)'}`,
                      background: active ? 'var(--gold)' : 'transparent',
                      flexShrink: 0,
                      marginTop: '1px',
                      transition: 'all 0.2s',
                    }} />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: active ? 'var(--text)' : 'var(--text-mid)', marginBottom: '3px' }}>{s.label}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-dim)', lineHeight: 1.5 }}>{s.desc}</div>
                    </div>
                  </button>
                )
              })}
            </div>

            <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-dim)', display: 'block', marginBottom: '16px' }}>
              Response length
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '36px' }}>
              {LENGTHS.map(l => {
                const active = (data.responseLength || 'short') === l.id
                return (
                  <button
                    key={l.id}
                    onClick={() => update({ responseLength: l.id })}
                    style={{
                      textAlign: 'left',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: active ? 'var(--gold-dim)' : 'var(--surface)',
                      border: `1px solid ${active ? 'rgba(45,138,85,0.3)' : 'var(--border2)'}`,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 600, color: active ? 'var(--text)' : 'var(--text-mid)', marginBottom: '3px' }}>{l.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: 1.4 }}>{l.desc}</div>
                  </button>
                )
              })}
            </div>

            <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-dim)', display: 'block', marginBottom: '16px' }}>
              Journal input
            </label>
            <button
              onClick={() => onToggleReflectOnEnter(!reflectOnEnter)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '16px 18px',
                borderRadius: '10px',
                background: reflectOnEnter ? 'var(--gold-dim)' : 'var(--surface)',
                border: `1px solid ${reflectOnEnter ? 'rgba(45,138,85,0.3)' : 'var(--border2)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                marginBottom: '36px',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${reflectOnEnter ? 'var(--gold)' : 'var(--text-dim)'}`,
                background: reflectOnEnter ? 'var(--gold)' : 'transparent',
                transition: 'all 0.2s',
              }} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-mid)', marginBottom: '3px' }}>Press Enter to reflect</div>
                <div style={{ fontSize: '13px', color: 'var(--text-dim)', lineHeight: 1.5 }}>Submit with Enter. Use Shift+Enter for a new line.</div>
              </div>
            </button>

            <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-dim)', display: 'block', marginBottom: '12px' }}>
              Anything else Platz should know?
            </label>
            <textarea
              value={data.customInstructions || ''}
              onChange={e => update({ customInstructions: e.target.value })}
              placeholder="e.g. I'm going through a career change. I tend to overthink small decisions. Push me to act more than plan..."
              rows={5}
              style={{
                width: '100%',
                fontSize: '14px',
                lineHeight: 1.8,
                color: 'var(--text)',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '16px 18px',
                marginBottom: '16px',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(45,138,85,0.3)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
        )}

        {/* ── What Platz Knows ── */}
        {tab === 'memory' && (
          <div className="fade-up">
            <p style={{ fontSize: '13px', color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: '32px' }}>
              Platz builds this automatically as you journal. It uses this to know you better over time. You don't need to manage it.
            </p>

            {!MEMORY_SECTIONS.some(s => data.memory?.[s.key]?.trim()) ? (
              <MemoryEmpty user={user} onBuilt={memory => setData(prev => ({ ...prev, memory }))} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {MEMORY_SECTIONS.filter(s => data.memory?.[s.key]?.trim()).map(section => (
                  <div
                    key={section.key}
                    style={{
                      padding: '20px 22px',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                    }}
                  >
                    <div style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: 'var(--gold)',
                      marginBottom: '10px',
                      opacity: 0.8,
                    }}>
                      {section.label}
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--text-mid)', lineHeight: 1.75 }}>
                      {data.memory[section.key]}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

function MemoryEmpty({ user, onBuilt }) {
  const [building, setBuilding] = useState(false)
  const [error, setError] = useState(null)

  async function build() {
    setBuilding(true)
    setError(null)
    try {
      const { data: entries } = await supabase
        .from('journal_entries')
        .select('messages')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(15)

      if (!entries?.length) {
        setError('No journal entries found. Write your first reflection first.')
        setBuilding(false)
        return
      }

      const formatted = entries.map(row => {
        const msgs = row.messages || []
        const userText = msgs.find(m => m.role === 'user')?.content || ''
        const platzResponse = msgs.find(m => m.role === 'platz')?.content || ''
        return { userText, platzResponse }
      }).filter(e => e.userText)

      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/build-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ entries: formatted }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to build memory')

      await supabase.from('about_me').upsert(
        { user_id: user.id, memory: result.memory },
        { onConflict: 'user_id' }
      )
      onBuilt(result.memory)
    } catch (e) {
      setError(e.message)
    }
    setBuilding(false)
  }

  return (
    <div style={{ padding: '40px 32px', textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
      <p style={{ fontSize: '14px', color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: '20px' }}>
        Nothing here yet. Platz will build this automatically after your next reflection.
      </p>
      <p style={{ fontSize: '13px', color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: '24px' }}>
        Already have journal entries? Build your profile from your history.
      </p>
      {error && (
        <p style={{ fontSize: '13px', color: '#c47a7a', marginBottom: '16px' }}>{error}</p>
      )}
      <button
        onClick={build}
        disabled={building}
        className="btn-gold"
        style={{
          padding: '10px 22px',
          background: 'var(--gold)',
          color: '#0f2d1a',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 600,
          opacity: building ? 0.6 : 1,
          transition: 'opacity 0.2s, filter 0.2s',
        }}
      >
        {building ? 'Building...' : 'Build from history'}
      </button>
    </div>
  )
}
