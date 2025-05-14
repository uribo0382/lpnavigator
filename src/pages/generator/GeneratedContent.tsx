import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Pencil, ListChecks, Check, RefreshCw, Edit, Save } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { escapeHtml, stripHtml } from '../../utils/textUtils';

// インターフェイスを変更
interface GeneratedContentProps {
  content?: {
    title: string;
    content: string;
    metaDescription: string;
    permalink: string;
    createdAt: Date;
    model?: string;
    wordCount?: number;
    excerpt?: string;
  } | null;
  onNewContent?: () => void;
}

const GeneratedContent: React.FC<GeneratedContentProps> = (props) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  // 編集用Divのref
  const editorRef = useRef<HTMLDivElement>(null);
  // エディタ内容は DOM で保持し、保存時に state に取り込む
  // ローカルストレージからコンテンツを取得
  const [content, setContent] = useState<{
    title: string;
    content: string;
    metaDescription: string;
    permalink: string;
    createdAt: Date;
    model?: string;
    wordCount?: number;
    excerpt?: string;
  } | null>(props.content || null);

  // コンテンツがない場合は、ローカルストレージから回答を読み込んでデモコンテンツを生成
  useEffect(() => {
    // props.contentが優先されるが、なければlocalStorageを確認
    if (!props.content) {
      const savedContent = localStorage.getItem('lp_navigator_generated_content');
      if (savedContent) {
        try {
          const parsedContent = JSON.parse(savedContent);
          parsedContent.createdAt = new Date(parsedContent.createdAt);
          setContent(parsedContent);
        } catch (e) {
          console.error('Failed to parse saved content:', e);
          redirectToCreate();
        }
      } else {
        // デモコンテンツの生成（ContentHistory.tsxと同じモックデータを使用）
        const demoContent = {
          id: '1',
          title: 'コンサルタント時間管理ソリューション基本情報',
          createdAt: new Date(2023, 5, 10),
          metaDescription: 'コンサルタントやコーチ向けの時間管理と売上向上のためのビデオ講座についての基本情報です。',
          permalink: 'consultant-time-management-solution',
          model: 'gpt-4o',
          wordCount: 850,
          excerpt: 'ビジネスオーナーのための時間管理と売上向上ソリューション',
          content: `ダン・ケネディが提供する「売上が倍増するコンサルタント時間術セミナー」に関する基本情報です。

【商品・サービスの概要】
「ダン・ケネディの売上が倍増するコンサルタント時間術セミナー」は、忙しいコンサルタントやコーチ、専門サービス提供者向けの無料ビデオ講座です。時間管理の革新的手法を学び、売上を増やしながら労働時間を減らすための具体的なシステムを提供します。詳細はhttps://www.dankennedy.jpで確認できます。

【主な特徴】
- ビジネスオーナーが時間の使い方を最適化するための実践的な手法
- 効率的な顧客対応と売上向上を両立させる戦略
- 夜間や週末の仕事を減らし、家族との時間を確保する方法
- 面倒なクライアント対応を最小限に抑えるコミュニケーションシステム
- 時間あたりの収益を最大化するプライシング戦略

【想定されるお客様】
忙しいスケジュールに悩むコンサルタント、コーチ、専門サービス提供者。特に販売から顧客サポートまですべてを一人で行っている個人事業主や小規模ビジネスオーナー。時間不足に悩みながらも売上が思うように増えない方々に最適です。

【解決できる課題】
- 過密スケジュールによる時間不足と疲労
- 労働時間の割に低い収益性
- 問題クライアントへの対応による精神的負担
- 深夜や週末の仕事による家族関係の悪化
- ビジネス拡大の障壁となる時間的制約

【提供価値】
このセミナーを受講することで、時間管理の効率化により最大50%の労働時間削減が可能になります。同時に、高単価クライアントの獲得と効率的なサービス提供により、売上を倍増させる具体的な方法を学べます。

【参加者の声】
「このセミナーの手法を実践したところ、週60時間の労働から40時間に減らしながら、月間売上が30%増加しました。特に問題クライアントへの対応時間が激減し、精神的にも楽になりました」- 東京都 マーケティングコンサルタント

「夜10時以降の仕事がなくなり、家族との時間が増えました。それでいて売上は1.5倍に。時間とお金の両方を手に入れる方法を具体的に教えてもらえたことに感謝しています」- 大阪府 ビジネスコーチ

【特別オファー】
セミナー参加者には、「高収益クライアント獲得ガイド」PDFを無料進呈。さらに有料プログラムへの参加で全額返金保証制度あり。初めての方でも6ヶ月で成果を出すためのサポート体制を完備しています。`
        };
        setContent(demoContent);
      }
    } else {
      setContent(props.content);
    }
  }, [props.content]);

  const redirectToCreate = () => {
      const savedAnswers = localStorage.getItem('lp_navigator_answers');
      if (savedAnswers) {
        try {
          setIsLoading(true);
          setTimeout(() => {
          try {
            navigate('/generator', { replace: true });
          } catch (error) {
            console.error('Navigation error:', error);
            window.location.href = '/generator';
          }
            setIsLoading(false);
          }, 500);
        } catch (e) {
          console.error('Failed to parse saved answers:', e);
        try {
          navigate('/generator', { replace: true });
        } catch (error) {
          console.error('Navigation error:', error);
          window.location.href = '/generator';
        }
      }
    } else {
      try {
        navigate('/generator', { replace: true });
      } catch (error) {
        console.error('Navigation error:', error);
        window.location.href = '/generator';
      }
    }
  };

  // 新規作成ハンドラー
  const handleNewContent = () => {
    // props.onNewContentがあればそれを使用
    if (props.onNewContent) {
      props.onNewContent();
      return;
    }
    
    // なければデフォルトの実装
    try {
      localStorage.removeItem('lp_navigator_answers');
      navigate('/generator', { replace: true });
    } catch (error) {
      console.error('Navigation error:', error);
      window.location.href = '/generator';
    }
  };

  // 編集モード開始 or editedContent 更新時に innerHTML を設定しキャレット復元
  useEffect(() => {
    if (isEditMode && editorRef.current) {
      editorRef.current.innerHTML = content?.content || '';
      editorRef.current.focus();
    }
  }, [isEditMode, content]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw size={40} className="mx-auto mb-4 text-primary-500 animate-spin" />
          <p className="text-gray-600">コンテンツを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return null;
  }

  // HTMLからテキストへの変換
  const htmlToText = (html: string) => {
    return stripHtml(html); // HTMLタグを完全に取り除く
  };

  const handleCopy = (text: string, type: string) => {
    // typeがcontentの場合はHTMLからテキストに変換
    const textToCopy = type === 'content' ? htmlToText(text) : text;
    navigator.clipboard.writeText(textToCopy);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  // 保存ボタンや編集終了時に呼び出して DOM の内容を state に反映
  const handleSaveContent = () => {
    if (editorRef.current && content) {
      const updated = {
        ...content,
        content: editorRef.current.innerText
      };
      setContent(updated);
      console.log('コンテンツを保存しました:', updated.content);
    }
    setIsEditMode(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-gray-800">基本情報詳細</h1>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            leftIcon={<ListChecks size={16} />}
            onClick={() => {
              try {
                navigate('/generator/history', { replace: true });
              } catch (error) {
                console.error('Navigation error:', error);
                window.location.href = '/generator/history';
              }
            }}
          >
            履歴を表示
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1">
        <Card className="h-full p-0 overflow-hidden">
          <div className="relative h-full">
            {isEditMode ? (
              <div
                ref={editorRef}
                className="content-wrapper w-full h-full bg-white overflow-auto p-6 pb-16 whitespace-pre-wrap"
                contentEditable
                style={{ minHeight: '600px', caretColor: 'var(--color-gray-800)' }}
              />
            ) : (
              <div 
                className="content-wrapper w-full h-full bg-white overflow-auto p-6 pb-16 whitespace-pre-wrap"
                style={{ minHeight: '600px' }}
              >
                {stripHtml(content.content)}
              </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 flex justify-start items-center bg-gray-50 p-3 border-t border-gray-200">
              <div className="flex space-x-3">
                <button 
                  className="flex items-center px-3 py-2 rounded-md bg-white hover:bg-gray-100 transition-colors border border-gray-200 text-gray-700 shadow-sm"
                  onClick={() => handleCopy(content.content, 'content')}
                  title="テキストをコピー"
                >
                  {copied === 'content' ? (
                    <>
                      <Check size={16} className="mr-1" />
                      <span className="text-sm font-medium">コピー済み</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} className="mr-1" />
                      <span className="text-sm font-medium">コピー</span>
                    </>
                  )}
                </button>
                <button 
                  className="flex items-center px-3 py-2 rounded-md shadow-sm hover:bg-gray-100 transition-colors border border-gray-200 bg-white text-gray-700"
                  onClick={() => {
                    if (isEditMode) {
                      handleSaveContent();
                    } else {
                      setIsEditMode(true);
                    }
                  }}
                  title={isEditMode ? '変更を保存' : '編集モード'}
                >
                  {isEditMode ? (
                    <>
                      <Save size={16} className="mr-1" />
                      <span className="text-sm font-medium">保存</span>
                    </>
                  ) : (
                    <>
                      <Edit size={16} className="mr-1" />
                      <span className="text-sm font-medium">編集</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-6 bg-primary-50 border border-primary-100 rounded-lg p-4">
          <h4 className="text-sm font-medium text-primary-800 mb-2">生成情報</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p>生成日時: {content.createdAt.toLocaleString('ja-JP')}</p>
            <p>使用モデル: {content.model || 'GPT-4o'}</p>
            <p>文字数: 約{content.wordCount || content.content.length}文字</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratedContent;