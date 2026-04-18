import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verify Supabase auth token
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { messages, system, max_tokens = 1024, response_length } = req.body

  const SONNET_LENGTHS = new Set(['medium', 'detailed', 'deep'])
  const model = SONNET_LENGTHS.has(response_length) ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001'

  try {
    const response = await client.messages.create({
      model,
      max_tokens,
      messages,
      ...(system && { system }),
    })

    res.status(200).json(response)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
