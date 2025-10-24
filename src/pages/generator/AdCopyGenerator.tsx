import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Bot, Zap, Sparkles, ArrowLeft, RefreshCw, Copy, Check, Edit, Save, Download, Megaphone, FileText } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import { useAuthFixed as useAuth } from '../../contexts/AuthContextFixed';
import { adCopyService } from '../../services/adCopyService';

// 型定義はadCopyServiceから取得
import type { BasicInfo, AdCopyFormula, AdCopy } from '../../services/adCopyService';

const AdCopyGenerator: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // 基本情報のリスト
  const [basicInfoList, setBasicInfoList] = useState<BasicInfo[]>([]);
  // 選択された基本情報
  const [selectedBasicInfo, setSelectedBasicInfo] = useState<string>('');
  
  // 広告文フォーミュラのリスト
  const [adCopyFormulas, setAdCopyFormulas] = useState<AdCopyFormula[]>([]);
  // 選択されたフォーミュラ
  const [selectedFormula, setSelectedFormula] = useState<string>('');
  
  // 生成状態
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  // 生成された広告文
  const [generatedAdCopies, setGeneratedAdCopies] = useState<AdCopy[]>([]);
  // エラーメッセージ
  const [error, setError] = useState<string | null>(null);
  // コピー状態
  const [copied, setCopied] = useState<{id: string, type: string} | null>(null);
  // 編集モード
  const [editMode, setEditMode] = useState<string | null>(null);
  // 編集内容
  const editorRef = useRef<HTMLDivElement>(null);
  // 進捗率の状態
  const [progressPercent, setProgressPercent] = useState<number>(0);

  // 基本情報とフォーミュラの読み込み
  useEffect(() => {
    if (!currentUser) return;
    
    // 基本情報の読み込み（Supabaseから）
    const loadBasicInfo = async () => {
      try {
        // Supabaseから基本情報を取得
        const basicInfos = await adCopyService.getBasicInfos(currentUser.id);
        
        setBasicInfoList(basicInfos);
        
        // 最新の基本情報を自動選択
        if (basicInfos.length > 0) {
          setSelectedBasicInfo(basicInfos[0].id);
        }
      } catch (error) {
        console.error('Error loading basic info:', error);
        setError('基本情報の読み込み中にエラーが発生しました。');
      }
    };

    // フォーミュラの読み込み
    const loadFormulas = async () => {
      try {
        // Supabaseから広告文フォーミュラを取得
        const formulas = await adCopyService.getActiveAdCopyFormulas();
        
        if (formulas.length > 0) {
          setAdCopyFormulas(formulas);
          setSelectedFormula(formulas[0].id);
        } else {
          setError('アクティブな広告文フォーミュラが見つかりません。');
        }
      } catch (error) {
        console.error('Error loading formulas:', error);
        setError('フォーミュラの読み込み中にエラーが発生しました。');
      }
    };

    loadBasicInfo();
    loadFormulas();
  }, [currentUser]);

  // 編集モード用エフェクト
  useEffect(() => {
    if (editMode && editorRef.current) {
      const adCopy = generatedAdCopies.find(copy => copy.id === editMode);
      if (adCopy) {
        editorRef.current.innerText = adCopy.content;
        editorRef.current.focus();
      }
    }
  }, [editMode, generatedAdCopies]);

  // AIモデルによる広告文生成関数
  const generateAdCopy = async () => {
    if (!selectedBasicInfo || !selectedFormula) {
      setError('基本情報とフォーミュラを選択してください。');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgressPercent(0);
    
    try {
      // 進捗状況のシミュレーション
      const progressInterval = setInterval(() => {
        setProgressPercent(prev => {
          // 95%まで進むようにする（100%は完了時に設定）
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          // 初めは速く、後半は遅くなるような進捗
          const increment = Math.max(1, 15 - Math.floor(prev / 10));
          return prev + increment;
        });
      }, 300);

      // Supabaseサービスを使用して広告文を生成
      const results = await adCopyService.generateAdCopies(
        currentUser!.id,
        selectedBasicInfo,
        selectedFormula
      );
      
      // 結果を状態に設定（sourceフィールドはgeneratedByにマップ）
      const mappedResults = results.map(adCopy => ({
        ...adCopy,
        source: adCopy.generatedBy
      }));
      setGeneratedAdCopies(mappedResults);

      // 進捗を100%に設定
      setProgressPercent(100);
      // インターバルをクリア（念のため）
      clearInterval(progressInterval);

      // 生成された広告文を比較ビューで表示するために画面遷移
      // LocalStorageに一時保存（遷移先で使用するため）
      localStorage.setItem('lp_navigator_generated_adcopies', JSON.stringify(mappedResults));
      navigate('/generator/adcopy', { replace: true });

    } catch (error) {
      console.error('Error generating ad copies:', error);
      setError('広告文の生成中にエラーが発生しました。');
    } finally {
      setIsGenerating(false);
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
      // 編集内容を保存
      saveEditedContent(id);
    } else {
      setEditMode(id);
    }
  };

  // 編集内容を保存
  const saveEditedContent = async (id: string) => {
    if (editorRef.current) {
      const updatedContent = editorRef.current.innerText;
      
      try {
        // Supabaseで広告文を更新
        await adCopyService.updateAdCopy(id, updatedContent);
        
        // ローカルの状態も更新
        const updatedAdCopies = generatedAdCopies.map(copy => 
          copy.id === id ? { ...copy, content: updatedContent } : copy
        );
        
        setGeneratedAdCopies(updatedAdCopies);
        setEditMode(null);
      } catch (error) {
        console.error('広告文の更新に失敗しました:', error);
        setError('広告文の保存に失敗しました。');
      }
    }
  };

  // 広告文表示画面に移動
  const handleViewAdCopy = () => {
    try {
      navigate('/generator/adcopy', { replace: true });
    } catch (error) {
      console.error('Navigation error:', error);
      window.location.href = '/generator/adcopy';
    }
  };

  // モデルアイコンの取得
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
        return 'border-green-300 bg-green-50';
      case 'Gemini':
        return 'border-purple-300 bg-purple-50';
      case 'Claude':
        return 'border-amber-300 bg-amber-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  // 広告文のダウンロード
  const handleDownload = (adCopy: AdCopy) => {
    try {
      const element = document.createElement('a');
      const file = new Blob([adCopy.content], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `${adCopy.title.replace(/\s/g, '-')}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.error('Download error:', error);
      setError('広告文のダウンロード中にエラーが発生しました。');
    }
  };

  // 基本情報のオプションを作成
  const basicInfoOptions = basicInfoList.map(info => ({
    value: info.id,
    label: `${info.title} (${new Date(info.createdAt).toLocaleDateString()})`
  }));

  // フォーミュラのオプションを作成
  const formulaOptions = adCopyFormulas.map(formula => ({
    value: formula.id,
    label: formula.name
  }));

  return (
    <div className="flex-1 overflow-y-auto p-0">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">広告文の作成</h1>

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
            広告文設定
          </h2>
        </div>

        <div className="space-y-6">
          <Select
            label="基本情報"
            options={basicInfoOptions}
            value={selectedBasicInfo}
            onChange={(value) => setSelectedBasicInfo(value)}
            helperText="広告文を生成するための基本情報を選択してください"
            fullWidth
          />

          <Select
            label="広告文フォーミュラ"
            options={formulaOptions}
            value={selectedFormula}
            onChange={(value) => setSelectedFormula(value)}
            helperText="使用する広告文のフォーミュラを選択してください"
            fullWidth
          />

          {selectedFormula && (
            <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <h3 className="text-sm font-medium text-gray-700 mb-1">フォーミュラ概要</h3>
              <p className="text-xs text-gray-600">
                {adCopyFormulas.find(f => f.id === selectedFormula)?.summary || 'フォーミュラの説明がありません。'}
              </p>
            </div>
          )}

          <Button
            variant="primary"
            onClick={generateAdCopy}
            disabled={isGenerating || !selectedBasicInfo || !selectedFormula}
            fullWidth
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                広告文を生成中...
              </>
            ) : (
              '広告文を生成する'
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
                <FileText 
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
                    広告文を生成中
                  </span>
                  <span className="dots-container inline-flex ml-1">
                    <span className="dot text-2xl text-primary-400">.</span>
                    <span className="dot text-2xl text-primary-400">.</span>
                    <span className="dot text-2xl text-primary-400">.</span>
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-2">
                  AIが高度なアルゴリズムを駆使して最適な広告文を生成しています
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
                  <p>&gt; ユーザー目的分析中...</p>
                  <p>&gt; 広告文生成処理中...</p>
                  <p>&gt; データ整形中...</p>
                  <p>&gt; 最終調整中...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : generatedAdCopies.length > 0 ? (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <Megaphone size={20} className="mr-2 text-primary-500" />
                生成された広告文
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewAdCopy}
              >
                比較ビューで表示
              </Button>
            </div>
            
            <div className="space-y-6">
              {generatedAdCopies.map((adCopy) => (
                <Card 
                  key={adCopy.id}
                  className="p-4 md:p-6 border-l-4 ${getModelColor(adCopy.source)}"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      {getModelIcon(adCopy.source)}
                      <h3 className="font-medium ml-2">{adCopy.source}</h3>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        className="flex items-center text-xs text-primary-600 hover:text-primary-800 px-2 py-1 rounded border border-gray-200"
                        onClick={() => handleCopy(adCopy.content, adCopy.id, 'content')}
                      >
                        {copied?.id === adCopy.id && copied?.type === 'content' ? (
                          <>
                            <Check size={14} className="mr-1" />
                            <span>コピー済み</span>
                          </>
                        ) : (
                          <>
                            <Copy size={14} className="mr-1" />
                            <span>コピー</span>
                          </>
                        )}
                      </button>
                      <button 
                        className="flex items-center text-xs text-primary-600 hover:text-primary-800 px-2 py-1 rounded border border-gray-200"
                        onClick={() => toggleEditMode(adCopy.id)}
                      >
                        {editMode === adCopy.id ? (
                          <>
                            <Save size={14} className="mr-1" />
                            <span>保存</span>
                          </>
                        ) : (
                          <>
                            <Edit size={14} className="mr-1" />
                            <span>編集</span>
                          </>
                        )}
                      </button>
                      <button 
                        className="flex items-center text-xs text-primary-600 hover:text-primary-800 px-2 py-1 rounded border border-gray-200"
                        onClick={() => handleDownload(adCopy)}
                      >
                        <Download size={14} className="mr-1" />
                        <span>ダウンロード</span>
                      </button>
                    </div>
                  </div>
                  
                  {editMode === adCopy.id ? (
                    <div
                      ref={editorRef}
                      className="w-full min-h-[200px] p-3 border border-gray-300 rounded bg-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                      contentEditable
                      style={{ whiteSpace: 'pre-wrap' }}
                    />
                  ) : (
                    <div className="text-sm text-gray-800 whitespace-pre-wrap p-3 bg-gray-50 rounded border border-gray-200">
                      {adCopy.content}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdCopyGenerator; 