import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { messages, model = 'claude-opus-4-6', max_tokens = 1024 } = req.body

  try {
    const response = await client.messages.create({
      model,
      max_tokens,
      messages,
    })

    res.status(200).json(response)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
