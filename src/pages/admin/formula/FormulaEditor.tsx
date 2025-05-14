import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import TextArea from '../../../components/ui/TextArea';

interface FormulaEditorProps {
  formula: {
    id?: string;
    name: string;
    type: string;
    template: string;
    variables: string[];
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    summary?: string;
  } | null;
  formulaType: 'question' | 'basic_info' | 'ad_copy' | 'lp_article';
  onSave: (formula: any) => void;
  onCancel: () => void;
}

const FormulaEditor: React.FC<FormulaEditorProps> = ({ 
  formula, 
  formulaType,
  onSave, 
  onCancel 
}) => {
  const [name, setName] = useState('');
  const [template, setTemplate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [variables, setVariables] = useState<string[]>([]);
  const [summary, setSummary] = useState('');
  const [error, setError] = useState<string | null>(null);

  // 編集時にデータを設定
  useEffect(() => {
    if (formula) {
      setName(formula.name);
      setTemplate(formula.template);
      setIsActive(formula.isActive);
      setVariables(formula.variables);
      setSummary(formula.summary || '');
    } else {
      // 新規作成時はデフォルト値を設定
      setName('');
      setTemplate(getTemplateHint(formulaType));
      setIsActive(true);
      setVariables([]);
      setSummary('');
    }
  }, [formula, formulaType]);

  // テンプレートからの変数を抽出
  const extractVariables = (templateText: string) => {
    const variableRegex = /{{([^{}]+)}}/g;
    const extractedVars = [];
    let match;
    
    while ((match = variableRegex.exec(templateText)) !== null) {
      extractedVars.push(match[1]);
    }
    
    // 重複を除去
    return [...new Set(extractedVars)];
  };

  // テンプレート変更時に変数を自動抽出
  useEffect(() => {
    const extractedVars = extractVariables(template);
    setVariables(extractedVars);
  }, [template]);

  // 保存処理
  const handleSave = () => {
    // バリデーション
    if (!name.trim()) {
      setError('フォーミュラ名を入力してください。');
      return;
    }
    
    if (!template.trim()) {
      setError('テンプレートを入力してください。');
      return;
    }
    
    // 元データがある場合はそれをベースに、ない場合は新規オブジェクトを作成
    const updatedFormula = formula 
      ? { 
          ...formula, 
          name, 
          template, 
          variables, 
          isActive,
          summary,
          updatedAt: new Date() 
        } 
      : { 
          name, 
          type: formulaType, 
          template, 
          variables, 
          isActive,
          summary,
          createdAt: new Date(),
          updatedAt: new Date()
        };
    
    onSave(updatedFormula);
  };

  // フォーミュラタイプに応じたテンプレートヒントを返す
  const getTemplateHint = (type: string) => {
    switch (type) {
      case 'question':
        return '以下の質問に回答してください：\n{{questions}}';
      case 'basic_info':
        return '以下の情報を元に、製品やサービスの基本情報を生成してください：\n\n商品: {{product}}\n特徴: {{features}}\n対象ユーザー: {{targetUser}}\nユーザーの課題: {{userProblem}}\n主な利点: {{benefits}}';
      case 'ad_copy':
        return '以下の基本情報を元に、魅力的な広告文を300文字以内で作成してください：\n\n{{basicInfo}}';
      case 'lp_article':
        return '以下の基本情報と広告文を元に、ランディングページの記事を作成してください：\n\n基本情報：\n{{basicInfo}}\n\n広告文：\n{{adCopy}}';
      default:
        return '';
    }
  };

  // フォーミュラタイプの日本語表示
  const getFormulaTypeJapanese = (type: string) => {
    switch (type) {
      case 'question':
        return '質問';
      case 'basic_info':
        return '基本情報';
      case 'ad_copy':
        return '広告文';
      case 'lp_article':
        return 'LP記事';
      default:
        return type;
    }
  };

  return (
    <div className="p-4">
      {error && (
        <div className="mb-4 p-3 bg-error-50 border border-error-200 text-error-700 rounded-md">
          {error}
        </div>
      )}
      
      <div className="mb-4">
        <Input
          label="フォーミュラ名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`${getFormulaTypeJapanese(formulaType)}フォーミュラの名前を入力`}
          required
        />
      </div>
      
      <div className="mb-4">
        <TextArea
          label="概要"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="フォーミュラの概要や説明を入力してください"
          rows={3}
          helperText="このフォーミュラの特徴や使い方について簡潔に説明してください。一覧画面のタイトル下部に表示されます。"
        />
      </div>
      
      <div className="mb-4">
        <TextArea
          label="テンプレート"
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          placeholder="プロンプトテンプレートを入力。変数は {{変数名}} の形式で指定"
          rows={10}
          required
        />
      </div>
      
      <div className="mb-4 flex space-x-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="mr-2 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700">有効</span>
        </label>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={onCancel}
        >
          キャンセル
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
        >
          保存
        </Button>
      </div>
    </div>
  );
};

export default FormulaEditor; 