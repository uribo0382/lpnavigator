import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { testAllConnections } from './services/ai';
import type { AIProvider } from './services/ai';

const App: React.FC = () => {
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
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>AI API 接続テスト</h1>
      
      <button 
        onClick={runTests} 
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: loading ? '#ccc' : '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'テスト中...' : 'テスト開始'}
      </button>

      {results && (
        <div style={{ marginTop: '20px' }}>
          <h2>テスト結果</h2>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>プロバイダー</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>接続状態</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(results).map(([provider, success]) => (
                <tr key={provider}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{provider}</td>
                  <td style={{ 
                    border: '1px solid #ddd', 
                    padding: '8px',
                    color: success ? 'green' : 'red',
                    fontWeight: 'bold'
                  }}>
                    {success ? '✅ 成功' : '❌ 失敗'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <h3>環境変数の確認</h3>
        <p>以下の環境変数が設定されていることを確認してください：</p>
        <ul>
          <li>VITE_OPENAI_API_KEY: {import.meta.env.VITE_OPENAI_API_KEY ? '✅ 設定済み' : '❌ 未設定'}</li>
          <li>VITE_ANTHROPIC_API_KEY: {import.meta.env.VITE_ANTHROPIC_API_KEY ? '✅ 設定済み' : '❌ 未設定'}</li>
          <li>VITE_GOOGLE_AI_API_KEY: {import.meta.env.VITE_GOOGLE_AI_API_KEY ? '✅ 設定済み' : '❌ 未設定'}</li>
        </ul>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);