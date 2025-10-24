import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2, ExternalLink, Calendar, Bot, RefreshCw, Zap, Sparkles, Eye, Download } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useAuthFixed as useAuth } from '../../contexts/AuthContextFixed';
import { adCopyService } from '../../services/adCopyService';
import type { AdCopy as AdCopyServiceType } from '../../services/adCopyService';

// 広告文の型定義（互換性のために拡張）
interface AdCopy extends AdCopyServiceType {
  source?: string; // AIモデル名（generatedByとの互換性のため）
}

const AdCopyHistory: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // 広告文履歴リスト
  const [adCopies, setAdCopies] = useState<AdCopy[]>([]);
  // 読み込み状態
  const [isLoading, setIsLoading] = useState(true);
  // 検索クエリ
  const [searchQuery, setSearchQuery] = useState('');
  // 削除確認ダイアログ
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  // 削除対象の広告文ID
  const [adCopyToDelete, setAdCopyToDelete] = useState<string | null>(null);
  // 選択中の広告文ID（ローディング表示用）
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // エラーメッセージ
  const [error, setError] = useState<string | null>(null);

  // 広告文履歴の読み込み
  useEffect(() => {
    const loadAdCopies = async () => {
      if (!currentUser) return;
      
      setIsLoading(true);
      try {
        // Supabaseから広告文履歴を取得
        const history = await adCopyService.getAdCopyHistory(currentUser.id, 100);
        
        // sourceフィールドの互換性のため、generatedByをsourceにマップ
        const formattedHistory = history.map(item => ({
          ...item,
          source: item.generatedBy
        }));
        
        setAdCopies(formattedHistory);
        setError(null);
      } catch (error) {
        console.error('Error loading ad copies:', error);
        setError('広告文の読み込み中にエラーが発生しました。');
        
        // エラー時はローカルストレージから読み込みを試みる（フォールバック）
        try {
          const savedHistory = localStorage.getItem('lp_navigator_adcopy_history');
          if (savedHistory) {
            const history = JSON.parse(savedHistory);
            const formattedHistory = history.map((item: any) => ({
              ...item,
              createdAt: new Date(item.createdAt),
              updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(item.createdAt)
            }));
            setAdCopies(formattedHistory);
            setError('オフラインモードで表示しています。');
          }
        } catch (localError) {
          console.error('Local storage error:', localError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadAdCopies();
  }, [currentUser]);

  // 検索フィルター適用
  const filteredAdCopies = adCopies.filter(adCopy => {
    if (!searchQuery.trim()) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      adCopy.title.toLowerCase().includes(searchLower) ||
      adCopy.content.toLowerCase().includes(searchLower) ||
      (adCopy.source || adCopy.generatedBy || '').toLowerCase().includes(searchLower)
    );
  });

  // 広告文の詳細表示
  const handleViewAdCopy = (adCopy: AdCopy) => {
    setSelectedId(adCopy.id); // ローディング表示のため
    
    try {
      // 選択した広告文をローカルストレージに保存（表示画面で使用）
      localStorage.setItem('lp_navigator_generated_adcopies', JSON.stringify([adCopy]));
      setTimeout(() => {
        navigate('/generator/adcopy', { replace: true });
        setSelectedId(null);
      }, 300);
    } catch (error) {
      console.error('Error saving selected ad copy:', error);
      setError('広告文の表示中にエラーが発生しました。');
      setSelectedId(null);
    }
  };

  // 広告文の削除確認
  const handleDeleteItem = (id: string) => {
    setAdCopyToDelete(id);
    setShowDeleteConfirmDialog(true);
  };

  // 広告文の削除実行
  const executeDelete = async () => {
    if (!adCopyToDelete) return;
    
    setSelectedId(adCopyToDelete); // ローディング表示用
    
    try {
      // Supabaseから削除（実装が必要な場合）
      // 注意: 現在のadCopyServiceには削除メソッドがないため、
      // 実際の削除はSupabaseで直接行うか、サービスに削除メソッドを追加する必要があります
      
      // UIからは削除
      const newAdCopies = adCopies.filter(adCopy => adCopy.id !== adCopyToDelete);
      setAdCopies(newAdCopies);
      
      // ローカルストレージも更新（フォールバック用）
      localStorage.setItem('lp_navigator_adcopy_history', JSON.stringify(newAdCopies));
      
      setShowDeleteConfirmDialog(false);
      setAdCopyToDelete(null);
      setError(null);
    } catch (error) {
      console.error('Error deleting ad copy:', error);
      setError('広告文の削除中にエラーが発生しました。');
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw size={40} className="mx-auto mb-4 text-primary-500 animate-spin" />
          <p className="text-gray-600">広告文履歴を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-0 space-y-6">
      <div className="flex items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">広告文一覧</h1>
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
          {filteredAdCopies.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchQuery ? '検索条件に一致する広告文が見つかりませんでした。' : '広告文履歴がありません。'}
              </p>
            </div>
          ) : (
            filteredAdCopies.map((adCopy) => (
              <div key={adCopy.id} className="border-b pb-6 last:border-b-0 last:pb-0">
                <div className="flex justify-between mb-2">
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium text-gray-900">{adCopy.title}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Eye size={14} />}
                      onClick={() => handleViewAdCopy(adCopy)}
                      isLoading={selectedId === adCopy.id}
                    >
                      表示
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      leftIcon={<Trash2 size={14} />}
                      onClick={() => handleDeleteItem(adCopy.id)}
                      isLoading={selectedId === adCopy.id && adCopyToDelete === adCopy.id}
                    >
                      削除
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                  {adCopy.content.substring(0, 150)}
                  {adCopy.content.length > 150 ? '...' : ''}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center">
                      <Calendar size={14} className="mr-1" />
                      <span>{formatDateDisplay(adCopy.createdAt)}</span>
                    </div>
                    <div className="flex items-center">
                      {getModelIcon(adCopy.source || adCopy.generatedBy)}
                      <span className="ml-1">{adCopy.source || adCopy.generatedBy}</span>
                    </div>
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
        title="広告文の削除"
        message="この広告文を削除してもよろしいですか？この操作は元に戻せません。"
        confirmLabel="削除する"
        cancelLabel="キャンセル"
      />
    </div>
  );
};

export default AdCopyHistory; 