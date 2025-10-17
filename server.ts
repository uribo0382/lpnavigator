import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// ログミドルウェア
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Anthropic API エンドポイント
app.post('/api/anthropic', async (req, res) => {
  try {
    console.log('Anthropic API request received:', { 
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : [],
      prompt: req.body?.prompt?.substring(0, 50) + '...' 
    });
    
    const { prompt, model = 'claude-3-5-sonnet-latest', temperature = 0.7, maxTokens = 2000 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const apiKey = process.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('VITE_ANTHROPIC_API_KEY is not set in environment');
      return res.status(500).json({ error: 'Anthropic API key is not configured' });
    }

    console.log('Creating Anthropic client with API key prefix:', apiKey.substring(0, 15) + '...');
    console.log('Request parameters:', { model, temperature, maxTokens });
    
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    const message = await anthropic.messages.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: maxTokens,
    });

    console.log('Anthropic API call successful, processing response...');
    
    const content = message.content[0];
    if (!content || content.type !== 'text') {
      throw new Error('No text response from Anthropic API');
    }

    const responseData = {
      content: content.text,
      model: message.model,
      usage: message.usage ? {
        promptTokens: message.usage.input_tokens,
        completionTokens: message.usage.output_tokens,
        totalTokens: message.usage.input_tokens + message.usage.output_tokens,
      } : undefined,
    };
    
    console.log('Sending successful response');
    return res.status(200).json(responseData);
  } catch (error: any) {
    console.error('Anthropic API Error:', error);
    const errorMessage = error.message || '不明なエラー';
    const statusCode = error.status || 500;
    
    // 詳細なエラー情報をログに記録
    console.error('Error details:', {
      message: errorMessage,
      status: statusCode,
      error: error.error,
      stack: error.stack
    });
    
    return res.status(statusCode).json({ 
      error: `Anthropic API エラー: ${errorMessage}`,
      details: error.error?.message || error.message
    });
  }
});

app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
});