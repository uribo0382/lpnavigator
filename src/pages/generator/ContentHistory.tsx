import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, ExternalLink, Download, Eye, Trash2, X, Copy, Edit, Check, Save, FileText, Clock, ArrowUpRight } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { mockContentHistory } from '../../utils/mockData';

// 保存データの型定義
interface SavedData {
  id: string;
  title: string;
  date: string;
  progress: number;
  answers: Record<string, string>;
}

// 新しい保存データモック（5件）
const mockSavedItemsData: SavedData[] = [
  {
    id: 'saved-lp-001',
    title: '春のキャンペーンLP (下書き)',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    progress: 75,
    answers: {
      '1': '商品Aの基本情報',
      '2': 'ターゲット顧客は30代女性',
      '3': '春らしいデザインコンセプト',
      '4': '特別セール価格',
      '5': '初回購入特典'
    }
  },
  {
    id: 'saved-lp-002',
    title: '新製品紹介LP (構成案)',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    progress: 30,
    answers: {
      '1': '製品Xの概要',
      '2': '主なターゲット層'
    }
  },
  {
    id: 'saved-lp-003',
    title: 'セミナー告知LP (情報収集中)',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    progress: 15,
    answers: { '1': 'セミナーのテーマ' }
  },
  {
    id: 'saved-lp-004',
    title: '夏の特別オファーLP (計画中)',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    progress: 50,
    answers: {
      '1': 'サマープロモーション',
      '2': '割引情報'
    }
  },
  {
    id: 'saved-lp-005',
    title: '秋のイベントLP (下書き)',
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    progress: 20,
    answers: {
      '1': 'イベント内容',
      '3': '参加特典'
    }
  }
];

// モック履歴データを拡張 (生成済みLP記事用)
const mockGeneratedLPs = mockContentHistory.map(item => ({
  ...item,
  excerpt: 'このLP記事は、ユーザーの課題を解決し、価値を提供するために作成されました。効果的なコンテンツが含まれています。',
  status: 'completed',
  content: `<h1>${item.title}</h1>
<p>このLP記事は、ユーザーの課題を解決し、価値を提供するために作成されました。効果的なコンテンツを含むランディングページです。</p>

<h2>商品の特徴</h2>
<ul>
  <li>使いやすさを重視した設計</li>
  <li>豊富な機能性</li>
  <li>高いコストパフォーマンス</li>
</ul>

<h2>お客様の声</h2>
<blockquote>
  「この商品を導入してから、業務効率が格段に向上しました。操作も簡単で、チームの全員が問題なく使えています。」
  <cite>- A社 マーケティング担当者</cite>
</blockquote>

<h2>今すぐ行動しましょう</h2>
<p>期間限定のスペシャルオファーをお見逃しなく。今なら初期費用無料でサービスをご利用いただけます。</p>

<div class="cta-box">
  <button class="cta-button">今すぐ詳細を見る</button>
</div>`
}));

interface ItemToDelete {
  id: string;
  type: 'saved' | 'completed';
}

