import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AIRequest {
  provider: 'openai' | 'anthropic' | 'google'
  action: 'test' | 'generate'
  params?: {
    prompt?: string
    model?: string
    temperature?: number
    maxTokens?: number
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { provider, action, params } = await req.json() as AIRequest

    // Get API keys from environment variables
    const apiKeys = {
      openai: Deno.env.get('OPENAI_API_KEY'),
      anthropic: Deno.env.get('ANTHROPIC_API_KEY'),
      google: Deno.env.get('GOOGLE_AI_API_KEY'),
    }

    const apiKey = apiKeys[provider]
    if (!apiKey) {
      throw new Error(`API key not found for provider: ${provider}`)
    }

    let result: any

    if (action === 'test') {
      // Test connection
      result = await testConnection(provider, apiKey)
    } else if (action === 'generate') {
      // Generate content
      result = await generateContent(provider, apiKey, params!)
    } else {
      throw new Error(`Unknown action: ${action}`)
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('AI Proxy Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function testConnection(provider: string, apiKey: string): Promise<boolean> {
  const testPrompt = 'こんにちは。これは接続テストです。'
  
  try {
    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: testPrompt }],
          max_tokens: 50,
        }),
      })
      
      if (!response.ok) {
        const error = await response.text()
        throw new Error(`OpenAI API error: ${response.status} - ${error}`)
      }
      
      return true
    } else if (provider === 'anthropic') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          messages: [{ role: 'user', content: testPrompt }],
          max_tokens: 50,
        }),
      })
      
      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Anthropic API error: ${response.status} - ${error}`)
      }
      
      return true
    } else if (provider === 'google') {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: testPrompt,
              }],
            }],
            generationConfig: {
              maxOutputTokens: 50,
            },
          }),
        }
      )
      
      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Google AI API error: ${response.status} - ${error}`)
      }
      
      return true
    }
    
    throw new Error(`Unknown provider: ${provider}`)
  } catch (error) {
    console.error(`${provider} connection test failed:`, error)
    return false
  }
}

async function generateContent(
  provider: string,
  apiKey: string,
  params: { prompt: string; model?: string; temperature?: number; maxTokens?: number }
): Promise<any> {
  const { prompt, model, temperature = 0.7, maxTokens = 2000 } = params
  
  if (provider === 'openai') {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens,
      }),
    })
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API error: ${response.status} - ${error}`)
    }
    
    const data = await response.json()
    return {
      content: data.choices[0]?.message?.content || '',
      model: data.model,
      usage: {
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
        totalTokens: data.usage?.total_tokens,
      },
    }
  } else if (provider === 'anthropic') {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-3-sonnet-20240229',
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens,
      }),
    })
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Anthropic API error: ${response.status} - ${error}`)
    }
    
    const data = await response.json()
    return {
      content: data.content[0]?.text || '',
      model: data.model,
      usage: {
        promptTokens: data.usage?.input_tokens,
        completionTokens: data.usage?.output_tokens,
        totalTokens: data.usage?.input_tokens + data.usage?.output_tokens,
      },
    }
  } else if (provider === 'google') {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-pro'}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt,
            }],
          }],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
          },
        }),
      }
    )
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Google AI API error: ${response.status} - ${error}`)
    }
    
    const data = await response.json()
    return {
      content: data.candidates[0]?.content?.parts[0]?.text || '',
      model: model || 'gemini-pro',
      usage: data.usageMetadata ? {
        promptTokens: data.usageMetadata.promptTokenCount,
        completionTokens: data.usageMetadata.candidatesTokenCount,
        totalTokens: data.usageMetadata.totalTokenCount,
      } : undefined,
    }
  }
  
  throw new Error(`Unknown provider: ${provider}`)
}