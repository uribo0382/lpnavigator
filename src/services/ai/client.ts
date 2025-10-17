import { supabase } from '../../lib/supabase';

export interface AIProxyRequest {
  provider: 'openai' | 'anthropic' | 'google';
  action: 'test' | 'generate';
  params?: {
    prompt?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
}

export interface AIProxyResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Supabase Edge Functionを経由してAI APIを呼び出す
 */
export async function callAIProxy<T = any>(request: AIProxyRequest): Promise<T> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-proxy', {
      body: request,
    });

    if (error) {
      throw error;
    }

    const response = data as AIProxyResponse<T>;
    
    if (!response.success) {
      throw new Error(response.error || 'Unknown error');
    }

    return response.data as T;
  } catch (error) {
    console.error('AI Proxy Error:', error);
    throw error;
  }
}

/**
 * プロバイダーの接続をテスト
 */
export async function testProviderConnection(provider: 'openai' | 'anthropic' | 'google'): Promise<boolean> {
  try {
    const result = await callAIProxy<boolean>({
      provider,
      action: 'test',
    });
    return result;
  } catch (error) {
    console.error(`${provider} connection test failed:`, error);
    return false;
  }
}

/**
 * すべてのプロバイダーの接続をテスト
 */
export async function testAllProviderConnections(): Promise<Record<string, boolean>> {
  const providers = ['openai', 'anthropic', 'google'] as const;
  const results: Record<string, boolean> = {};

  for (const provider of providers) {
    results[provider] = await testProviderConnection(provider);
  }

  return results;
}