const ContentHistory: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredGeneratedLPs, setFilteredGeneratedLPs] = useState(mockGeneratedLPs);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [savedItems, setSavedItems] = useState<SavedData[]>([]);
  const [activeTab, setActiveTab] = useState('completed');
  const [error, setError] = useState<string | null>(null);

  // 削除確認ダイアログ用 state
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ItemToDelete | null>(null);

  // 初期表示でモックデータを登録
  useEffect(() => {
    setSavedItems(mockSavedItemsData);
    localStorage.setItem('lp_navigator_saved_list', JSON.stringify(mockSavedItemsData));
    setActiveTab('completed');
  }, []);

  // 検索処理 (生成済みLPと保存データの両方に対応)
  useEffect(() => {
    try {
      if (activeTab === 'completed') {
        if (!searchTerm.trim()) {
          setFilteredGeneratedLPs(mockGeneratedLPs);
          return;
        }
        const filtered = mockGeneratedLPs.filter(item =>
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.metaDescription.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredGeneratedLPs(filtered);
      } else { // activeTab === 'saved'
        // 保存データ用のフィルタ処理は map 時に行う
      }
    } catch (searchError) {
      console.error('Search error:', searchError);
      setError('検索処理中にエラーが発生しました。');
    }
  }, [searchTerm, activeTab]);

  const formatDateDisplay = (dateStr: string | Date) => {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 削除ボタンクリック時の処理 (ダイアログ表示をトリガー)
  const handleDeleteItem = (id: string) => {
    setItemToDelete({ id, type: activeTab as 'saved' | 'completed' });
    setShowDeleteConfirmDialog(true);
  };

  // 確認ダイアログで「削除」をクリックしたときの処理
  const executeDelete = () => {
    if (!itemToDelete) return;

    const { id, type } = itemToDelete;
    setSelectedId(id); // ローディング表示用 (削除処理中)

    setTimeout(() => {
      try {
        if (type === 'saved') {
          const updatedSavedItems = savedItems.filter(item => item.id !== id);
          setSavedItems(updatedSavedItems);
          localStorage.setItem('lp_navigator_saved_list', JSON.stringify(updatedSavedItems));
          setError(null);
        } else { // type === 'completed'
          setFilteredGeneratedLPs(prevLPs => prevLPs.filter(item => item.id !== id));
          setError(null);
        }
      } catch (deleteError) {
        console.error(`Failed to delete ${type} item:`, deleteError);
        setError(`${type === 'saved' ? '保存済み' : '生成済み'}アイテムの削除中にエラーが発生しました。`);
      }
      setSelectedId(null); // ローディング解除
      setShowDeleteConfirmDialog(false);
      setItemToDelete(null);
    }, 800);
  };

  const handleViewItem = (id: string) => {
    try {
      const item = filteredGeneratedLPs.find(i => i.id === id);
      if (item) {
        // 選択した基本情報をローカルストレージに保存
        localStorage.setItem('lp_navigator_generated_content', JSON.stringify(item));
        
        // 基本情報詳細ページへ遷移
        navigate('/generator/content');
      }
    } catch (error) {
      console.error('View item error:', error);
      setError('コンテンツの表示中にエラーが発生しました。');
    }
  };

  const handleEditSavedItem = async (item: SavedData) => {
    try {
      // LocalStorageにアンサーをセット
      localStorage.setItem('lp_navigator_answers', JSON.stringify(item.answers));
      localStorage.setItem('lp_navigator_last_saved', item.id);
      
      // 少し遅延を入れて状態が確実に保存されるようにする
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 編集画面へ遷移
      navigate('/generator', { 
        state: { 
          fromHistory: true, 
          savedDataId: item.id 
        }
      });
    } catch (error) {
      console.error('Navigation error:', error);
      setError('ページ遷移中にエラーが発生しました。ページを再読み込みしてください。');
      
      // エラー時のフォールバック
      setTimeout(() => { 
        try {
          window.location.href = '/generator'; 
        } catch (e) {
          console.error('Fallback navigation failed:', e);
        }
      }, 1500);
    }
  };

  const handleDownloadItem = (item: typeof mockGeneratedLPs[0]) => {
    try {
      const element = document.createElement('a');
      const file = new Blob([item.content], {type: 'text/html'});
      element.href = URL.createObjectURL(file);
      element.download = `${item.permalink || 'lp-content'}.html`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.error('Download error:', error);
      setError('ダウンロード中にエラーが発生しました。');
    }
  };

  // 保存データタブで表示するアイテムリスト (検索対応)
  const displayedSavedItems = searchTerm.trim() 
    ? savedItems.filter(item => item.title.toLowerCase().includes(searchTerm.toLowerCase()))
    : savedItems;

  // 進捗状況の色を決定する関数
  const getProgressColor = (progress: number) => {
    if (progress < 30) return '#ef4444'; // 赤
    if (progress < 70) return '#f59e0b'; // オレンジ
    return '#10b981'; // 緑
  };

  return (
    <div className="flex-1 overflow-y-auto p-0">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">基本情報一覧</h1>

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

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <FileText size={20} className="mr-2 text-primary-500" />
            基本情報検索
          </h2>
        </div>

        <div className="flex mb-6 border-b">
          <button
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'completed' 
                ? 'border-primary-500 text-primary-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('completed')}
          >
            生成済み基本情報
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'saved' 
                ? 'border-primary-500 text-primary-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('saved')}
          >
            保存データ
          </button>
        </div>

        <div className="mb-4">
          <Input
            placeholder="タイトルで検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search size={16} className="text-gray-400" />}
            fullWidth
          />
        </div>
      </div>

      <Card className="p-4 md:p-6">
        {activeTab === 'completed' ? (
          <div className="space-y-6">
            {filteredGeneratedLPs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">該当する記事が見つかりませんでした。</p>
              </div>
            ) : (
              filteredGeneratedLPs.map((item) => (
                <div key={item.id} className="border-b pb-6 last:border-b-0 last:pb-0">
                  <div className="flex justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Eye size={14} />}
                        onClick={() => handleViewItem(item.id)}
                      >
                        表示
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        leftIcon={<Trash2 size={14} />}
                        onClick={() => handleDeleteItem(item.id)}
                        isLoading={selectedId === item.id && activeTab === 'completed'}
                      >
                        削除
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{item.metaDescription}</p>
                  <div className="flex flex-wrap gap-y-2 gap-x-4 text-xs text-gray-500">
                    <div>生成日時: {formatDateDisplay(item.createdAt)}</div>
                    <div>使用モデル: {item.model}</div>
                    <div>文字数: 約{item.wordCount}文字</div>
                    <div className="flex items-center">
                      パーマリンク: 
                      <a 
                        href={`/generator/content/${item.permalink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1 text-primary-600 hover:text-primary-800 flex items-center"
                      >
                        {item.permalink}
                        <ExternalLink size={12} className="ml-1" />
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : ( // activeTab === 'saved'
          <div className="space-y-6">
            {displayedSavedItems.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">保存されたデータがありません。</p>
                <Button
                  variant="outline"
                  leftIcon={<FileText size={16} />}
                  onClick={() => navigate('/generator')} // Navigate to creation flow
                  className="mt-4"
                >
                  新しいLP記事を作成
                </Button>
              </div>
            ) : (
              displayedSavedItems.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <FileText size={18} className="mr-2 text-primary-500" />
                      {item.title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<ArrowUpRight size={14} />}
                        onClick={() => handleEditSavedItem(item)}
                      >
                        編集を続ける
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        leftIcon={<Trash2 size={14} />}
                        onClick={() => handleDeleteItem(item.id)}
                        isLoading={selectedId === item.id && activeTab === 'saved'}
                      >
                        削除
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock size={14} className="mr-1" />
                      {formatDateDisplay(item.date)}
                    </div>
                    <div className="flex items-center">
                      <div className="text-xs font-medium text-gray-500 mr-2">
                        進捗状況: {Math.round(item.progress)}%
                      </div>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full"
                          style={{ 
                            width: `${item.progress}%`,
                            backgroundColor: getProgressColor(item.progress)
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Card>

      {/* 削除確認ダイアログ */}
      <ConfirmDialog
        isOpen={showDeleteConfirmDialog}
        onClose={() => {
          setShowDeleteConfirmDialog(false);
          setItemToDelete(null);
        }}
        title={`${itemToDelete?.type === 'saved' ? '保存データ' : '基本情報'}を削除しますか？`}
        message={`この${itemToDelete?.type === 'saved' ? '保存データ' : '基本情報'}は完全に削除され、元に戻すことはできません。`}
        confirmLabel="削除する"
        cancelLabel="キャンセル"
        onConfirm={executeDelete}
      />
    </div>
  );
};

export default ContentHistory;