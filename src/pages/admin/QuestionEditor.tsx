import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import TextArea from '../../components/ui/TextArea';
import Select from '../../components/ui/Select';
import { getQuestionByOrderNumber, updateQuestion, createQuestion, getAllQuestions } from '../../services/questionsService';
import type { Question } from '../../services/questionsService';

interface QuestionForm {
  text: string;
  category: string;
  order_number: number;
  is_active: boolean;
  helper_text?: string;
  sample_answer?: string;
  is_required: boolean;
}

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

const QuestionEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNewQuestion = id === 'new';
  
  const [formData, setFormData] = useState<QuestionForm>({
    text: '',
    category: 'features',
    order_number: 1,
    is_active: true,
    helper_text: '',
    sample_answer: '',
    is_required: false,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [errors, setErrors] = useState<Partial<Record<keyof QuestionForm, string>>>({});
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadQuestion = async () => {
      if (!isNewQuestion) {
        try {
          setIsInitialLoading(true);
          const orderNumber = parseInt(id);
          if (isNaN(orderNumber)) {
            setError('無効な質問IDです');
            return;
          }
          
          const question = await getQuestionByOrderNumber(orderNumber);
          if (question) {
            setCurrentQuestion(question);
            setFormData({
              text: question.text || '',
              category: question.category || 'features',
              order_number: question.order_number || 1,
              is_active: question.is_active !== undefined ? question.is_active : true,
              helper_text: question.helper_text || '',
              sample_answer: question.sample_answer || '',
              is_required: question.is_required !== undefined ? question.is_required : false,
            });
          } else {
            setError('質問が見つかりません');
          }
        } catch (err) {
          console.error('質問読み込みエラー:', err);
          setError('質問の読み込みに失敗しました');
        } finally {
          setIsInitialLoading(false);
        }
      } else {
        // 新規作成時は最大の順番を取得
        try {
          const questions = await getAllQuestions();
          const maxOrder = questions.reduce((max, q) => Math.max(max, q.order_number || 0), 0);
          setFormData(prev => ({ ...prev, order_number: maxOrder + 1 }));
        } catch (err) {
          console.error('質問一覧取得エラー:', err);
        } finally {
          setIsInitialLoading(false);
        }
      }
    };
    
    loadQuestion();
  }, [id, isNewQuestion]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const name = e.target.name as keyof QuestionForm;
    let value: any = e.target.value;
    
    // order_numberの場合は数値に変換
    if (name === 'order_number' && value !== '') {
      value = parseInt(value, 10);
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name as keyof QuestionForm;
    const checked = e.target.checked;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof QuestionForm, string>> = {};
    
    if (!formData.text.trim()) {
      newErrors.text = '質問内容は必須です';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (!isNewQuestion && currentQuestion) {
        // 更新
        await updateQuestion(currentQuestion.id, {
          text: formData.text,
          category: formData.category,
          order_number: formData.order_number,
          is_active: formData.is_active,
          helper_text: formData.helper_text,
          sample_answer: formData.sample_answer,
          is_required: formData.is_required
        });
      } else {
        // 新規追加
        await createQuestion({
          text: formData.text,
          category: formData.category,
          order_number: formData.order_number,
          is_active: formData.is_active,
          helper_text: formData.helper_text,
          sample_answer: formData.sample_answer,
          is_required: formData.is_required
        });
      }
      navigate('/admin/questions');
    } catch (err: any) {
      console.error('質問保存エラー:', err);
      setError(err.message || '質問の保存に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          leftIcon={<ArrowLeft size={16} />}
          onClick={() => navigate('/admin/questions')}
        >
          質問一覧に戻る
        </Button>
        <h1 className="text-2xl font-bold text-gray-800">
          {isNewQuestion ? '新しい質問を作成' : '質問を編集'}
        </h1>
        <div></div> {/* スペースバランス用 */}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <Card>
        {isInitialLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">質問データを読み込んでいます...</p>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Input
                label="質問文"
                name="text"
                value={formData.text}
                onChange={handleChange}
                placeholder="ユーザーに表示される質問のテキスト"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Select
                  label="カテゴリ"
                  name="category"
                  value={formData.category}
                  onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  options={categoryOptions}
                />
              </div>
              
              <div>
                <Input
                  label="表示順序"
                  name="order_number"
                  type="number"
                  value={formData.order_number.toString()}
                  onChange={handleChange}
                  min={1}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleCheckboxChange}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-gray-700">アクティブ（有効）</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_required"
                  checked={formData.is_required}
                  onChange={handleCheckboxChange}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-gray-700">必須入力 <span className="text-red-500">*</span></span>
              </label>
            </div>
            
            <div>
              <TextArea
                label="ヘルプテキスト"
                name="helper_text"
                value={formData.helper_text || ''}
                onChange={handleChange}
                placeholder="質問の下に表示される説明文"
                rows={2}
              />
            </div>
            
            <div>
              <TextArea
                label="模範回答例"
                name="sample_answer"
                value={formData.sample_answer || ''}
                onChange={handleChange}
                placeholder="ユーザーが参照できる回答例"
                rows={4}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/questions')}
            >
              キャンセル
            </Button>
            <Button
              variant="primary"
              type="submit"
              leftIcon={<Save size={16} />}
              isLoading={isLoading}
            >
              保存
            </Button>
          </div>
        </form>
        )}
      </Card>
    </div>
  );
};

export default QuestionEditor;