import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Key,
  CreditCard,
  Package,
  LogOut,
  Save,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import ConfirmDialog from '../components/ui/ConfirmDialog';

type TabType = 'profile' | 'password' | 'plan' | 'payment' | 'account';
type PlanType = 'フリープラン' | 'スタンダードプラン' | 'プレミアムプラン' | 'エンタープライズプラン';

const ProfilePage: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isLoading, setIsLoading] = useState(false);
  
  // プロフィール編集用の状態
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
  });
  
  // パスワード変更用の状態
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // エラーと成功メッセージの状態
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // 現在のプラン（モック）
  const [currentPlan, setCurrentPlan] = useState<PlanType>('フリープラン');
  
  // 削除確認ダイアログの状態
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // プラン変更確認ダイアログの状態
  const [showPlanChangeConfirm, setShowPlanChangeConfirm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  
  // ログアウト確認ダイアログの状態
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // 管理者かどうかを判定
  const isAdmin = () => currentUser?.role === 'admin';
  
  // プロフィール更新処理
  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    
    // バリデーション
    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      setError('すべての項目を入力してください。');
      setIsLoading(false);
      return;
    }
    
    // メールアドレスの形式チェック
    if (!/\S+@\S+\.\S+/.test(profileForm.email)) {
      setError('有効なメールアドレス形式で入力してください。');
      setIsLoading(false);
      return;
    }
    
    // 更新処理のシミュレーション
    setTimeout(() => {
      setSuccess('プロフィールを更新しました。');
      setIsLoading(false);
    }, 1000);
  };
  
  // パスワード変更処理
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    
    // バリデーション
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setError('すべての項目を入力してください。');
      setIsLoading(false);
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      setError('新しいパスワードは8文字以上で入力してください。');
      setIsLoading(false);
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('新しいパスワードと確認用パスワードが一致しません。');
      setIsLoading(false);
      return;
    }
    
    // パスワード変更処理のシミュレーション
    setTimeout(() => {
      setSuccess('パスワードを変更しました。');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setIsLoading(false);
    }, 1000);
  };
  
  // 退会処理
  const handleDeleteAccount = () => {
    setShowDeleteConfirm(true);
  };
  
  // 退会を確認した場合の処理
  const confirmDeleteAccount = () => {
    setIsLoading(true);
    
    // 退会処理のシミュレーション
    setTimeout(() => {
      logout();
      navigate('/login');
    }, 1000);
  };
  
  // プラン変更を開始する処理
  const handlePlanChange = (plan: PlanType) => {
    if (plan !== currentPlan) {
      setSelectedPlan(plan);
      setShowPlanChangeConfirm(true);
    }
  };
  
  // プラン変更を確認した場合の処理
  const confirmPlanChange = () => {
    if (selectedPlan) {
      setIsLoading(true);
      setError(null);
      
      // プラン変更処理のシミュレーション
      setTimeout(() => {
        setCurrentPlan(selectedPlan);
        setSuccess(`プランを${selectedPlan}に変更しました。`);
        setIsLoading(false);
        setShowPlanChangeConfirm(false);
      }, 1000);
    }
  };
  
  // プラン料金を取得する関数
  const getPlanPrice = (plan: PlanType): string => {
    switch (plan) {
      case 'フリープラン':
        return '¥0';
      case 'スタンダードプラン':
        return '¥9,800';
      case 'プレミアムプラン':
        return '¥19,800';
      case 'エンタープライズプラン':
        return '¥29,800';
      default:
        return '';
    }
  };
  
  // プランの説明を取得する関数
  const getPlanDescription = (plan: PlanType): string => {
    switch (plan) {
      case 'フリープラン':
        return '広告文生成が月に3回まで利用できます。';
      case 'スタンダードプラン':
        return '広告文の生成が無制限。AIの性能が低いモデルを使用します。';
      case 'プレミアムプラン':
        return '広告文の生成が無制限。AIの性能が高いモデルを使用します。';
      case 'エンタープライズプラン':
        return '全機能が利用可能な最上位プラン。広告文の生成が無制限、高性能AIモデル使用、LP記事生成対応、優先サポート付き。';
      default:
        return '';
    }
  };
  
  // プランの特徴を取得する関数
  const getPlanFeatures = (plan: PlanType): string[] => {
    switch (plan) {
      case 'フリープラン':
        return ['広告文生成：月3回まで', '基本的なAIモデル', 'メールサポート'];
      case 'スタンダードプラン':
        return ['広告文生成：無制限', '標準AIモデル', 'チャットサポート', 'APIアクセス'];
      case 'プレミアムプラン':
        return ['広告文生成：無制限', '高性能AIモデル', '優先サポート', 'APIアクセス', 'カスタム広告テンプレート'];
      case 'エンタープライズプラン':
        return ['広告文生成：無制限', '最高性能AIモデル', 'LP記事生成機能', '24時間サポート', 'APIアクセス', 'カスタム広告テンプレート', 'チーム共有機能', 'ホワイトラベル対応'];
      default:
        return [];
    }
  };
  
  // ログアウト処理
  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };
  
  // ログアウトを確認した場合の処理
  const confirmLogout = () => {
    logout();
    navigate('/login');
  };
  
  // プロフィールタブのコンテンツ
  const renderProfileTab = () => (
    <form onSubmit={handleProfileUpdate} className="space-y-6">
      <div>
        <Input
          label="名前"
          value={profileForm.name}
          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
          placeholder="お名前"
          fullWidth
          required
        />
      </div>
      
      <div>
        <Input
          label="メールアドレス"
          type="email"
          value={profileForm.email}
          onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
          placeholder="メールアドレス"
          fullWidth
          required
        />
      </div>
      
      <Button
        type="submit"
        fullWidth
        isLoading={isLoading}
        leftIcon={<Save size={18} />}
      >
        変更を保存
      </Button>
    </form>
  );
  
  // パスワード変更タブのコンテンツ
  const renderPasswordTab = () => (
    <form onSubmit={handlePasswordChange} className="space-y-6">
      <div>
        <Input
          label="現在のパスワード"
          type="password"
          value={passwordForm.currentPassword}
          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
          placeholder="現在のパスワード"
          fullWidth
          required
        />
      </div>
      
      <div>
        <Input
          label="新しいパスワード"
          type="password"
          value={passwordForm.newPassword}
          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
          placeholder="新しいパスワード（8文字以上）"
          fullWidth
          required
        />
      </div>
      
      <div>
        <Input
          label="新しいパスワード（確認）"
          type="password"
          value={passwordForm.confirmPassword}
          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
          placeholder="新しいパスワード（確認）"
          fullWidth
          required
        />
      </div>
      
      <Button
        type="submit"
        fullWidth
        isLoading={isLoading}
        leftIcon={<Key size={18} />}
      >
        パスワードを変更
      </Button>
    </form>
  );
  
  // プラン選択タブのコンテンツ
  const renderPlanTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
        <h3 className="font-medium mb-2">現在のプラン</h3>
        <p className="text-primary-600 font-semibold">{currentPlan}</p>
      </div>
      
      <div className="space-y-4">
        <h3 className="font-medium mb-2">利用可能なプラン</h3>
        
        {/* フリープラン */}
        <div className={`p-4 border rounded-md ${currentPlan === 'フリープラン' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium">フリープラン</h4>
            {currentPlan === 'フリープラン' && (
              <span className="bg-primary-100 text-primary-800 text-xs py-1 px-2 rounded-full">現在のプラン</span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-4">{getPlanDescription('フリープラン')}</p>
          <ul className="text-sm text-gray-600 mb-4 space-y-1">
            {getPlanFeatures('フリープラン').map((feature, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                {feature}
              </li>
            ))}
          </ul>
          <p className="font-medium mb-2">{getPlanPrice('フリープラン')} / 月</p>
          <Button
            variant={currentPlan === 'フリープラン' ? 'outline' : 'primary'}
            fullWidth
            disabled={currentPlan === 'フリープラン'}
            onClick={() => handlePlanChange('フリープラン')}
          >
            {currentPlan === 'フリープラン' ? '利用中' : '選択する'}
          </Button>
        </div>
        
        {/* スタンダードプラン */}
        <div className={`p-4 border rounded-md ${currentPlan === 'スタンダードプラン' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium">スタンダードプラン</h4>
            {currentPlan === 'スタンダードプラン' && (
              <span className="bg-primary-100 text-primary-800 text-xs py-1 px-2 rounded-full">現在のプラン</span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-4">{getPlanDescription('スタンダードプラン')}</p>
          <ul className="text-sm text-gray-600 mb-4 space-y-1">
            {getPlanFeatures('スタンダードプラン').map((feature, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                {feature}
              </li>
            ))}
          </ul>
          <p className="font-medium mb-2">{getPlanPrice('スタンダードプラン')} / 月</p>
          <Button
            variant={currentPlan === 'スタンダードプラン' ? 'outline' : 'primary'}
            fullWidth
            disabled={currentPlan === 'スタンダードプラン'}
            onClick={() => handlePlanChange('スタンダードプラン')}
          >
            {currentPlan === 'スタンダードプラン' ? '利用中' : '選択する'}
          </Button>
        </div>
        
        {/* プレミアムプラン */}
        <div className={`p-4 border rounded-md ${currentPlan === 'プレミアムプラン' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium">プレミアムプラン</h4>
            {currentPlan === 'プレミアムプラン' && (
              <span className="bg-primary-100 text-primary-800 text-xs py-1 px-2 rounded-full">現在のプラン</span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-4">{getPlanDescription('プレミアムプラン')}</p>
          <ul className="text-sm text-gray-600 mb-4 space-y-1">
            {getPlanFeatures('プレミアムプラン').map((feature, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                {feature}
              </li>
            ))}
          </ul>
          <p className="font-medium mb-2">{getPlanPrice('プレミアムプラン')} / 月</p>
          <Button
            variant={currentPlan === 'プレミアムプラン' ? 'outline' : 'primary'}
            fullWidth
            disabled={currentPlan === 'プレミアムプラン'}
            onClick={() => handlePlanChange('プレミアムプラン')}
          >
            {currentPlan === 'プレミアムプラン' ? '利用中' : '選択する'}
          </Button>
        </div>
        
        {/* エンタープライズプラン */}
        <div className={`p-4 border-2 rounded-md shadow-md ${currentPlan === 'エンタープライズプラン' ? 'border-primary-500 bg-primary-50' : 'border-blue-400 bg-blue-50'}`}>
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium text-lg">エンタープライズプラン</h4>
            {currentPlan === 'エンタープライズプラン' ? (
              <span className="bg-primary-100 text-primary-800 text-xs py-1 px-2 rounded-full">現在のプラン</span>
            ) : (
              <span className="bg-blue-100 text-blue-800 text-xs py-1 px-2 rounded-full">おすすめ</span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-4">{getPlanDescription('エンタープライズプラン')}</p>
          <ul className="text-sm text-gray-600 mb-4 space-y-1">
            {getPlanFeatures('エンタープライズプラン').map((feature, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-500 mr-2">✓</span>
                {feature}
              </li>
            ))}
          </ul>
          <div className="bg-blue-100 text-blue-800 text-sm p-2 rounded mb-4">
            年間契約で20%オフ！ 月額換算：¥23,840
          </div>
          <p className="font-medium mb-2">{getPlanPrice('エンタープライズプラン')} / 月</p>
          <Button
            variant={currentPlan === 'エンタープライズプラン' ? 'outline' : 'primary'}
            fullWidth
            disabled={currentPlan === 'エンタープライズプラン'}
            onClick={() => handlePlanChange('エンタープライズプラン')}
            className={currentPlan === 'エンタープライズプラン' ? '' : 'bg-blue-600 hover:bg-blue-700'}
          >
            {currentPlan === 'エンタープライズプラン' ? '利用中' : '選択する'}
          </Button>
        </div>
      </div>

      {/* FAQ セクション */}
      <div className="mt-8 bg-gray-50 p-6 rounded-md border border-gray-200">
        <h3 className="font-medium text-lg mb-4">よくある質問</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">プランはいつでも変更できますか？</h4>
            <p className="text-sm text-gray-600">はい、いつでもプランの変更が可能です。アップグレードの場合は即時反映され、ダウングレードの場合は現在の請求期間の終了時に反映されます。</p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">年間契約のメリットは何ですか？</h4>
            <p className="text-sm text-gray-600">年間契約を選択すると、月額料金から20%割引が適用されます。長期的に利用される予定であれば、年間契約がお得です。</p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">LP記事生成とは何ですか？</h4>
            <p className="text-sm text-gray-600">LP記事生成は、ランディングページ用の完全な記事コンテンツを自動生成する機能です。高性能AIを活用して、SEO対策された魅力的なランディングページ記事を簡単に作成できます。</p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">エンタープライズプランの詳細について知りたいです</h4>
            <p className="text-sm text-gray-600">エンタープライズプランについての詳細は、サポートチームまでお問い合わせください。チーム全体での利用や独自のカスタマイズについてもご相談いただけます。</p>
          </div>
        </div>
      </div>
    </div>
  );
  
  // 支払い方法タブのコンテンツ
  const renderPaymentTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
        <h3 className="font-medium mb-2">支払い方法</h3>
        <p className="text-gray-600">現在登録されている支払い方法はありません。</p>
      </div>
      
      <form className="space-y-6">
        <div>
          <Input
            label="カード番号"
            placeholder="1234 5678 9012 3456"
            fullWidth
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="有効期限"
            placeholder="MM/YY"
            fullWidth
            required
          />
          
          <Input
            label="セキュリティコード"
            placeholder="123"
            fullWidth
            required
          />
        </div>
        
        <div>
          <Input
            label="カード名義"
            placeholder="TARO YAMADA"
            fullWidth
            required
          />
        </div>
        
        <Button
          type="submit"
          fullWidth
          leftIcon={<CreditCard size={18} />}
        >
          カードを登録する
        </Button>
      </form>
    </div>
  );
  
  // アカウント管理タブのコンテンツ
  const renderAccountTab = () => (
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex items-start">
          <AlertTriangle className="text-red-500 mt-0.5 mr-3" size={20} />
          <div>
            <h3 className="font-medium text-red-800 mb-1">アカウント削除</h3>
            <p className="text-sm text-red-700">
              アカウントを削除すると、すべてのデータが永久に失われます。この操作は取り消せません。
            </p>
          </div>
        </div>
        <Button
          variant="danger"
          className="mt-4 text-red-500 font-bold"
          isLoading={isLoading}
          onClick={handleDeleteAccount}
        >
          アカウントを削除する
        </Button>
      </div>
    </div>
  );
  
  // タブコンテンツのレンダリング
  const renderTabContent = () => {
    // 管理者の場合、非表示タブが選択されていたらプロフィールタブに戻す
    if (isAdmin() && (activeTab === 'plan' || activeTab === 'payment' || activeTab === 'account')) {
      setActiveTab('profile');
      return renderProfileTab();
    }
    
    switch (activeTab) {
      case 'profile':
        return renderProfileTab();
      case 'password':
        return renderPasswordTab();
      case 'plan':
        return renderPlanTab();
      case 'payment':
        return renderPaymentTab();
      case 'account':
        return renderAccountTab();
      default:
        return null;
    }
  };

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">アカウント設定</h1>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* サイドバーナビゲーション */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="font-medium">{currentUser?.name}</div>
              <div className="text-sm text-gray-500">{currentUser?.email}</div>
            </div>
            
            <nav className="p-2">
              <button
                className={`flex items-center w-full px-3 py-2 text-left rounded-md ${
                  activeTab === 'profile' 
                    ? 'bg-primary-50 text-primary-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setActiveTab('profile')}
              >
                <User size={18} className="mr-2" />
                プロフィール
              </button>
              
              <button
                className={`flex items-center w-full px-3 py-2 text-left rounded-md ${
                  activeTab === 'password' 
                    ? 'bg-primary-50 text-primary-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setActiveTab('password')}
              >
                <Key size={18} className="mr-2" />
                パスワード
              </button>
              
              {!isAdmin() && (
                <>
                  <button
                    className={`flex items-center w-full px-3 py-2 text-left rounded-md ${
                      activeTab === 'plan' 
                        ? 'bg-primary-50 text-primary-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setActiveTab('plan')}
                  >
                    <Package size={18} className="mr-2" />
                    プラン
                  </button>
                  
                  <button
                    className={`flex items-center w-full px-3 py-2 text-left rounded-md ${
                      activeTab === 'payment' 
                        ? 'bg-primary-50 text-primary-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setActiveTab('payment')}
                  >
                    <CreditCard size={18} className="mr-2" />
                    お支払い
                  </button>
                  
                  <button
                    className={`flex items-center w-full px-3 py-2 text-left rounded-md ${
                      activeTab === 'account' 
                        ? 'bg-primary-50 text-primary-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setActiveTab('account')}
                  >
                    <AlertTriangle size={18} className="mr-2" />
                    アカウント
                  </button>
                </>
              )}
              
              <button
                className="flex items-center w-full px-3 py-2 text-left rounded-md text-red-600 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut size={18} className="mr-2" />
                ログアウト
              </button>
            </nav>
          </div>
        </div>
        
        {/* メインコンテンツ */}
        <div className="flex-1">
          <Card>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6 text-sm">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-6 text-sm">
                {success}
              </div>
            )}
            
            {renderTabContent()}
          </Card>
        </div>
      </div>

      {/* アカウント削除確認ダイアログ */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteAccount}
        title="アカウント削除"
        message="アカウントを削除すると、すべてのデータが永久に失われます。この操作は取り消せません。"
        confirmLabel="削除する"
        cancelLabel="キャンセル"
      />

      {/* プラン変更確認ダイアログ */}
      <ConfirmDialog
        isOpen={showPlanChangeConfirm}
        onClose={() => setShowPlanChangeConfirm(false)}
        onConfirm={confirmPlanChange}
        title="プラン変更"
        message={selectedPlan ? `プランを${currentPlan}から${selectedPlan}に変更します。月額料金は${getPlanPrice(selectedPlan)}/月になります。よろしいですか？` : ''}
        confirmLabel="変更する"
        cancelLabel="キャンセル"
      />

      {/* ログアウト確認ダイアログ */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="ログアウト"
        message="ログアウトしてもよろしいですか？"
        confirmLabel="ログアウト"
        cancelLabel="キャンセル"
      />
    </div>
  );
};

export default ProfilePage; 