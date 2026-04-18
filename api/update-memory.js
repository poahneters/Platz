import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

const MEMORY_SYSTEM = `You maintain a structured memory profile for a personal journaling app. You will be given the user's current memory profile and a new journal entry with the AI's response.

Update only the sections where new, concrete information appears. Do not invent or infer beyond what was explicitly stated. Keep each section to a few concise sentences — accurate and useful, not exhaustive. If a section has nothing new to add, return it exactly unchanged.

The five sections are:
- people: Key relationships mentioned and relevant context about them
- goals: What the user is working toward, stated or clearly implied
- struggles: Recurring fears, blockers, anxieties, or challenges
- patterns: Thinking or behavioral tendencies observed across their writing
- life: Current circumstances — job, school, living situation, major life context

Return ONLY a valid JSON object with exactly these five keys. No explanation, no markdown, just the JSON.`

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { currentMemory, entry, platzResponse } = req.body

  const memory = {
    people: '',
    goals: '',
    struggles: '',
    patterns: '',
    life: '',
    ...currentMemory,
  }

  const userMessage = `Current memory profile:
${JSON.stringify(memory, null, 2)}

New journal entry:
${entry}

Platz's response:
${platzResponse}`

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: MEMORY_SYSTEM,
      messages: [{ role: 'user', content: userMessage }],
    })

    const updated = JSON.parse(response.content[0].text)
    res.status(200).json({ memory: updated })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
