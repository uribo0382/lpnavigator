import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import QuestionFlow from './generator/QuestionFlow';

const ContentGenerator: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentContent, setCurrentContent] = useState<{
    title: string;
    content: string;
    metaDescription: string;
    permalink: string;
    createdAt: Date;
  } | null>(null);
  const [navigationError, setNavigationError] = useState<string | null>(null);

  // ローカルストレージからコンテンツを復元
  useEffect(() => {
    const loadContent = async () => {
      try {
        const savedContent = localStorage.getItem('lp_navigator_generated_content');
        if (savedContent) {
          try {
            const parsedContent = JSON.parse(savedContent);
            // 日付文字列をDate型に変換
            parsedContent.createdAt = new Date(parsedContent.createdAt);
            setCurrentContent(parsedContent);
          } catch (e) {
            console.error('Failed to parse saved content:', e);
          }
        }
      } catch (error) {
        console.error('Content loading error:', error);
      }
    };

    loadContent();
  }, []);

  // コンテンツ生成ハンドラー
  const handleContentGenerated = (content: {
    title: string;
    content: string;
    metaDescription: string;
    permalink: string;
    createdAt: Date;
  }) => {
    setCurrentContent(content);
    // ローカルストレージに保存
    try {
      localStorage.setItem('lp_navigator_generated_content', JSON.stringify(content));
    } catch (error) {
      console.error('Failed to save content to localStorage:', error);
    }
    
    // 生成されたコンテンツページに移動
    try {
      // ハッシュをクリアしてからナビゲート
      window.history.replaceState(null, '', window.location.pathname);
      navigate('/generator/content', { replace: true });
    } catch (error) {
      console.error('Navigation error:', error);
      // フォールバックとしてwindow.locationを使用（HashRouter形式）
      window.location.href = '#/generator/content';
    }
  };

  // ナビゲーションエラーが発生した場合
  if (navigationError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-error-50 border border-error-200 text-error-700 p-6 rounded-md max-w-md">
          <h2 className="text-lg font-medium mb-2">エラーが発生しました</h2>
          <p className="mb-4">{navigationError}</p>
          <button 
            className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
            onClick={() => window.location.reload()}
          >
            ページを再読み込み
          </button>
        </div>
      </div>
    );
  }

  // 単一のコンポーネントを返す
  return <QuestionFlow onContentGenerated={handleContentGenerated} />;
};

export default ContentGenerator;