import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Sparkles, CheckCircle, FileText, Bot, Lightbulb, Save, Clock, HelpCircle, AlertCircle, Info } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import TextArea from '../../components/ui/TextArea';
import Select from '../../components/ui/Select';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import BasicInfoReview from './BasicInfoReview';
import { generateBasicInfo } from '../../services/contentGenerator';
import type { AIProvider } from '../../services/ai';
import aiService from '../../services/ai';
import { getActiveQuestions, createQuestionSession, saveAllAnswers, completeSession, saveBasicInfo } from '../../services/questionsService';
import type { Question } from '../../services/questionsService';
import { useAuthFixed as useAuth } from '../../contexts/AuthContextFixed';
import { contentHistoryService } from '../../services/contentHistoryService';
import { supabase, refreshSession } from '../../lib/supabase';
import { formulaService } from '../../services/formulaService';

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
  { value: 'openai:gpt-5-pro', label: 'GPT-5 Pro (OpenAI) - 有料' },
  { value: 'openai:gpt-5', label: 'GPT-5 (OpenAI) - 有料' },
  { value: 'openai:gpt-4o-mini', label: 'GPT-4o Mini (OpenAI) - 有料' },
  { value: 'openai:gpt-4.1', label: 'GPT-4.1 (OpenAI) - 有料' },
  { value: 'openai:gpt-4.1-nano', label: 'GPT-4.1 Nano (OpenAI) - 有料' },
  { value: 'openai:gpt-audio-mini', label: 'GPT-Audio Mini (OpenAI) - 有料' },
  { value: 'anthropic:claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet (Anthropic) - 有料' },
  { value: 'anthropic:claude-3-5-haiku-latest', label: 'Claude 3.5 Haiku (Anthropic) - 有料' },
  { value: 'google:gemini-2.0-flash', label: 'Gemini 2.0 Flash (Google) - 無料' },
  { value: 'google:gemini-2.5-flash', label: 'Gemini 2.5 Flash (Google) - 無料' },
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


