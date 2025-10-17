import React from 'react';
import Card from '../../components/ui/Card';
import { AlertCircle, CheckCircle } from 'lucide-react';

const ApiTestDebug: React.FC = () => {
  // 環境変数の値を取得（最初と最後の数文字のみ表示）
  const maskApiKey = (key: string | undefined): string => {
    if (!key) return '未設定';
    if (key.length < 20) return '無効なキー';
    return `${key.substring(0, 10)}...${key.substring(key.length - 4)}`;
  };

  const envVars = {
    openai: {
      key: import.meta.env.VITE_OPENAI_API_KEY,
      exists: !!import.meta.env.VITE_OPENAI_API_KEY,
      masked: maskApiKey(import.meta.env.VITE_OPENAI_API_KEY),
      valid: import.meta.env.VITE_OPENAI_API_KEY?.startsWith('sk-'),
    },
    anthropic: {
      key: import.meta.env.VITE_ANTHROPIC_API_KEY,
      exists: !!import.meta.env.VITE_ANTHROPIC_API_KEY,
      masked: maskApiKey(import.meta.env.VITE_ANTHROPIC_API_KEY),
      valid: import.meta.env.VITE_ANTHROPIC_API_KEY?.startsWith('sk-'),
    },
    google: {
      key: import.meta.env.VITE_GOOGLE_AI_API_KEY,
      exists: !!import.meta.env.VITE_GOOGLE_AI_API_KEY,
      masked: maskApiKey(import.meta.env.VITE_GOOGLE_AI_API_KEY),
      valid: import.meta.env.VITE_GOOGLE_AI_API_KEY?.startsWith('AIza'),
    },
  };

  // 簡単な接続テスト
  const testOpenAI = async () => {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${envVars.openai.key}`,
        },
      });
      console.log('OpenAI response status:', response.status);
      return response.ok;
    } catch (error) {
      console.error('OpenAI test error:', error);
      return false;
    }
  };

  const testAnthropic = async () => {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': envVars.anthropic.key || '',
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      });
      console.log('Anthropic response status:', response.status);
      return response.status === 200;
    } catch (error) {
      console.error('Anthropic test error:', error);
      return false;
    }
  };

  const testGoogle = async () => {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${envVars.google.key}`
      );
      console.log('Google AI response status:', response.status);
      const data = await response.json();
      console.log('Available Google models:', data);
      // モデル名のリストを表示
      if (data.models) {
        const modelNames = data.models.map((m: any) => m.name);
        console.log('Model names:', modelNames);
        // geminiモデルのみフィルタ
        const geminiModels = modelNames.filter((name: string) => name.includes('gemini'));
        console.log('Gemini models:', geminiModels);
      }
      return response.ok;
    } catch (error) {
      console.error('Google test error:', error);
      return false;
    }
  };

  const runSimpleTests = async () => {
    console.log('=== API Debug Info ===');
    console.log('OpenAI:', envVars.openai);
    console.log('Anthropic:', envVars.anthropic);
    console.log('Google:', envVars.google);
    
    console.log('\n=== Simple Connection Tests ===');
    const openaiResult = await testOpenAI();
    console.log('OpenAI test result:', openaiResult);
    
    const anthropicResult = await testAnthropic();
    console.log('Anthropic test result:', anthropicResult);
    
    const googleResult = await testGoogle();
    console.log('Google test result:', googleResult);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">API デバッグ情報</h1>
      
      <Card>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">環境変数の状態</h2>
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-600 mb-2 flex items-center">
              OpenAI API
              {envVars.openai.exists ? (
                <CheckCircle className="text-green-500 ml-2" size={20} />
              ) : (
                <AlertCircle className="text-red-500 ml-2" size={20} />
              )}
            </h3>
            <p className="text-sm text-gray-600">存在: {envVars.openai.exists ? 'はい' : 'いいえ'}</p>
            <p className="text-sm text-gray-600">値: {envVars.openai.masked}</p>
            <p className="text-sm text-gray-600">形式: {envVars.openai.valid ? '正しい (sk-で始まる)' : '不正な形式'}</p>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-600 mb-2 flex items-center">
              Anthropic API
              {envVars.anthropic.exists ? (
                <CheckCircle className="text-green-500 ml-2" size={20} />
              ) : (
                <AlertCircle className="text-red-500 ml-2" size={20} />
              )}
            </h3>
            <p className="text-sm text-gray-600">存在: {envVars.anthropic.exists ? 'はい' : 'いいえ'}</p>
            <p className="text-sm text-gray-600">値: {envVars.anthropic.masked}</p>
            <p className="text-sm text-gray-600">形式: {envVars.anthropic.valid ? '正しい (sk-で始まる)' : '不正な形式'}</p>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-600 mb-2 flex items-center">
              Google AI API
              {envVars.google.exists ? (
                <CheckCircle className="text-green-500 ml-2" size={20} />
              ) : (
                <AlertCircle className="text-red-500 ml-2" size={20} />
              )}
            </h3>
            <p className="text-sm text-gray-600">存在: {envVars.google.exists ? 'はい' : 'いいえ'}</p>
            <p className="text-sm text-gray-600">値: {envVars.google.masked}</p>
            <p className="text-sm text-gray-600">形式: {envVars.google.valid ? '正しい (AIzaで始まる)' : '不正な形式'}</p>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={runSimpleTests}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            シンプルテストを実行（コンソールで結果を確認）
          </button>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">トラブルシューティング</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p>1. 開発サーバーを再起動してください: <code className="bg-gray-100 px-2 py-1 rounded">npm run dev</code></p>
          <p>2. ブラウザのキャッシュをクリアしてください</p>
          <p>3. .env.localファイルが正しい場所にあることを確認してください</p>
          <p>4. APIキーが有効であることを各プロバイダーのダッシュボードで確認してください</p>
          <p>5. コンソールログを確認して詳細なエラー情報を確認してください（F12キー）</p>
        </div>
      </Card>
    </div>
  );
};

export default ApiTestDebug;