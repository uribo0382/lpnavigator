import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { supabase, testSupabaseConnection } from '../../lib/supabase';
import { supabaseConfig, validateSupabaseConfig } from '../../lib/supabaseConfig';

interface ConnectionStatus {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  details: {
    url: boolean;
    anonKey: boolean;
    connection: boolean;
  };
}

export const SupabaseConnectionTest: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>({
    isConnected: false,
    isLoading: true,
    error: null,
    details: {
      url: false,
      anonKey: false,
      connection: false,
    },
  });

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setStatus(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // 設定の検証
      const configValid = validateSupabaseConfig(supabaseConfig);
      const urlValid = !!supabaseConfig.url;
      const anonKeyValid = !!supabaseConfig.anonKey;

      // 接続テスト
      const connectionValid = await testSupabaseConnection();

      setStatus({
        isConnected: configValid && connectionValid,
        isLoading: false,
        error: !configValid ? '設定が不正です' : !connectionValid ? '接続に失敗しました' : null,
        details: {
          url: urlValid,
          anonKey: anonKeyValid,
          connection: connectionValid,
        },
      });
    } catch (error) {
      setStatus({
        isConnected: false,
        isLoading: false,
        error: error instanceof Error ? error.message : '不明なエラーが発生しました',
        details: {
          url: false,
          anonKey: false,
          connection: false,
        },
      });
    }
  };

  const getStatusIcon = (isValid: boolean) => {
    if (status.isLoading) {
      return <Loader className="w-5 h-5 text-gray-400 animate-spin" />;
    }
    return isValid ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <AlertCircle className="w-5 h-5 text-red-500" />
    );
  };

  const getStatusText = (isValid: boolean) => {
    return isValid ? '正常' : 'エラー';
  };

  const getStatusColor = (isValid: boolean) => {
    return isValid ? 'text-green-700' : 'text-red-700';
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Supabase 接続テスト</h2>

      {/* 全体のステータス */}
      <div className={`mb-6 p-4 rounded-lg ${status.isConnected ? 'bg-green-50' : 'bg-red-50'}`}>
        <div className="flex items-center space-x-3">
          {getStatusIcon(status.isConnected)}
          <div>
            <h3 className={`font-semibold ${getStatusColor(status.isConnected)}`}>
              接続ステータス: {status.isLoading ? '確認中...' : status.isConnected ? '接続成功' : '接続失敗'}
            </h3>
            {status.error && (
              <p className="text-red-600 text-sm mt-1">{status.error}</p>
            )}
          </div>
        </div>
      </div>

      {/* 詳細情報 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">接続詳細</h3>
        
        {/* Supabase URL */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
          <div className="flex items-center space-x-3">
            {getStatusIcon(status.details.url)}
            <span className="font-medium">Supabase URL</span>
          </div>
          <span className={`text-sm ${getStatusColor(status.details.url)}`}>
            {getStatusText(status.details.url)}
          </span>
        </div>

        {/* Anon Key */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
          <div className="flex items-center space-x-3">
            {getStatusIcon(status.details.anonKey)}
            <span className="font-medium">Anon Key</span>
          </div>
          <span className={`text-sm ${getStatusColor(status.details.anonKey)}`}>
            {getStatusText(status.details.anonKey)}
          </span>
        </div>

        {/* データベース接続 */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
          <div className="flex items-center space-x-3">
            {getStatusIcon(status.details.connection)}
            <span className="font-medium">データベース接続</span>
          </div>
          <span className={`text-sm ${getStatusColor(status.details.connection)}`}>
            {getStatusText(status.details.connection)}
          </span>
        </div>
      </div>

      {/* 設定情報（開発環境のみ） */}
      <div className="mt-6 p-4 bg-gray-100 rounded text-sm">
        <h4 className="font-semibold text-gray-700 mb-2">設定情報</h4>
        <div className="space-y-1 text-gray-600">
          <p>URL: {supabaseConfig.url ? `${supabaseConfig.url.substring(0, 30)}...` : '未設定'}</p>
          <p>Anon Key: {supabaseConfig.anonKey ? `${supabaseConfig.anonKey.substring(0, 20)}...` : '未設定'}</p>
          <p>Service Role Key: {supabaseConfig.serviceRoleKey ? '設定済み' : '未設定'}</p>
        </div>
      </div>

      {/* 再テストボタン */}
      <div className="mt-6">
        <button
          onClick={checkConnection}
          disabled={status.isLoading}
          className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {status.isLoading ? '接続確認中...' : '再テスト'}
        </button>
      </div>
    </div>
  );
};