const QuestionFlow: React.FC<QuestionFlowProps> = ({ onContentGenerated }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState('openai:gpt-4o-mini');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { currentUser } = useAuth();
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

  // 質問データを取得
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        console.log('QuestionFlow: loadQuestions開始');
        setQuestionsLoading(true);
        
        const activeQuestions = await getActiveQuestions();
        console.log('QuestionFlow: 取得した質問', activeQuestions);
        
        // order_numberでソート済みの質問を設定
        setQuestions(activeQuestions);
      } catch (error) {
        console.error('質問データ読み込みエラー:', error);
        setAlertMessage('質問データの読み込みに失敗しました。');
        setShowAlertDialog(true);
      } finally {
        setQuestionsLoading(false);
      }
    };

    loadQuestions();
  }, []); // 依存配列を空にして、初回のみ実行

  // セッション作成（別のuseEffectで管理）
  useEffect(() => {
    const createSession = async () => {
      if (currentUser && questions.length > 0 && !sessionId) {
        try {
          console.log('QuestionFlow: セッション作成開始', currentUser.id);
          const session = await createQuestionSession(currentUser.id);
          setSessionId(session.id);
          console.log('QuestionFlow: セッション作成完了', session.id);
        } catch (error) {
          console.error('セッション作成エラー:', error);
          // セッション作成エラーは質問表示をブロックしない
        }
      }
    };

    createSession();
  }, [currentUser, questions.length, sessionId]);

  // 初期化時に保存データから回答を読み込み、フォームに反映
  useEffect(() => {
    const loadSavedData = async () => {
      let initialAnswers: Record<string, string> = {};
      const fromHistory = location.state?.fromHistory;
      const savedDataId = location.state?.savedDataId;
      
      if (fromHistory && savedDataId && currentUser) {
        try {
          // Supabaseから保存データを取得
          const savedData = await contentHistoryService.getSavedContentById(savedDataId);
          
          if (savedData && savedData.user_id === currentUser.id) {
            initialAnswers = savedData.answers;
            
            // セッション情報があれば復元
            if (savedData.session_data?.sessionId) {
              setSessionId(savedData.session_data.sessionId);
            }
            if (savedData.session_data?.selectedModel) {
              setSelectedModel(savedData.session_data.selectedModel);
            }
            
            // localStorageにも保持
            localStorage.setItem('lp_navigator_answers', JSON.stringify(initialAnswers));
          }
        } catch (e) {
          console.error('保存データの読み込み失敗:', e);
          // フォールバックとしてlocalStorageから読み込み
          const savedAnswers = localStorage.getItem('lp_navigator_answers');
          if (savedAnswers) {
            try {
              initialAnswers = JSON.parse(savedAnswers);
            } catch {}
          }
        }
      } else {
        // 通常の初期化時はlocalStorageから読み込み
        const savedAnswers = localStorage.getItem('lp_navigator_answers');
        if (savedAnswers) {
          try {
            initialAnswers = JSON.parse(savedAnswers);
          } catch {}
        }
      }
      
      // 回答をセット
      setAnswers(initialAnswers);
      // 常に最初の質問から始める
      setActiveQuestionIndex(0);
    };
    
    loadSavedData();
  }, [currentUser, location.state]);
  
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
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] || '' : '';
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
    if (currentQuestion?.sample_answer) {
      handleAnswerChange(currentQuestion.id, currentQuestion.sample_answer);
    }
  };

  // すべての質問に模範回答を自動入力する関数
  const fillAllSampleAnswers = () => {
    const newAnswers = { ...answers };
    
    questions.forEach(question => {
      if (question.sample_answer) {
        newAnswers[question.id] = question.sample_answer;
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
      q.is_required && (!answers[q.id] || answers[q.id].trim() === '')
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

  // 選択されたフォーミュラIDを保存する状態を追加
  const [selectedFormulaId, setSelectedFormulaId] = useState<string>('');
  
  // 確認画面から基本情報生成の確認ダイアログを表示
  const handleConfirmFromReview = (formulaId: string) => {
    setSelectedFormulaId(formulaId);
    setShowReview(false);
    setShowGenerateConfirmDialog(true);
  };

  // LP記事生成ロジックの修正版
  const executeGenerateContent = async () => {
    if (!currentUser) {
      setAlertMessage('コンテンツを生成するにはログインが必要です。');
      setShowAlertDialog(true);
      return;
    }

    // セッションがまだない場合は作成
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      try {
        const session = await createQuestionSession(currentUser.id);
        currentSessionId = session.id;
        setSessionId(session.id);
      } catch (error) {
        console.error('セッション作成エラー:', error);
        setAlertMessage('セッションの作成に失敗しました。');
        setShowAlertDialog(true);
        return;
      }
    }

    setIsGenerating(true);
    setGenerationComplete(false);
    setAnimationProgress(0);
    setShowCompletedAnimation(false);
    
    try {
      // セッションに回答を保存
      await saveAllAnswers(currentSessionId, answers);
      
      // モデル選択から provider と model を分離
      const [provider, model] = selectedModel.split(':') as [AIProvider, string];
      
      // 選択されたフォーミュラを取得
      let formulaTemplate: string | undefined;
      let formulaVariables: string[] | undefined;
      
      if (selectedFormulaId) {
        try {
          const formulas = await formulaService.getFormulasByType('basic_info');
          const selectedFormula = formulas.find(f => f.id === selectedFormulaId);
          
          if (selectedFormula) {
            formulaTemplate = selectedFormula.template;
            formulaVariables = selectedFormula.variables;
          }
        } catch (error) {
          console.error('フォーミュラ取得エラー:', error);
          // エラーが発生してもデフォルトの方法で続行
        }
      }
      
      // AI APIを使用してコンテンツを生成
      const generatedContent = await generateBasicInfo({
        answers,
        questions: questions.map(q => ({
          id: q.id,
          text: q.text,
          category: q.category
        })),
        provider,
        model,
        formulaTemplate,
        formulaVariables
      });

      // 基本情報をSupabaseに保存
      await saveBasicInfo(currentUser.id, currentSessionId, {
        title: generatedContent.title,
        content: generatedContent.content,
        summary: generatedContent.metaDescription,
        generated_by: selectedModel,
        formula_id: selectedFormulaId || undefined
      });
      
      // セッションを完了にマーク
      await completeSession(currentSessionId);

      // 生成完了状態にする
      setGenerationComplete(true);
      
      // カスタムイベントで生成完了データを保存
      (window as any).generatedContent = generatedContent;
      
      // アニメーションが完了していない場合は、アニメーション完了を待つ
      // アニメーション側の useEffect で completeGenerationAndNavigate() が呼ばれる
      
      if (animationProgress >= 1) {
        // アニメーションが既に完了している場合は遷移
        completeGenerationAndNavigate();
      }
    } catch (error) {
      console.error('コンテンツ生成エラー:', error);
      setIsGenerating(false);
      setAlertMessage('コンテンツの生成に失敗しました。もう一度お試しください。');
      setShowAlertDialog(true);
    }
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
  const handleSaveProgress = async () => {
    if (!currentUser) {
      setAlertMessage('保存するにはログインが必要です。');
      setShowAlertDialog(true);
      return;
    }

    // セッションがまだない場合は作成
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      try {
        const session = await createQuestionSession(currentUser.id);
        currentSessionId = session.id;
        setSessionId(session.id);
      } catch (error) {
        console.error('セッション作成エラー:', error);
        const errorMessage = error instanceof Error ? error.message : '不明なエラー';
        setAlertMessage(`セッションの作成に失敗しました: ${errorMessage}`);
        setShowAlertDialog(true);
        return;
      }
    }

    try {
      setIsLoading(true);
      
      // セッションをリフレッシュ
      try {
        await refreshSession();
      } catch (error) {
        console.error('セッションリフレッシュエラー:', error);
        // リフレッシュに失敗してもログは出すだけで続行
      }
      
      // Supabaseに回答を保存
      // 一時的にコメントアウトして、saved_contentsテーブルへの保存のみテスト
      // await saveAllAnswers(currentSessionId, answers);
      
      // タイトルを生成
      const title = `LP記事 (${new Date().toLocaleDateString('ja-JP')})`;
      const progress = Math.round(calculateProgress());
      
      // saved_contentsテーブルに保存
      const sessionData = {
        sessionId: currentSessionId,
        activeQuestionIndex,
        selectedModel
      };
      
      // 既存の保存データのIDを確認
      const savedDataId = location.state?.savedDataId;
      
      // 現在の認証情報を確認
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Auth user:', user?.id, 'Current user:', currentUser.id);
      
      console.log('保存処理開始', {
        userId: currentUser.id,
        authUserId: user?.id,
        sessionId: currentSessionId,
        savedDataId,
        answersCount: Object.keys(answers).length
      });
      
      const savedData = await contentHistoryService.saveDraftContent(
        currentUser.id,
        title,
        answers,
        progress,
        sessionData,
        savedDataId
      );
      
      console.log('保存成功', savedData);
      
      // ローカルストレージにも保存（バックアップ）
      localStorage.setItem('lp_navigator_answers', JSON.stringify(answers));
      localStorage.setItem('lp_navigator_last_saved', currentSessionId);
      
      // 成功メッセージを表示
      setShowSuccessMessage(true);
      
      // 保存リスト画面に遷移（少し遅延させる）
      setTimeout(() => {
        setShowSuccessMessage(false);
        // 保存データタブが選択された状態で遷移
        localStorage.setItem('lp_navigator_history_tab', 'saved');
        navigate('/generator/history', { replace: true });
      }, 1000);
    } catch (error) {
      console.error('保存エラー:', error);
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      setAlertMessage(`保存に失敗しました: ${errorMessage}`);
      setShowAlertDialog(true);
    } finally {
      setIsLoading(false);
    }
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
  const handleAiEdit = async () => {
    if (!currentAnswer.trim()) {
      setAlertMessage('添削するテキストを入力してください。');
      setShowAlertDialog(true);
      return;
    }

    if (!currentQuestion) return;

    setAiEditing(true);

    try {
      // Gemini APIを使用してAI添削
      const prompt = `あなたはLP作成のプロです。今、LPを作るための情報の整理を行なっている過程で、次の質問に答えようとしています。

質問内容：${currentQuestion.text}

そして、今途中まで入力した答えが次の通りです
${currentAnswer}

これをより解像度の高い回答にするために、内容を読み取り、情報に過不足がないか確かめ、不足している内容を補い、より体系的に整理された回答にして出力してください`;
      
      const response = await aiService.generateContent('google', {
        prompt,
        model: 'gemini-2.0-flash',
        temperature: 0.7,
        maxTokens: 500
      });
      
      setAiEditedText(response.content);
      setShowAiSuggestion(true);
    } catch (error) {
      console.error('AI添削エラー:', error);
      setAlertMessage('AI添削処理に失敗しました。もう一度お試しください。');
      setShowAlertDialog(true);
    } finally {
      setAiEditing(false);
    }
  };


  // AI添削結果を適用
  const applyAiSuggestion = () => {
    if (currentQuestion) {
      handleAnswerChange(currentQuestion.id, aiEditedText);
    }
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

  // 質問データがロード中の場合
  if (questionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-500">質問データを読み込み中...</p>
        </div>
      </div>
    );
  }

  // 質問データが空の場合
  if (questions.length === 0) {
    console.log('QuestionFlow: questions.length === 0', { questionsLoading });
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle size={48} className="text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">表示できる質問がありません。</p>
          <p className="text-gray-400 text-sm mt-2">Supabaseのquestionsテーブルにデータが存在し、is_activeがtrueに設定されているか確認してください。</p>
        </div>
      </div>
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
                const isRequired = q.is_required;
                
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
              {currentQuestion?.is_required && (
                <span className="text-red-500 font-bold ml-1">*</span>
              )}
              {!currentQuestion?.is_required && (
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
          {currentQuestion?.helper_text && (
            <p className="text-sm text-gray-500 mb-4">
              {currentQuestion.helper_text}
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
              <div className="p-3 bg-white rounded border border-gray-200">
                <p className="text-gray-800 whitespace-pre-wrap">{aiEditedText}</p>
              </div>
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