import React from 'react';
import { SupabaseConnectionTest } from '../../components/test/SupabaseConnectionTest';

export const SupabaseTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Supabase 接続テストページ
        </h1>
        <SupabaseConnectionTest />
        <div className="mt-8 text-center text-gray-600">
          <p className="text-sm">
            このページは開発環境でのみ使用してください。
          </p>
          <p className="text-sm mt-2">
            本番環境では削除またはアクセス制限を設定してください。
          </p>
        </div>
      </div>
    </div>
  );
};