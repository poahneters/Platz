import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/* ─── storage helpers ─── */
const LS = {
  onboarding: 'platz-onboarding-complete',
  mbti: 'platz-mbti',
  entries: 'platz-entries',
  ctx: 'platz-ctx',
  tasks: 'platz-tasks',
  goals: 'platz-goals',
  bingo: 'platz-bingo',
}

function safeParse(json, fallback) {
  try {
    return JSON.parse(json)
  } catch {
    return fallback
  }
}

function loadStr(key, def = '') {
  try {
    return localStorage.getItem(key) ?? def
  } catch {
    return def
  }
}

function saveStr(key, val) {
  try {
    localStorage.setItem(key, val)
  } catch {
    /* ignore */
  }
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/* ─── MBTI quiz (16 questions, 4 per dimension) ─── */
const MBTI_QUESTIONS = [
  // E / I
  {
    prompt: 'When your energy is low, what tends to help most?',
    a: { t: 'Time with people you care about', v: 'E' },
    b: { t: 'Quiet time alone to reset', v: 'I' },
  },
  {
    prompt: 'In a new group, you usually…',
    a: { t: 'Jump in and get conversations going', v: 'E' },
    b: { t: 'Listen first and speak when it feels right', v: 'I' },
  },
  {
    prompt: 'You process big ideas best by…',
    a: { t: 'Talking them through out loud', v: 'E' },
    b: { t: 'Writing or thinking them through privately', v: 'I' },
  },
  {
    prompt: 'A free Saturday sounds more like…',
    a: { t: 'Plans with others', v: 'E' },
    b: { t: 'Open, unscheduled time for yourself', v: 'I' },
  },
  // S / N
  {
    prompt: 'You trust your gut most when it’s grounded in…',
    a: { t: 'Concrete details and what actually happened', v: 'S' },
    b: { t: 'Patterns, possibilities, and the bigger picture', v: 'N' },
  },
  {
    prompt: 'When learning something new, you prefer…',
    a: { t: 'Step-by-step examples you can apply', v: 'S' },
    b: { t: 'The underlying concept, then the details', v: 'N' },
  },
  {
    prompt: 'You’re more drawn to stories that…',
    a: { t: 'Feel realistic and specific', v: 'S' },
    b: { t: 'Open up new angles or meanings', v: 'N' },
  },
  {
    prompt: '“Good enough” usually means…',
    a: { t: 'It matches what we agreed on in practice', v: 'S' },
    b: { t: 'It still moves the idea forward', v: 'N' },
  },
  // T / F
  {
    prompt: 'A hard decision is easiest when you lead with…',
    a: { t: 'Principles, pros and cons, and outcomes', v: 'T' },
    b: { t: 'How people will feel and what it honors', v: 'F' },
  },
  {
    prompt: 'Feedback lands best when it’s…',
    a: { t: 'Direct, clear, and specific', v: 'T' },
    b: { t: 'Considerate and attuned to context', v: 'F' },
  },
  {
    prompt: 'Conflict feels more like…',
    a: { t: 'A problem to resolve fairly', v: 'T' },
    b: { t: 'Something that can strain connection', v: 'F' },
  },
  {
    prompt: 'You’d rather be remembered as…',
    a: { t: 'Someone who was honest and fair', v: 'T' },
    b: { t: 'Someone who was kind and present', v: 'F' },
  },
  // J / P
  {
    prompt: 'You feel most at ease when…',
    a: { t: 'There’s a plan you can rely on', v: 'J' },
    b: { t: 'There’s room to adapt as you go', v: 'P' },
  },
  {
    prompt: 'Deadlines usually make you feel…',
    a: { t: 'Focused—structure helps you finish', v: 'J' },
    b: { t: 'Energized late—or you prefer flexibility', v: 'P' },
  },
  {
    prompt: 'An open evening tends to become…',
    a: { t: 'Scheduled once you know what matters', v: 'J' },
    b: { t: 'Something you decide in the moment', v: 'P' },
  },
  {
    prompt: 'You experience “done” as…',
    a: { t: 'A clear checkbox and closure', v: 'J' },
    b: { t: 'A milestone you might revisit', v: 'P' },
  },
]

const MBTI_DESCRIPTIONS = {
  INTJ: 'You like a clear mental model and long horizons. You move quietly toward what makes sense—and you’re willing to rework the plan when reality shifts.',
  INTP: 'Ideas pull you in; you enjoy refining systems until they click. You’d rather be precise than loud, and you recharge in unhurried thinking time.',
  ENTJ: 'You’re comfortable steering toward outcomes and asking hard questions. You respect competence—and you show up when something needs to move.',
  ENTP: 'You think in forks and possibilities, and you like a lively debate. Rules are suggestions until a better frame appears.',
  INFJ: 'You notice undertones other people miss, and you care about meaning over noise. You lead with warmth, but your standards run deep.',
  INFP: 'You want your choices to feel honest. You’re gentle on the surface and stubborn about what matters underneath.',
  ENFJ: 'You read a room quickly and want people to feel seen. You’ll carry responsibility when it helps everyone rise.',
  ENFP: 'Curiosity and connection drive you; you light up when something feels possible. You need freedom to explore without losing heart.',
  ISTJ: 'You trust what’s proven, and you show up consistently. Calm preparation is your love language.',
  ISFJ: 'You remember details that matter to people, and you protect what’s good. Steady care is how you say you care.',
  ESTJ: 'You like clarity, follow-through, and fair process. You’d rather fix a problem than dance around it.',
  ESFJ: 'Harmony matters to you, and you work to keep things workable for everyone. You show love in practical attention.',
  ISTP: 'You learn by doing and fix what’s in front of you. You keep things simple until complexity earns its place.',
  ISFP: 'You move at your own pace toward what feels true. Quiet loyalty runs deeper than it looks.',
  ESTP: 'You’re at home in the moment and quick to act when timing matters. You’d rather try and adjust than over-plan.',
  ESFP: 'Life feels better when it’s shared and a little spontaneous. You bring warmth and presence wherever you go.',
}

function tallyToType(counts) {
  const e = (counts.E ?? 0) >= (counts.I ?? 0) ? 'E' : 'I'
  const s = (counts.S ?? 0) >= (counts.N ?? 0) ? 'S' : 'N'
  const t = (counts.T ?? 0) >= (counts.F ?? 0) ? 'T' : 'F'
  const j = (counts.J ?? 0) >= (counts.P ?? 0) ? 'J' : 'P'
  return `${e}${s}${t}${j}`
}

const BINGO_LINES = [
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24],
  [0, 5, 10, 15, 20],
  [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23],
  [4, 9, 14, 19, 24],
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
]

function initialBingoCells() {
  return Array.from({ length: 25 }, (_, i) =>
    i === 12
      ? { id: makeId(), text: 'Free', done: true, isFree: true }
      : { id: makeId(), text: '', done: false, isFree: false },
  )
}

function loadBingo() {
  const raw = loadStr(LS.bingo, '')
  if (!raw) return initialBingoCells()
  const parsed = safeParse(raw, null)
  if (!Array.isArray(parsed) || parsed.length !== 25) return initialBingoCells()
  return parsed.map((c, i) => ({
    id: c.id ?? makeId(),
    text: typeof c.text === 'string' ? c.text : i === 12 ? 'Free' : '',
    done: Boolean(c.done) || i === 12,
    isFree: i === 12,
  }))
}

function winningBingoLines(cells) {
  const wins = []
  for (const line of BINGO_LINES) {
    const ok = line.every((idx) => {
      const c = cells[idx]
      return c?.done && (c.isFree || (c.text && c.text.trim().length > 0))
    })
    if (ok) wins.push(line)
  }
  return wins
}

/* ─── Field Notes: single-file styles ─── */
const APP_CSS = `
*{box-sizing:border-box;margin:0;padding:0;}
.platz-root{
  font-family:'Lora',Georgia,serif;
  background:#d9d3bc;
  color:#2c2416;
  min-height:100vh;
  display:flex;
  flex-direction:column;
}
.platz-ui{font-family:'DM Sans',system-ui,sans-serif;}
.platz-topbar{
  flex-shrink:0;
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:1rem 1.25rem;
  background:#d9d3bc;
}
.platz-wordmark{
  font-family:'Lora',Georgia,serif;
  font-style:italic;
  font-size:1.35rem;
  color:#2c2416;
  letter-spacing:0.02em;
}
.platz-burger{
  width:26px;
  height:18px;
  display:flex;
  flex-direction:column;
  justify-content:space-between;
  background:none;
  border:none;
  padding:0;
  cursor:pointer;
}
.platz-burger span{display:block;height:2px;background:#2c2416;width:100%;}
.platz-body{flex:1;display:flex;flex-direction:column;min-height:0;position:relative;}
.platz-overlay{
  display:none;
  position:fixed;
  inset:0;
  background:rgba(44,36,22,0.45);
  z-index:200;
}
.platz-overlay.open{display:block;}
.platz-drawer{
  position:fixed;
  top:0;
  left:0;
  width:min(88vw,300px);
  height:100%;
  background:#2c2416;
  color:#ede8d0;
  z-index:210;
  transform:translateX(-100%);
  transition:transform 0.2s ease;
  display:flex;
  flex-direction:column;
  padding:1.25rem 1.25rem 2rem;
}
.platz-drawer.open{transform:translateX(0);}
.platz-drawer-h{
  display:flex;
  justify-content:flex-end;
  margin-bottom:2rem;
}
.platz-drawer-close{
  font-family:'DM Sans',system-ui,sans-serif;
  font-size:0.85rem;
  color:#ede8d0;
  background:none;
  border:none;
  cursor:pointer;
  text-decoration:underline;
  text-underline-offset:3px;
}
.platz-drawer-close:hover{color:#8b6914;}
.platz-nav{display:flex;flex-direction:column;gap:0.5rem;}
.platz-nav button{
  display:block;
  width:100%;
  text-align:left;
  padding:0.65rem 0;
  border:none;
  background:none;
  font-family:'Lora',Georgia,serif;
  font-style:italic;
  font-size:1.35rem;
  color:#ede8d0;
  cursor:pointer;
  line-height:1.3;
}
.platz-nav button:hover{color:#8b6914;}
.platz-nav button.active{color:#8b6914;}
.platz-scroll-main{
  flex:1;
  min-height:0;
  display:flex;
  flex-direction:column;
  overflow:hidden;
}
.platz-page{
  flex:1;
  min-height:0;
  overflow-y:auto;
  -webkit-overflow-scrolling:touch;
}
.platz-sheet{
  max-width:680px;
  margin:0 auto;
  min-height:100%;
  background:#ede8d0;
  padding:1.5rem 1.5rem 2.5rem;
}
.platz-sheet--ruled{
  background-color:#ede8d0;
  background-image:repeating-linear-gradient(
    transparent 0,
    transparent 31px,
    rgba(200,194,174,0.4) 31px,
    rgba(200,194,174,0.4) 32px
  );
}
.platz-section-label{
  font-family:'DM Sans',system-ui,sans-serif;
  font-size:0.72rem;
  font-weight:500;
  letter-spacing:0.14em;
  text-transform:uppercase;
  color:#7a6e5f;
  margin-bottom:1.25rem;
}
.platz-muted{color:#7a6e5f;font-size:14px;line-height:1.75;font-family:'Lora',Georgia,serif;}
.platz-inp{
  width:100%;
  border:none;
  border-bottom:1px solid rgba(200,194,174,0.7);
  padding:0.5rem 0;
  font-size:15px;
  font-family:'Lora',Georgia,serif;
  background:transparent;
  color:#2c2416;
  outline:none;
  border-radius:0;
}
.platz-inp::placeholder{color:#7a6e5f;opacity:0.85;}
textarea.platz-inp{
  min-height:100px;
  resize:vertical;
  line-height:1.75;
  padding-top:0.35rem;
}
.platz-btn{
  display:inline-block;
  padding:0.45rem 0;
  font-size:13px;
  font-family:'DM Sans',system-ui,sans-serif;
  cursor:pointer;
  border:none;
  background:none;
  color:#2c2416;
  text-decoration:underline;
  text-underline-offset:3px;
}
.platz-btn:hover{color:#8b6914;}
.platz-btn-primary{font-weight:500;color:#8b6914;}
.platz-btn-primary:hover{color:#2c2416;}
.platz-btn-ghost{color:#7a6e5f;}
.platz-mt{margin-top:1rem;}
.platz-mb{margin-bottom:1rem;}
/* Onboarding */
.onb-wrap{
  min-height:100vh;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:2rem;
  background:#d9d3bc;
}
.onb-card{
  max-width:440px;
  width:100%;
  text-align:center;
  padding:2.5rem 2rem;
  background:#ede8d0;
}
.onb-title{
  font-family:'Lora',Georgia,serif;
  font-style:italic;
  font-size:2rem;
  margin-bottom:12px;
  color:#2c2416;
}
.onb-sub{
  font-size:15px;
  color:#7a6e5f;
  line-height:1.65;
  margin-bottom:2rem;
  font-family:'Lora',Georgia,serif;
}
.onb-actions{display:flex;flex-direction:column;gap:0.65rem;}
.onb-quiz{min-height:100vh;display:flex;flex-direction:column;background:#d9d3bc;}
.onb-quiz-inner{
  flex:1;
  max-width:520px;
  margin:0 auto;
  padding:2rem 1.5rem;
  width:100%;
  display:flex;
  flex-direction:column;
  background:#ede8d0;
}
.onb-progress{
  font-size:11px;
  color:#8b6914;
  margin-bottom:1.25rem;
  font-family:'DM Sans',system-ui,sans-serif;
  letter-spacing:0.12em;
  text-transform:uppercase;
}
.onb-q{
  font-family:'Lora',Georgia,serif;
  font-size:18px;
  line-height:1.55;
  margin-bottom:1.5rem;
  color:#2c2416;
}
.onb-opts{display:flex;flex-direction:column;gap:10px;}
.onb-opt{
  display:block;
  width:100%;
  text-align:left;
  padding:14px 0;
  border:none;
  border-bottom:1px solid rgba(200,194,174,0.7);
  background:transparent;
  font-size:14px;
  font-family:'DM Sans',system-ui,sans-serif;
  color:#2c2416;
  cursor:pointer;
  line-height:1.5;
}
.onb-opt:hover{color:#8b6914;}
.onb-result{
  font-family:'Lora',Georgia,serif;
  font-size:2rem;
  font-weight:500;
  margin-bottom:1rem;
  color:#8b6914;
}
.onb-desc{font-size:15px;line-height:1.75;color:#5c4f3a;margin-bottom:1.5rem;font-family:'Lora',Georgia,serif;}
/* Journal */
.j-calendar{
  font-family:'DM Sans',system-ui,sans-serif;
  font-size:0.82rem;
  font-weight:500;
  letter-spacing:0.18em;
  text-transform:uppercase;
  color:#7a6e5f;
  margin-bottom:1.75rem;
}
.j-feed{display:flex;flex-direction:column;gap:3rem;padding-bottom:1.5rem;}
.j-exchange{display:flex;flex-direction:column;gap:0;}
.j-user{
  font-family:'Lora',Georgia,serif;
  font-size:17px;
  line-height:1.9;
  color:#2c2416;
  white-space:pre-wrap;
}
.j-rule{
  height:0;
  border:none;
  border-top:1px solid rgba(200,194,174,0.85);
  margin:1rem 0 1rem;
}
.j-ai{
  font-family:'Lora',Georgia,serif;
  font-size:15px;
  line-height:1.85;
  font-style:italic;
  color:#5c4f3a;
  white-space:pre-wrap;
}
.j-ai--hold{color:#7a6e5f;}
.j-save-wrap{margin-top:0.6rem;}
.j-save{
  font-size:12px;
  color:#7a6e5f;
  background:none;
  border:none;
  cursor:pointer;
  font-family:'DM Sans',system-ui,sans-serif;
  text-decoration:underline;
  text-underline-offset:3px;
  padding:0;
}
.j-save:hover{color:#8b6914;}
.j-empty{padding:2rem 0 1rem;padding-bottom:2.5rem;}
.j-empty-title{font-family:'Lora',Georgia,serif;font-size:1.15rem;margin-bottom:0.5rem;color:#7a6e5f;font-style:italic;}
.j-empty-sub{font-size:14px;color:#7a6e5f;line-height:1.75;font-family:'Lora',Georgia,serif;}
.j-input-zone{
  flex-shrink:0;
  padding-top:0.25rem;
  padding-bottom:0.5rem;
  margin-top:auto;
  border-top:1px solid transparent;
}
.j-ta{
  display:block;
  width:100%;
  resize:none;
  border:none;
  padding:0.15rem 0 0.35rem;
  font-size:17px;
  line-height:1.9;
  font-family:'Lora',Georgia,serif;
  min-height:calc(1.9em + 4px);
  max-height:280px;
  outline:none;
  background:transparent;
  color:#2c2416;
}
.j-ta::placeholder{color:#7a6e5f;opacity:0.75;}
.j-panel{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden;}
.j-panel .platz-sheet--ruled{flex:1;display:flex;flex-direction:column;min-height:0;}
.j-scroll{flex:1;overflow-y:auto;min-height:0;}
.j-saved{margin-top:2rem;padding-top:1.25rem;border-top:1px solid rgba(200,194,174,0.75);}
.j-saved-label{
  font-family:'DM Sans',system-ui,sans-serif;
  font-size:0.68rem;
  letter-spacing:0.14em;
  text-transform:uppercase;
  color:#8b6914;
  margin-bottom:1rem;
}
.j-saved-item{padding:0 0 1.25rem;margin-bottom:1.25rem;border-bottom:1px solid rgba(200,194,174,0.5);}
.j-saved-item:last-child{border-bottom:none;margin-bottom:0;}
.j-saved-h{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:8px;
  margin-bottom:0.5rem;
}
.j-saved-title{font-family:'Lora',Georgia,serif;font-size:1rem;color:#2c2416;}
.j-saved-date{font-size:11px;color:#7a6e5f;font-family:'DM Sans',system-ui,sans-serif;margin-top:0.2rem;}
.j-saved-body{font-size:14px;line-height:1.85;color:#5c4f3a;white-space:pre-wrap;font-family:'Lora',Georgia,serif;}
/* Tasks */
.t-task{display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid rgba(200,194,174,0.55);font-size:15px;font-family:'Lora',Georgia,serif;}
.t-task:last-child{border-bottom:none;}
.t-check{
  appearance:none;
  width:17px;
  height:17px;
  margin-top:4px;
  flex-shrink:0;
  border:1.5px solid #5c4f3a;
  border-radius:50%;
  background:transparent;
  cursor:pointer;
}
.t-check:checked{
  background:radial-gradient(circle, #8b6914 42%, transparent 44%);
  border-color:#8b6914;
}
.t-task span{flex:1;line-height:1.75;color:#2c2416;}
.t-task span.done{text-decoration:line-through;color:#7a6e5f;}
.t-del{
  font-size:11px;
  color:#7a6e5f;
  background:none;
  border:none;
  cursor:pointer;
  font-family:'DM Sans',system-ui,sans-serif;
  text-decoration:underline;
  text-underline-offset:2px;
  flex-shrink:0;
  padding-top:4px;
}
.t-del:hover{color:#8b6914;}
/* Goals */
.g-sticky{
  background:#f2ecda;
  padding:1.1rem 1.15rem;
  margin-bottom:1rem;
}
.g-sticky h3{
  font-family:'Lora',Georgia,serif;
  font-size:1.05rem;
  margin-bottom:0.5rem;
  color:#2c2416;
}
.g-sticky p{color:#5c4f3a;font-size:14px;line-height:1.75;white-space:pre-wrap;font-family:'Lora',Georgia,serif;}
.g-status{
  font-size:12px;
  margin-top:0.75rem;
  font-family:'DM Sans',system-ui,sans-serif;
  color:#7a6e5f;
}
.g-status select{
  margin-left:6px;
  padding:4px 0;
  border:none;
  border-bottom:1px solid rgba(200,194,174,0.8);
  background:transparent;
  font-size:12px;
  font-family:'DM Sans',system-ui,sans-serif;
  color:#2c2416;
  cursor:pointer;
  outline:none;
}
.g-remove{margin-top:0.75rem;}
/* Bingo */
.b-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:0;max-width:100%;border:1px solid rgba(44,36,22,0.35);}
.b-cell{
  border-right:1px solid rgba(44,36,22,0.28);
  border-bottom:1px solid rgba(44,36,22,0.28);
  padding:8px;
  min-height:76px;
  display:flex;
  flex-direction:column;
  background:transparent;
  font-size:11px;
}
.b-cell:nth-child(5n){border-right:none;}
.b-cell:nth-child(n+21){border-bottom:none;}
.b-cell.winning{background:rgba(139,105,20,0.08);}
.b-cell textarea{
  width:100%;
  border:none;
  resize:none;
  font-size:12px;
  font-family:'Lora',Georgia,serif;
  line-height:1.45;
  background:transparent;
  outline:none;
  flex:1;
  min-height:40px;
  color:#2c2416;
}
.b-cell textarea::placeholder{color:#7a6e5f;opacity:0.7;}
.b-cell.free{
  align-items:center;
  justify-content:center;
  text-align:center;
  font-family:'Lora',Georgia,serif;
  font-size:13px;
  font-style:italic;
  color:#7a6e5f;
}
.b-foot{font-size:13px;color:#7a6e5f;margin-top:1rem;font-family:'Lora',Georgia,serif;}
.b-toggle{
  margin-top:8px;
  font-size:11px;
  padding:0;
  border:none;
  background:none;
  font-family:'DM Sans',system-ui,sans-serif;
  color:#8b6914;
  cursor:pointer;
  text-decoration:underline;
  text-underline-offset:2px;
}
.b-toggle:disabled{opacity:0.35;cursor:not-allowed;text-decoration:none;color:#7a6e5f;}
/* Settings blocks */
.set-block{margin-bottom:1.75rem;padding-bottom:1.5rem;border-bottom:1px solid rgba(200,194,174,0.55);}
.set-block:last-child{border-bottom:none;}
.set-block h3{font-family:'Lora',Georgia,serif;font-size:1.05rem;margin-bottom:0.65rem;color:#2c2416;}
/* Modal */
.modal-bg{display:none;position:fixed;inset:0;background:rgba(44,36,22,0.4);align-items:center;justify-content:center;z-index:300;}
.modal-bg.open{display:flex;}
.modal-box{
  background:#ede8d0;
  border:1px solid rgba(200,194,174,0.9);
  padding:1.5rem;
  width:min(340px,92vw);
}
.modal-box h4{
  font-family:'Lora',Georgia,serif;
  font-size:1rem;
  margin-bottom:12px;
  color:#2c2416;
}
.modal-box input{
  width:100%;
  border:none;
  border-bottom:1px solid rgba(200,194,174,0.85);
  padding:8px 0;
  font-size:14px;
  margin-bottom:1rem;
  outline:none;
  background:transparent;
  color:#2c2416;
  font-family:'Lora',Georgia,serif;
}
.modal-actions{display:flex;gap:1rem;justify-content:flex-end;font-family:'DM Sans',system-ui,sans-serif;}
`

