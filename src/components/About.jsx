export default function About({ onReplayTutorial }) {
  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
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

        {/* Replay tutorial */}
        <div style={{ paddingTop: '32px', borderTop: '1px solid var(--border)', marginTop: '8px' }}>
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

      </div>

    </div>
  )
}
