import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Download, Pencil, FileText, ListChecks, Check, RefreshCw, Edit, Save } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

// インターフェイスを変更
interface GeneratedContentProps {
  content?: {
    title: string;
    content: string;
    metaDescription: string;
    permalink: string;
    createdAt: Date;
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
        redirectToCreate();
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
    // 一時的なdiv要素を作成
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    // 内部のテキストを取得（HTMLタグを除去）
    return tempDiv.textContent || tempDiv.innerText || '';
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
        content: editorRef.current.innerHTML
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
          <h1 className="text-2xl font-bold text-gray-800">生成されたLP記事</h1>
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
          <Button
            leftIcon={<Pencil size={16} />}
            onClick={handleNewContent}
          >
            新規作成
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-full p-0 overflow-hidden">
            <div className="relative h-full">
              {isEditMode ? (
                <div
                  ref={editorRef}
                  className="content-wrapper w-full h-full bg-white overflow-auto p-6 pb-16"
                  contentEditable
                  style={{ minHeight: '600px', caretColor: 'var(--color-gray-800)' }}
                />
              ) : (
                <div 
                  className="content-wrapper w-full h-full bg-white overflow-auto p-6 pb-16"
                  dangerouslySetInnerHTML={{ __html: content.content }}
                  style={{ minHeight: '600px' }}
                />
              )}
              
              <div className="absolute bottom-0 left-0 right-0 flex justify-start items-center bg-gray-50 p-3 border-t border-gray-200">
                <div className="flex space-x-3">
                  <button 
                    className="flex items-center px-3 py-2 rounded-md bg-white hover:bg-gray-100 transition-colors border border-gray-200 text-gray-700 shadow-sm"
                    onClick={() => handleCopy(isEditMode ? content.content : content.content, 'content')}
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
        </div>

        <div className="space-y-6">
          <Card title="SEO情報">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-sm font-medium text-gray-700">タイトル</h4>
                  <button 
                    className="text-xs text-primary-600 hover:text-primary-800 flex items-center"
                    onClick={() => handleCopy(content.title, 'title')}
                  >
                    {copied === 'title' ? 'コピーしました！' : 'コピー'}
                    {copied !== 'title' && <Copy size={12} className="ml-1" />}
                  </button>
                </div>
                <p className="text-sm bg-gray-50 p-2 rounded border">{content.title}</p>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-sm font-medium text-gray-700">メタディスクリプション</h4>
                  <button 
                    className="text-xs text-primary-600 hover:text-primary-800 flex items-center"
                    onClick={() => handleCopy(content.metaDescription, 'meta')}
                  >
                    {copied === 'meta' ? 'コピーしました！' : 'コピー'}
                    {copied !== 'meta' && <Copy size={12} className="ml-1" />}
                  </button>
                </div>
                <p className="text-sm bg-gray-50 p-2 rounded border">{content.metaDescription}</p>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-sm font-medium text-gray-700">パーマリンク</h4>
                  <button 
                    className="text-xs text-primary-600 hover:text-primary-800 flex items-center"
                    onClick={() => handleCopy(content.permalink, 'permalink')}
                  >
                    {copied === 'permalink' ? 'コピーしました！' : 'コピー'}
                    {copied !== 'permalink' && <Copy size={12} className="ml-1" />}
                  </button>
                </div>
                <p className="text-sm bg-gray-50 p-2 rounded border">{content.permalink}</p>
              </div>
            </div>
          </Card>

          <Card title="ダウンロードオプション">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                生成されたコンテンツをHTMLファイルとしてダウンロードできます。
              </p>
              <Button
                variant="outline"
                fullWidth
                leftIcon={<FileText size={16} />}
                onClick={() => {
                  const element = document.createElement('a');
                  const file = new Blob([content.content], {type: 'text/html'});
                  element.href = URL.createObjectURL(file);
                  element.download = `${content.permalink || 'lp-content'}.html`;
                  document.body.appendChild(element);
                  element.click();
                  document.body.removeChild(element);
                }}
              >
                HTMLファイルをダウンロード
              </Button>
            </div>
          </Card>

          <div className="bg-primary-50 border border-primary-100 rounded-lg p-4">
            <h4 className="text-sm font-medium text-primary-800 mb-2">生成情報</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p>生成日時: {content.createdAt.toLocaleString('ja-JP')}</p>
              <p>使用モデル: GPT-4o</p>
              <p>文字数: 約{content.content.length}文字</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratedContent;