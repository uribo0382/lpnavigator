import React, { useState } from 'react';
import { testAllConnections } from '../../services/ai';
import type { AIProvider } from '../../services/ai';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { Loader, CheckCircle, AlertCircle } from 'lucide-react';

const ApiTest: React.FC = () => {
  const [results, setResults] = useState<Record<AIProvider, boolean> | null>(null);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    try {
      const testResults = await testAllConnections();
      setResults(testResults);
    } catch (error) {
      console.error('テスト実行エラー:', error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">AI API 接続テスト</h1>
        
        <Card className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">環境変数の確認</h2>
          <div className="space-y-2">
            <div className="flex items-center">
              {import.meta.env.VITE_OPENAI_API_KEY ? 
                <CheckCircle className="text-green-500 mr-2" size={20} /> : 
                <AlertCircle className="text-red-500 mr-2" size={20} />
              }
              <span>VITE_OPENAI_API_KEY: {import.meta.env.VITE_OPENAI_API_KEY ? '設定済み' : '未設定'}</span>
            </div>
            <div className="flex items-center">
              {import.meta.env.VITE_ANTHROPIC_API_KEY ? 
                <CheckCircle className="text-green-500 mr-2" size={20} /> : 
                <AlertCircle className="text-red-500 mr-2" size={20} />
              }
              <span>VITE_ANTHROPIC_API_KEY: {import.meta.env.VITE_ANTHROPIC_API_KEY ? '設定済み' : '未設定'}</span>
            </div>
            <div className="flex items-center">
              {import.meta.env.VITE_GOOGLE_AI_API_KEY ? 
                <CheckCircle className="text-green-500 mr-2" size={20} /> : 
                <AlertCircle className="text-red-500 mr-2" size={20} />
              }
              <span>VITE_GOOGLE_AI_API_KEY: {import.meta.env.VITE_GOOGLE_AI_API_KEY ? '設定済み' : '未設定'}</span>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">接続テスト</h2>
          
          <Button 
            onClick={runTests} 
            disabled={loading}
            isLoading={loading}
            className="mb-6"
          >
            {loading ? 'テスト中...' : 'テスト開始'}
          </Button>

          {results && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-600">テスト結果</h3>
              <div className="overflow-hidden border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        プロバイダー
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        接続状態
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(results).map(([provider, success]) => (
                      <tr key={provider}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {provider.toUpperCase()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {success ? (
                              <>
                                <CheckCircle className="mr-1" size={14} />
                                成功
                              </>
                            ) : (
                              <>
                                <AlertCircle className="mr-1" size={14} />
                                失敗
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">
                  結果: {Object.values(results).filter(r => r).length}/{Object.keys(results).length} のAPIが正常に接続できました。
                </p>
                
                {results.openai === false && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                    <h4 className="text-sm font-semibold text-yellow-800 mb-2">OpenAI API エラーについて</h4>
                    <p className="text-sm text-yellow-700">
                      「429: You exceeded your current quota」エラーが表示される場合：
                    </p>
                    <ul className="list-disc list-inside text-sm text-yellow-700 mt-2 space-y-1">
                      <li>OpenAIダッシュボード (platform.openai.com) で使用状況を確認</li>
                      <li>請求情報が正しく設定されているか確認</li>
                      <li>APIキーの使用制限に達していないか確認</li>
                      <li>無料トライアルの場合、クレジットが残っているか確認</li>
                    </ul>
                  </div>
                )}
                
                {results.anthropic === false && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                    <h4 className="text-sm font-semibold text-yellow-800 mb-2">Anthropic API エラーについて</h4>
                    <p className="text-sm text-yellow-700">
                      接続に失敗した場合は、サーバーのログを確認してください。
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ApiTest;