import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, UserX, UserCheck, AlertTriangle, FileText, Lock } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { userService, User } from '../../services/userService';
import ConfirmDialog from '../../components/ui/ConfirmDialog';


// ユーザー情報の型定義を拡張
interface UserForm {
  name: string;
  email: string;
  role: 'admin' | 'user';
  plan: string;
  isActive: boolean;
  company?: string;
  position?: string;
  phone?: string;
}

// ロールオプション
const roleOptions = [
  { value: 'admin', label: '管理者' },
  { value: 'user', label: '一般ユーザー' },
];

// プランオプション
const planOptions = [
  { value: 'free', label: 'フリープラン' },
  { value: 'standard', label: 'スタンダードプラン' },
  { value: 'premium', label: 'プレミアムプラン' },
  { value: 'enterprise', label: 'エンタープライズプラン' },
];

// ユーザー編集コンポーネント
const UserEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = id !== 'new' && !!id;
  const isViewing = false; // 将来的に閲覧モードも追加可能
  
  // 状態管理
  const [formData, setFormData] = useState<UserForm>({
    name: '',
    email: '',
    role: 'user',
    plan: 'free',
    isActive: true,
    company: '',
    position: '',
    phone: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof UserForm, string>>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [showResetPasswordConfirm, setShowResetPasswordConfirm] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);

  // ユーザーデータの取得
  useEffect(() => {
    console.log('UserEditor - isEditing:', isEditing, 'id:', id);
    if (isEditing && id) {
      fetchUserData();
    }
  }, [id, isEditing]);

  // ユーザーデータ取得
  const fetchUserData = async () => {
    setIsFetching(true);
    
    try {
      // Supabaseからユーザーデータを取得
      const user = await userService.getUserById(id || '');
      
      if (user) {
        console.log('Fetched user for editing:', user);
        setFormData({
          name: user.name || '',
          email: user.email || '',
          role: user.role as 'admin' | 'user',
          plan: user.plan || 'free',
          isActive: user.isActive ?? true,
          company: user.company || '',
          position: user.position || '',
          phone: user.phone || '',
        });
      } else {
        setShowSuccessMessage('ユーザーが見つかりません。');
        // 3秒後にユーザー一覧に戻る
        setTimeout(() => {
          navigate('/admin/users');
        }, 3000);
      }
    } catch (error: any) {
      console.error('Failed to fetch user data:', error);
      setShowSuccessMessage(`ユーザーデータの取得中にエラーが発生しました: ${error.message}`);
    } finally {
      setIsFetching(false);
    }
  };

  // 入力値変更ハンドラ
  const handleInputChange = (name: keyof UserForm, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // エラーをクリア
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // ロールが管理者かどうかを確認する関数
  const isAdminRole = () => formData.role === 'admin';

  // フォームバリデーション
  const validateForm = () => {
    const newErrors: Partial<Record<keyof UserForm, string>> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '名前は必須です';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'メールアドレスは必須です';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '有効なメールアドレス形式で入力してください';
    }
    
    if (formData.phone && !/^[0-9\-+() ]*$/.test(formData.phone)) {
      newErrors.phone = '有効な電話番号形式で入力してください';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // フォーム送信ハンドラ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isEditing && id) {
        // ユーザー情報を更新
        const updatedUser = await userService.updateUser(id, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          plan: formData.plan,
          isActive: formData.isActive,
          company: formData.company,
          position: formData.position,
          phone: formData.phone
        });
        console.log('User updated:', updatedUser);
      } else {
        // 新規ユーザーを作成
        const newUser = await userService.createUser({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          plan: formData.plan,
          isActive: formData.isActive,
          company: formData.company,
          position: formData.position,
          phone: formData.phone
        });
        console.log('User created:', newUser);
      }
      
      // 成功メッセージを表示して遷移
      setShowSuccessMessage(isEditing ? 'ユーザー情報を更新しました' : '新しいユーザーを登録しました');
      
      setTimeout(() => {
        navigate('/admin/users');
      }, 1500);
    } catch (error: any) {
      console.error('Failed to save user:', error);
      setShowSuccessMessage(`エラーが発生しました: ${error.message}`);
      setIsLoading(false);
    }
  };

  // ユーザー削除ハンドラ
  const handleDeleteUser = async () => {
    if (!id) return;
    
    setIsLoading(true);
    
    try {
      await userService.deleteUser(id);
      
      // 削除成功メッセージを表示して遷移
      setShowSuccessMessage('ユーザーを削除しました');
      setShowDeleteConfirm(false);
      
      setTimeout(() => {
        navigate('/admin/users');
      }, 1500);
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      setShowSuccessMessage(`削除中にエラーが発生しました: ${error.message}`);
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  // ステータス変更ハンドラ
  const handleToggleStatus = async () => {
    if (!id) return;
    
    setIsLoading(true);
    
    try {
      const updatedUser = await userService.toggleUserActive(id);
      
      // フォームデータを更新
      setFormData(prev => ({
        ...prev,
        isActive: updatedUser.isActive
      }));
      
      // 成功メッセージを表示
      setShowSuccessMessage(updatedUser.isActive ? 'ユーザーを有効化しました' : 'ユーザーを無効化しました');
      setShowStatusConfirm(false);
      setIsLoading(false);
    } catch (error: any) {
      console.error('Failed to update user status:', error);
      setShowSuccessMessage(`ステータス変更中にエラーが発生しました: ${error.message}`);
      setIsLoading(false);
      setShowStatusConfirm(false);
    }
  };

  // パスワードリセットハンドラ
  const handleResetPassword = async () => {
    setIsLoading(true);
    
    try {
      // APIコールをシミュレート
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 成功メッセージを表示
      setShowSuccessMessage('パスワードリセットメールを送信しました');
      setShowResetPasswordConfirm(false);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to reset password:', error);
      setShowSuccessMessage('パスワードリセット中にエラーが発生しました');
      setIsLoading(false);
      setShowResetPasswordConfirm(false);
    }
  };

  // ローディング表示
  if (isEditing && isFetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            leftIcon={<ArrowLeft size={16} />}
            onClick={() => navigate('/admin/users')}
            className="mr-4"
          >
            戻る
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditing ? (isAdminRole() ? '管理者編集' : 'ユーザー編集') : (isAdminRole() ? '新規管理者登録' : '新規ユーザー登録')}
          </h1>
        </div>
        
        {isEditing && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              leftIcon={<Lock size={16} />}
              onClick={() => setShowResetPasswordConfirm(true)}
            >
              パスワードリセット
            </Button>
            
            <Button
              variant={formData.isActive ? 'danger' : 'success'}
              leftIcon={formData.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
              onClick={() => setShowStatusConfirm(true)}
            >
              {formData.isActive ? 'ユーザーを無効化' : 'ユーザーを有効化'}
            </Button>
            
            <Button
              variant="danger"
              leftIcon={<Trash2 size={16} />}
              onClick={() => setShowDeleteConfirm(true)}
            >
              削除
            </Button>
          </div>
        )}
      </div>

      {/* 成功メッセージ */}
      {showSuccessMessage && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{showSuccessMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* ユーザー編集フォーム - 基本情報のみ表示 */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="名前"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="例: 山田 太郎"
                error={errors.name}
                required
                disabled={isViewing}
                fullWidth
              />

              <Input
                label="メールアドレス"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="例: example@domain.com"
                error={errors.email}
                required
                disabled={isViewing}
                fullWidth
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                label="ロール"
                options={roleOptions}
                value={formData.role}
                onChange={(value) => handleInputChange('role', value as 'admin' | 'user')}
                disabled={isViewing}
                fullWidth
              />

              {!isAdminRole() && (
                <Select
                  label="プラン"
                  options={planOptions}
                  value={formData.plan}
                  onChange={(value) => handleInputChange('plan', value)}
                  disabled={isViewing}
                  fullWidth
                />
              )}
            </div>

            {!isAdminRole() && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="会社名"
                  value={formData.company || ''}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  placeholder="例: 株式会社サンプル"
                  disabled={isViewing}
                  fullWidth
                />

                <Input
                  label="役職"
                  value={formData.position || ''}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  placeholder="例: マーケティング部長"
                  disabled={isViewing}
                  fullWidth
                />
              </div>
            )}

            {!isAdminRole() && (
              <Input
                label="電話番号"
                value={formData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="例: 03-1234-5678"
                error={errors.phone}
                disabled={isViewing}
                fullWidth
              />
            )}

            {/* 管理者用の項目 */}
            {isAdminRole() && (
              <div>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FileText className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">管理者権限情報</h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>
                          管理者ユーザーは全機能へのアクセス権を持ち、ユーザー管理やシステム設定を行うことができます。
                          プランや利用制限は適用されません。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
              <div className="flex items-center">
                <input
                  id="isActive"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  disabled={isViewing}
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  アカウントを有効にする
                </label>
              </div>
            </div>
          </div>

          {/* フォームボタン */}
          <div className="flex justify-end pt-4 border-t mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/users')}
              className="mr-3"
              disabled={isLoading}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              leftIcon={<Save size={16} />}
              isLoading={isLoading}
              disabled={isViewing}
            >
              {isEditing ? '更新' : '登録'}
            </Button>
          </div>
        </form>
      </Card>

      {/* 削除確認ダイアログ */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteUser}
        title="ユーザー削除"
        message={`このユーザーを削除してもよろしいですか？この操作は取り消せません。`}
        confirmLabel="削除する"
        cancelLabel="キャンセル"
      />

      {/* ステータス変更確認ダイアログ */}
      <ConfirmDialog
        isOpen={showStatusConfirm}
        onClose={() => setShowStatusConfirm(false)}
        onConfirm={handleToggleStatus}
        title={formData.isActive ? "ユーザー無効化" : "ユーザー有効化"}
        message={`このユーザーを${formData.isActive ? '無効' : '有効'}にしてもよろしいですか？`}
        confirmLabel={formData.isActive ? "無効化する" : "有効化する"}
        cancelLabel="キャンセル"
      />

      {/* パスワードリセット確認ダイアログ */}
      <ConfirmDialog
        isOpen={showResetPasswordConfirm}
        onClose={() => setShowResetPasswordConfirm(false)}
        onConfirm={handleResetPassword}
        title="パスワードリセット"
        message="パスワードリセットメールを送信してもよろしいですか？"
        confirmLabel="送信する"
        cancelLabel="キャンセル"
      />
    </div>
  );
};

export default UserEditor;