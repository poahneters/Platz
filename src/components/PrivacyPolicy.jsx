export default function PrivacyPolicy({ onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(15, 35, 20, 0.6)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        maxWidth: '680px', width: '100%',
        maxHeight: '85vh',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '24px 28px 20px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>
              Privacy Policy
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '3px' }}>Last updated: April 28, 2026</div>
          </div>
          <button onClick={onClose} style={{ fontSize: '20px', color: 'var(--text-dim)', lineHeight: 1, padding: '4px 8px' }}>×</button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '28px', lineHeight: 1.8, fontSize: '14px', color: 'var(--text-mid)' }}>

          <p>This Privacy Policy describes how Platz collects, uses, and shares your information when you use our Service. By using Platz, you agree to the practices described here.</p>

          <Section title="What We Collect">
            <ul>
              <li>Your email address and first name</li>
              <li>Journal entries, reflections, and responses you write</li>
              <li>Tasks and to-do items you create</li>
              <li>Usage data (IP address, browser type, pages visited, time spent)</li>
            </ul>
          </Section>

          <Section title="AI-Powered Features">
            <p>Platz uses Anthropic's Claude AI to provide journaling prompts and reflective responses. When you interact with AI features:</p>
            <ul>
              <li>The content of your journal entries and messages is sent to Anthropic's servers to generate a response.</li>
              <li>Anthropic does not use API data to train its models.</li>
              <li>Anthropic acts as a data processor on our behalf.</li>
              <li>We do not store your AI conversations beyond displaying them to you.</li>
            </ul>
            <p>For more information, see <a href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noreferrer" style={{ color: 'var(--gold)' }}>Anthropic's Privacy Policy</a>.</p>
          </Section>

          <Section title="How We Use Your Data">
            <ul>
              <li>To provide and maintain the Service</li>
              <li>To power AI journaling features via Anthropic's Claude API</li>
              <li>To manage your account and authenticate you</li>
              <li>To improve the Service over time</li>
            </ul>
          </Section>

          <Section title="Who We Share Your Data With">
            <ul>
              <li><strong style={{ color: 'var(--text)' }}>Supabase, Inc.</strong> — database and authentication</li>
              <li><strong style={{ color: 'var(--text)' }}>Anthropic, PBC</strong> — AI response generation (journal content only, transmitted solely to generate your requested response)</li>
              <li><strong style={{ color: 'var(--text)' }}>Vercel, Inc.</strong> — website hosting and delivery</li>
            </ul>
            <p>We do not sell your data. We do not share it with advertisers.</p>
          </Section>

          <Section title="Data Retention">
            <p>We retain your account data for the duration of your account plus up to 24 months after closure. You can request deletion at any time by contacting us.</p>
          </Section>

          <Section title="Your Rights">
            <p>You can access, correct, or delete your personal data at any time by visiting your account settings or contacting us. We will honor deletion requests within a reasonable time.</p>
          </Section>

          <Section title="Disclaimer and Limitations">
            <p><strong style={{ color: 'var(--text)' }}>Platz is not a mental health service.</strong> It is a personal journaling and productivity tool. Nothing in Platz — including AI-generated responses — constitutes professional mental health, medical, legal, or financial advice.</p>
            <p>You should not use Platz as a substitute for therapy, counseling, or any professional support. AI responses are generated automatically and are not reviewed by a professional. They may be incomplete, inaccurate, or inappropriate for your situation.</p>
            <p>If you are experiencing a mental health crisis or are in danger, please contact a qualified professional or a crisis resource immediately. In the US, you can call or text <strong style={{ color: 'var(--text)' }}>988</strong> (Suicide and Crisis Lifeline) at any time.</p>
            <p>By using Platz, you agree not to:</p>
            <ul>
              <li>Use the Service as a replacement for professional mental health treatment or therapy</li>
              <li>Rely on AI responses as professional recommendations of any kind</li>
              <li>Share AI-generated responses with others as professional advice</li>
            </ul>
          </Section>

          <Section title="Children's Privacy">
            <p>Platz is not directed at anyone under 16. We do not knowingly collect data from children under 16. If you believe a child has provided us with personal data, please contact us.</p>
          </Section>

          <Section title="Security">
            <p>Your data is stored securely via Supabase with row-level security, meaning only you can access your own data. All data is transmitted over HTTPS. No method of transmission over the internet is 100% secure, but we use commercially reasonable means to protect your information.</p>
          </Section>

          <Section title="Changes to This Policy">
            <p>We may update this policy from time to time. We will notify you of significant changes by posting the new policy on this page and updating the "Last updated" date.</p>
          </Section>

          <Section title="Contact">
            <p>Questions? Contact us at <a href="https://www.platzjournal.com" target="_blank" rel="noreferrer" style={{ color: 'var(--gold)' }}>platzjournal.com</a>.</p>
          </Section>

        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: '24px' }}>
      <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text)', marginBottom: '10px' }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {children}
      </div>
    </div>
  )
}
