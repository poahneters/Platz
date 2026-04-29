import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

const SYSTEM = `You are building a memory profile for a user based on their journal conversations with an AI called Platz. Read everything carefully, then extract what matters most.

IMPORTANT: Never use em dashes (--) anywhere in your output. Use commas, periods, or rewrite the sentence instead.

Prioritize information that:
- Recurs across multiple entries — repetition signals importance
- Carries emotional weight or vulnerability
- Would genuinely change how a thoughtful advisor would respond to this person
- Reveals something about who they are, not just what happened to them

Do not include incidental details, one-off mentions, or surface-level context that would not change how someone would advise them. Be specific and concrete, not vague. If you are not confident about something, leave it out.

The five sections are:
- values: What the user fundamentally cares about. Their beliefs, priorities, and what drives them at a deeper level. What they seem unwilling to compromise on. This is the most important section — fill it when you see clear signals, even implicit ones.
- life: Current circumstances — work, school, living situation, and key relationships. Reflect the most recent state if things have changed.
- goals: What they are actively working toward. Focus on goals they return to or have taken concrete steps toward.
- struggles: Recurring fears, blockers, or anxieties. Weight toward things that come up more than once.
- patterns: How they tend to think and behave. Defaults, blind spots, recurring tendencies. Only include what is clearly observable across entries, not inferred from a single moment.

If you have nothing confident to say about a section, return an empty string.

Return ONLY a valid JSON object with exactly these five keys: values, life, goals, struggles, patterns. No explanation, no markdown, just the JSON. Do not use em dashes anywhere in the values.`

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { entries } = req.body
  if (!entries?.length) return res.status(400).json({ error: 'No entries provided' })

  const formatted = entries.map((e, i) => {
    const conversation = e.conversation
      .map(m => `${m.role === 'user' ? 'User' : 'Platz'}: ${m.content.slice(0, 500)}`)
      .join('\n\n')
    return `Entry ${i + 1}:\n${conversation}`
  }).join('\n\n---\n\n')

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      system: SYSTEM,
      messages: [{ role: 'user', content: formatted }],
    })

    let text = response.content[0].text.trim()
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    }
    const memory = JSON.parse(text)
    res.status(200).json({ memory })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