export default function App() {
  const [phase, setPhase] = useState(() =>
    loadStr(LS.onboarding, '') === 'true' ? 'app' : 'welcome',
  )
  const [quizStep, setQuizStep] = useState(0)
  const [quizCounts, setQuizCounts] = useState(() => ({}))
  const [quizResultType, setQuizResultType] = useState(null)
  const [quizFromSettings, setQuizFromSettings] = useState(false)

  const [section, setSection] = useState('journal')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mbti, setMbti] = useState(() => loadStr(LS.mbti, ''))
  const [ctx, setCtx] = useState(() => loadStr(LS.ctx, ''))
  const [entries, setEntries] = useState(() =>
    safeParse(loadStr(LS.entries, '[]'), []),
  )
  const [tasks, setTasks] = useState(() =>
    safeParse(loadStr(LS.tasks, '[]'), []),
  )
  const [goals, setGoals] = useState(() =>
    safeParse(loadStr(LS.goals, '[]'), []),
  )
  const [bingoCells, setBingoCells] = useState(loadBingo)

  const [messages, setMessages] = useState([])
  const historyRef = useRef([])
  const [inputValue, setInputValue] = useState('')
  const [sendDisabled, setSendDisabled] = useState(false)
  const [taskInput, setTaskInput] = useState('')
  const [goalTitle, setGoalTitle] = useState('')
  const [goalDesc, setGoalDesc] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [pendingSave, setPendingSave] = useState('')
  const [modalTitleInput, setModalTitleInput] = useState('')

  const msgsRef = useRef(null)
  const inpRef = useRef(null)
  const modalInputRef = useRef(null)

  const journalCalendarLine = useMemo(
    () =>
      new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    [],
  )

  const journalExchanges = useMemo(() => {
    const ex = []
    for (let i = 0; i < messages.length; i += 2) {
      ex.push({ user: messages[i], ai: messages[i + 1] })
    }
    return ex
  }, [messages])

  const ctxTrim = ctx.trim()
  const bingoWins = useMemo(() => winningBingoLines(bingoCells), [bingoCells])
  const winningSet = useMemo(() => {
    const s = new Set()
    for (const line of bingoWins) for (const i of line) s.add(i)
    return s
  }, [bingoWins])

  useEffect(() => {
    const el = inpRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 280)}px`
  }, [inputValue])

  useEffect(() => {
    if (!sidebarOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sidebarOpen])

  useEffect(() => {
    const el = msgsRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages])

  useEffect(() => {
    if (!modalOpen) return
    const t = setTimeout(() => modalInputRef.current?.focus(), 50)
    return () => clearTimeout(t)
  }, [modalOpen])

  const persistEntries = useCallback((next) => {
    saveStr(LS.entries, JSON.stringify(next))
  }, [])
  const persistTasks = useCallback((next) => {
    saveStr(LS.tasks, JSON.stringify(next))
  }, [])
  const persistGoals = useCallback((next) => {
    saveStr(LS.goals, JSON.stringify(next))
  }, [])
  const persistBingo = useCallback((next) => {
    saveStr(LS.bingo, JSON.stringify(next))
  }, [])

  const finishOnboarding = useCallback((type) => {
    saveStr(LS.onboarding, 'true')
    if (type) {
      saveStr(LS.mbti, type)
      setMbti(type)
    }
    setPhase('app')
    setQuizFromSettings(false)
    setQuizStep(0)
    setQuizCounts({})
    setQuizResultType(null)
  }, [])

  const skipOnboarding = () => {
    saveStr(LS.onboarding, 'true')
    setPhase('app')
  }

  const answerQuestion = (letter) => {
    const nextCounts = {
      ...quizCounts,
      [letter]: (quizCounts[letter] ?? 0) + 1,
    }
    setQuizCounts(nextCounts)
    if (quizStep >= MBTI_QUESTIONS.length - 1) {
      setQuizResultType(tallyToType(nextCounts))
      setPhase('quiz-result')
      return
    }
    setQuizStep((s) => s + 1)
  }

  const startQuiz = (fromSettings) => {
    setQuizFromSettings(!!fromSettings)
    setQuizCounts({})
    setQuizStep(0)
    setQuizResultType(null)
    setPhase('quiz')
  }

  const openSave = (bid) => {
    const m = messages.find((x) => x.id === bid)
    setPendingSave(m?.content ?? '')
    setModalTitleInput('')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setPendingSave('')
  }

  const confirmSave = () => {
    const t = modalTitleInput.trim() || 'untitled'
    setEntries((prev) => {
      const next = [
        { title: t, content: pendingSave, date: new Date().toISOString() },
        ...prev,
      ]
      persistEntries(next)
      return next
    })
    closeModal()
  }

  const deleteEntry = (i) => {
    setEntries((prev) => {
      const next = [...prev]
      next.splice(i, 1)
      persistEntries(next)
      return next
    })
  }

  const onCtxChange = (v) => {
    setCtx(v)
    saveStr(LS.ctx, v)
  }

  const journalSystemPrompt = useMemo(() => {
    const mbtiLine = mbti
      ? `The user's self-reported MBTI-style preference is ${mbti}. Let this gently inform tone and pacing—not as a label that limits them.\n\n`
      : ''
    const ctxBlock = ctxTrim
      ? `Context and goals they shared:\n${ctx}\n\n`
      : ''
    return `${mbtiLine}${ctxBlock}You are a reflective journal companion—not a chatbot. Help them think more clearly and kindly about what is on their mind.

Rules:
- Ask exactly one reflective follow-up question per response.
- Keep responses to 2–4 sentences.
- Be warm, direct, and genuinely curious.
- Do not give unsolicited advice; only offer guidance if they clearly ask for it.
- Never sound salesy, robotic, or like a generic AI assistant.`
  }, [mbti, ctx, ctxTrim])

  const sendJournal = async () => {
    const text = inputValue.trim()
    if (!text || sendDisabled) return
    setInputValue('')
    if (inpRef.current) inpRef.current.style.height = 'auto'

    const afterUser = [...historyRef.current, { role: 'user', content: text }]
    historyRef.current = afterUser

    const uid = makeId()
    const aid = makeId()
    setMessages((prev) => [
      ...prev,
      { id: uid, role: 'user', content: text },
      { id: aid, role: 'ai', content: 'thinking...', isThinking: true },
    ])
    setSendDisabled(true)

    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: journalSystemPrompt,
          messages: afterUser,
        }),
      })
      const data = await r.json()

      if (!r.ok) {
        const errText =
          data.error?.message ?? JSON.stringify(data)
        historyRef.current = afterUser.slice(0, -1)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aid
              ? { ...m, content: `Error: ${errText}`, isThinking: false }
              : m,
          ),
        )
      } else {
        const reply = (data.content || [])
          .filter((b) => b.type === 'text')
          .map((b) => b.text)
          .join('')
          .trim()
        if (reply) {
          historyRef.current = [
            ...afterUser,
            { role: 'assistant', content: reply },
          ]
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aid ? { ...m, content: reply, isThinking: false } : m,
            ),
          )
        } else {
          historyRef.current = afterUser.slice(0, -1)
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aid
                ? { ...m, content: 'no response — try again', isThinking: false }
                : m,
            ),
          )
        }
      }
    } catch (e) {
      historyRef.current = afterUser.slice(0, -1)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aid
            ? { ...m, content: `Error: ${e.message}`, isThinking: false }
            : m,
        ),
      )
    }
    setSendDisabled(false)
  }

  const onInpKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendJournal()
    }
  }

  const onModalKeyDown = (e) => {
    if (e.key === 'Enter') confirmSave()
    if (e.key === 'Escape') closeModal()
  }

  const addTask = () => {
    const t = taskInput.trim()
    if (!t) return
    setTasks((prev) => {
      const next = [...prev, { id: makeId(), text: t, done: false }]
      persistTasks(next)
      return next
    })
    setTaskInput('')
  }

  const toggleTask = (id) => {
    setTasks((prev) => {
      const next = prev.map((x) =>
        x.id === id ? { ...x, done: !x.done } : x,
      )
      persistTasks(next)
      return next
    })
  }

  const deleteTask = (id) => {
    setTasks((prev) => {
      const next = prev.filter((x) => x.id !== id)
      persistTasks(next)
      return next
    })
  }

  const addGoal = () => {
    const title = goalTitle.trim()
    if (!title) return
    setGoals((prev) => {
      const next = [
        ...prev,
        {
          id: makeId(),
          title,
          description: goalDesc.trim(),
          status: 'not_started',
        },
      ]
      persistGoals(next)
      return next
    })
    setGoalTitle('')
    setGoalDesc('')
  }

  const updateGoalStatus = (id, status) => {
    setGoals((prev) => {
      const next = prev.map((g) => (g.id === id ? { ...g, status } : g))
      persistGoals(next)
      return next
    })
  }

  const deleteGoal = (id) => {
    setGoals((prev) => {
      const next = prev.filter((g) => g.id !== id)
      persistGoals(next)
      return next
    })
  }

  const updateBingoCell = (idx, field, value) => {
    if (idx === 12) return
    setBingoCells((prev) => {
      const next = [...prev]
      const c = { ...next[idx], [field]: value }
      next[idx] = c
      persistBingo(next)
      return next
    })
  }

  const toggleBingoDone = (idx) => {
    if (idx === 12) return
    setBingoCells((prev) => {
      const next = [...prev]
      const c = next[idx]
      if (!c.isFree && !(c.text && c.text.trim())) return prev
      next[idx] = { ...c, done: !c.done }
      persistBingo(next)
      return next
    })
  }

  const clearAllData = () => {
    if (!window.confirm('Clear all Platz data from this browser? This cannot be undone.')) return
    Object.values(LS).forEach((k) => {
      try {
        localStorage.removeItem(k)
      } catch {
        /* ignore */
      }
    })
    setMbti('')
    setCtx('')
    setEntries([])
    setTasks([])
    setGoals([])
    setBingoCells(initialBingoCells())
    historyRef.current = []
    setMessages([])
    setPhase('welcome')
    setQuizStep(0)
    setQuizCounts({})
    setQuizResultType(null)
    setQuizFromSettings(false)
  }

  /* ─── Onboarding UI ─── */
  if (phase === 'welcome') {
    return (
      <>
        <style>{APP_CSS}</style>
        <div className="onb-wrap platz-root">
          <div className="onb-card">
            <h1 className="onb-title">Platz</h1>
            <p className="onb-sub">
              your private space to think, reflect, and move forward
            </p>
            <div className="onb-actions">
              <button
                type="button"
                className="onb-opt"
                onClick={() => startQuiz(false)}
              >
                Take the personality quiz
              </button>
              <button
                type="button"
                className="onb-opt"
                onClick={skipOnboarding}
              >
                Skip for now
              </button>
            </div>
            <p className="platz-muted platz-mt" style={{ fontSize: 12 }}>
              You can take the quiz anytime from Settings.
            </p>
          </div>
        </div>
      </>
    )
  }

  if (phase === 'quiz') {
    const q = MBTI_QUESTIONS[quizStep]
    return (
      <>
        <style>{APP_CSS}</style>
        <div className="onb-quiz platz-root">
          <div className="onb-quiz-inner">
            <p className="onb-progress">
              {quizStep + 1} / {MBTI_QUESTIONS.length}
            </p>
            <p className="onb-q">{q.prompt}</p>
            <div className="onb-opts">
              <button
                type="button"
                className="onb-opt"
                onClick={() => answerQuestion(q.a.v)}
              >
                {q.a.t}
              </button>
              <button
                type="button"
                className="onb-opt"
                onClick={() => answerQuestion(q.b.v)}
              >
                {q.b.t}
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (phase === 'quiz-result' && quizResultType) {
    const desc =
      MBTI_DESCRIPTIONS[quizResultType] ??
      'You’ve noted a preference snapshot—use it as a compass, not a cage.'
    return (
      <>
        <style>{APP_CSS}</style>
        <div className="onb-wrap platz-root">
          <div className="onb-card">
            <div className="onb-result">{quizResultType}</div>
            <p className="onb-desc">{desc}</p>
            <button
              type="button"
              className="onb-opt"
              style={{ width: '100%' }}
              onClick={() => {
                if (quizFromSettings) {
                  saveStr(LS.mbti, quizResultType)
                  setMbti(quizResultType)
                  setPhase('app')
                  setQuizFromSettings(false)
                } else {
                  finishOnboarding(quizResultType)
                }
              }}
            >
              Continue
            </button>
          </div>
        </div>
      </>
    )
  }

  /* ─── Main app ─── */
  const navItems = [
    ['journal', 'Journal'],
    ['tasks', 'Tasks'],
    ['goals', 'Goals'],
    ['bingo', 'Bingo'],
    ['settings', 'Settings'],
  ]

  return (
    <>
      <style>{APP_CSS}</style>
      <div className="platz-root platz-ui">
        <header className="platz-topbar">
          <span className="platz-wordmark">Platz</span>
          <button
            type="button"
            className="platz-burger"
            aria-expanded={sidebarOpen}
            aria-label="Open menu"
            onClick={() => setSidebarOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>
        </header>

        <div className="platz-body">
          <div
            className={sidebarOpen ? 'platz-overlay open' : 'platz-overlay'}
            role="presentation"
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            className={sidebarOpen ? 'platz-drawer open' : 'platz-drawer'}
            aria-hidden={!sidebarOpen}
          >
            <div className="platz-drawer-h">
              <button
                type="button"
                className="platz-drawer-close"
                onClick={() => setSidebarOpen(false)}
              >
                Close
              </button>
            </div>
            <nav className="platz-nav">
              {navItems.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={section === id ? 'active' : ''}
                  onClick={() => {
                    setSection(id)
                    setSidebarOpen(false)
                  }}
                >
                  {label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="platz-scroll-main">
            {section === 'journal' && (
              <div className="j-panel">
                <div className="platz-sheet platz-sheet--ruled">
                  <p className="j-calendar">{journalCalendarLine}</p>
                  <div className="j-scroll" ref={msgsRef}>
                    <div className="j-feed">
                      {messages.length === 0 ? (
                        <div className="j-empty">
                          <div className="j-empty-title">
                            What&apos;s on your mind?
                          </div>
                          <div className="j-empty-sub">
                            Write anything — no one&apos;s watching.
                          </div>
                        </div>
                      ) : (
                        journalExchanges.map(({ user: u, ai: a }) =>
                          u ? (
                            <div key={u.id} className="j-exchange">
                              <div className="j-user" id={u.id}>
                                {u.content}
                              </div>
                              {a ? (
                                <>
                                  <hr className="j-rule" />
                                  <div
                                    className={`j-ai${a.isThinking ? ' j-ai--hold' : ''}`}
                                    id={a.id}
                                  >
                                    {a.content}
                                  </div>
                                  {!a.isThinking ? (
                                    <div className="j-save-wrap">
                                      <button
                                        type="button"
                                        className="j-save"
                                        onClick={() => openSave(a.id)}
                                      >
                                        save
                                      </button>
                                    </div>
                                  ) : null}
                                </>
                              ) : null}
                            </div>
                          ) : null,
                        )
                      )}
                    </div>
                    {entries.length > 0 ? (
                      <div className="j-saved">
                        <div className="j-saved-label">Saved</div>
                        {entries.map((e, i) => (
                          <div
                            key={`${e.date}-${i}`}
                            className="j-saved-item"
                          >
                            <div className="j-saved-h">
                              <div>
                                <div className="j-saved-title">{e.title}</div>
                                <div className="j-saved-date">
                                  {new Date(e.date).toLocaleDateString(
                                    'en-US',
                                    {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    },
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                className="t-del"
                                onClick={() => deleteEntry(i)}
                              >
                                delete
                              </button>
                            </div>
                            <div className="j-saved-body">{e.content}</div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="j-input-zone">
                    <textarea
                      ref={inpRef}
                      className="j-ta"
                      placeholder="Begin writing..."
                      rows={1}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={onInpKeyDown}
                    />
                  </div>
                </div>
              </div>
            )}

            {section === 'tasks' && (
              <div className="platz-page">
              <div className="platz-sheet">
                <p className="platz-section-label">Tasks</p>
                <input
                  className="platz-inp platz-mb"
                  placeholder="Add a task — press Enter"
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTask()
                    }
                  }}
                />
                {!tasks.length ? (
                  <p className="platz-muted">No tasks yet.</p>
                ) : (
                  tasks.map((t) => (
                    <div key={t.id} className="t-task">
                      <input
                        type="checkbox"
                        className="t-check"
                        checked={t.done}
                        onChange={() => toggleTask(t.id)}
                      />
                      <span className={t.done ? 'done' : ''}>{t.text}</span>
                      <button
                        type="button"
                        className="t-del"
                        onClick={() => deleteTask(t.id)}
                      >
                        delete
                      </button>
                    </div>
                  ))
                )}
              </div>
              </div>
            )}

            {section === 'goals' && (
              <div className="platz-page">
              <div className="platz-sheet">
                <p className="platz-section-label">Goals</p>
                <div className="g-sticky platz-mb">
                  <input
                    className="platz-inp platz-mb"
                    placeholder="Goal title"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                  />
                  <textarea
                    className="platz-inp"
                    placeholder="Optional description"
                    value={goalDesc}
                    onChange={(e) => setGoalDesc(e.target.value)}
                    rows={3}
                  />
                  <button
                    type="button"
                    className="platz-btn platz-btn-primary platz-mt"
                    onClick={addGoal}
                  >
                    Add goal
                  </button>
                </div>
                {!goals.length ? (
                  <p className="platz-muted">No goals yet.</p>
                ) : (
                  goals.map((g) => (
                    <div key={g.id} className="g-sticky">
                      <h3>{g.title}</h3>
                      {g.description ? <p>{g.description}</p> : null}
                      <div className="g-status">
                        Status
                        <select
                          value={g.status ?? 'not_started'}
                          onChange={(e) =>
                            updateGoalStatus(g.id, e.target.value)
                          }
                        >
                          <option value="not_started">not started</option>
                          <option value="in_progress">in progress</option>
                          <option value="complete">complete</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        className="platz-btn platz-btn-ghost g-remove"
                        onClick={() => deleteGoal(g.id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
              </div>
            )}

            {section === 'bingo' && (
              <div className="platz-page">
              <div className="platz-sheet">
                <p className="platz-section-label">Bingo</p>
                <p className="platz-muted platz-mb">
                  Fill each square with a small goal or intention. The center is
                  free. Use mark when you&apos;ve lived it.
                </p>
                <div className="b-grid">
                  {bingoCells.map((cell, idx) => {
                    const highlight = winningSet.has(idx)
                    return (
                      <div
                        key={cell.id}
                        className={`b-cell${cell.isFree ? ' free' : ''}${highlight ? ' winning' : ''}`}
                      >
                        {cell.isFree ? (
                          <span>Free</span>
                        ) : (
                          <>
                            <textarea
                              value={cell.text}
                              onChange={(e) =>
                                updateBingoCell(idx, 'text', e.target.value)
                              }
                              placeholder="intention…"
                              disabled={false}
                            />
                            <button
                              type="button"
                              className="b-toggle"
                              disabled={!cell.text?.trim()}
                              onClick={() => toggleBingoDone(idx)}
                            >
                              {cell.done ? 'unmark' : 'mark'}
                            </button>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
                {bingoWins.length > 0 ? (
                  <p className="b-foot">
                    Bingo — you completed a full line. Nice.
                  </p>
                ) : (
                  <p className="b-foot">Complete a row, column, or diagonal.</p>
                )}
              </div>
              </div>
            )}

            {section === 'settings' && (
              <div className="platz-page">
              <div className="platz-sheet">
                <p className="platz-section-label">Settings</p>
                <div className="set-block">
                  <h3>Personality</h3>
                  <p className="platz-muted platz-mb">
                    {mbti
                      ? `Current snapshot: ${mbti}`
                      : 'No quiz result saved yet.'}
                  </p>
                  <button
                    type="button"
                    className="platz-btn platz-btn-primary"
                    onClick={() => startQuiz(true)}
                  >
                    Retake quiz
                  </button>
                </div>
                <div className="set-block">
                  <h3>Context for journal</h3>
                  <p className="platz-muted platz-mb">
                    The journal companion reads this when you write. It stays on
                    your device until you clear data.
                  </p>
                  <textarea
                    className="platz-inp"
                    placeholder="Goals, situation, what you’re working through…"
                    value={ctx}
                    onChange={(e) => onCtxChange(e.target.value)}
                  />
                </div>
                <div className="set-block">
                  <h3>Data</h3>
                  <button
                    type="button"
                    className="platz-btn platz-btn-ghost"
                    onClick={clearAllData}
                  >
                    Clear all data
                  </button>
                </div>
              </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className={modalOpen ? 'modal-bg open' : 'modal-bg'}
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal()
        }}
      >
        <div className="modal-box">
          <h4>save this entry</h4>
          <input
            ref={modalInputRef}
            placeholder="give it a title..."
            value={modalTitleInput}
            onChange={(e) => setModalTitleInput(e.target.value)}
            onKeyDown={onModalKeyDown}
          />
          <div className="modal-actions">
            <button type="button" className="platz-btn" onClick={closeModal}>
              cancel
            </button>
            <button
              type="button"
              className="platz-btn platz-btn-primary"
              onClick={confirmSave}
            >
              save
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
