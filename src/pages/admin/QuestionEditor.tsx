import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Bot, AlertCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import TextArea from '../../components/ui/TextArea';
import Select from '../../components/ui/Select';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { mockQuestions } from '../../utils/mockData';

interface QuestionForm {
  text: string;
  category: string;
  order: number;
  isActive: boolean;
  helperText?: string;
  sampleAnswer?: string;
  isRequired?: boolean;
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
    order: mockQuestions.length + 1,
    isActive: true,
    helperText: '',
    sampleAnswer: '',
    isRequired: false,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof QuestionForm, string>>>({});
  
  // AI添削関連の状態
  const [aiEditing, setAiEditing] = useState(false);
  const [aiEditedText, setAiEditedText] = useState<string>('');
  const [showAiSuggestion, setShowAiSuggestion] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isNewQuestion) {
      const question = mockQuestions.find(q => q.id === id);
      if (question) {
        setFormData({
          text: question.text || '',
          category: question.category || 'features',
          order: question.order || mockQuestions.length + 1,
          isActive: question.isActive !== undefined ? question.isActive : true,
          helperText: question.helperText || '',
          sampleAnswer: question.sampleAnswer || '',
          isRequired: question.isRequired !== undefined ? question.isRequired : false,
        });
      }
    }
  }, [id, isNewQuestion]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const name = e.target.name as keyof QuestionForm;
    const value = e.target.value;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    // localStorageからリスト取得
    const stored = localStorage.getItem('questions_management_questions');
    let list = stored ? JSON.parse(stored) : mockQuestions;
    
    // Simulate API call and persist
    setTimeout(() => {
      if (!isNewQuestion && id) {
        // 更新
        list = list.map((q: any) => q.id === id
          ? { ...q, text: formData.text, category: formData.category, helperText: formData.helperText, isActive: formData.isActive, isRequired: formData.isRequired, sampleAnswer: formData.sampleAnswer }
          : q
        );
      } else {
        // 新規追加: IDを連番で付与
        const existingIds = list.map((q: any) => parseInt(q.id, 10)).filter((n: number) => !isNaN(n));
        const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
        const newId = String(maxId + 1);
        const newQuestion = {
          id: newId,
          text: formData.text,
          category: formData.category,
          helperText: formData.helperText,
          isActive: formData.isActive,
          order: formData.order,
          isRequired: formData.isRequired,
          sampleAnswer: formData.sampleAnswer,
        };
        list.push(newQuestion);
      }
      // 保存
      localStorage.setItem('questions_management_questions', JSON.stringify(list));
      setIsLoading(false);
      navigate('/admin/questions');
    }, 1000);
  };
  
  // AIによる添削処理
  const handleAiEdit = () => {
    if (!formData.sampleAnswer || formData.sampleAnswer.trim() === '') {
      setAlertMessage('添削するテキストを入力してください。');
      setShowAlertDialog(true);
      return;
    }

    setAiEditing(true);

    // AI添削のシミュレーション（実際の実装ではAPIを呼び出す）
    setTimeout(() => {
      const enhancedText = simulateAiEnhancement(formData.sampleAnswer || '');
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
      { type: '説得力向上', original: 'です', enhanced: 'であり、多くのユーザーに支持されています' },
      { type: '具体性追加', original: 'あります', enhanced: '豊富に取り揃えております' },
      { type: '専門用語追加', original: '効果', enhanced: '効果（コンバージョン率向上）' },
      { type: '具体例追加', original: '商品', enhanced: '商品（当社オリジナルの高品質製品）' },
      { type: 'SEO最適化', original: '特徴', enhanced: '特徴（業界最高水準）' }
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
      enhancedText += '<span class="bg-blue-100 text-blue-800 px-1 rounded" title="補足情報の追加">。この点はユーザーにとって重要なポイントです。</span>';
    }

    return enhancedText;
  };

  // AI添削結果を適用
  const applyAiSuggestion = () => {
    // HTMLタグを取り除いた純粋なテキストを取得
    const plainText = aiEditedText.replace(/<[^>]*>/g, '');
    setFormData(prev => ({ ...prev, sampleAnswer: plainText }));
    setShowAiSuggestion(false);
  };

  // AI添削結果をキャンセル
  const cancelAiSuggestion = () => {
    setShowAiSuggestion(false);
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

      <Card>
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
                  name="order"
                  type="number"
                  value={formData.order.toString()}
                  onChange={handleChange}
                  min={1}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleCheckboxChange}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-gray-700">アクティブ（有効）</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isRequired"
                  checked={formData.isRequired}
                  onChange={handleCheckboxChange}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-gray-700">必須入力 <span className="text-red-500">*</span></span>
              </label>
            </div>
            
            <div>
              <TextArea
                label="ヘルプテキスト"
                name="helperText"
                value={formData.helperText || ''}
                onChange={handleChange}
                placeholder="質問の下に表示される説明文"
                rows={2}
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="sampleAnswer" className="block text-sm font-medium text-gray-700">
                  模範回答例
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Bot size={16} />}
                  onClick={handleAiEdit}
                  disabled={aiEditing || !formData.sampleAnswer}
                  isLoading={aiEditing}
                >
                  AI添削
                </Button>
              </div>
              
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
                name="sampleAnswer"
                value={formData.sampleAnswer || ''}
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
      </Card>
      
      {/* アラートダイアログ */}
      <ConfirmDialog
        isOpen={showAlertDialog}
        onClose={() => setShowAlertDialog(false)}
        onConfirm={() => setShowAlertDialog(false)}
        message={alertMessage}
        confirmText="OK"
      />
    </div>
  );
};

export default QuestionEditor;