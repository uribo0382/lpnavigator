import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Copy, Download, Pencil, FileText, ListChecks, Check, RefreshCw, Edit, Save, Bot, Sparkles, Zap, FileEdit } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

// 広告文の型定義
interface AdCopy {
  id: string;
  title: string;
  content: string;
  source: string; // AIモデル名（"ChatGPT", "Gemini", "Claude"など）
  basicInfoId: string; // 元になった基本情報のID
  formulaId: string; // 使用したフォーミュラのID
  createdAt: Date;
}

interface AdCopyDisplayProps {
  adCopy?: AdCopy | null;
  onNewAdCopy?: () => void;
}

const AdCopyDisplay: React.FC<AdCopyDisplayProps> = (props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [copied, setCopied] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 広告文データの状態
  const [adCopy, setAdCopy] = useState<AdCopy | null>(props.adCopy || null);
  // 3つのモデルの広告文
  const [allAdCopies, setAllAdCopies] = useState<AdCopy[]>([]);
  // 現在表示中のモデル
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  // 編集モード
  const [editingModel, setEditingModel] = useState<string | null>(null);
  // 編集中の内容
  const [editingContent, setEditingContent] = useState<string>('');

  // 広告文がない場合はローカルストレージから読み込む
  useEffect(() => {
    if (!props.adCopy) {
      const savedAdCopy = localStorage.getItem('lp_navigator_generated_adcopy');
      if (savedAdCopy) {
        try {
          const parsedAdCopy = JSON.parse(savedAdCopy);
          parsedAdCopy.createdAt = new Date(parsedAdCopy.createdAt);
          setAdCopy(parsedAdCopy);
          setSelectedModel(parsedAdCopy.source);

          // 広告文履歴から同じタイトルの他のモデルの広告文を探す
          const savedHistory = localStorage.getItem('lp_navigator_adcopy_history');
          if (savedHistory) {
            const history = JSON.parse(savedHistory);
            const formattedHistory = history.map((item: any) => ({
              ...item,
              createdAt: new Date(item.createdAt)
            }));
            
            // タイトルの基本部分（モデル名を除いた部分）を取得
            const baseTitle = parsedAdCopy.title.replace(/ - 広告文 \(.+\)$/, '');
            
            // 同じ基本タイトルを持つ広告文を全て取得
            const relatedAdCopies = formattedHistory.filter((item: AdCopy) => {
              const itemBaseTitle = item.title.replace(/ - 広告文 \(.+\)$/, '');
              return itemBaseTitle === baseTitle;
            });
            
            setAllAdCopies(relatedAdCopies);
            setError(null);
          }
        } catch (e) {
          console.error('Failed to parse saved ad copy:', e);
          setError('広告文の読み込み中にエラーが発生しました。');
          redirectToCreate();
        }
      } else {
        redirectToCreate();
      }
    } else {
      setAdCopy(props.adCopy);
      setSelectedModel(props.adCopy.source);
    }
  }, [props.adCopy]);

  // 広告文生成画面にリダイレクト
  const redirectToCreate = () => {
    try {
      setIsLoading(true);
      setTimeout(() => {
        try {
          navigate('/generator/adcopy/create', { replace: true });
        } catch (error) {
          console.error('Navigation error:', error);
          window.location.href = '/generator/adcopy/create';
        }
        setIsLoading(false);
      }, 500);
    } catch (e) {
      console.error('Navigation error:', e);
      try {
        navigate('/generator/adcopy/create', { replace: true });
      } catch (error) {
        console.error('Navigation error:', error);
        window.location.href = '/generator/adcopy/create';
      }
    }
  };

  // 新規作成ハンドラー
  const handleNewAdCopy = () => {
    if (props.onNewAdCopy) {
      props.onNewAdCopy();
      return;
    }
    
    try {
      navigate('/generator/adcopy/create', { replace: true });
    } catch (error) {
      console.error('Navigation error:', error);
      window.location.href = '/generator/adcopy/create';
    }
  };

  // 広告文一覧ページに移動
  const handleViewHistory = () => {
    try {
      navigate('/generator/adcopy/history', { replace: true });
    } catch (error) {
      console.error('Navigation error:', error);
      window.location.href = '/generator/adcopy/history';
    }
  };

  // LP記事生成ボタンのハンドラー
  const handleGenerateLpArticle = (adCopy: AdCopy) => {
    // 選択された広告文をローカルストレージに保存
    localStorage.setItem('lp_navigator_selected_adcopy', JSON.stringify(adCopy));
    
    // LP記事生成画面に移動
    try {
      navigate('/generator/lparticle/create', { replace: true });
    } catch (error) {
      console.error('Navigation error:', error);
      window.location.href = '/generator/lparticle/create';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw size={40} className="mx-auto mb-4 text-primary-500 animate-spin" />
          <p className="text-gray-600">広告文を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!adCopy) {
    return null;
  }

  // コピー機能
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

  // 特定のモデルの広告文を取得
  const getAdCopyByModel = (model: string) => {
    return allAdCopies.find(copy => copy.source === model) || null;
  };

  // 編集モードへの切り替え
  const handleEditStart = (model: string) => {
    const modelAdCopy = getAdCopyByModel(model);
    if (!modelAdCopy) return;
    
    setEditingModel(model);
    setEditingContent(modelAdCopy.content);
  };

  // 編集キャンセル
  const handleEditCancel = () => {
    setEditingModel(null);
    setEditingContent('');
  };

  // 編集内容の保存
  const handleSaveEdit = (model: string) => {
    const updatedAdCopies = allAdCopies.map(copy => {
      if (copy.source === model) {
        return { ...copy, content: editingContent };
      }
      return copy;
    });
    
    setAllAdCopies(updatedAdCopies);
    
    // ローカルストレージも更新
    localStorage.setItem('lp_navigator_adcopy_history', JSON.stringify(updatedAdCopies));
    
    // 編集モードを終了
    setEditingModel(null);
    setEditingContent('');
  };

  // 指定モデルの広告文表示（3列比較表示用）
  const renderAdCopyContent = (model: string) => {
    const modelAdCopy = getAdCopyByModel(model);
    if (!modelAdCopy) return <div className="text-gray-400 text-center p-4">未生成</div>;
    
    if (editingModel === model) {
      return (
        <div className="h-full flex flex-col flex-grow">
          <textarea
            className="text-sm text-gray-800 p-4 flex-1 border-0 focus:ring-0 resize-none min-h-[400px] flex-grow"
            value={editingContent}
            onChange={(e) => setEditingContent(e.target.value)}
            autoFocus
          />
          <div className="p-2 flex justify-end space-x-2 border-t sticky bottom-0 bg-white">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditCancel}
            >
              キャンセル
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleSaveEdit(model)}
            >
              保存
            </Button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="text-sm text-gray-800 whitespace-pre-wrap p-4 h-full overflow-auto min-h-[400px] flex-grow">
        {modelAdCopy.content}
      </div>
    );
  };

  // CardのヘッダーにEdit/Saveボタンを追加
  const renderCardHeader = (model: string, Icon: any, color: string) => {
    const modelAdCopy = getAdCopyByModel(model);
    if (!modelAdCopy) return null;
    
    return (
      <div className={`${color} p-4 flex items-center justify-between`}>
        <div className="flex items-center">
          <Icon size={20} className="mr-2" />
          <h3 className="font-medium text-lg">{model}</h3>
        </div>
        <div className="flex items-center space-x-2">
          {editingModel === model ? (
            null
          ) : (
            <>
              <button
                className="text-xs bg-white rounded-full w-8 h-8 flex items-center justify-center border border-gray-200 text-primary-600 hover:bg-primary-600 hover:border-primary-600 transition-colors group"
                onClick={() => handleCopy(modelAdCopy.content, model.toLowerCase())}
                title="コピー"
              >
                {copied === model.toLowerCase() ? (
                  <Check size={14} />
                ) : (
                  <Copy size={14} />
                )}
              </button>
              <button
                className="text-xs bg-white rounded-full w-8 h-8 flex items-center justify-center border border-gray-200 text-primary-600 hover:bg-primary-600 hover:border-primary-600 transition-colors group"
                onClick={() => handleEditStart(model)}
                title="編集"
              >
                <Edit size={14} />
              </button>
              <button
                className="text-xs bg-white rounded-full w-8 h-8 flex items-center justify-center border border-gray-200 text-primary-600 hover:bg-primary-600 hover:border-primary-600 transition-colors group"
                onClick={() => handleGenerateLpArticle(modelAdCopy)}
                title="LP記事生成"
              >
                <FileEdit size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/generator/adcopy/create')}
          className="mr-2"
        >
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-2xl font-bold text-gray-800">
          広告文詳細
          {adCopy.title && <span className="ml-1 font-normal text-gray-600">: {adCopy.title.replace(/ - 広告文 \(.+\)$/, '')}</span>}
        </h1>
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

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-600">
          3種類のAIモデルで生成された広告文を比較できます。
        </p>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            leftIcon={<ListChecks size={16} />}
            onClick={handleViewHistory}
          >
            広告文一覧
          </Button>
        </div>
      </div>

      {/* 3列表示レイアウト - 各AIモデルの広告文を横に並べる */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ChatGPT列 */}
        <Card className={`overflow-hidden flex flex-col ${getAdCopyByModel('ChatGPT') ? 'border-green-300' : ''}`}>
          {renderCardHeader('ChatGPT', Bot, 'bg-green-50 border-b border-green-200')}
          <div className="flex-1 overflow-auto bg-white flex flex-col">
            {renderAdCopyContent('ChatGPT')}
          </div>
        </Card>
        
        {/* Gemini列 */}
        <Card className={`overflow-hidden flex flex-col ${getAdCopyByModel('Gemini') ? 'border-purple-300' : ''}`}>
          {renderCardHeader('Gemini', Sparkles, 'bg-purple-50 border-b border-purple-200')}
          <div className="flex-1 overflow-auto bg-white flex flex-col">
            {renderAdCopyContent('Gemini')}
          </div>
        </Card>
        
        {/* Claude列 */}
        <Card className={`overflow-hidden flex flex-col ${getAdCopyByModel('Claude') ? 'border-amber-300' : ''}`}>
          {renderCardHeader('Claude', Zap, 'bg-amber-50 border-b border-amber-200')}
          <div className="flex-1 overflow-auto bg-white flex flex-col">
            {renderAdCopyContent('Claude')}
          </div>
        </Card>
      </div>

      {/* 追加情報と操作ボタン */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="広告文情報">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-sm font-medium text-gray-700">タイトル</h4>
                <button 
                  className="text-xs text-primary-600 hover:text-primary-800 flex items-center"
                  onClick={() => handleCopy(adCopy.title, 'title')}
                >
                  {copied === 'title' ? (
                    <>
                      <Check size={12} className="mr-1" />
                      <span>コピー済み</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} className="mr-1" />
                      <span>コピー</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm bg-gray-50 p-2 rounded border">{adCopy.title}</p>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-sm font-medium text-gray-700">生成情報</h4>
              </div>
              <div className="text-sm text-gray-600 space-y-1 bg-gray-50 p-2 rounded border">
                <p>生成日時: {formatDateDisplay(adCopy.createdAt)}</p>
                <p>基本情報ID: {adCopy.basicInfoId}</p>
                <p>フォーミュラID: {adCopy.formulaId}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdCopyDisplay; 