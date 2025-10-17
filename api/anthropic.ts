import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, model = 'claude-3-5-sonnet-latest', temperature = 0.7, maxTokens = 2000 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const apiKey = process.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('VITE_ANTHROPIC_API_KEY is not set');
      return res.status(500).json({ error: 'Anthropic API key is not configured' });
    }

    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    const message = await anthropic.messages.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: maxTokens,
    });

    const content = message.content[0];
    if (!content || content.type !== 'text') {
      throw new Error('No text response from Anthropic API');
    }

    return res.status(200).json({
      content: content.text,
      model: message.model,
      usage: message.usage ? {
        promptTokens: message.usage.input_tokens,
        completionTokens: message.usage.output_tokens,
        totalTokens: message.usage.input_tokens + message.usage.output_tokens,
      } : undefined,
    });
  } catch (error: any) {
    console.error('Anthropic API Error:', error);
    const errorMessage = error.message || '不明なエラー';
    const statusCode = error.status || 500;
    return res.status(statusCode).json({ 
      error: `Anthropic API エラー: ${errorMessage}`,
      details: error.error?.message || error.message
    });
  }
}