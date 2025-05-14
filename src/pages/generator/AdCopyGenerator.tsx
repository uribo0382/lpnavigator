import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Bot, Zap, Sparkles, ArrowLeft, RefreshCw, Copy, Check, Edit, Save, Download, Megaphone, FileText } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import { mockFormulas } from '../../utils/mockData';

// 基本情報の型定義
interface BasicInfo {
  id: string;
  title: string;
  content: string;
  metaDescription: string;
  permalink: string;
  createdAt: Date;
}

// 広告文フォーミュラの型定義
interface AdCopyFormula {
  id: string;
  name: string;
  type: string;
  template: string;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  summary?: string;
}

// 広告文の型定義
interface AdCopy {
  id: string;
  title: string;
  content: string;
  source: string; // AIモデル名
  basicInfoId: string;
  formulaId: string;
  createdAt: Date;
}

const AdCopyGenerator: React.FC = () => {
  const navigate = useNavigate();
  
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
    // 基本情報のローカルストレージからの読み込み
    const loadBasicInfo = () => {
      try {
        // 実際のアプリケーションではAPIから取得するなど
        // ここではデモ用にローカルストレージから取得
        const savedContent = localStorage.getItem('lp_navigator_generated_content');
        const savedContents = localStorage.getItem('lp_navigator_content_history');
        
        const basicInfoItems: BasicInfo[] = [];
        
        if (savedContent) {
          try {
            const parsedContent = JSON.parse(savedContent);
            parsedContent.createdAt = new Date(parsedContent.createdAt);
            basicInfoItems.push(parsedContent);
          } catch (e) {
            console.error('Failed to parse saved content:', e);
          }
        }
        
        if (savedContents) {
          try {
            const parsedContents = JSON.parse(savedContents);
            parsedContents.forEach((item: any) => {
              item.createdAt = new Date(item.createdAt);
              basicInfoItems.push(item);
            });
          } catch (e) {
            console.error('Failed to parse saved contents:', e);
          }
        }

        // ダミーデータの追加（実際のアプリでは不要）
        // 常にダミーデータを追加して、選択できるものが必ずあるようにする
        basicInfoItems.push({
          id: 'dummy-1',
          title: 'クラウド会計ソフトウェア基本情報',
          content: `株式会社FinTechソリューションズが提供するクラウド会計ソフトウェア「SmartAccounts」に関する基本情報です。

【商品・サービスの概要】
SmartAccountsは、中小企業向けのクラウド型会計ソフトウェアで、請求書発行から経費管理、決算書作成まで一気通貫で対応します。インターネット環境があればいつでもどこでも利用可能で、モバイルアプリにも対応しています。

【主な特徴】
- AI搭載のレシート読取機能で経費精算の手間を90%削減
- 銀行口座やクレジットカードと自動連携し、取引データを自動取得
- 税務申告に必要な書類を自動生成し、電子申告にも対応

【想定されるお客様】
従業員50名以下の中小企業、個人事業主、フリーランス。特に、経理担当者が少ない、または経理業務の効率化を図りたい企業に最適です。

【解決できる課題】
経理業務の属人化、手作業による記帳ミス、確定申告時の書類作成負担、リモートワーク時の経理業務遅延などの課題を解決します。

【提供価値】
経理業務の時間を最大70%削減し、本業に集中できる環境を提供します。また、リアルタイムの経営状況の可視化により、的確な経営判断をサポートします。`,
          metaDescription: '中小企業向けクラウド会計ソフトウェアの特徴と導入メリットについての基本情報です。',
          permalink: 'cloud-accounting-software-info',
          createdAt: new Date(2023, 5, 10)
        });

        basicInfoItems.push({
          id: 'dummy-2',
          title: 'オーガニック食品宅配サービス基本情報',
          content: `株式会社グリーンテーブルが提供する「オーガニックライフ」に関する基本情報です。

【商品・サービスの概要】
オーガニックライフは、全国の厳選された有機栽培農家から直接仕入れた新鮮な野菜や果物、加工食品を定期的にご自宅にお届けする宅配サービスです。すべての食材は有機JAS認証を取得しており、安心・安全な食生活をサポートします。

【主な特徴】
- 契約農家から直送される完全無農薬・有機栽培の新鮮野菜
- 旬の食材を活かしたレシピ提案とミールキット同梱オプション
- 食材の生産者情報と栽培方法の完全開示による透明性

【想定されるお客様】
健康や食の安全性に関心の高い30〜50代の家族世帯、特に小さなお子様がいるご家庭や、食材の品質にこだわる方々。また、忙しくてスーパーに買い物に行く時間がない共働き世帯にも最適です。

【解決できる課題】
市販の食品に含まれる農薬や添加物への不安、忙しい日常での食材調達の時間的負担、食材の産地や栽培方法の不透明さなどの課題を解決します。`,
          metaDescription: '無農薬・有機栽培の新鮮食材を定期宅配するサービスについての基本情報です。',
          permalink: 'organic-food-delivery-info',
          createdAt: new Date(2023, 5, 15)
        });

        basicInfoItems.push({
          id: 'dummy-3',
          title: 'オンラインヨガスタジオ基本情報',
          content: `YogaLifeStudioが提供する「どこでもヨガ」に関する基本情報です。

【商品・サービスの概要】
どこでもヨガは、自宅や外出先から参加できるオンラインヨガスタジオです。ライブクラスとオンデマンドレッスンを組み合わせたハイブリッド型で、場所や時間を選ばずに本格的なヨガレッスンを受講できます。初心者から上級者まで、様々なレベルやスタイルのクラスを提供しています。

【主な特徴】
- 一流インストラクターによるライブクラスを毎日20本以上配信
- 500本以上のレッスン動画がいつでも視聴可能なオンデマンドライブラリ
- インストラクターからリアルタイムでポーズの修正やアドバイスが受けられる双方向コミュニケーション

【想定されるお客様】
忙しい仕事や育児でスタジオに通う時間がない方、自宅で気軽にヨガを始めたい初心者、対面レッスンに抵抗がある方、地方在住でヨガスタジオへのアクセスが限られている方など。年齢層は20代から60代まで幅広く対応。

【解決できる課題】
スタジオまでの移動時間や固定スケジュールの制約、初心者の対面レッスンへの心理的ハードル、地方在住者のヨガ教室へのアクセス制限、コロナ禍における運動不足などの課題を解決します。`,
          metaDescription: '自宅で気軽に参加できるライブ配信・オンデマンドのヨガレッスンサービスについての基本情報です。',
          permalink: 'online-yoga-studio-info',
          createdAt: new Date(2023, 5, 20)
        });
        
        setBasicInfoList(basicInfoItems);
        
        // 最新の基本情報を自動選択
        if (basicInfoItems.length > 0) {
          setSelectedBasicInfo(basicInfoItems[0].id);
        }
      } catch (error) {
        console.error('Error loading basic info:', error);
        setError('基本情報の読み込み中にエラーが発生しました。');
        
        // エラー時でもダミーデータを設定する
        const dummyData = {
          id: 'dummy-error',
          title: 'サンプルコンテンツ',
          content: 'これはサンプルコンテンツです。実際のアプリケーションでは、保存された基本情報が表示されます。',
          metaDescription: 'サンプルメタ説明',
          permalink: 'sample',
          createdAt: new Date()
        };
        setBasicInfoList([dummyData]);
        setSelectedBasicInfo(dummyData.id);
      }
    };

    // フォーミュラの読み込み
    const loadFormulas = () => {
      try {
        // 実際のアプリケーションではAPIから取得するなど
        // ここではモックデータを使用
        const adCopyFormulas = mockFormulas.filter(formula => 
          formula.type === 'ad_copy' && formula.isActive
        );

        if (adCopyFormulas.length === 0) {
          // アクティブなフォーミュラがない場合は、すべてのad_copyタイプを取得
          const allAdCopyFormulas = mockFormulas.filter(formula => formula.type === 'ad_copy');
          setAdCopyFormulas(allAdCopyFormulas);
          
          // 最初のフォーミュラを選択
          if (allAdCopyFormulas.length > 0) {
            setSelectedFormula(allAdCopyFormulas[0].id);
          }
        } else {
          setAdCopyFormulas(adCopyFormulas);
          // 最初のフォーミュラを選択
          setSelectedFormula(adCopyFormulas[0].id);
        }
      } catch (error) {
        console.error('Error loading formulas:', error);
        setError('フォーミュラの読み込み中にエラーが発生しました。');
        
        // エラー時でもダミーフォーミュラを設定
        const dummyFormula = {
          id: 'formula-dummy',
          name: 'サンプルフォーミュラ',
          type: 'ad_copy',
          template: 'サンプルテンプレート',
          variables: ['変数1', '変数2'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          summary: 'これはサンプルフォーミュラです。'
        };
        setAdCopyFormulas([dummyFormula]);
        setSelectedFormula(dummyFormula.id);
      }
    };

    loadBasicInfo();
    loadFormulas();
  }, []);

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
      // 選択された基本情報とフォーミュラを取得
      const basicInfo = basicInfoList.find(info => info.id === selectedBasicInfo);
      const formula = adCopyFormulas.find(f => f.id === selectedFormula);
      
      if (!basicInfo || !formula) {
        throw new Error('選択された基本情報またはフォーミュラが見つかりません。');
      }

      // 進捗状況のシミュレーション（実際のAPI呼び出し中に進捗を示すためのもの）
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

      // プログレスバーを模擬するための時間（3秒）
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 各AIモデルで広告文生成（実際はAPI呼び出しなど）
      // ここではダミーの遅延と結果を用意
      const models = [
        { name: 'ChatGPT', delay: 500 },
        { name: 'Gemini', delay: 500 },
        { name: 'Claude', delay: 500 }
      ];

      // 並行して全モデルの生成を開始
      const generationPromises = models.map(async (model) => {
        // 実際のAPIリクエストの代わりに setTimeout でシミュレート
        await new Promise(resolve => setTimeout(resolve, model.delay));
        
        // 各モデルの生成結果（ダミーデータ）
        return {
          id: `adcopy-${Date.now()}-${model.name.toLowerCase()}`,
          title: `${basicInfo.title} - 広告文 (${model.name})`,
          content: generateDummyAdCopyContent(basicInfo, formula, model.name),
          source: model.name,
          basicInfoId: basicInfo.id,
          formulaId: formula.id,
          createdAt: new Date()
        };
      });

      // 全てのモデルの生成が完了するのを待つ
      const results = await Promise.all(generationPromises);
      
      // 結果を状態に設定
      setGeneratedAdCopies(results);

      // 進捗を100%に設定
      setProgressPercent(100);
      // インターバルをクリア（念のため）
      clearInterval(progressInterval);

      // 広告文履歴に追加（全モデル分）
      const savedHistory = localStorage.getItem('lp_navigator_adcopy_history');
      const history = savedHistory ? JSON.parse(savedHistory) : [];
      
      // 全ての広告文を履歴に追加
      results.forEach(adCopy => {
        history.unshift(adCopy);
      });
      
      localStorage.setItem('lp_navigator_adcopy_history', JSON.stringify(history));
      
      // 最初の広告文を表示用として保存
      if (results.length > 0) {
        localStorage.setItem('lp_navigator_generated_adcopy', JSON.stringify(results[0]));
      }

      // 生成された広告文を比較ビューで表示するために画面遷移
      navigate('/generator/adcopy', { replace: true });

    } catch (error) {
      console.error('Error generating ad copies:', error);
      setError('広告文の生成中にエラーが発生しました。');
    } finally {
      setIsGenerating(false);
    }
  };

  // ダミーの広告文コンテンツを生成（実際はAI APIを使用）
  const generateDummyAdCopyContent = (basicInfo: BasicInfo, formula: AdCopyFormula, modelName: string) => {
    // 基本情報の内容から簡単な広告文を生成
    const contentText = basicInfo.content.substring(0, 100);
    const titleText = basicInfo.title;
    
    // モデル別に少し異なる内容にする
    if (modelName === 'ChatGPT') {
      return `【${titleText}】\n\n業界最先端のAI技術を駆使して、あなたのコンテンツ作成を革新します。時間の節約と品質の向上を同時に実現。今すぐ無料トライアルを始めて、効率的なコンテンツ戦略を構築しましょう。`;
    } else if (modelName === 'Gemini') {
      return `✨ ${titleText} ✨\n\nコンテンツ作成の常識を覆す、次世代AIツール。あなたのアイデアを瞬時に魅力的な文章に変換します。創造性を解き放ち、ブランドの声を届けましょう。期間限定30%オフキャンペーン実施中！`;
    } else {
      return `${titleText}\n\n「もっと効率的にコンテンツを作れたら...」\nそんな願いを叶えるツールが誕生しました。高品質な文章を、あなたのブランドボイスで、しかも驚くほど簡単に。\n\n今なら14日間無料でお試しいただけます。`;
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
  const saveEditedContent = (id: string) => {
    if (editorRef.current) {
      const updatedContent = editorRef.current.innerText;
      
      // 広告文を更新
      const updatedAdCopies = generatedAdCopies.map(copy => 
        copy.id === id ? { ...copy, content: updatedContent } : copy
      );
      
      setGeneratedAdCopies(updatedAdCopies);
      
      // 広告文履歴も更新
      const savedHistory = localStorage.getItem('lp_navigator_adcopy_history');
      if (savedHistory) {
        const history = JSON.parse(savedHistory);
        const updatedHistory = history.map((item: any) => 
          item.id === id ? { ...item, content: updatedContent } : item
        );
        localStorage.setItem('lp_navigator_adcopy_history', JSON.stringify(updatedHistory));
      }
      
      setEditMode(null);
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