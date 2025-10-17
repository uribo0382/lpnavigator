// Anthropic APIをサーバーサイド経由で呼び出すクライアント

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
 * Anthropic APIを使用してコンテンツを生成（サーバーサイド経由）
 */
export async function generateContent({
  prompt,
  model = 'claude-3-5-sonnet-latest',
  temperature = 0.7,
  maxTokens = 2000,
}: GenerateContentParams): Promise<GenerateContentResponse> {
  try {
    const response = await fetch('/api/anthropic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        model,
        temperature,
        maxTokens,
      }),
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
        console.error('Server error response:', error);
      } catch (jsonError) {
        console.error('Failed to parse error response:', jsonError);
        // レスポンスボディはすでに読み込み済みなので、エラーメッセージのみ使用
        errorMessage = `サーバーエラー: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Anthropic API Error:', error);
    throw new Error(`Anthropic API エラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
  }
}

/**
 * Anthropic API接続テスト
 */
export async function testConnection(): Promise<boolean> {
  try {
    console.log('Anthropic API Key exists:', !!import.meta.env.VITE_ANTHROPIC_API_KEY);
    console.log('Anthropic API Key prefix:', import.meta.env.VITE_ANTHROPIC_API_KEY?.substring(0, 15) + '...');
    
    const response = await generateContent({
      prompt: 'こんにちは。これは接続テストです。',
      model: 'claude-3-5-sonnet-latest',
      maxTokens: 50,
    });
    
    console.log('Anthropic API接続テスト成功:', response);
    return true;
  } catch (error: any) {
    console.error('Anthropic API接続テスト失敗:', error);
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