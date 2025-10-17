import OpenAI from 'openai';

// OpenAI APIクライアントの初期化
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true // ブラウザ環境での実行を許可
});

export interface GenerateContentParams {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GenerateContentResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * OpenAI APIを使用してコンテンツを生成
 */
export async function generateContent({
  prompt,
  model = 'gpt-4o-mini',
  temperature = 0.7,
  maxTokens = 2000,
}: GenerateContentParams): Promise<GenerateContentResponse> {
  try {
    console.log('OpenAI generating with model:', model);
    const completion = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: maxTokens,
    });

    const message = completion.choices[0]?.message;
    if (!message || !message.content) {
      throw new Error('No response from OpenAI API');
    }

    return {
      content: message.content,
      model: completion.model,
      usage: completion.usage ? {
        promptTokens: completion.usage.prompt_tokens,
        completionTokens: completion.usage.completion_tokens,
        totalTokens: completion.usage.total_tokens,
      } : undefined,
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error(`OpenAI API エラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
  }
}

/**
 * OpenAI API接続テスト
 */
export async function testConnection(): Promise<boolean> {
  try {
    console.log('OpenAI API Key exists:', !!import.meta.env.VITE_OPENAI_API_KEY);
    console.log('OpenAI API Key prefix:', import.meta.env.VITE_OPENAI_API_KEY?.substring(0, 10) + '...');
    console.log('OpenAI API Key length:', import.meta.env.VITE_OPENAI_API_KEY?.length);
    
    const response = await generateContent({
      prompt: 'こんにちは。これは接続テストです。',
      model: 'gpt-4o-mini',
      maxTokens: 50,
    });
    
    console.log('OpenAI API接続テスト成功:', response);
    return true;
  } catch (error: any) {
    console.error('OpenAI API接続テスト失敗:', error);
    console.error('Error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      status: error.status,
      stack: error.stack
    });
    return false;
  }
}

export default {
  generateContent,
  testConnection,
};