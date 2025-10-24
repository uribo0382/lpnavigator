import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Bot, Zap, Sparkles, ArrowLeft, RefreshCw, Copy, Check, Edit, Save, FileEdit, FileText } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import { mockFormulas } from '../../utils/mockData';
import { lpArticleService } from '../../services/lpArticleService';
import { useAuthFixed as useAuth } from '../../contexts/AuthContextFixed';

// 基本情報の型定義
interface BasicInfo {
  id: string;
  title: string;
  content: string;
  metaDescription: string;
  permalink: string;
  createdAt: Date;
}

// LP記事フォーミュラの型定義
interface LpArticleFormula {
  id: string;
  name: string;
  type: string;
  template: string;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  summary: string;
}

// LP記事の型定義
interface LpArticle {
  id: string;
  title: string;
  content: string;
  source: string; // AIモデル名
  basicInfoId: string;
  formulaId: string;
  createdAt: Date;
}

// 広告文の型定義 (AdCopyGenerator.tsxから流用、または共通型定義ファイルからimport)
interface AdCopy {
  id: string;
  title: string;
  content: string;
  source: string; // AIモデル名
  basicInfoId: string;
  formulaId: string;
  createdAt: Date;
}

const LpArticleGenerator: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // 選択された広告文
  const [selectedAdCopy, setSelectedAdCopy] = useState<AdCopy | null>(null);
  
  // LP記事フォーミュラのリスト
  const [lpArticleFormulas, setLpArticleFormulas] = useState<LpArticleFormula[]>([]);
  // 選択されたフォーミュラ
  const [selectedFormula, setSelectedFormula] = useState<string>('');
  
  // 生成状態
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  // 生成されたLP記事
  const [generatedLpArticles, setGeneratedLpArticles] = useState<LpArticle[]>([]);
  // エラーメッセージ
  const [error, setError] = useState<string | null>(null);
  // コピー状態
  const [copied, setCopied] = useState<{id: string, type: string} | null>(null);
  // 編集モード
  const [editMode, setEditMode] = useState<string | null>(null);
  // 編集内容
  const editorRef = useRef<HTMLDivElement>(null);
  // 進捗率の状態 (AdCopyGeneratorから移植)
  const [progressPercent, setProgressPercent] = useState<number>(0);

  // 広告文とフォーミュラの読み込み
  useEffect(() => {
    // 選択された広告文のローカルストレージからの読み込み
    const loadSelectedAdCopy = () => {
      try {
        const savedAdCopy = localStorage.getItem('lp_navigator_selected_adcopy');
        if (savedAdCopy) {
          const parsedAdCopy = JSON.parse(savedAdCopy);
          // createdAt が Dateオブジェクトであることを保証
          parsedAdCopy.createdAt = new Date(parsedAdCopy.createdAt);
          setSelectedAdCopy(parsedAdCopy);
        } else {
          // 選択された広告文がない場合は、広告文詳細画面にリダイレクト
          setError('広告文が選択されていません。広告文詳細画面から選択してください。');
        }
      } catch (error) {
        console.error('Error loading selected ad copy:', error);
        setError('選択された広告文の読み込み中にエラーが発生しました。');
      }
    };

    // フォーミュラの読み込み
    const loadFormulas = async () => {
      try {
        // Supabaseからフォーミュラを取得
        const formulas = await lpArticleService.getActiveLpArticleFormulas();
        
        setLpArticleFormulas(formulas);
        // 最初のフォーミュラを選択
        if (formulas.length > 0) {
          setSelectedFormula(formulas[0].id);
        }
      } catch (error) {
        console.error('Error loading formulas:', error);
        setError('フォーミュラの読み込み中にエラーが発生しました。');
      }
    };

    loadSelectedAdCopy();
    loadFormulas();
  }, []);

  // 編集モード用エフェクト
  useEffect(() => {
    if (editMode && editorRef.current) {
      const lpArticle = generatedLpArticles.find(article => article.id === editMode);
      if (lpArticle) {
        editorRef.current.innerText = lpArticle.content;
        editorRef.current.focus();
      }
    }
  }, [editMode, generatedLpArticles]);

  // AIモデルによるLP記事生成関数
  const generateLpArticle = async () => {
    if (!selectedAdCopy || !selectedFormula || !currentUser) {
      setError('広告文またはLP記事フォーミュラが選択されていません。');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgressPercent(0); 
    
    try {
      const formula = lpArticleFormulas.find(f => f.id === selectedFormula);
      
      if (!selectedAdCopy || !formula) {
        throw new Error('選択された広告文、またはLP記事フォーミュラが見つかりません。');
      }

      // 進捗状況のシミュレーション
      const progressInterval = setInterval(() => {
        setProgressPercent(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          const increment = Math.max(1, 15 - Math.floor(prev / 10));
          return prev + increment;
        });
      }, 300);

      // Supabase APIを使用してLP記事を生成
      const lpArticles = await lpArticleService.generateLpArticles(
        currentUser.id,
        selectedAdCopy.basicInfoId,
        selectedAdCopy.id,
        formula.id
      );

      // 進捗を100%に設定
      setProgressPercent(100);
      clearInterval(progressInterval);

      if (lpArticles.length === 0) {
        throw new Error('LP記事の生成に失敗しました。');
      }

      // 生成されたLP記事を状態に保存
      const formattedArticles = lpArticles.map(article => ({
        id: article.id,
        title: article.title,
        content: article.content,
        source: article.generatedBy,
        basicInfoId: article.basicInfoId,
        formulaId: article.formulaId,
        adCopyId: selectedAdCopy.id,
        createdAt: article.createdAt
      }));

      setGeneratedLpArticles(formattedArticles);

      // LocalStorageにも保存（表示画面で使用）
      localStorage.setItem('lp_navigator_generated_lparticles', JSON.stringify(formattedArticles));
      
      if (formattedArticles.length > 0) {
        localStorage.setItem('lp_navigator_generated_lparticle', JSON.stringify(formattedArticles[0]));
      }
    } catch (error) {
      console.error('Error generating LP articles:', error);
      setError(error instanceof Error ? error.message : 'LP記事の生成中にエラーが発生しました。');
      setProgressPercent(0);
    } finally {
      setIsGenerating(false);
    }
  };

  // ダミーのLP記事コンテンツを生成（実際はAI APIを使用）
  const generateDummyLpArticleContent = (adCopy: AdCopy, formula: LpArticleFormula, modelName: string) => {
    const titleText = adCopy.title.replace(/ - 広告文 \(.+\)$/, '');
    // HTMLではなくプレーンテキストを生成するように変更
    if (modelName === 'ChatGPT') {
      return `${titleText}\n\n革新的なAI技術を駆使して、コンテンツ作成の効率を飛躍的に向上させるツールをご紹介します。\n\n特徴\n- 高品質な文章を自動生成\n- SEO対策済みのコンテンツ作成\n- 多言語対応で海外展開も簡単\n- 直感的な操作性でだれでも簡単に使える\n\n導入メリット\n本ツールを導入することで、コンテンツ作成の時間を最大80%削減できます。さらに、AI技術による高品質な文章生成により、読者の満足度も向上します。\n\nお客様の声\n「導入前は記事作成に週3日かかっていましたが、今では1日で完了します。品質も向上し、サイトのエンゲージメントが25%アップしました。」 - マーケティング企業 CTO\n\n今すぐ始めよう\n初回限定で30日間の無料トライアルをご用意しています。この機会に是非お試しください。`;
    } else if (modelName === 'Gemini') {
      return `${titleText} - コンテンツ制作の未来\n\n次世代のAI技術で、あなたのコンテンツ戦略を一新しませんか？時間と労力を大幅に節約しながら、クオリティの高いコンテンツを生成できます。\n\n✨ 主な機能 ✨\n- 自然な日本語でのコンテンツ生成\n- ブランドの声に合わせたトーン調整\n- キーワード最適化によるSEO強化\n- 複数フォーマットでのエクスポート\n\n💼 ビジネス成果 💼\n導入企業の90%が以下の効果を実感しています：\n- コンテンツ制作時間の70%削減\n- ウェブサイト訪問者の滞在時間35%増加\n- コンバージョン率の20%向上\n\n👥 信頼の声 👥\n「このツールは我々のコンテンツチームの生産性を一変させました。以前は1つの記事に丸一日かかっていましたが、今では複数の高品質コンテンツを同日中に作成できます。」 - マーケティングディレクター\n\n🚀 今すぐ始める 🚀\n限定キャンペーン実施中！今なら年間プランが30%オフ。さらに14日間の無料トライアルで、リスクなくお試しいただけます。`;
    } else { // Claude およびその他のモデル
      return `${titleText}\n\nAIの力でコンテンツ作成の常識を覆す、革新的なツールが誕生しました。時間と創造性のバランスを大切にする現代のクリエイターやマーケターのために設計された、次世代のコンテンツ制作システムです。\n\nこんな悩みを解決します\n時間不足: 高品質なコンテンツ作成にかかる時間を最大75%削減し、本来のクリエイティブ業務に集中できます。\n品質のばらつき: AIによる一貫した品質管理で、すべてのコンテンツが高水準を維持します。\nスケーラビリティ: ビジネスの成長に合わせて、コンテンツ制作を効率的にスケールさせることができます。\n\n主な機能\n- 自然言語処理による高品質な文章生成\n- ブランドボイスに合わせたトーン調整\n- SEO最適化されたコンテンツ\n- 多言語サポート（10言語対応）\n- コンテンツパフォーマンス分析\n\nお客様の声\n「導入前は1記事の作成に平均8時間かかっていましたが、今では2時間以内に完了し、しかも品質が向上しました。チームの生産性が劇的に改善されました。」 - Eコマース企業 マーケティングマネージャー\n\n今すぐ始めましょう\n14日間の無料トライアルで、リスクなくお試しいただけます。また、初期導入サポートも無料でご提供しています。`;
    }
  };

  // コピー機能
  const handleCopy = (text: string, id: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied({ id, type });
    setTimeout(() => setCopied(null), 2000);
  };

  // 編集モード切り替え
  const toggleEditMode = (id: string) => {
    if (editMode === id) {
      saveEditedContent(id);
    } else {
      setEditMode(id);
    }
  };

  // 編集内容保存
  const saveEditedContent = (id: string) => {
    if (!editorRef.current) return;
    
    const content = editorRef.current.innerText;
    const updatedArticles = generatedLpArticles.map(article => {
      if (article.id === id) {
        return { ...article, content };
      }
      return article;
    });
    
    setGeneratedLpArticles(updatedArticles);
    setEditMode(null);
    
    // ローカルストレージも更新
    const savedHistory = localStorage.getItem('lp_navigator_lparticle_history');
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        const updatedHistory = history.map((item: any) => {
          if (item.id === id) {
            return { ...item, content };
          }
          return item;
        });
        localStorage.setItem('lp_navigator_lparticle_history', JSON.stringify(updatedHistory));
      } catch (e) {
        console.error('Failed to update history:', e);
      }
    }
  };

  // LP記事表示画面へ移動
  const handleViewLpArticle = () => {
    try {
      navigate('/generator/lparticle', { replace: true });
    } catch (error) {
      console.error('Navigation error:', error);
      window.location.href = '/generator/lparticle';
    }
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
        return 'bg-green-50 border-green-200 text-green-800';
      case 'Gemini':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'Claude':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  // 日付のフォーマット
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-0">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">LP記事の作成</h1>
      
      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 p-4 rounded-md mb-4">
          <p className="text-sm">{error}</p>
          <Button 
            variant="outline" 
            size="sm"
            className="mt-2"
            onClick={() => setError(null)}
          >
            閉じる
          </Button>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <FileText size={20} className="mr-2 text-primary-500" />
            LP記事設定
          </h2>
        </div>
        
        <div className="space-y-6">
          {selectedAdCopy && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
              <h3 className="text-sm font-medium text-gray-700 mb-1">選択された広告文</h3>
              <p className="text-sm text-gray-600 mb-2">
                {selectedAdCopy.title}
              </p>
              <p className="text-xs text-gray-500">
                モデル: {selectedAdCopy.source} / 作成日: {new Date(selectedAdCopy.createdAt).toLocaleDateString()}
              </p>
            </div>
          )}
          
          <Select
            label="LP記事フォーミュラ"
            options={lpArticleFormulas.map(formula => ({
              value: formula.id,
              label: formula.name
            }))}
            value={selectedFormula}
            onChange={(value) => setSelectedFormula(value)}
            helperText="使用するLP記事のフォーミュラを選択してください"
            fullWidth
            disabled={isGenerating}
          />
          
          {selectedFormula && (
            <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <h3 className="text-sm font-medium text-gray-700 mb-1">フォーミュラ概要</h3>
              <p className="text-xs text-gray-600">
                {lpArticleFormulas.find(f => f.id === selectedFormula)?.summary || 'フォーミュラの説明がありません。'}
              </p>
            </div>
          )}
          
          <Button
            variant="primary"
            onClick={generateLpArticle}
            disabled={isGenerating || !selectedAdCopy || !selectedFormula}
            fullWidth
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                LP記事を生成中...
              </>
            ) : (
              'LP記事を生成する'
            )}
          </Button>
        </div>
      </div>
      
      {isGenerating ? (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-xl shadow-2xl max-w-md w-full border border-gray-700">
            <div className="text-center relative">
              {/* メインアニメーション部分 */}
              <div className="relative mb-6 mx-auto w-28 h-28">
                {/* 背景のグラデーションサークル */}
                <div className="absolute inset-0 rounded-full animate-gradient opacity-20" style={{ filter: 'blur(10px)' }}></div>
                
                {/* アイコンを回転させるアニメーション */}
                <FileEdit 
                  size={112} 
                  className="absolute inset-0 text-primary-400 z-10 ai-icon-float"
                  style={{
                    animation: 'pulse 2s infinite ease-in-out, spin 8s linear infinite',
                    filter: 'drop-shadow(0 0 8px rgba(96, 165, 250, 0.7))'
                  }}
                />
                
                {/* 内側を回る軌道の小さな円 */}
                <div className="absolute inset-0">
                  {[...Array(8)].map((_, i) => (
                    <div 
                      key={i}
                      className="absolute w-3 h-3 bg-blue-400 rounded-full"
                      style={{
                        transform: `rotate(${i * 45}deg) translateY(-35px)`,
                        animation: `orbitSpin3D 3s infinite ease-in-out ${i * 0.2}s`,
                        boxShadow: '0 0 8px rgba(96, 165, 250, 0.7)'
                      }}
                    />
                  ))}
                </div>
                
                {/* 外側を回る軌道の小さな円 */}
                <div className="absolute inset-0">
                  {[...Array(12)].map((_, i) => (
                    <div 
                      key={i}
                      className="absolute w-2 h-2 bg-green-400 rounded-full"
                      style={{
                        transform: `rotate(${i * 30}deg) translateY(-50px)`,
                        animation: `orbitSpin3D 6s infinite ease-in-out ${i * 0.1}s`,
                        boxShadow: '0 0 6px rgba(74, 222, 128, 0.7)'
                      }}
                    />
                  ))}
                </div>
              </div>
              
              {/* 「生成中」テキスト - センターに大きく表示 */}
              <div className="mb-8 appear-from-bottom">
                <div className="animate-text-pulse mb-3">
                  <span className="text-2xl font-bold text-transparent bg-clip-text animate-gradient">
                    LP記事を生成中
                  </span>
                  <span className="dots-container inline-flex ml-1">
                    <span className="dot text-2xl text-primary-400">.</span>
                    <span className="dot text-2xl text-primary-400">.</span>
                    <span className="dot text-2xl text-primary-400">.</span>
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-2">
                  AIが高度なアルゴリズムを駆使して最適なLP記事を生成しています
                </p>
              </div>
              
              {/* プログレスバー */}
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div className="text-xs text-gray-400">
                    {progressPercent}%
                  </div>
                  <div className="text-xs text-gray-400">
                    AIプロセス実行中
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-2 text-xs flex rounded-full bg-gray-700">
                  <div 
                    className="animate-gradient progress-bar-flash h-full rounded-full"
                    style={{ 
                      width: `${progressPercent}%`,
                      transition: 'width 0.3s ease'
                    }}
                  ></div>
                </div>
              </div>
              
              {/* 処理内容を示唆するテキスト - コンピュータっぽい演出 */}
              <div className="mt-4 text-left bg-gray-900 p-2 rounded text-xs font-mono text-gray-400 h-12 overflow-hidden">
                <div className="terminal-scroll">
                  <p>&gt; 情報収集完了</p>
                  <p>&gt; テンプレート選択中...</p>
                  <p>&gt; コンテンツ最適化実行中...</p>
                  <p>&gt; LP記事構成分析中...</p>
                  <p>&gt; LP記事生成処理中...</p>
                  <p>&gt; データ整形中...</p>
                  <p>&gt; 最終調整中...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : generatedLpArticles.length > 0 && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <FileEdit size={20} className="mr-2 text-primary-500" />
                生成されたLP記事
              </h2>
            </div>
            
            <div className="space-y-6">
              {generatedLpArticles.map((lpArticle) => (
                <Card key={lpArticle.id} className="p-4 md:p-6 overflow-hidden">
                  <div className={`px-4 py-3 border-b ${getModelColor(lpArticle.source)}`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        {getModelIcon(lpArticle.source)}
                        <h3 className="font-medium ml-2">{lpArticle.source} の生成結果</h3>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(lpArticle.content, lpArticle.id, 'content')}
                          leftIcon={copied?.id === lpArticle.id && copied?.type === 'content' ? <Check size={14} /> : <Copy size={14} />}
                        >
                          {copied?.id === lpArticle.id && copied?.type === 'content' ? 'コピー済み' : 'コピー'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleEditMode(lpArticle.id)}
                          leftIcon={editMode === lpArticle.id ? <Save size={14} /> : <Edit size={14} />}
                        >
                          {editMode === lpArticle.id ? '保存' : '編集'}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    {editMode === lpArticle.id ? (
                      <div
                        ref={editorRef}
                        contentEditable
                        className="min-h-[300px] p-4 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
                      />
                    ) : (
                      <div className="text-sm text-gray-700">
                        <div className="mb-4">
                          <span className="font-medium text-gray-700">タイトル:</span> {lpArticle.title}
                        </div>
                        <div className="mb-4">
                          <span className="font-medium text-gray-700">生成日時:</span> {formatDate(lpArticle.createdAt)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-700 mb-2">LP記事内容:</div>
                          <div className="border p-4 rounded-md bg-gray-50 whitespace-pre-wrap h-[300px] overflow-auto">
                            {lpArticle.content}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LpArticleGenerator; 