import openai from './openai';
import anthropic from './anthropic';
import google from './google';

export type AIProvider = 'openai' | 'anthropic' | 'google';

export interface AIService {
  generateContent: (params: {
    prompt: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }) => Promise<{
    content: string;
    model: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  }>;
  testConnection: () => Promise<boolean>;
}

// プロバイダーごとのサービスマッピング
const services: Record<AIProvider, AIService> = {
  openai,
  anthropic,
  google,
};

// デフォルトモデルの設定
const defaultModels: Record<AIProvider, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-sonnet-latest',
  google: 'gemini-2.0-flash',
};

/**
 * 指定されたプロバイダーでコンテンツを生成
 */
export async function generateContent(
  provider: AIProvider,
  params: {
    prompt: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
) {
  const service = services[provider];
  if (!service) {
    throw new Error(`Unknown AI provider: ${provider}`);
  }

  // デフォルトモデルを設定
  const model = params.model || defaultModels[provider];

  return service.generateContent({ ...params, model });
}

/**
 * 指定されたプロバイダーの接続をテスト
 */
export async function testConnection(provider: AIProvider): Promise<boolean> {
  const service = services[provider];
  if (!service) {
    throw new Error(`Unknown AI provider: ${provider}`);
  }

  return service.testConnection();
}

/**
 * すべてのプロバイダーの接続をテスト
 */
export async function testAllConnections(): Promise<Record<AIProvider, boolean>> {
  const results: Partial<Record<AIProvider, boolean>> = {};
  
  for (const provider of Object.keys(services) as AIProvider[]) {
    try {
      results[provider] = await testConnection(provider);
    } catch (error) {
      console.error(`Failed to test ${provider} connection:`, error);
      results[provider] = false;
    }
  }

  return results as Record<AIProvider, boolean>;
}

export default {
  generateContent,
  testConnection,
  testAllConnections,
};