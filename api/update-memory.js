import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

const MEMORY_SYSTEM = `You maintain a structured memory profile for a personal journaling app. You will be given the user's current memory profile and a new journal conversation.

Update only the sections where new, meaningful information appears. Prioritize information that:
- Carries clear emotional weight or significance to the user
- Would actually change how a thoughtful advisor would respond to them
- Contradicts or refines something already in the profile

Skip incidental details, one-off mentions, or anything that is just surface context. If something in the profile is contradicted or outdated, correct it. Keep each section to a few concise, specific sentences. Never use em dashes.

The five sections are:
- values: What the user fundamentally cares about. Their beliefs, priorities, and what drives them at a deeper level. What they seem unwilling to compromise on.
- life: Current circumstances — work, school, living situation, key relationships, and any major life context.
- goals: What they are actively working toward, stated or clearly implied.
- struggles: Recurring fears, blockers, anxieties, or challenges that hold them back.
- patterns: How they tend to think and behave — their defaults, blind spots, and recurring tendencies. Only include what is clearly observable, not guessed.

Return ONLY a valid JSON object with exactly these five keys: values, life, goals, struggles, patterns. No explanation, no markdown, just the JSON.`

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { currentMemory, thread } = req.body

  const memory = {
    values: '',
    life: '',
    goals: '',
    struggles: '',
    patterns: '',
    ...currentMemory,
  }

  const conversation = thread
    .map(m => `${m.role === 'user' ? 'User' : 'Platz'}: ${m.content.slice(0, 500)}`)
    .join('\n\n')

  const userMessage = `Current memory profile:
${JSON.stringify(memory, null, 2)}

Journal conversation:
${conversation}`

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      system: MEMORY_SYSTEM,
      messages: [{ role: 'user', content: userMessage }],
    })

    let text = response.content[0].text.trim()
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    }
    const updated = JSON.parse(text)
    res.status(200).json({ memory: updated })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
