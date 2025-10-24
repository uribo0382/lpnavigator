import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { RefreshCw } from 'lucide-react';

// テスト用コンポーネント - ユーザーデータの直接確認
const TestUsersData: React.FC = () => {
  const [rawData, setRawData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rlsStatus, setRlsStatus] = useState<string>('Unknown');

  const testDirectQuery = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('=== Direct Supabase Query Test ===');
      
      // 1. RLS状態の確認はスキップ（RPCが利用できない可能性があるため）
      // setRlsStatus('Check manually in Supabase');
      
      // 2. 直接クエリ実行
      const { data, error, count } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // console.log('Query Status:', status);
      // console.log('Query Status Text:', statusText);
      console.log('Total Count:', count);
      console.log('Data:', data);
      console.log('Error:', error);

      if (error) {
        setError(`Error: ${error.message} (Code: ${error.code})`);
        setRawData([]);
      } else {
        setRawData(data || []);
      }
    } catch (err: any) {
      console.error('Test error:', err);
      setError(`Exception: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    testDirectQuery();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">ユーザーデータテスト</h1>
        <Button
          onClick={testDirectQuery}
          leftIcon={<RefreshCw size={16} />}
          isLoading={isLoading}
        >
          再取得
        </Button>
      </div>

      {/* RLS状態 */}
      <Card className="p-4">
        <h2 className="font-semibold mb-2">RLS (Row Level Security) Status</h2>
        <p className={`text-sm ${rlsStatus === 'Disabled' ? 'text-green-600' : 'text-red-600'}`}>
          {rlsStatus}
        </p>
        {rlsStatus === 'Enabled' && (
          <p className="text-xs text-gray-500 mt-1">
            RLSが有効です。database/fix-users-rls-complete.sql を実行してください。
          </p>
        )}
      </Card>

      {/* エラー表示 */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
        </Card>
      )}

      {/* 生データ表示 */}
      <Card className="p-4">
        <h2 className="font-semibold mb-2">Raw Database Data ({rawData.length} users)</h2>
        <div className="overflow-x-auto">
          {rawData.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">ID</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Role</th>
                  <th className="px-3 py-2 text-left">is_active</th>
                  <th className="px-3 py-2 text-left">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rawData.map((user) => (
                  <tr key={user.id}>
                    <td className="px-3 py-2 truncate max-w-xs">{user.id}</td>
                    <td className="px-3 py-2">{user.email}</td>
                    <td className="px-3 py-2">{user.name}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        user.role === 'admin' ? 'bg-purple-100' : 'bg-blue-100'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-3 py-2">{String(user.is_active)}</td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {typeof user.is_active}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">No data found</p>
          )}
        </div>
      </Card>

      {/* JSON表示 */}
      <Card className="p-4">
        <h2 className="font-semibold mb-2">JSON Data</h2>
        <pre className="text-xs overflow-x-auto bg-gray-50 p-3 rounded">
          {JSON.stringify(rawData, null, 2)}
        </pre>
      </Card>
    </div>
  );
};

export default TestUsersData;