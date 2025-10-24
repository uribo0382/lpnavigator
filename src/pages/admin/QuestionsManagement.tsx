import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, GripVertical, AlertCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { getAllQuestions, deleteQuestion, updateQuestionOrder, updateQuestion } from '../../services/questionsService';
import type { Question } from '../../services/questionsService';

// カテゴリ選択肢のラベル定義
const categoryOptions = [
  { value: 'problem', label: '課題' },
  { value: 'solution', label: '解決策' },
  { value: 'features', label: '特徴' },
  { value: 'benefits', label: '利点' },
  { value: 'social_proof', label: '社会的証明' },
  { value: 'offer_details', label: 'オファー詳細' },
  { value: 'guarantee', label: '保証' },
  { value: 'faq', label: 'よくある質問' },
  { value: 'pricing', label: '価格' },
  { value: 'cta', label: '行動喚起' },
];

const getCategoryLabel = (value: string) => {
  const category = categoryOptions.find(cat => cat.value === value);
  return category ? category.label : value;
};

const QuestionsManagement: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 質問データを取得
  const loadQuestions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAllQuestions();
      setQuestions(data);
    } catch (err) {
      console.error('質問データ取得エラー:', err);
      setError('質問データの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const handleDeleteConfirm = async () => {
    if (selectedQuestionId) {
      setIsDeleting(selectedQuestionId);
      
      try {
        await deleteQuestion(selectedQuestionId);
        setQuestions(prev => prev.filter(q => q.id !== selectedQuestionId));
        setShowConfirmDialog(false);
        setSelectedQuestionId(null);
      } catch (err) {
        console.error('質問削除エラー:', err);
        setError('質問の削除に失敗しました');
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const handleDeleteQuestion = (id: string) => {
    setSelectedQuestionId(id);
    setShowConfirmDialog(true);
  };

  // ドラッグ開始
  const handleDragStart = (index: number) => () => {
    setDraggingIndex(index);
  };
  // ドラッグ中に空間を許可
  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
  };
  // ドロップ時に順序を入れ替え
  const handleDrop = (index: number) => async (e: React.DragEvent) => {
    e.preventDefault();
    if (draggingIndex === null || draggingIndex === index) return;
    
    // ドラッグ＆ドロップで位置移動
    const list = [...questions];
    const [moved] = list.splice(draggingIndex, 1);
    list.splice(index, 0, moved);
    
    // 順序を再設定
    const updated = list.map((q, i) => ({ ...q, order_number: i + 1 }));
    setQuestions(updated);
    setDraggingIndex(null);
    
    // Supabaseの順序を更新
    try {
      await updateQuestionOrder(updated.map((q, i) => ({ id: q.id, order_number: i + 1 })));
    } catch (err) {
      console.error('質問順序更新エラー:', err);
      setError('質問の順序更新に失敗しました');
      // エラーの場合は再読み込み
      await loadQuestions();
    }
  };

  const handleToggleActive = async (id: string) => {
    const question = questions.find(q => q.id === id);
    if (!question) return;
    
    try {
      const updated = await updateQuestion(id, { is_active: !question.is_active });
      setQuestions(prev => 
        prev.map(q => q.id === id ? updated : q)
      );
    } catch (err) {
      console.error('質問ステータス更新エラー:', err);
      setError('質問のステータス更新に失敗しました');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">質問管理</h1>
        <Link to="/admin/questions/new">
          <Button leftIcon={<Plus size={16} />}>
            新規質問作成
          </Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 mb-4">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <Card>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">質問データを読み込んでいます...</p>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  <span className="sr-only">並べ替え</span>
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-16">
                  順序
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap flex-1">
                  質問内容
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-24">
                  カテゴリ
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-20">
                  ステータス
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-16">
                  必須
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  {/* 操作 */}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {questions
                .sort((a, b) => {
                  const orderA = a.order_number || 0;
                  const orderB = b.order_number || 0;
                  return orderA - orderB;
                })
                .map((question, index) => (
                <tr key={question.id} className="hover:bg-gray-50 cursor-move"
                  draggable
                  onDragStart={handleDragStart(index)}
                  onDragOver={handleDragOver(index)}
                  onDrop={handleDrop(index)}
                >
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-400">
                    <GripVertical size={16} />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {index + 1}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {question.text}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getCategoryLabel(question.category)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      question.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {question.is_active ? '有効' : '無効'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span 
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        question.is_required 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {question.is_required ? '必須' : '任意'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link to={`/admin/questions/${question.order_number}`}>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          leftIcon={<Edit size={14} />}
                        >
                          編集
                        </Button>
                      </Link>
                      <Button 
                        variant="danger" 
                        size="sm" 
                        leftIcon={<Trash2 size={14} />}
                        onClick={() => handleDeleteQuestion(question.id)}
                        isLoading={isDeleting === question.id}
                      >
                        削除
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </Card>

      {/* 確認ダイアログ */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowConfirmDialog(false)}
        message="この質問を削除してもよろしいですか？"
        confirmLabel="削除"
        cancelLabel="キャンセル"
      />
    </div>
  );
};

export default QuestionsManagement;