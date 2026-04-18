import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

const SYSTEM = `You are building a memory profile for a user based on their past journal entries and AI responses. Read everything carefully and extract what you can confidently say is true about this person.

The five sections are:
- people: Key relationships mentioned and relevant context about them
- goals: What the user is working toward, stated or clearly implied
- struggles: Recurring fears, blockers, anxieties, or challenges
- patterns: Thinking or behavioral tendencies observed across their writing
- life: Current circumstances, job, school, living situation, major life context

Rules:
- Only include what is clearly stated or strongly implied. Do not invent or assume.
- Keep each section to a few concise sentences. Be specific, not vague.
- If you have nothing confident to say about a section, return an empty string for it.
- Never use em dashes.

Return ONLY a valid JSON object with exactly these five keys: people, goals, struggles, patterns, life. No explanation, no markdown, just the JSON.`

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { entries } = req.body
  if (!entries?.length) return res.status(400).json({ error: 'No entries provided' })

  const formatted = entries.map((e, i) => {
    const parts = [`Entry ${i + 1}:\n${e.userText}`]
    if (e.platzResponse) parts.push(`Platz response:\n${e.platzResponse}`)
    return parts.join('\n')
  }).join('\n\n---\n\n')

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
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
