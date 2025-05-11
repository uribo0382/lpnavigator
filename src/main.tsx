import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Windowインターフェースを拡張
declare global {
  interface Window {
    navigateToHashPath: (path: string) => void;
  }
}

// エラーハンドリングを追加
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection: Promiseがキャッチされずに拒否されました。');
  console.error('Reason (理由):', event.reason);
  if (event.reason instanceof Error) {
    console.error('Error Name:', event.reason.name);
    console.error('Error Message:', event.reason.message);
    console.error('Error Stack:', event.reason.stack);
  }
  console.log('Full unhandledrejection event object:', event);
  
  // 開発者向け: event.reason が単純なオブジェクトの場合、詳細を表示する試み
  if (typeof event.reason === 'object' && event.reason !== null && !(event.reason instanceof Error)) {
    try {
      console.log('Reason object (stringified):', JSON.stringify(event.reason, Object.getOwnPropertyNames(event.reason)));
    } catch (e) {
      console.log('Could not stringify event.reason object.');
    }
  }

  if (event.reason?.name === 'FetchError') {
    console.info('FetchError: このエラーはブラウザ拡張機能と関連している可能性があります。');
  }
});

// runtime.lastErrorのエラーを抑制するためのグローバルエラーハンドラー
const originalConsoleError = console.error;
console.error = function(...args) {
  if (
    args[0] && 
    typeof args[0] === 'string' && 
    (args[0].includes('runtime.lastError') || args[0].includes('You cannot render a <Router>'))
  ) {
    // runtime.lastErrorとRouter関連のエラーを抑制
    return;
  }
  originalConsoleError.apply(console, args);
};

// リロード時にも適切なルートを保持するためのグローバル関数
window.navigateToHashPath = (path: string) => {
  window.location.hash = path.startsWith('/') ? path : `/${path}`;
};

// ディープリンクを処理するためのヘルパー
const handleDirectNavigation = () => {
  // URLからディープリンクを取得
  const hash = window.location.hash;
  // HashRouterを使用している場合はハッシュからパスを抽出
  if (hash && hash !== '#/') {
    console.log('Direct navigation detected:', hash);
  }
  // 404ページからのリダイレクトを検出
  if (window.location.pathname.includes('404')) {
    window.location.href = '/';
  }
};

// 初期ロード時にディープリンクを処理
handleDirectNavigation();

// HashRouterを使用 - パスのスラッシュを正しく扱えるよう設定
ReactDOM.createRoot(document.getElementById('root')!).render(
  <HashRouter>
    <App />
  </HashRouter>
);
