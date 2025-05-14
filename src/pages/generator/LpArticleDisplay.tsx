import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Copy, Pencil, FileText, ListChecks, Check, RefreshCw, Edit, Save, Bot, Sparkles, Zap, FileEdit, Pilcrow, Type } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

// LP記事の型定義
interface LpArticle {
  id: string;
  title: string;
  content: string;
  source: string; // AIモデル名（"ChatGPT", "Gemini", "Claude"など）
  basicInfoId: string; // 元になった基本情報のID
  formulaId: string; // 使用したフォーミュラのID
  createdAt: Date;
}

interface LpArticleDisplayProps {
  lpArticle?: LpArticle | null;
  onNewLpArticle?: () => void;
}

const LpArticleDisplay: React.FC<LpArticleDisplayProps> = (props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [copied, setCopied] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // LP記事データの状態
  const [lpArticle, setLpArticle] = useState<LpArticle | null>(props.lpArticle || null);
  // 編集モード
  const [editingModel, setEditingModel] = useState<string | null>(null);
  // 編集中の内容
  const [editingContent, setEditingContent] = useState<string>('');

  // LP記事がない場合はローカルストレージから読み込む
  useEffect(() => {
    if (!props.lpArticle) {
      const savedLpArticle = localStorage.getItem('lp_navigator_generated_lparticle');
      if (savedLpArticle) {
        try {
          const parsedLpArticle = JSON.parse(savedLpArticle);
          parsedLpArticle.createdAt = new Date(parsedLpArticle.createdAt);
          
          // 念のため、contentからHTMLタグを除去する処理を追加
          if (typeof parsedLpArticle.content === 'string') {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = parsedLpArticle.content;
            parsedLpArticle.content = tempDiv.textContent || tempDiv.innerText || '';
          }

          setLpArticle(parsedLpArticle);
        } catch (e) {
          console.error('Failed to parse saved LP article:', e);
          setError('LP記事の読み込み中にエラーが発生しました。');
          redirectToCreate();
        }
      } else {
        redirectToCreate();
      }
    } else {
      setLpArticle(props.lpArticle);
    }
  }, [props.lpArticle]);

  // LP記事生成画面にリダイレクト
  const redirectToCreate = () => {
    try {
      setIsLoading(true);
      setTimeout(() => {
        try {
          navigate('/generator/lparticle/create', { replace: true });
        } catch (error) {
          console.error('Navigation error:', error);
          window.location.href = '/generator/lparticle/create';
        }
        setIsLoading(false);
      }, 500);
    } catch (e) {
      console.error('Navigation error:', e);
      try {
        navigate('/generator/lparticle/create', { replace: true });
      } catch (error) {
        console.error('Navigation error:', error);
        window.location.href = '/generator/lparticle/create';
      }
    }
  };

  // LP記事一覧ページに移動
  const handleViewHistory = () => {
    try {
      navigate('/generator/lparticle/history', { replace: true });
    } catch (error) {
      console.error('Navigation error:', error);
      window.location.href = '/generator/lparticle/history';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw size={40} className="mx-auto mb-4 text-primary-500 animate-spin" />
          <p className="text-gray-600">LP記事を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!lpArticle) {
    return null;
  }

  // テキストとしてコピー
  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  // 日付のフォーマット
  const formatDateDisplay = (date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // モデル別アイコンの取得
  const getModelIcon = (source: string) => {
    switch (source) {
      case 'ChatGPT':
        return <Bot size={18} className="text-green-600" />;
      case 'Gemini':
        return <Sparkles size={18} className="text-purple-600" />;
      case 'Claude':
        return <Zap size={18} className="text-amber-600" />;
      default:
        return null;
    }
  };

  // モデル別カラーの取得
  const getModelColor = (source: string) => {
    switch (source) {
      case 'ChatGPT':
        return 'bg-green-50 border-green-200';
      case 'Gemini':
        return 'bg-purple-50 border-purple-200';
      case 'Claude':
        return 'bg-amber-50 border-amber-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  // 編集モードへの切り替え
  const handleEdit = () => {
    if (lpArticle) {
      if (editingModel === lpArticle.id) {
        handleSaveEdit();
      } else {
        setEditingModel(lpArticle.id);
        setEditingContent(lpArticle.content);
      }
    }
  };

  const handleEditCancel = () => {
    setEditingModel(null);
    setEditingContent('');
  };

  // 編集内容の保存
  const handleSaveEdit = () => {
    if (lpArticle && editingModel === lpArticle.id) {
      const updatedArticle = { ...lpArticle, content: editingContent };
      setLpArticle(updatedArticle);

      // ローカルストレージ履歴の更新
      const savedHistory = localStorage.getItem('lp_navigator_lparticle_history');
      if (savedHistory) {
        const history: LpArticle[] = JSON.parse(savedHistory);
        const updatedHistory = history.map(item => 
          item.id === updatedArticle.id ? updatedArticle : item
        );
        localStorage.setItem('lp_navigator_lparticle_history', JSON.stringify(updatedHistory));
      }
      // 現在表示している記事データも更新
      localStorage.setItem('lp_navigator_generated_lparticle', JSON.stringify(updatedArticle));

      setEditingModel(null);
    }
  };

  // LP記事のコンテンツ表示
  const renderLpContent = () => {
    if (!lpArticle) return <div className="text-gray-400 text-center p-4">LP記事がありません。</div>;

    if (editingModel === lpArticle.id) {
      return (
        <div className="h-full flex flex-col flex-grow">
          <textarea
            className="text-sm text-gray-800 p-4 flex-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500 resize-none min-h-[400px] flex-grow"
            value={editingContent}
            onChange={(e) => setEditingContent(e.target.value)}
            autoFocus
          />
        </div>
      );
    }

    return (
      <div className="text-sm text-gray-800 whitespace-pre-wrap p-4 border border-gray-200 rounded-md bg-gray-50 min-h-[400px] overflow-auto">
        {lpArticle.content}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/generator/lparticle/create')}
            className="mr-2"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">
            LP記事詳細
            {lpArticle && lpArticle.title && 
              <span className="ml-1 font-normal text-gray-600">: {lpArticle.title.replace(/ - LP記事 \(.+\)$/, '')}</span>}
          </h1>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            leftIcon={<ListChecks size={16} />}
            onClick={handleViewHistory}
          >
            LP記事一覧
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 p-4 rounded-md mb-4">
          <p className="text-sm">{error}</p>
          <Button 
            variant="outline" 
            size="sm"
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            再読み込み
          </Button>
        </div>
      )}

      {lpArticle && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <div className={`p-4 flex items-center justify-between ${getModelColor(lpArticle.source)} border-b`}>
                <div className="flex items-center">
                  {getModelIcon(lpArticle.source)}
                  <h3 className="font-medium text-lg ml-2">{lpArticle.source}によるLP記事</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    className={`text-xs rounded-full w-8 h-8 flex items-center justify-center border border-gray-300 transition-colors 
                              ${editingModel === lpArticle.id ? 'bg-primary-600 text-white' : 'bg-white text-primary-600 hover:bg-primary-50'}`}
                    onClick={handleEdit}
                    title={editingModel === lpArticle.id ? "保存" : "編集"}
                  >
                    {editingModel === lpArticle.id ? <Save size={14} /> : <Edit size={14} />}
                  </button>
                  {editingModel === lpArticle.id && (
                    <Button variant="outline" size="sm" onClick={handleEditCancel} title="キャンセル">
                      <Check size={14} />
                    </Button>
                  )}
                  <button 
                    className="text-xs bg-white rounded-full w-8 h-8 flex items-center justify-center border border-gray-300 text-primary-600 hover:bg-primary-50 transition-colors"
                    onClick={() => handleCopy(lpArticle.content, 'content')}
                    title="コピー"
                  >
                    {copied === 'content' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
              <div className="p-4">
                {renderLpContent()}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-4">
            <Card title="LP記事情報">
              <div className="space-y-3 p-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">タイトル</h4>
                  <p className="text-sm bg-gray-50 p-2 rounded border">{lpArticle.title}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">生成情報</h4>
                  <div className="text-xs text-gray-600 space-y-1 bg-gray-50 p-2 rounded border">
                    <p>モデル: {lpArticle.source}</p>
                    <p>生成日時: {formatDateDisplay(lpArticle.createdAt)}</p>
                    <p>基本情報ID: {lpArticle.basicInfoId}</p>
                    <p>フォーミュラID: {lpArticle.formulaId}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default LpArticleDisplay; 