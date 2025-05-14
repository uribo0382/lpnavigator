import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, FileText, AlertCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Select from '../../components/ui/Select';

interface BasicInfoReviewProps {
  answers: Record<string, string>;
  questions: Array<{
    id: string;
    text: string;
    category: string;
    isRequired: boolean;
    order: number;
  }>;
  onBack: () => void;
  onConfirm: () => void;
  selectedModel: string;
  setSelectedModel: (value: string) => void;
  modelOptions: Array<{ value: string; label: string }>;
}

const BasicInfoReview: React.FC<BasicInfoReviewProps> = ({
  answers,
  questions,
  onBack,
  onConfirm,
  selectedModel,
  setSelectedModel,
  modelOptions
}) => {
  const navigate = useNavigate();
  
  // 必須項目が入力されているか確認
  const checkRequiredAnswers = () => {
    const unansweredRequired = questions.filter(q => 
      q.isRequired && (!answers[q.id] || answers[q.id].trim() === '')
    );
    return unansweredRequired.length === 0;
  };

  const requiredAnswersComplete = checkRequiredAnswers();

  // 質問を順番に並べ替え
  const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">基本情報の確認</h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <FileText size={20} className="mr-2 text-primary-500" />
            入力内容の確認
          </h2>
        </div>
        
        {!requiredAnswersComplete && (
          <div className="bg-error-50 border border-error-200 text-error-700 p-4 rounded-md mb-4 flex items-start">
            <AlertCircle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">未回答の必須項目があります</p>
              <p className="text-sm mt-1">必須項目にすべて回答してから基本情報を生成してください。</p>
            </div>
          </div>
        )}

        <p className="text-gray-600 mb-6">
          入力した内容を確認し、問題がなければ「基本情報を生成」ボタンをクリックしてください。
          修正が必要な場合は「入力画面に戻る」ボタンをクリックして編集できます。
        </p>
      </div>

      {/* 質問と回答を順番に表示 */}
      <Card className="p-4 md:p-6 mb-6">
        <div className="space-y-4">
          {sortedQuestions.map((question, index) => {
            const hasAnswer = answers[question.id] && answers[question.id].trim() !== '';
            
            return (
              <div key={question.id} className="border-b pb-4 last:border-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start">
                    <span className="font-mono font-bold text-gray-500 mr-2">{index + 1}.</span>
                    <p className="font-medium text-gray-700">
                      {question.text}
                      {question.isRequired && <span className="text-red-500 ml-1">*</span>}
                    </p>
                  </div>
                  {hasAnswer ? (
                    <CheckCircle size={16} className="text-success-500 flex-shrink-0 mt-1" />
                  ) : (
                    question.isRequired ? (
                      <AlertCircle size={16} className="text-error-500 flex-shrink-0 mt-1" />
                    ) : (
                      <span className="text-gray-400 text-xs mt-1">未回答</span>
                    )
                  )}
                </div>
                <div className={`p-3 rounded ${hasAnswer ? 'bg-gray-50' : 'bg-gray-100 border border-dashed border-gray-300'}`}>
                  {hasAnswer ? (
                    <p className="text-gray-800 whitespace-pre-wrap">{answers[question.id]}</p>
                  ) : (
                    <p className="text-gray-400 italic">
                      {question.isRequired ? '必須項目です。入力画面に戻って回答してください。' : '未回答'}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4 sticky bottom-0 bg-white p-4 border-t shadow-md">
        <Button
          variant="outline"
          leftIcon={<ArrowLeft size={16} />}
          onClick={onBack}
          className="w-full sm:w-auto"
        >
          入力画面に戻る
        </Button>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center w-full sm:w-auto gap-4 sm:gap-2">
          <div className="w-full sm:w-48">
            <Select
              options={modelOptions}
              value={selectedModel}
              onChange={setSelectedModel}
              helperText=""
              dropdownPosition="top"
            />
          </div>
          <Button
            variant="primary"
            leftIcon={<FileText size={16} />}
            onClick={onConfirm}
            disabled={!requiredAnswersComplete}
            className="w-full sm:w-auto"
          >
            基本情報を生成
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BasicInfoReview; 