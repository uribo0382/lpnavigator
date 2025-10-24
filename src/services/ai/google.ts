import { GoogleGenerativeAI } from '@google/generative-ai';

// Google AI APIクライアントの初期化
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_API_KEY || '');

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
 * Google AI APIを使用してコンテンツを生成
 */
export async function generateContent({
  prompt,
  model = 'gemini-2.0-flash',
  temperature = 0.7,
  maxTokens = 8192,  // デフォルト値を8192トークンに増加（Gemini 2.0 Flash の上限）
}: GenerateContentParams): Promise<GenerateContentResponse> {
  try {
    const generativeModel = genAI.getGenerativeModel({ 
      model,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    });

    const result = await generativeModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error('No response from Google AI API');
    }

    return {
      content: text,
      model,
      usage: response.usageMetadata ? {
        promptTokens: response.usageMetadata.promptTokenCount || 0,
        completionTokens: response.usageMetadata.candidatesTokenCount || 0,
        totalTokens: response.usageMetadata.totalTokenCount || 0,
      } : undefined,
    };
  } catch (error) {
    console.error('Google AI API Error:', error);
    throw new Error(`Google AI API エラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
  }
}

/**
 * Google AI API接続テスト
 */
export async function testConnection(): Promise<boolean> {
  try {
    console.log('Google AI API Key exists:', !!import.meta.env.VITE_GOOGLE_AI_API_KEY);
    console.log('Google AI API Key prefix:', import.meta.env.VITE_GOOGLE_AI_API_KEY?.substring(0, 10) + '...');
    
    const response = await generateContent({
      prompt: 'こんにちは。これは接続テストです。',
      model: 'gemini-2.0-flash',
      maxTokens: 50,
    });
    
    console.log('Google AI API接続テスト成功:', response);
    return true;
  } catch (error: any) {
    console.error('Google AI API接続テスト失敗:', error);
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