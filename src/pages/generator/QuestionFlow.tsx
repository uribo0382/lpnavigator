import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Sparkles, CheckCircle, FileText, Bot, Lightbulb, Save, Clock, HelpCircle, AlertCircle, Info } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import TextArea from '../../components/ui/TextArea';
import Select from '../../components/ui/Select';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import BasicInfoReview from './BasicInfoReview';
import { mockQuestions } from '../../utils/mockData';

interface QuestionFlowProps {
  onContentGenerated: (content: {
    title: string;
    content: string;
    metaDescription: string;
    permalink: string;
    createdAt: Date;
  }) => void;
}

const modelOptions = [
  { value: 'gpt-4o', label: 'GPT-4o (OpenAI)' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (OpenAI)' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (OpenAI)' },
  { value: 'claude-3-opus', label: 'Claude 3 Opus (Anthropic)' },
];

// アクティブな質問のインデックスを解析するヘルパー関数
const parseActiveQuestion = (hash: string): number => {
  if (!hash) return 0;
  
  // 新しい形式 (#q-X) と古い形式 (#question-X) の両方に対応
  const newMatch = hash.match(/#q-(\d+)/);
  if (newMatch && newMatch[1]) {
    const index = parseInt(newMatch[1], 10) - 1;
    return index >= 0 ? index : 0;
  }
  
  // 後方互換性のため古い形式もサポート
  const oldMatch = hash.match(/#question-(\d+)/);
  if (oldMatch && oldMatch[1]) {
    const index = parseInt(oldMatch[1], 10) - 1;
    return index >= 0 ? index : 0;
  }
  
  return 0;
};

// 保存データの型定義を追加
interface SavedData {
  id: string;
  title: string;
  date: string;
  progress: number;
  answers: Record<string, string>;
}

// 必須フラグを追加して質問型を拡張
interface Question {
  id: string;
  text: string;
  category: string;
  helperText?: string;
  order: number;
  isActive: boolean;
  sampleAnswer?: string;
  isRequired: boolean;
}

const QuestionFlow: React.FC<QuestionFlowProps> = ({ onContentGenerated }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [questions] = useState<Question[]>(() => {
    const processedQuestions = mockQuestions
      .map(q => ({
        ...q,
        isActive: q.isActive === undefined ? false : q.isActive,
        order: q.order === undefined ? 0 : q.order,
        isRequired: q.isRequired === undefined ? false : q.isRequired,
      }))
      .filter(q => q.isActive === true)
      .sort((a, b) => a.order - b.order);
    return processedQuestions as Question[];
  });
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [redirectToSaved, setRedirectToSaved] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(true); // 説明パネルの表示状態
  
  // テキストエリア参照とキャレット位置
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });
  
  // アラート関連の状態
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // AI添削関連の状態
  const [aiEditing, setAiEditing] = useState(false);
  const [aiEditedText, setAiEditedText] = useState<string>('');
  const [showAiSuggestion, setShowAiSuggestion] = useState(false);
  
  // State for LP Generation Confirmation Dialog
  const [showGenerateConfirmDialog, setShowGenerateConfirmDialog] = useState(false);

  // アニメーション制御用のstate追加
  const [generationComplete, setGenerationComplete] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [showCompletedAnimation, setShowCompletedAnimation] = useState(false);
  const animationRef = useRef<number | null>(null);
  
  // 確認画面を表示するためのステート追加
  const [showReview, setShowReview] = useState(false);
  
  // アニメーションの制御用
  useEffect(() => {
    if (isGenerating) {
      let startTime: number;
      let animationDuration = 3000; // アニメーションの総時間(ms) - 最低でも生成処理と同じ時間
      
      // アニメーションのフレームループを開始
      const animateProgress = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);
        
        setAnimationProgress(progress);
        
        if (progress < 1) {
          // アニメーションを続ける
          animationRef.current = requestAnimationFrame(animateProgress);
        } else {
          // アニメーション完了
          if (generationComplete) {
            // 生成処理も完了している場合、結果画面に遷移
            completeGenerationAndNavigate();
          } else {
            // アニメーションだけ完了した場合は、完了アニメーションを表示
            setShowCompletedAnimation(true);
          }
        }
      };
      
      // アニメーションを開始
      animationRef.current = requestAnimationFrame(animateProgress);
      
      // クリーンアップ関数
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [isGenerating, generationComplete]);

  // 初期化時に保存データから回答を読み込み、フォームに反映
  useEffect(() => {
    let initialAnswers: Record<string, string> = {};
    const fromHistory = location.state?.fromHistory;
    const savedDataId = location.state?.savedDataId;
    if (fromHistory && savedDataId) {
      const savedListStr = localStorage.getItem('lp_navigator_saved_list') || '[]';
      try {
        const savedList: SavedData[] = JSON.parse(savedListStr);
        const target = savedList.find(item => item.id === savedDataId);
        if (target) {
          initialAnswers = target.answers;
          // localStorageにも保持
          localStorage.setItem('lp_navigator_answers', JSON.stringify(initialAnswers));
        }
      } catch (e) {
        console.error('保存データの読み込み失敗:', e);
      }
    }
    // 回答をセット
    setAnswers(initialAnswers);
    // HashRouterを使用している場合は、ハッシュから質問番号を読み取らない
    // const hashIndex = parseActiveQuestion(window.location.hash);
    // setActiveQuestionIndex(hashIndex < questions.length ? hashIndex : 0);
    
    // 常に最初の質問から始める
    setActiveQuestionIndex(0);
  }, []);
  
  // アクティブな質問が変更されたときにURLハッシュを更新
  useEffect(() => {
    // HashRouterを使用している場合は、ハッシュの更新を無効化
    // HashRouterでは#/pathの形式を使用するため、追加のハッシュフラグメントは競合する
    // 代わりにクエリパラメータやstateを使用することを推奨
    
    // 以下のコードをコメントアウトして無効化
    /*
    const newHash = `q-${activeQuestionIndex + 1}`;
    
    if (!window.location.hash.includes(newHash)) {
      try {
        const url = new URL(window.location.href);
        url.hash = newHash;
        window.history.replaceState(null, '', url.toString());
      } catch (error) {
        console.error('Hash update error:', error);
      }
    }
    */
  }, [activeQuestionIndex]);

  const currentQuestion = questions[activeQuestionIndex];
  const currentAnswer = answers[currentQuestion.id] || '';
  const isLastQuestion = activeQuestionIndex === questions.length - 1;

  // 再レンダー後にキャレット位置を再設定
  useLayoutEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      const { start, end } = selectionRef.current;
      ta.setSelectionRange(start, end);
    }
  }, [currentAnswer]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    // キャレット位置をキャプチャ
    const ta = textareaRef.current;
    if (ta) {
      selectionRef.current = { start: ta.selectionStart || 0, end: ta.selectionEnd || 0 };
    }
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);
    localStorage.setItem('lp_navigator_answers', JSON.stringify(newAnswers));
  };

  // onSelect/onMouseUp/onKeyUp 共通でキャレット復元
  const handleCaretChange = () => {
    const ta = textareaRef.current;
    if (ta) {
      const pos = ta.selectionStart || 0;
      selectionRef.current = { start: pos, end: pos };
      ta.setSelectionRange(pos, pos);
    }
  };

  const handleNext = () => {
    if (activeQuestionIndex < questions.length - 1) {
      // 成功メッセージを表示
      setShowSuccessMessage(true);
      
      // 少し遅延させてから次の質問に移動
      setTimeout(() => {
        setShowSuccessMessage(false);
        setActiveQuestionIndex(prev => prev + 1);
      }, 500);
    }
  };

  const handlePrevious = () => {
    if (activeQuestionIndex > 0) {
      setActiveQuestionIndex(prev => prev - 1);
    }
  };

  // 模範回答を自動入力するための関数
  const fillSampleAnswer = () => {
    if (currentQuestion?.sampleAnswer) {
      handleAnswerChange(currentQuestion.id, currentQuestion.sampleAnswer);
    }
  };

  // すべての質問に模範回答を自動入力する関数
  const fillAllSampleAnswers = () => {
    const newAnswers = { ...answers };
    
    questions.forEach(question => {
      if (question.sampleAnswer) {
        newAnswers[question.id] = question.sampleAnswer;
      }
    });
    
    setAnswers(newAnswers);
    
    // ローカルストレージに保存
    localStorage.setItem('lp_navigator_answers', JSON.stringify(newAnswers));
    
    // 成功メッセージを表示
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 1500);
  };

  // 特定の質問にジャンプする関数
  const jumpToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setActiveQuestionIndex(index);
    }
  };

  // 必須質問への回答をチェック
  const checkRequiredAnswers = () => {
    const unansweredRequired = questions.filter(q => 
      q.isRequired && (!answers[q.id] || answers[q.id].trim() === '')
    );
    return unansweredRequired.length === 0;
  };

  // 条件を緩和して、常に次へボタンを表示できるようにする（デモ用）
  const canProceed = true; // answers[currentQuestion?.id] && answers[currentQuestion?.id].trim() !== '';

  // 回答状況に基づいて進捗状況を計算
  const calculateProgress = () => {
    const answeredCount = questions.filter(q => answers[q.id] && answers[q.id].trim() !== '').length;
    return (answeredCount / questions.length) * 100;
  };

  // 入力内容確認画面を表示
  const handleShowReview = () => {
    if (!checkRequiredAnswers()) {
      setAlertMessage('必須質問に回答してください。');
      setShowAlertDialog(true);
      return;
    }
    setShowReview(true);
  };

  // 入力画面に戻る
  const handleBackToInput = () => {
    setShowReview(false);
  };

  // 確認画面から基本情報生成の確認ダイアログを表示
  const handleConfirmFromReview = () => {
    setShowReview(false);
    setShowGenerateConfirmDialog(true);
  };

  // LP記事生成ロジックの修正版
  const executeGenerateContent = () => {
    setIsGenerating(true);
    setGenerationComplete(false);
    setAnimationProgress(0);
    setShowCompletedAnimation(false);
    
    // Simulate API call to generate content
    setTimeout(() => {
      const sampleContent = {
        title: "あなたの問題を解決する究極のソリューション",
        content: `<h1>あなたの問題を解決する究極のソリューション</h1>
        <p>毎日の悩みから解放されたいと思ったことはありませんか？多くの人が同じ問題に直面していますが、その解決策を見つけるのは容易ではありません。</p>

        <h2>あなたが直面している問題</h2>
        <p>${answers['9'] || '多くの人々は日々のストレスや効率の悪さに悩まされています。'}</p>

        <h2>私たちの商品について</h2>
        <p>${answers['1'] || '当社の革新的な商品は、最新技術と使いやすさを組み合わせて設計されています。'}</p>

        <h3>商品の主な特徴</h3>
        <ul>
          <li>${answers['2'] || '使いやすいインターフェース'}</li>
          <li>時間節約</li>
          <li>高品質な結果</li>
        </ul>

        <h2>お客様の声</h2>
        <blockquote>
          「${answers['6'] || 'この商品を使い始めてから、生活が一変しました。もっと早く知っていれば良かったです！'}」
          <cite>- 満足したお客様</cite>
        </blockquote>

        <h2>競合製品との違い</h2>
        <p>${answers['12'] || '当社の製品は、競合他社の製品と比較して、より使いやすく、より多くの機能を提供しています。'}</p>

        <h2>得られる結果</h2>
        <p>${answers['13'] || '当社の製品を使用することで、効率が向上し、ストレスが軽減され、より良い結果を得ることができます。'}</p>

        <h2>今すぐ行動しましょう</h2>
        <p>${answers['4'] || '限定オファーをお見逃しなく！今なら特別価格でご提供中です。'}</p>

        <p>${answers['3'] || '今すぐ注文して、あなたの生活を変えましょう。'}</p>

        <div class="cta-box">
          <h3>特別オファー</h3>
          <p>${answers['5'] || 'この特別オファーは期間限定です。すぐにご購入ください！'}</p>
          <p>${answers['7'] || '今すぐ購入すると、特別な特典が付いてきます！'}</p>
          <button class="cta-button">今すぐ購入</button>
        </div>`,
        metaDescription: `${answers['9'] ? answers['9'].substring(0, 50) + '...' : '問題解決の商品で日常の問題を解決。効率的で使いやすい当社の製品があなたの生活を向上させます。'}`,
        permalink: "best-product-ultimate-solution",
        createdAt: new Date()
      };

      // onContentGenerated(sampleContent); // ここでは実行せず、データを保存
      // 生成完了状態にする
      setGenerationComplete(true);
      
      // カスタムイベントで生成完了データを保存
      (window as any).generatedContent = sampleContent;
      
      // アニメーションが完了していない場合は、アニメーション完了を待つ
      // アニメーション側の useEffect で completeGenerationAndNavigate() が呼ばれる
      
      if (animationProgress >= 1) {
        // アニメーションが既に完了している場合は遷移
        completeGenerationAndNavigate();
      }
    }, 3000);
  };
  
  // 生成完了して遷移する関数
  const completeGenerationAndNavigate = () => {
    // 保存しておいたデータを使用
    const sampleContent = (window as any).generatedContent;
    if (sampleContent) {
      onContentGenerated(sampleContent);
      // 状態をリセット
      setIsGenerating(false);
      setShowGenerateConfirmDialog(false);
      
      try {
        navigate('/generator/content', { replace: true });
      } catch (error) {
        console.error('Navigation error:', error);
        window.location.href = '/generator/content';
      }
    }
  };

  // 回答が入力されているか確認
  const hasAnswers = useCallback(() => {
    return Object.values(answers).some(answer => answer && answer.trim() !== '');
  }, [answers]);

  // 画面遷移前の確認
  const confirmNavigation = useCallback((targetPath: string) => {
    if (hasAnswers()) {
      setPendingNavigation(targetPath);
      setShowConfirmDialog(true);
      return false;
    }
    return true;
  }, [hasAnswers]);

  // 保存せずに画面遷移
  const handleNavigateWithoutSaving = useCallback(() => {
    if (pendingNavigation) {
      try {
        navigate(pendingNavigation);
      } catch (error) {
        console.error('Navigation error:', error);
        // フォールバックとしてwindow.locationを使用
        window.location.href = pendingNavigation;
      }
    }
  }, [navigate, pendingNavigation]);
  
  // ブラウザバックやページ離脱時の処理
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasAnswers()) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasAnswers]);

  // 途中保存用の関数を拡張
  const handleSaveProgress = () => {
    // 現在の保存リストを取得
    const savedListStr = localStorage.getItem('lp_navigator_saved_list') || '[]';
    let savedList: SavedData[] = [];
    
    try {
      savedList = JSON.parse(savedListStr);
    } catch (e) {
      console.error('Failed to parse saved list:', e);
    }
    
    // 新しい保存データを作成
    const newSaveData: SavedData = {
      id: Date.now().toString(),
      title: `LP記事 (${new Date().toLocaleDateString()})`,
      date: new Date().toISOString(),
      progress: calculateProgress(),
      answers: { ...answers }
    };
    
    // リストに追加
    savedList.push(newSaveData);
    
    // ローカルストレージに保存
    localStorage.setItem('lp_navigator_saved_list', JSON.stringify(savedList));
    localStorage.setItem('lp_navigator_answers', JSON.stringify(answers));
    localStorage.setItem('lp_navigator_last_saved', newSaveData.id);
    
    // 成功メッセージを表示
    setShowSuccessMessage(true);
    
    // 保存リスト画面に遷移（少し遅延させる）
    setTimeout(() => {
      setShowSuccessMessage(false);
      // 保存データタブが選択された状態で遷移
      localStorage.setItem('lp_navigator_history_tab', 'saved');
      navigate('/generator/history', { replace: true });
    }, 1000);
  };

  // 保存画面への遷移処理
  useEffect(() => {
    if (redirectToSaved) {
      try {
        // ハッシュをクリアしてからナビゲート
        window.history.replaceState(null, '', window.location.pathname);
        navigate('/generator/history', { replace: true });
      } catch (error) {
        console.error('Navigation error:', error);
        // フォールバックとしてwindow.locationを使用（HashRouter形式）
        window.location.href = '#/generator/history';
      }
    }
  }, [redirectToSaved, navigate]);

  // AIによる添削処理
  const handleAiEdit = () => {
    if (!currentAnswer.trim()) {
      setAlertMessage('添削するテキストを入力してください。');
      setShowAlertDialog(true);
      return;
    }

    setAiEditing(true);

    // AI添削のシミュレーション（実際の実装ではAPIを呼び出す）
    setTimeout(() => {
      const enhancedText = simulateAiEnhancement(currentAnswer);
      setAiEditedText(enhancedText);
      setShowAiSuggestion(true);
      setAiEditing(false);
    }, 1500);
  };

  // AI添削のシミュレーション関数
  const simulateAiEnhancement = (text: string) => {
    // この部分は実際のAPIと置き換えます
    const improvements = [
      { type: '表現の改善', original: '良い', enhanced: '優れた' },
      { type: '文章の充実', original: 'です。', enhanced: 'であり、お客様満足度No.1を獲得しています。' },
      { type: '説得力向上', original: 'あります', enhanced: '豊富に取り揃えております' },
      { type: '専門用語追加', original: '効果', enhanced: '効果（コンバージョン率向上）' }
    ];

    let enhancedText = text;
    improvements.forEach(item => {
      if (text.includes(item.original)) {
        enhancedText = enhancedText.replace(
          item.original, 
          `<span class="bg-green-100 text-green-800 px-1 rounded" title="${item.type}">${item.enhanced}</span>`
        );
      }
    });

    // 文章末に補足を追加
    if (!enhancedText.endsWith('.') && !enhancedText.endsWith('。')) {
      enhancedText += '<span class="bg-blue-100 text-blue-800 px-1 rounded" title="補足情報の追加">。さらに詳しい情報はお問い合わせください。</span>';
    }

    return enhancedText;
  };

  // AI添削結果を適用
  const applyAiSuggestion = () => {
    // HTMLタグを取り除いた純粋なテキストを取得
    const plainText = aiEditedText.replace(/<[^>]*>/g, '');
    handleAnswerChange(currentQuestion.id, plainText);
    setShowAiSuggestion(false);
  };

  // AI添削結果をキャンセル
  const cancelAiSuggestion = () => {
    setShowAiSuggestion(false);
  };

  // アニメーション用CSSの追加
  useEffect(() => {
    // head要素に style タグを追加
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      @keyframes orbitSpin {
        0% { opacity: 1; transform: rotate(0deg) translateY(-40px) scale(1); }
        50% { opacity: 0.5; transform: rotate(180deg) translateY(-40px) scale(1.2); }
        100% { opacity: 1; transform: rotate(360deg) translateY(-40px) scale(1); }
      }
      
      @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
      
      @keyframes scale {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.3); }
      }
      
      @keyframes textPulse {
        0% { opacity: 0.7; transform: scale(0.95); }
        50% { opacity: 1; transform: scale(1.05); }
        100% { opacity: 0.7; transform: scale(0.95); }
      }
      
      @keyframes gradientFlow {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      
      @keyframes dotPulse {
        0%, 100% { opacity: 0; }
        50% { opacity: 1; }
      }
      
      @keyframes appearFromBottom {
        0% { transform: translateY(20px); opacity: 0; }
        100% { transform: translateY(0); opacity: 1; }
      }
      
      @keyframes progressBarFlash {
        0%, 100% { opacity: 0.8; }
        50% { opacity: 1; }
      }
      
      @keyframes scrollUp {
        0% { transform: translateY(0); }
        100% { transform: translateY(-120px); }
      }
      
      .animate-pulse {
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
      
      .animate-scale {
        animation: scale 1s ease-in-out infinite;
      }
      
      .animate-text-pulse {
        animation: textPulse 2s ease-in-out infinite;
        display: inline-block;
      }
      
      .animate-gradient {
        background: linear-gradient(90deg, #4f46e5, #3b82f6, #0ea5e9, #4f46e5);
        background-size: 300% 100%;
        animation: gradientFlow 3s ease infinite;
      }
      
      .dots-container .dot {
        animation: dotPulse 1.5s infinite;
      }
      
      .dots-container .dot:nth-child(2) {
        animation-delay: 0.2s;
      }
      
      .dots-container .dot:nth-child(3) {
        animation-delay: 0.4s;
      }
      
      .appear-from-bottom {
        animation: appearFromBottom 0.5s ease-out forwards;
      }
      
      .progress-bar-flash {
        animation: progressBarFlash 2s infinite;
      }
      
      .scroll-up {
        animation: scrollUp 10s linear infinite;
      }
    `;
    document.head.appendChild(styleTag);
    
    // クリーンアップ関数でstyleタグを削除
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);

  // 確認画面を表示する場合
  if (showReview) {
    return (
      <BasicInfoReview
        answers={answers}
        questions={questions}
        onBack={handleBackToInput}
        onConfirm={handleConfirmFromReview}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        modelOptions={modelOptions}
      />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">基本情報の作成</h1>

      {/* 入力方法説明パネル */}
      {showInstructions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-start">
            <div className="flex">
              <Info size={24} className="text-blue-500 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-blue-700 mb-2">入力方法について</h3>
                <ul className="text-blue-800 space-y-2 text-sm">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>任意の質問ステップに移動して、<strong>順不同で入力できます</strong>。上部の番号ボタンをクリックして移動できます。</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>すべてのステップに回答しなくてもLP記事を生成できますが、<strong>必須マーク</strong><span className="text-red-500 font-bold ml-1">*</span>のある質問には必ず回答してください。</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>質問に対する回答は「模範回答」ボタンから例を参照できます。</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>いつでも「途中保存」ボタンで入力内容を保存できます。</span>
                  </li>
                </ul>
              </div>
            </div>
            <button 
              onClick={() => setShowInstructions(false)}
              className="text-blue-500 hover:text-blue-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <FileText size={20} className="mr-2 text-primary-500" />
            基本情報収集
          </h2>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Save size={16} />}
              onClick={handleSaveProgress}
              className="flex items-center"
            >
              途中保存
            </Button>
            {/* モデル選択は最終質問ステップでのみ表示 */}
            {!isLastQuestion && (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<HelpCircle size={16} />}
                onClick={() => setShowInstructions(prev => !prev)}
                className="text-blue-600"
              >
                ヘルプ
              </Button>
            )}
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden">
            <div className="bg-gray-100 h-2 rounded-full mb-4">
              <div 
                className="bg-gray-400 h-2 rounded-full transition-all duration-500 ease-in-out progress-indicator"
                style={{ width: `${calculateProgress()}%`, backgroundColor: calculateProgress() < 30 ? '#ef4444' : calculateProgress() < 70 ? '#f59e0b' : '#10b981' }}
              ></div>
            </div>
            
            <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
              <div>質問 {activeQuestionIndex + 1} / {questions.length}</div>
              <div className="flex items-center">
                回答進捗: {Math.round(calculateProgress())}%
                {calculateProgress() > 0 && (
                  <CheckCircle size={14} className="ml-1 text-success-500" />
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* シンプルな質問ナビゲーション - 数字と枠を強調 */}
        <div className="bg-gray-50 p-3 rounded-lg mb-6">
          <div className="flex justify-center items-center">
            <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-21 gap-1 w-full">
              {questions.map((q, index) => {
                // 状態の確認
                const isActive = activeQuestionIndex === index;
                const isCompleted = answers[q.id] && answers[q.id].trim() !== '';
                const isRequired = q.isRequired;
                
                return (
                  <button
                    key={q.id}
                    onClick={() => jumpToQuestion(index)}
                    className={`
                      flex flex-col items-center justify-center p-1 rounded
                      transition-all duration-200 relative
                      ${isActive 
                        ? 'bg-primary-700 ring-4 ring-primary-200' 
                        : isCompleted 
                          ? 'bg-primary-100 text-primary-700 border border-primary-300' 
                          : 'bg-gray-100 text-gray-500 border border-gray-300'}
                    `}
                  >
                    <span className={`
                      font-mono font-bold text-xl
                      ${isActive ? 'text-yellow-300' : isCompleted ? 'text-primary-700' : 'text-gray-500'}
                    `}>
                      {index + 1}
                    </span>
                    {isRequired && (
                      <span className="absolute -top-2 -right-2 text-red-500 font-bold text-xs">*</span>
                    )}
                    {isCompleted && !isActive && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white shadow-sm"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="mt-3 px-2 text-center text-sm font-medium bg-primary-50 py-1 rounded border border-primary-100">
            現在の質問: <span className="text-primary-700 font-bold">{activeQuestionIndex + 1}</span> / {questions.length}
          </div>
        </div>
      </div>

      <Card className="slide-in relative">
        {showSuccessMessage && (
          <div className="absolute top-0 left-0 right-0 bg-success-500 text-white py-2 text-center text-sm font-medium animate-pulse rounded-t-lg z-10 success-animation flex items-center justify-center">
            <CheckCircle size={16} className="mr-2" />
            回答が保存されました
          </div>
        )}
        
        <div className="mb-8 mt-2">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              {currentQuestion?.text}
              {currentQuestion?.isRequired && (
                <span className="text-red-500 font-bold ml-1">*</span>
              )}
              {!currentQuestion?.isRequired && (
                <span className="text-gray-400 text-sm ml-2">(任意)</span>
              )}
            </h3>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Bot size={16} />}
                onClick={handleAiEdit}
                disabled={aiEditing || !currentAnswer.trim()}
                isLoading={aiEditing}
              >
                AI添削
              </Button>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Lightbulb size={16} />}
                onClick={fillSampleAnswer}
              >
                模範回答
              </Button>
            </div>
          </div>
          {currentQuestion?.helperText && (
            <p className="text-sm text-gray-500 mb-4">
              {currentQuestion.helperText}
            </p>
          )}
          
          {/* AI添削の提案表示 */}
          {showAiSuggestion && (
            <div className="mb-4 p-3 border border-primary-200 bg-primary-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-primary-700 font-medium flex items-center">
                  <Bot size={16} className="mr-2" />
                  AIによる添削提案
                </h4>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cancelAiSuggestion}
                  >
                    キャンセル
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={applyAiSuggestion}
                  >
                    適用する
                  </Button>
                </div>
              </div>
              <div 
                className="p-3 bg-white rounded border border-gray-200 text-gray-800"
                dangerouslySetInnerHTML={{ __html: aiEditedText }}
              />
            </div>
          )}
          
          <TextArea
            ref={textareaRef}
            value={answers[currentQuestion.id] || ''}
            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
            placeholder="ここに回答を入力してください..."
            rows={6}
            fullWidth
            onSelect={handleCaretChange}
            onKeyUp={handleCaretChange}
            onMouseUp={handleCaretChange}
          />
        </div>

        <div className="sticky-footer nav-buttons mt-4 border-t pt-4 flex flex-wrap gap-2">
          <Button
            variant="outline"
            leftIcon={<ArrowLeft size={16} />}
            onClick={handlePrevious}
            disabled={activeQuestionIndex === 0 || isLoading}
            className="min-w-24"
          >
            前へ
          </Button>

          {/* 保存ボタン */}
          <Button
            variant="secondary"
            leftIcon={<Save size={16} />}
            onClick={handleSaveProgress}
            disabled={isLoading || isGenerating}
            className="ml-0 sm:ml-2"
          >
            保存
          </Button>

          {/* 最後の質問の場合は確認ボタンとモデル選択、それ以外は次へボタンを表示 */}
          {isLastQuestion ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center w-full sm:w-auto sm:ml-auto gap-2 mt-2 sm:mt-0">
              <Button
                variant="primary"
                leftIcon={<FileText size={16} />}
                onClick={handleShowReview}
                disabled={isGenerating}
                className="min-w-32 important-button w-full sm:w-auto"
              >
                入力内容を確認
              </Button>
            </div>
          ) : (
            <Button
              variant="primary"
              rightIcon={<ArrowRight size={20} className="stroke-gray-800 stroke-2" />}
              onClick={handleNext}
              disabled={isLoading}
              className="next-button important-button w-full sm:w-auto sm:ml-auto mt-2 sm:mt-0"
            >
              次へ
            </Button>
          )}
        </div>
      </Card>

      {isGenerating && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-xl shadow-2xl max-w-md w-full border border-gray-700">
            <div className="text-center relative">
              {/* メインアニメーション部分 */}
              <div className="relative mb-6 mx-auto w-28 h-28">
                {/* 背景のグラデーションサークル */}
                <div className="absolute inset-0 rounded-full animate-gradient opacity-20" style={{ filter: 'blur(10px)' }}></div>
                
                {/* ロボットアイコンを回転させるアニメーション */}
                <Bot 
                  size={112} 
                  className="absolute inset-0 text-primary-400 z-10"
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
                        animation: `orbitSpin 3s infinite ease-in-out ${i * 0.2}s`,
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
                        animation: `orbitSpin 6s infinite ease-in-out ${i * 0.1}s`,
                        boxShadow: '0 0 6px rgba(74, 222, 128, 0.7)'
                      }}
                    />
                  ))}
                </div>
                
                {/* 生成完了したとき専用のアニメーション */}
                {showCompletedAnimation && (
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <CheckCircle size={56} className="text-success-500 animate-scale" style={{ filter: 'drop-shadow(0 0 10px rgba(34, 197, 94, 0.7))' }} />
                  </div>
                )}
              </div>
              
              {/* 「生成中」テキスト - センターに大きく表示 */}
              <div className="mb-8 appear-from-bottom" style={{ opacity: showCompletedAnimation ? 0 : 1, transition: 'opacity 0.5s ease' }}>
                <div className="animate-text-pulse mb-3">
                  <span className="text-2xl font-bold text-transparent bg-clip-text animate-gradient">
                    生成中
                  </span>
                  <span className="dots-container inline-flex ml-1">
                    <span className="dot text-2xl text-primary-400">.</span>
                    <span className="dot text-2xl text-primary-400">.</span>
                    <span className="dot text-2xl text-primary-400">.</span>
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-2">
                  AIが高度なアルゴリズムを駆使して最適な基本情報を生成しています
                </p>
              </div>
              
              {/* 「完了」メッセージ */}
              {showCompletedAnimation && (
                <div className="mb-8 appear-from-bottom">
                  <h2 className="text-2xl font-bold text-transparent bg-clip-text animate-gradient mb-2">
                    生成完了！
                  </h2>
                  <p className="text-gray-400 text-sm">
                    最適な基本情報が生成されました。画面遷移します...
                  </p>
                </div>
              )}
              
              {/* プログレスバー */}
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div className="text-xs text-gray-400">
                    {Math.round(animationProgress * 100)}%
                  </div>
                  <div className="text-xs text-gray-400">
                    {showCompletedAnimation ? '完了' : 'AIプロセス実行中'}
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-2 text-xs flex rounded-full bg-gray-700">
                  <div 
                    className={`${showCompletedAnimation ? 'bg-success-500' : 'animate-gradient progress-bar-flash'} h-full rounded-full`}
                    style={{ 
                      width: `${animationProgress * 100}%`,
                      transition: 'width 0.3s ease'
                    }}
                  ></div>
                </div>
              </div>
              
              {/* 処理内容を示唆するテキスト - コンピュータっぽい演出 */}
              <div className="mt-4 text-left bg-gray-900 p-2 rounded text-xs font-mono text-gray-400 h-12 overflow-hidden">
                <div className="scroll-up">
                  {!showCompletedAnimation ? (
                    <>
                      <p>&gt; 情報収集完了</p>
                      <p>&gt; テンプレート選択中...</p>
                      <p>&gt; コンテンツ最適化実行中...</p>
                      <p>&gt; ユーザー目的分析中...</p>
                      <p>&gt; 単語ベクトル計算中...</p>
                      <p>&gt; セマンティック処理実行中...</p>
                    </>
                  ) : (
                    <>
                      <p>&gt; 処理完了</p>
                      <p>&gt; コンテンツ生成成功</p>
                      <p>&gt; 結果ページへリダイレクト準備完了</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 確認ダイアログ (ページ離脱時など) */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleSaveProgress}
        onCancel={handleNavigateWithoutSaving}
        title="変更が保存されていません"
        message="入力内容が保存されていません。保存しますか？"
        confirmLabel="保存する"
        cancelLabel="保存せずに移動"
      />

      {/* アラートダイアログ (必須項目未入力時など) */}
      <ConfirmDialog
        isOpen={showAlertDialog}
        onClose={() => setShowAlertDialog(false)}
        onConfirm={() => setShowAlertDialog(false)}
        message={alertMessage}
        confirmLabel="OK"
      />

      {/* Confirm Dialog for LP Generation */}
      <ConfirmDialog
        isOpen={showGenerateConfirmDialog}
        onClose={() => setShowGenerateConfirmDialog(false)}
        onConfirm={executeGenerateContent}
        onCancel={() => setShowGenerateConfirmDialog(false)}
        message="基本情報を生成します。よろしいですか？"
        confirmLabel="生成する"
        cancelLabel="キャンセル"
      />
    </div>
  );
};

export default QuestionFlow;