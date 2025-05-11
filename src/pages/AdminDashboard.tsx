import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// 管理者サブページのモックコンポーネント
const QuestionsManagement = () => (
  <div className="p-4">
    <h2 className="text-xl font-bold mb-4">質問一覧</h2>
    <p className="text-gray-600">ここに質問の一覧が表示されます。</p>
  </div>
);

const QuestionEditor = () => (
  <div className="p-4">
    <h2 className="text-xl font-bold mb-4">質問作成 / 編集</h2>
    <p className="text-gray-600">質問の作成・編集フォームが表示されます。</p>
  </div>
);

const UsersManagement = () => (
  <div className="p-4">
    <h2 className="text-xl font-bold mb-4">ユーザー一覧</h2>
    <p className="text-gray-600">ユーザー一覧が表示されます。</p>
  </div>
);

const UserEditor = () => (
  <div className="p-4">
    <h2 className="text-xl font-bold mb-4">ユーザー登録 / 編集</h2>
    <p className="text-gray-600">ユーザーの登録・編集フォームが表示されます。</p>
  </div>
);

const ApiSettings = () => (
  <div className="p-4">
    <h2 className="text-xl font-bold mb-4">API設定</h2>
    <p className="text-gray-600">API連携情報の設定画面です。</p>
  </div>
);

const Analytics = () => (
  <div className="p-4">
    <h2 className="text-xl font-bold mb-4">分析・レポート</h2>
    <p className="text-gray-600">利用統計やレポートが表示されます。</p>
  </div>
);

// デフォルトの管理画面
const DefaultAdmin = () => (
  <div className="p-4">
    <h2 className="text-xl font-bold mb-4">管理画面トップ</h2>
    <p className="text-gray-600">
      左のメニューから管理機能を選択してください。
    </p>
    <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-4">
      <p className="text-blue-700">
        現在HashRouterを使用しています。URLが「/#/admin/〇〇」の形式になっています。
      </p>
    </div>
  </div>
);

const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 現在のパスを location.pathname から取得
  const currentPath = location.pathname;

  console.log('AdminDashboard マウント/更新');
  console.log('location.pathname:', location.pathname);
  console.log('window.location.hash:', window.location.hash); // 比較用
  
  React.useEffect(() => {
    console.log('AdminDashboard - Current path (from location.pathname):', currentPath);
    const pageTitle = currentPath.split('/').pop() || 'ダッシュボード';
    document.title = `管理画面 | ${pageTitle}`;
  }, [currentPath]);
  
  React.useEffect(() => {
    // /admin または /admin/ の場合、/admin/questions にリダイレクト
    if (currentPath === '/admin' || currentPath === '/admin/') {
      console.log('初期リダイレクト: /admin → /admin/questions using react-router navigate');
      navigate('/admin/questions', { replace: true });
    }
  }, [currentPath, navigate]);

  const getContent = () => {
    console.log('レンダリング判定 path (from location.pathname):', currentPath);

    const routes = [
      { path: /^\/admin\/questions\/new$/, component: <QuestionEditor />, name: "Question New" },
      { path: /^\/admin\/questions\/edit\/[\w-]+$/, component: <QuestionEditor />, name: "Question Edit" },
      { path: /^\/admin\/questions\/[\w-]+$/, component: <QuestionEditor />, name: "Question Detail" }, // Detail/ID付き汎用
      { path: /^\/admin\/questions$/, component: <QuestionsManagement />, name: "Questions List" },
      { path: /^\/admin\/users\/new$/, component: <UserEditor />, name: "User New" },
      { path: /^\/admin\/users\/edit\/[\w-]+$/, component: <UserEditor />, name: "User Edit" },
      { path: /^\/admin\/users\/[\w-]+$/, component: <UserEditor />, name: "User Detail" }, // Detail/ID付き汎用
      { path: /^\/admin\/users$/, component: <UsersManagement />, name: "Users List" },
      { path: /^\/admin\/api-settings$/, component: <ApiSettings />, name: "API Settings" },
      { path: /^\/admin\/analytics$/, component: <Analytics />, name: "Analytics" },
    ];

    for (const route of routes) {
      if (route.path.test(currentPath)) {
        console.log('Matched route:', route.name, 'for path:', currentPath);
        return route.component;
      }
    }

    // /admin または /admin/ の場合 (初期リダイレクトがまだ処理されていない場合など)
    if (/^\/admin\/?$/.test(currentPath)) {
      console.log('Matched DefaultAdmin (or awaiting redirect) for path:', currentPath);
      return <DefaultAdmin />; // or a loading indicator
    }
    
    // 上記いずれにもマッチしないが /admin で始まる場合 (予期せぬパス)
    if (currentPath.startsWith('/admin')) {
      console.warn('Unhandled admin path, showing DefaultAdmin as fallback:', currentPath);
      return <DefaultAdmin />;
    }

    console.error('No admin route matched, this should not happen if /admin/* catches it. Path:', currentPath);
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
        <p className="text-yellow-700">
          指定されたページ「{currentPath}」が見つかりません。
        </p>
      </div>
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">管理者ダッシュボード</h1>
      
      <div className="bg-gray-50 p-3 rounded mb-6 text-sm text-gray-600">
        現在のパス (from location.pathname): {currentPath}
        <div className="text-xs text-gray-400 mt-1">
          Browser URL (window.location.href): {window.location.href}
        </div>
      </div>
      
      {getContent()}
    </div>
  );
};

export default AdminDashboard;