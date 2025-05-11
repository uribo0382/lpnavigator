import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, GripVertical, AlertCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { mockQuestions } from '../../utils/mockData';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

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
  // LocalStorageのデータを強制的にクリアして新しいモックデータを使用
  useEffect(() => {
    // 最新のmockQuestionsで強制的に更新する
    localStorage.setItem('questions_management_questions', JSON.stringify(mockQuestions));
  }, []);

  // 質問リストをローカルストレージまたはモックから初期化
  const saved = localStorage.getItem('questions_management_questions');
  const initialQuestions = saved ? JSON.parse(saved) as typeof mockQuestions : mockQuestions;
  const [questions, setQuestions] = useState(initialQuestions);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);

  const handleDeleteConfirm = () => {
    if (selectedQuestionId) {
      setIsDeleting(selectedQuestionId);
      
      // 実際のアプリではAPIリクエストを行う
      setTimeout(() => {
        setQuestions(prev => prev.filter(q => q.id !== selectedQuestionId));
        setIsDeleting(null);
        setShowConfirmDialog(false);
        setSelectedQuestionId(null);
      }, 500);
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
  const handleDrop = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (draggingIndex === null || draggingIndex === index) return;
    // ドラッグ＆ドロップで位置移動
    const list = [...questions];
    const [moved] = list.splice(draggingIndex, 1);
    list.splice(index, 0, moved);
    // IDと順序を統合して再設定
    const updated = list.map((q, i) => ({ ...q, order: i + 1, id: String(i + 1) }));
    setQuestions(updated);
    localStorage.setItem('questions_management_questions', JSON.stringify(updated));
    setDraggingIndex(null);
  };

  const handleToggleActive = (id: string) => {
    setQuestions(prev => 
      prev.map(q => q.id === id ? { ...q, isActive: !q.isActive } : q)
    );
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

      <Card>
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
                  const orderA = a.order || 0;
                  const orderB = b.order || 0;
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
                      question.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {question.isActive ? '有効' : '無効'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span 
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        question.isRequired 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {question.isRequired ? '必須' : '任意'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link to={`/admin/questions/${question.id}`}>
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
      </Card>

      {/* 確認ダイアログ */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowConfirmDialog(false)}
        message="この質問を削除してもよろしいですか？"
        confirmText="削除"
        cancelText="キャンセル"
      />
    </div>
  );
};

export default QuestionsManagement;