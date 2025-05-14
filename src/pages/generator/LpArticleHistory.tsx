import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2, ExternalLink, Calendar, Bot, RefreshCw, Zap, Sparkles, Eye, Download, FileEdit } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

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

const LpArticleHistory: React.FC = () => {
  const navigate = useNavigate();
  
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
    const loadLpArticles = () => {
      setIsLoading(true);
      try {
        // ローカルストレージからLP記事履歴を取得
        const savedHistory = localStorage.getItem('lp_navigator_lparticle_history');
        if (savedHistory) {
          const history = JSON.parse(savedHistory);
          // 日付をDate型に変換
          const formattedHistory = history.map((item: any) => ({
            ...item,
            createdAt: new Date(item.createdAt)
          }));
          setLpArticles(formattedHistory);
        } else {
          // ダミーデータの追加（実際のアプリでは不要）
          const dummyData = [
            {
              id: 'lparticle-1',
              title: 'AIを活用したコンテンツ作成ツール - LP記事 (ChatGPT)',
              content: '<h1>AIを活用したコンテンツ作成ツール</h1>\n<p>革新的なAI技術を駆使して、コンテンツ作成の効率を飛躍的に向上させるツールをご紹介します。</p>\n\n<h2>特徴</h2>\n<ul>\n  <li>高品質な文章を自動生成</li>\n  <li>SEO対策済みのコンテンツ作成</li>\n  <li>多言語対応で海外展開も簡単</li>\n  <li>直感的な操作性でだれでも簡単に使える</li>\n</ul>',
              source: 'ChatGPT',
              basicInfoId: 'dummy-1',
              formulaId: 'formula-007',
              createdAt: new Date(2023, 8, 15)
            },
            {
              id: 'lparticle-2',
              title: 'デジタルマーケティング支援サービス - LP記事 (Gemini)',
              content: '<h1>デジタルマーケティング支援サービス - コンテンツ制作の未来</h1>\n<p>次世代のAI技術で、あなたのコンテンツ戦略を一新しませんか？時間と労力を大幅に節約しながら、クオリティの高いコンテンツを生成できます。</p>\n\n<h2>✨ 主な機能 ✨</h2>\n<ul>\n  <li>自然な日本語でのコンテンツ生成</li>\n  <li>ブランドの声に合わせたトーン調整</li>\n  <li>キーワード最適化によるSEO強化</li>\n  <li>複数フォーマットでのエクスポート</li>\n</ul>',
              source: 'Gemini',
              basicInfoId: 'dummy-2',
              formulaId: 'formula-008',
              createdAt: new Date(2023, 8, 10)
            },
            {
              id: 'lparticle-3',
              title: 'クラウドストレージソリューション - LP記事 (Claude)',
              content: '<h1>クラウドストレージソリューション</h1>\n<section class="intro">\n  <p>AIの力でコンテンツ作成の常識を覆す、革新的なツールが誕生しました。時間と創造性のバランスを大切にする現代のクリエイターやマーケターのために設計された、次世代のコンテンツ制作システムです。</p>\n</section>\n\n<section class="benefits">\n  <h2>こんな悩みを解決します</h2>\n  <div class="benefit-grid">\n    <div class="benefit-item">\n      <h3>時間不足</h3>\n      <p>高品質なコンテンツ作成にかかる時間を最大75%削減し、本来のクリエイティブ業務に集中できます。</p>\n    </div>',
              source: 'Claude',
              basicInfoId: 'dummy-3',
              formulaId: 'formula-007',
              createdAt: new Date(2023, 8, 5)
            }
          ];
          setLpArticles(dummyData);
        }
        setError(null);
      } catch (error) {
        console.error('Error loading LP articles:', error);
        setError('LP記事の読み込み中にエラーが発生しました。');
      } finally {
        setIsLoading(false);
      }
    };

    loadLpArticles();
  }, []);

  // 検索フィルター適用
  const filteredLpArticles = lpArticles.filter(lpArticle => {
    if (!searchQuery.trim()) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      lpArticle.title.toLowerCase().includes(searchLower) ||
      lpArticle.content.toLowerCase().includes(searchLower) ||
      lpArticle.source.toLowerCase().includes(searchLower)
    );
  });

  // LP記事の詳細表示
  const handleViewLpArticle = (lpArticle: LpArticle) => {
    setSelectedId(lpArticle.id); // ローディング表示のため
    
    try {
      // 選択したLP記事をローカルストレージに保存
      localStorage.setItem('lp_navigator_generated_lparticle', JSON.stringify(lpArticle));
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
  const executeDelete = () => {
    if (!lpArticleToDelete) return;
    
    setSelectedId(lpArticleToDelete); // ローディング表示用
    
    setTimeout(() => {
      try {
        const newLpArticles = lpArticles.filter(lpArticle => lpArticle.id !== lpArticleToDelete);
        setLpArticles(newLpArticles);
        
        // ローカルストレージを更新
        localStorage.setItem('lp_navigator_lparticle_history', JSON.stringify(newLpArticles));
        
        setShowDeleteConfirmDialog(false);
        setLpArticleToDelete(null);
        setError(null);
      } catch (error) {
        console.error('Error deleting LP article:', error);
        setError('LP記事の削除中にエラーが発生しました。');
      }
      setSelectedId(null);
    }, 800);
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
  const getModelIcon = (source: string) => {
    switch (source) {
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
                    {getModelIcon(lpArticle.source)}
                    <span className="ml-1">{lpArticle.source}</span>
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
        confirmText="削除する"
        cancelText="キャンセル"
      />
    </div>
  );
};

export default LpArticleHistory; 