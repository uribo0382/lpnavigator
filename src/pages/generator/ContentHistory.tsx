import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, ExternalLink, Download, Eye, Trash2, X, Copy, Edit, Check, Save, FileText, Clock, ArrowUpRight } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useAuthFixed as useAuth } from '../../contexts/AuthContextFixed';
import { contentHistoryService, BasicInfo, SavedContent } from '../../services/contentHistoryService';

interface ItemToDelete {
  id: string;
  type: 'saved' | 'completed';
}

const ContentHistory: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [completedBasicInfos, setCompletedBasicInfos] = useState<BasicInfo[]>([]);
  const [savedContents, setSavedContents] = useState<SavedContent[]>([]);
  const [filteredCompletedInfos, setFilteredCompletedInfos] = useState<BasicInfo[]>([]);
  const [filteredSavedContents, setFilteredSavedContents] = useState<SavedContent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('completed');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 削除確認ダイアログ用 state
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ItemToDelete | null>(null);

  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        
        // 生成済み基本情報を取得
        let basicInfosData: BasicInfo[] = [];
        try {
          basicInfosData = await contentHistoryService.getCompletedBasicInfos(currentUser.id);
          console.log('Fetched basic infos for user:', basicInfosData.length);
        } catch (err) {
          console.error('Error fetching basic infos:', err);
        }
        
        // 保存データを取得
        let savedContentsData: SavedContent[] = [];
        try {
          savedContentsData = await contentHistoryService.getSavedContents(currentUser.id);
          console.log('Fetched saved contents for user:', savedContentsData.length);
        } catch (err) {
          console.error('Error fetching saved contents:', err);
        }
        
        setCompletedBasicInfos(basicInfosData);
        setFilteredCompletedInfos(basicInfosData);
        setSavedContents(savedContentsData);
        setFilteredSavedContents(savedContentsData);
        
        // localStorageからタブ状態を取得
        const savedTab = localStorage.getItem('lp_navigator_history_tab');
        if (savedTab === 'saved') {
          setActiveTab('saved');
          localStorage.removeItem('lp_navigator_history_tab');
        }
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError(`データの取得中にエラーが発生しました: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser]);

  // 検索処理
  useEffect(() => {
    const performSearch = async () => {
      if (!currentUser) return;
      
      try {
        if (!searchTerm.trim()) {
          // 検索語が空の場合は全データを表示
          setFilteredCompletedInfos(completedBasicInfos);
          setFilteredSavedContents(savedContents);
          return;
        }
        
        if (activeTab === 'completed') {
          const filtered = await contentHistoryService.searchBasicInfos(currentUser.id, searchTerm);
          setFilteredCompletedInfos(filtered);
        } else {
          const filtered = await contentHistoryService.searchSavedContents(currentUser.id, searchTerm);
          setFilteredSavedContents(filtered);
        }
      } catch (searchError) {
        console.error('Search error:', searchError);
        setError('検索処理中にエラーが発生しました。');
      }
    };
    
    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, activeTab, currentUser, completedBasicInfos, savedContents]);

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

  // HTMLコンテンツから文字数を計算する関数
  const calculateWordCount = (htmlContent: string): number => {
    if (!htmlContent) return 0;
    
    // HTMLタグを除去してテキストのみを抽出
    const textContent = htmlContent.replace(/<[^>]*>/g, '');
    // 改行や余分な空白を除去
    const cleanedText = textContent.replace(/\s+/g, ' ').trim();
    
    return cleanedText.length;
  };

  // HTMLコンテンツから説明文を抽出する関数
  const extractDescription = (htmlContent: string, maxLength: number = 150): string => {
    if (!htmlContent) return '';
    
    // HTMLタグを除去してテキストのみを抽出
    const textContent = htmlContent.replace(/<[^>]*>/g, '');
    // 改行や余分な空白を除去
    const cleanedText = textContent.replace(/\s+/g, ' ').trim();
    
    // 最初の段落または指定文字数まで
    const firstParagraph = cleanedText.split('\n')[0];
    const description = firstParagraph || cleanedText;
    
    if (description.length > maxLength) {
      return description.substring(0, maxLength - 3) + '...';
    }
    
    return description;
  };

  // 削除ボタンクリック時の処理
  const handleDeleteItem = (id: string) => {
    setItemToDelete({ id, type: activeTab as 'saved' | 'completed' });
    setShowDeleteConfirmDialog(true);
  };

  // 確認ダイアログで「削除」をクリックしたときの処理
  const executeDelete = async () => {
    if (!itemToDelete) return;

    const { id, type } = itemToDelete;
    setSelectedId(id);

    try {
      if (type === 'saved') {
        await contentHistoryService.deleteSavedContent(id);
        setSavedContents(prev => prev.filter(item => item.id !== id));
        setFilteredSavedContents(prev => prev.filter(item => item.id !== id));
      } else {
        await contentHistoryService.deleteBasicInfo(id);
        setCompletedBasicInfos(prev => prev.filter(item => item.id !== id));
        setFilteredCompletedInfos(prev => prev.filter(item => item.id !== id));
      }
      setError(null);
    } catch (deleteError) {
      console.error(`Failed to delete ${type} item:`, deleteError);
      setError(`${type === 'saved' ? '保存済み' : '生成済み'}アイテムの削除中にエラーが発生しました。`);
    } finally {
      setSelectedId(null);
      setShowDeleteConfirmDialog(false);
      setItemToDelete(null);
    }
  };

  const handleViewItem = async (id: string) => {
    try {
      const item = await contentHistoryService.getBasicInfoById(id);
      if (item) {
        // 選択した基本情報をローカルストレージに保存
        localStorage.setItem('lp_navigator_generated_content', JSON.stringify({
          id: item.id,
          title: item.title,
          content: item.content,
          metaDescription: item.meta_description,
          permalink: item.permalink,
          model: item.generated_by,
          wordCount: item.word_count,
          createdAt: item.created_at
        }));
        
        // 基本情報詳細ページへ遷移
        navigate('/generator/content');
      }
    } catch (error) {
      console.error('View item error:', error);
      setError('コンテンツの表示中にエラーが発生しました。');
    }
  };

  const handleEditSavedItem = async (item: SavedContent) => {
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

  const handleDownloadItem = (item: BasicInfo) => {
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

  // 進捗状況の色を決定する関数
  const getProgressColor = (progress: number) => {
    if (progress < 30) return '#ef4444'; // 赤
    if (progress < 70) return '#f59e0b'; // オレンジ
    return '#10b981'; // 緑
  };
  
  if (!currentUser) {
    return (
      <div className="flex-1 overflow-y-auto p-0">
        <div className="text-center py-8">
          <p className="text-gray-500">ログインしてください。</p>
        </div>
      </div>
    );
  }

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
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">読み込み中...</p>
          </div>
        ) : activeTab === 'completed' ? (
          <div className="space-y-6">
            {filteredCompletedInfos.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">該当する記事が見つかりませんでした。</p>
              </div>
            ) : (
              filteredCompletedInfos.map((item) => (
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
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{extractDescription(item.content)}</p>
                  <div className="flex flex-wrap gap-y-2 gap-x-4 text-xs text-gray-500">
                    <div>生成日時: {formatDateDisplay(item.created_at)}</div>
                    <div>使用モデル: {item.generated_by || '不明'}</div>
                    <div>文字数: 約{calculateWordCount(item.content)}文字</div>
                    {item.permalink && (
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
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : ( // activeTab === 'saved'
          <div className="space-y-6">
            {filteredSavedContents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">保存されたデータがありません。</p>
                <Button
                  variant="outline"
                  leftIcon={<FileText size={16} />}
                  onClick={() => navigate('/generator')}
                  className="mt-4"
                >
                  新しいLP記事を作成
                </Button>
              </div>
            ) : (
              filteredSavedContents.map((item) => (
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
                      {formatDateDisplay(item.updated_at)}
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