export default function TermsOfService({ onClose }) {
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
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '24px 28px 20px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>
              Terms and Conditions
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '3px' }}>Last updated: April 28, 2026</div>
          </div>
          <button onClick={onClose} style={{ fontSize: '20px', color: 'var(--text-dim)', lineHeight: 1, padding: '4px 8px' }}>×</button>
        </div>

        <div style={{ overflowY: 'auto', padding: '28px', lineHeight: 1.8, fontSize: '14px', color: 'var(--text-mid)' }}>

          <p>These Terms and Conditions govern your use of Platz (platzjournal.com). By accessing or using the Service, you agree to be bound by these terms. If you do not agree, do not use the Service.</p>

          <p>Platz is operated by Platz, 340 E Foothill Blvd, San Luis Obispo, CA 93405, United States. Contact: <a href="mailto:hello@platzjournal.com" style={{ color: 'var(--gold)' }}>hello@platzjournal.com</a></p>

          <Section title="1. Our Services">
            <p>Platz is a personal journaling and productivity app that combines daily reflection, to-do lists, and AI-powered prompts to help users build self-awareness and stay organized. The Services are intended for users who are at least 18 years old.</p>
            <p>The Services are not tailored to comply with industry-specific regulations (HIPAA, FISMA, etc.). Do not use the Services in ways that would subject them to such laws.</p>
          </Section>

          <Section title="2. Intellectual Property">
            <p>We own all intellectual property rights in the Services, including source code, design, and content. You are granted a limited, non-exclusive, non-transferable license to access and use the Services for personal, non-commercial use only. You may not copy, reproduce, or exploit any part of the Services without our written permission.</p>
            <p>You retain full ownership of content you create (journal entries, tasks, etc.). By using the Services, you grant us the right to store and process your content solely to provide the Service to you.</p>
          </Section>

          <Section title="3. User Representations">
            <p>By using the Services, you represent that: all registration information you provide is true and accurate; you have the legal capacity to agree to these terms; you are at least 18 years old; you will not use the Services for any illegal or unauthorized purpose; and your use will not violate any applicable law.</p>
          </Section>

          <Section title="4. User Registration">
            <p>You must register to use the Services. Keep your password confidential — you are responsible for all activity under your account. We reserve the right to remove or change usernames we deem inappropriate.</p>
          </Section>

          <Section title="5. Purchases and Payment">
            <p>If Platz offers paid features, we will specify accepted payment methods at that time. You agree to provide accurate payment information and authorize us to charge your payment provider. We reserve the right to change pricing at any time.</p>
          </Section>

          <Section title="6. Prohibited Activities">
            <p>You agree not to:</p>
            <ul>
              <li>Use Platz as a substitute for professional mental health treatment</li>
              <li>Attempt to use the AI as a therapist or counselor</li>
              <li>Share AI-generated responses as professional recommendations to others</li>
              <li>Systematically retrieve data or scrape content from the Services</li>
              <li>Trick, defraud, or mislead us or other users</li>
              <li>Circumvent or interfere with security features of the Services</li>
              <li>Upload viruses, malware, or other harmful code</li>
              <li>Use automated scripts, bots, or scrapers to access the Services</li>
              <li>Attempt to impersonate another user or person</li>
              <li>Use the Services for any commercial purpose without our written consent</li>
              <li>Use the Services in a manner inconsistent with any applicable law</li>
            </ul>
          </Section>

          <Section title="7. Third-Party Services">
            <p>The Services rely on third-party providers including Supabase (database and authentication), Anthropic (AI responses), and Vercel (hosting). We are not responsible for the practices of these third parties. Links to third-party websites are provided for convenience only — we do not endorse or control them.</p>
          </Section>

          <Section title="8. Privacy Policy">
            <p>Your use of the Services is also governed by our Privacy Policy, which is incorporated into these Terms. By using the Services, you consent to the data practices described in the Privacy Policy, including the transmission of journal entries to Anthropic's Claude API to generate AI responses.</p>
          </Section>

          <Section title="9. Term and Termination">
            <p>These Terms remain in effect while you use the Services. We reserve the right to suspend or terminate your account at any time, for any reason, without notice. If your account is terminated, you may not register a new account without our permission.</p>
          </Section>

          <Section title="10. Disclaimer">
            <p>THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.</p>
          </Section>

          <Section title="11. Limitations of Liability">
            <p>TO THE FULLEST EXTENT PERMITTED BY LAW, OUR LIABILITY TO YOU FOR ANY CLAIM ARISING FROM YOUR USE OF THE SERVICES IS LIMITED TO THE LESSER OF: (A) THE AMOUNT YOU PAID TO US IN THE SIX (6) MONTHS PRIOR TO THE CLAIM, OR (B) $100.00 USD. WE ARE NOT LIABLE FOR INDIRECT, CONSEQUENTIAL, INCIDENTAL, OR PUNITIVE DAMAGES OF ANY KIND.</p>
          </Section>

          <Section title="12. Indemnification">
            <p>You agree to defend, indemnify, and hold Platz harmless from any claims, damages, or expenses arising from your use of the Services, your breach of these Terms, or your violation of any third party's rights.</p>
          </Section>

          <Section title="13. Governing Law">
            <p>These Terms are governed by the laws of the State of California, United States, without regard to conflict of law principles.</p>
          </Section>

          <Section title="14. Dispute Resolution">
            <p><strong style={{ color: 'var(--text)' }}>Informal Negotiations:</strong> Before initiating arbitration, the parties agree to attempt to resolve any dispute informally for at least thirty (30) days via written notice.</p>
            <p><strong style={{ color: 'var(--text)' }}>Binding Arbitration:</strong> If informal negotiations fail, disputes will be resolved by binding arbitration under the AAA Commercial Arbitration Rules. If arbitration fees are deemed excessive by the arbitrator, we will cover them. Arbitration will take place in Santa Barbara, California.</p>
            <p><strong style={{ color: 'var(--text)' }}>Time Limit:</strong> Any claim must be brought within one (1) year of the cause of action arising.</p>
            <p><strong style={{ color: 'var(--text)' }}>No Class Actions:</strong> All disputes must be brought individually. No class-action arbitration is permitted.</p>
          </Section>

          <Section title="15. AI-Generated Content and Mental Health Disclaimer">
            <p>Platz uses Anthropic's Claude AI to generate responses to user journal entries. These responses are automatically generated and do not constitute professional mental health, medical, legal, or financial advice.</p>
            <p>Platz is not a therapy service and should not be used as a substitute for professional mental health treatment. If you are experiencing a mental health crisis, please contact the <strong style={{ color: 'var(--text)' }}>988 Suicide and Crisis Lifeline</strong> or a qualified professional.</p>
            <p>By using Platz, you agree not to rely on AI-generated responses as professional advice of any kind.</p>
          </Section>

          <Section title="16. Miscellaneous">
            <p>These Terms constitute the entire agreement between you and Platz. If any provision is found unenforceable, the remaining provisions remain in full effect. Our failure to enforce any right does not constitute a waiver. We may assign our rights and obligations at any time.</p>
          </Section>

          <Section title="17. California Users">
            <p>California residents with unresolved complaints may contact the Complaint Assistance Unit of the Division of Consumer Services of the California Department of Consumer Affairs at 1625 North Market Blvd., Suite N 112, Sacramento, CA 95834, or by phone at (800) 952-5210.</p>
          </Section>

          <Section title="Contact Us">
            <p>
              Platz<br />
              340 E Foothill Blvd<br />
              San Luis Obispo, CA 93405<br />
              United States<br />
              <a href="mailto:hello@platzjournal.com" style={{ color: 'var(--gold)' }}>hello@platzjournal.com</a>
            </p>
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
