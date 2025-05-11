import React, { useState } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

interface ApiForm {
  selectedModel: string;
  openaiApiKey: string;
  claudeApiKey: string;
  geminiApiKey: string;
  maxRetries: number;
  timeout: number;
  rateLimit: number;
}

const ApiSettings: React.FC = () => {
  const [formData, setFormData] = useState<ApiForm>({
    selectedModel: 'gpt-4o',
    openaiApiKey: 'sk-*****************************',
    claudeApiKey: '',
    geminiApiKey: '',
    maxRetries: 3,
    timeout: 60,
    rateLimit: 10,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [showTestResult, setShowTestResult] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [testMessage, setTestMessage] = useState('');

  const [showSaveResultDialog, setShowSaveResultDialog] = useState(false);
  const [saveResultMessage, setSaveResultMessage] = useState('');

  const handleInputChange = (name: keyof ApiForm, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      setSaveResultMessage('API設定が正常に保存されました。');
      setShowSaveResultDialog(true);
    }, 1000);
  };

  const handleTestConnection = () => {
    setIsLoading(true);
    setShowTestResult(false);
    
    setTimeout(() => {
      setShowTestResult(true);
      if (formData.selectedModel.startsWith('gpt') && formData.openaiApiKey) {
        setTestSuccess(true);
        setTestMessage('接続テスト成功: OpenAI APIと正常に接続できました。');
      } else {
        setTestSuccess(false);
        setTestMessage('接続テスト失敗: APIキーが無効であるか、サービスに接続できません。');
      }
      setIsLoading(false);
    }, 1500);
  };

  const modelOptions = [
    { value: 'gpt-4o', label: 'GPT-4o (OpenAI)' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (OpenAI)' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (OpenAI)' },
    { value: 'claude-3-opus', label: 'Claude 3 Opus (Anthropic)' },
    { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet (Anthropic)' },
    { value: 'gemini-pro', label: 'Gemini Pro (Google)' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">API設定</h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">AIモデル設定</h2>
            
            <Select
              label="使用モデル"
              options={modelOptions}
              value={formData.selectedModel}
              onChange={(value) => handleInputChange('selectedModel', value)}
              helperText="記事生成に使用するAIモデルを選択してください"
              fullWidth
            />

            <Input
              label="OpenAI APIキー"
              type="password"
              value={formData.openaiApiKey}
              onChange={(e) => handleInputChange('openaiApiKey', e.target.value)}
              placeholder="sk-..."
              fullWidth
            />

            <Input
              label="Claude APIキー (オプション)"
              type="password"
              value={formData.claudeApiKey}
              onChange={(e) => handleInputChange('claudeApiKey', e.target.value)}
              placeholder="Claude APIキーを入力"
              fullWidth
            />

            <Input
              label="Gemini APIキー (オプション)"
              type="password"
              value={formData.geminiApiKey}
              onChange={(e) => handleInputChange('geminiApiKey', e.target.value)}
              placeholder="Gemini APIキーを入力"
              fullWidth
            />
          </div>

          <div className="border-t pt-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">詳細設定</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                label="タイムアウト (秒)"
                type="number"
                value={formData.timeout.toString()}
                onChange={(e) => handleInputChange('timeout', parseInt(e.target.value))}
                min={10}
                max={300}
                fullWidth
              />
              
              <Input
                label="最大リトライ回数"
                type="number"
                value={formData.maxRetries.toString()}
                onChange={(e) => handleInputChange('maxRetries', parseInt(e.target.value))}
                min={0}
                max={10}
                fullWidth
              />
              
              <Input
                label="レート制限 (分あたり)"
                type="number"
                value={formData.rateLimit.toString()}
                onChange={(e) => handleInputChange('rateLimit', parseInt(e.target.value))}
                min={1}
                max={100}
                fullWidth
              />
            </div>
          </div>

          {showTestResult && (
            <div className={`p-4 rounded-md ${testSuccess ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {testMessage}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              leftIcon={<RefreshCw size={16} />}
              onClick={handleTestConnection}
              isLoading={isLoading}
            >
              接続テスト
            </Button>
            <Button
              type="submit"
              leftIcon={<Save size={16} />}
              isLoading={isLoading}
            >
              設定を保存
            </Button>
          </div>
        </form>
      </Card>

      <ConfirmDialog
        isOpen={showSaveResultDialog}
        onClose={() => setShowSaveResultDialog(false)}
        onConfirm={() => setShowSaveResultDialog(false)}
        message={saveResultMessage}
        confirmText="OK"
      />
    </div>
  );
};

export default ApiSettings;