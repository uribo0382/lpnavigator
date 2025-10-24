import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2, ExternalLink, Calendar, Bot, RefreshCw, Zap, Sparkles, Eye, Download, FileEdit } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useAuthFixed as useAuth } from '../../contexts/AuthContextFixed';
import { lpArticleService } from '../../services/lpArticleService';
import type { LpArticle as LpArticleServiceType } from '../../services/lpArticleService';

// LP記事の型定義（互換性のために拡張）
interface LpArticle extends LpArticleServiceType {
  source?: string; // AIモデル名（generatedByとの互換性のため）
}

const LpArticleHistory: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // LP記事履歴リスト
  const [lpArticles, setLpArticles] = useState<LpArticle[]>([]);
  // 読み込み状態
  const [isLoading, setIsLoading] = useState(true);
  // 検索クエリ
  const [searchQuery, setSearchQuery] = useState('');
  // 削除確認ダイアログ
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  // 削除対象のLP記事ID
  const [lpArticleToDelete, setLpArticleToDelete] = useState<string | null>(null);
  // 選択中のLP記事ID（ローディング表示用）
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // エラーメッセージ
  const [error, setError] = useState<string | null>(null);

  // LP記事履歴の読み込み
  useEffect(() => {
    const loadLpArticles = async () => {
      if (!currentUser) return;
      
      setIsLoading(true);
      try {
        // SupabaseからLP記事履歴を取得
        const history = await lpArticleService.getLpArticleHistory(currentUser.id, 100);
        
        // sourceフィールドの互換性のため、generatedByをsourceにマップ
        const formattedHistory = history.map(item => ({
          ...item,
          source: item.generatedBy
        }));
        
        setLpArticles(formattedHistory);
        setError(null);
      } catch (error) {
        console.error('Error loading LP articles:', error);
        setError('LP記事の読み込み中にエラーが発生しました。');
        
        // エラー時はローカルストレージから読み込みを試みる（フォールバック）
        try {
          const savedHistory = localStorage.getItem('lp_navigator_lparticle_history');
          if (savedHistory) {
            const history = JSON.parse(savedHistory);
            const formattedHistory = history.map((item: any) => ({
              ...item,
              createdAt: new Date(item.createdAt),
              updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(item.createdAt)
            }));
            setLpArticles(formattedHistory);
            setError('オフラインモードで表示しています。');
          }
        } catch (localError) {
          console.error('Local storage error:', localError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadLpArticles();
  }, [currentUser]);

  // 検索フィルター適用
  const filteredLpArticles = lpArticles.filter(lpArticle => {
    if (!searchQuery.trim()) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      lpArticle.title.toLowerCase().includes(searchLower) ||
      lpArticle.content.toLowerCase().includes(searchLower) ||
      (lpArticle.source || lpArticle.generatedBy || '').toLowerCase().includes(searchLower)
    );
  });

  // LP記事の詳細表示
  const handleViewLpArticle = (lpArticle: LpArticle) => {
    setSelectedId(lpArticle.id); // ローディング表示のため
    
    try {
      // 選択したLP記事をローカルストレージに保存（表示画面で使用）
      localStorage.setItem('lp_navigator_generated_lparticles', JSON.stringify([lpArticle]));
      setTimeout(() => {
        navigate('/generator/lparticle', { replace: true });
        setSelectedId(null);
      }, 300);
    } catch (error) {
      console.error('Error saving selected LP article:', error);
      setError('LP記事の表示中にエラーが発生しました。');
      setSelectedId(null);
    }
  };

  // LP記事の削除確認
  const handleDeleteItem = (id: string) => {
    setLpArticleToDelete(id);
    setShowDeleteConfirmDialog(true);
  };

  // LP記事の削除実行
  const executeDelete = async () => {
    if (!lpArticleToDelete) return;
    
    setSelectedId(lpArticleToDelete); // ローディング表示用
    
    try {
      // Supabaseから削除（実装が必要な場合）
      // 注意: 現在のlpArticleServiceには削除メソッドがないため、
      // 実際の削除はSupabaseで直接行うか、サービスに削除メソッドを追加する必要があります
      
      // UIからは削除
      const newLpArticles = lpArticles.filter(lpArticle => lpArticle.id !== lpArticleToDelete);
      setLpArticles(newLpArticles);
      
      // ローカルストレージも更新（フォールバック用）
      localStorage.setItem('lp_navigator_lparticle_history', JSON.stringify(newLpArticles));
      
      setShowDeleteConfirmDialog(false);
      setLpArticleToDelete(null);
      setError(null);
    } catch (error) {
      console.error('Error deleting LP article:', error);
      setError('LP記事の削除中にエラーが発生しました。');
    }
    setSelectedId(null);
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

  // モデルアイコンの取得
  const getModelIcon = (source: string | undefined) => {
    const model = source || '';
    switch (model) {
      case 'ChatGPT':
        return <Bot size={16} className="text-green-600" />;
      case 'Gemini':
        return <Sparkles size={16} className="text-purple-600" />;
      case 'Claude':
        return <Zap size={16} className="text-amber-600" />;
      default:
        return null;
    }
  };

  // HTMLからテキストを抽出する関数
  const htmlToText = (html: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw size={40} className="mx-auto mb-4 text-primary-500 animate-spin" />
          <p className="text-gray-600">LP記事履歴を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">LP記事一覧</h1>
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

      <div className="flex items-center mb-6">
        <div className="w-full">
          <Input
            placeholder="タイトルで検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={16} className="text-gray-400" />}
            fullWidth
          />
        </div>
      </div>

      <Card>
        <div className="space-y-6">
          {filteredLpArticles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchQuery ? '検索条件に一致するLP記事が見つかりませんでした。' : 'LP記事履歴がありません。'}
              </p>
            </div>
          ) : (
            filteredLpArticles.map((lpArticle) => (
              <div key={lpArticle.id} className="border-b pb-6 last:border-b-0 last:pb-0">
                <div className="flex justify-between mb-2">
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium text-gray-900">{lpArticle.title}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Eye size={14} />}
                      onClick={() => handleViewLpArticle(lpArticle)}
                      isLoading={selectedId === lpArticle.id}
                    >
                      表示
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      leftIcon={<Trash2 size={14} />}
                      onClick={() => handleDeleteItem(lpArticle.id)}
                      isLoading={selectedId === lpArticle.id && lpArticleToDelete === lpArticle.id}
                    >
                      削除
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                  {htmlToText(lpArticle.content).substring(0, 150)}
                  {htmlToText(lpArticle.content).length > 150 ? '...' : ''}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center">
                    <Calendar size={14} className="mr-1" />
                    <span>{formatDateDisplay(lpArticle.createdAt)}</span>
                  </div>
                  <div className="flex items-center">
                    {getModelIcon(lpArticle.source || lpArticle.generatedBy)}
                    <span className="ml-1">{lpArticle.source || lpArticle.generatedBy}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* 削除確認ダイアログ */}
      <ConfirmDialog
        isOpen={showDeleteConfirmDialog}
        onClose={() => setShowDeleteConfirmDialog(false)}
        onConfirm={executeDelete}
        title="LP記事の削除"
        message="このLP記事を削除してもよろしいですか？この操作は元に戻せません。"
        confirmLabel="削除する"
        cancelLabel="キャンセル"
      />
    </div>
  );
};

export default LpArticleHistory; 