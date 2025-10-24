import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp,
  Filter,
  Download,
  Edit
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { userService, User } from '../../services/userService';
import { testSupabaseConnection } from '../../lib/supabase';
import { debugUsersData } from '../../services/debugUserService';


// ユーザー一覧管理コンポーネント
const UsersManagement: React.FC = () => {
  // 状態管理
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof User>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // ユーザーデータの読み込み
  useEffect(() => {
    // Supabase接続テストを実行してから、ユーザーデータを取得
    const initializeData = async () => {
      // デバッグ: 生データを確認
      await debugUsersData();
      
      const isConnected = await testSupabaseConnection();
      if (!isConnected) {
        setError('データベースへの接続に失敗しました。環境変数を確認してください。');
        setIsLoading(false);
        return;
      }
      fetchUsers();
    };
    
    initializeData();
  }, []);

  // ソートと検索とフィルタリングを適用
  useEffect(() => {
    console.log('=== UsersManagement Filtering Debug ===');
    console.log('1. Raw users array:', users);
    console.log('2. Users count:', users.length);
    console.log('3. Selected filter:', selectedFilter);
    console.log('4. User details:', users.map(u => ({ 
      id: u.id, 
      email: u.email, 
      role: u.role, 
      isActive: u.isActive,
      isActiveType: typeof u.isActive
    })));
    
    // フィルタリング適用
    let result = [...users];
    console.log('5. Initial result count:', result.length);
    
    // 特定のフィルターが選択されている場合のみフィルタリング
    if (selectedFilter === 'users-only') {
      result = result.filter(user => user.role === 'user');
      console.log('6a. After users-only filter:', result.length);
    } else if (selectedFilter === 'admins-only') {
      result = result.filter(user => user.role === 'admin');
      console.log('6b. After admins-only filter:', result.length);
    }
    // 'all'の場合は全ユーザーを表示
    
    console.log('7. After role filter - result:', result);

    // 検索フィルタリング
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        user => 
          user.name.toLowerCase().includes(query) || 
          user.email.toLowerCase().includes(query) ||
          user.id.toLowerCase().includes(query)
      );
    }

    // ステータスフィルタリング（roleフィルター以外の場合）
    if (selectedFilter === 'active') {
      result = result.filter(user => user.isActive);
    } else if (selectedFilter === 'inactive') {
      result = result.filter(user => !user.isActive);
    } else if (selectedFilter.startsWith('plan:')) {
      const plan = selectedFilter.split(':')[1];
      result = result.filter(user => user.plan === plan);
    }

    // ソート適用
    result.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // 日付比較の場合
      if (aValue instanceof Date && bValue instanceof Date) {
        aValue = aValue.getTime();
        bValue = bValue.getTime();
      }
      
      // null/undefined の場合は最後にソート
      if (aValue === undefined || aValue === null) return sortDirection === 'asc' ? 1 : -1;
      if (bValue === undefined || bValue === null) return sortDirection === 'asc' ? -1 : 1;
      
      // 文字列の場合は小文字に変換して比較
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    console.log('8. Final filtered result:', result);
    console.log('9. Final filtered result count:', result.length);
    setFilteredUsers(result);
    console.log('=== End of Filtering Debug ===');
  }, [users, searchQuery, sortField, sortDirection, selectedFilter]);

  // ユーザーデータ取得
  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 全ユーザーを取得（フィルタリングはuseEffectで行う）
      const data = await userService.getAllUsers();
      console.log('Fetched users:', data);
      console.log('Data type:', typeof data);
      console.log('Is array:', Array.isArray(data));
      
      if (!data) {
        console.error('No data returned from userService');
        setUsers([]);
      } else if (!Array.isArray(data)) {
        console.error('Data is not an array:', data);
        setUsers([]);
      } else {
        setUsers(data);
      }
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      // より詳細なエラーメッセージを表示
      const errorMessage = error?.message || 'ユーザーデータの取得に失敗しました。';
      setError(`エラー: ${errorMessage}`);
      setUsers([]); // エラー時も空配列をセット
    } finally {
      setIsLoading(false);
    }
  };

  // ソート切り替え
  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // ソートアイコンを表示
  const renderSortIcon = (field: keyof User) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  // プラン表示名を取得
  const getPlanDisplayName = (plan: string) => {
    switch(plan) {
      case 'free': return 'フリープラン';
      case 'standard': return 'スタンダードプラン';
      case 'premium': return 'プレミアムプラン';
      case 'enterprise': return 'エンタープライズプラン';
      default: return plan;
    }
  };

  // 日付フォーマット
  const formatDate = (date: Date | undefined) => {
    if (!date) return '未設定';
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  };

  // CSVエクスポート（モック）
  const handleExportCSV = () => {
    alert('CSV出力機能はモックです。実際にはここでCSVファイルをダウンロードします。');
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">ユーザー管理</h1>
      </div>

      {error && (
        <Card className="mb-4 p-4 bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
        </Card>
      )}

      {/* 検索とフィルター */}
      <Card className="mb-4 p-4">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="pl-10 pr-3 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="ユーザー名、メールアドレスで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <select
                className="pl-3 pr-8 py-2 border border-gray-300 rounded-md appearance-none bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
              >
                <option value="all">すべてのユーザー</option>
                <option value="users-only">一般ユーザーのみ</option>
                <option value="admins-only">管理者のみ</option>
                <option value="active">有効なユーザーのみ</option>
                <option value="inactive">無効なユーザーのみ</option>
                <option value="plan:free">フリープラン</option>
                <option value="plan:standard">スタンダードプラン</option>
                <option value="plan:premium">プレミアムプラン</option>
                <option value="plan:enterprise">エンタープライズプラン</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Filter size={16} className="text-gray-400" />
              </div>
            </div>
            
            <Button
              variant="ghost"
              leftIcon={<RefreshCw size={16} />}
              onClick={fetchUsers}
              isLoading={isLoading}
              className="text-sm"
            >
              更新
            </Button>
          </div>
        </div>
      </Card>

      {/* ユーザーリスト */}
      <Card>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-12 text-center">
              <RefreshCw size={32} className="animate-spin mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">ユーザーデータを読み込み中...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500 mb-2">ユーザーが見つかりません</p>
              <p className="text-gray-400 text-sm">検索条件を変更するか、新しいユーザーを登録してください。</p>
              {users.length === 0 && (
                <p className="text-gray-400 text-sm mt-2">
                  データベースにユーザーが登録されていない可能性があります。
                </p>
              )}
            </div>
          ) : (
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    scope="col" 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer max-w-[10ch]"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center whitespace-nowrap">
                      ID {renderSortIcon('id')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      名前 {renderSortIcon('name')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hidden md:table-cell"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center">
                      メール {renderSortIcon('email')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-[8ch] hidden sm:table-cell"
                    onClick={() => handleSort('plan')}
                  >
                    <div className="flex items-center">
                      プラン {renderSortIcon('plan')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-[8ch] hidden sm:table-cell"
                    onClick={() => handleSort('isActive')}
                  >
                    <div className="flex items-center">
                      状態 {renderSortIcon('isActive')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-[10ch] hidden md:table-cell"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center whitespace-nowrap">
                      登録日 {renderSortIcon('createdAt')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-4 py-3 text-right w-[3rem]"
                  >
                    <span className="sr-only">操作</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 truncate max-w-[10ch]">
                      {user.id}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.name}
                      <div className="text-xs text-gray-500 md:hidden">
                        {user.email}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                      {user.email}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap hidden sm:table-cell">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.plan === 'free' ? 'bg-gray-100 text-gray-800' :
                        user.plan === 'standard' ? 'bg-blue-100 text-blue-800' :
                        user.plan === 'premium' ? 'bg-indigo-100 text-indigo-800' :
                        user.plan === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {getPlanDisplayName(user.plan)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap hidden sm:table-cell">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? '有効' : '無効'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/admin/users/${user.id}`} onClick={() => console.log('Navigating to edit user:', user.id, user.email)}>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          leftIcon={<Edit size={16} />}
                          className="text-gray-600 hover:text-gray-900 p-1"
                        >
                          <span className="sr-only">編集</span>
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
};

export default UsersManagement;