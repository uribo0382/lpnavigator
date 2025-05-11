import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, Settings, Users, FileText, List, BarChart, ChevronRight, ChevronDown, History, Clock, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmDialog from '../ui/ConfirmDialog';

interface SidebarProps {
  onCloseMobileMenu?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onCloseMobileMenu }) => {
  const { isAdmin } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  const toggleMenu = (menu: string) => {
    setExpandedMenus(prevState => 
      prevState.includes(menu) 
        ? prevState.filter(item => item !== menu) 
        : [...prevState, menu]
    );
  };

  const isMenuExpanded = (menu: string) => expandedMenus.includes(menu);

  // 回答が入力されているか確認
  const hasAnswers = () => {
    const answersStr = localStorage.getItem('lp_navigator_answers');
    if (!answersStr) return false;
    
    try {
      const answers = JSON.parse(answersStr);
      return Object.values(answers).some(answer => answer && (answer as string).trim() !== '');
    } catch (e) {
      return false;
    }
  };

  // 画面遷移前の確認
  const confirmNavigation = (targetPath: string) => {
    // 現在のパスを確認して、create画面にいる場合のみ保存確認する
    const isCreatePage = location.pathname === '/generator/create' || location.pathname === '/generator';
    if (isCreatePage && hasAnswers()) {
      setPendingNavigation(targetPath);
      setShowConfirmDialog(true);
      return false;
    }
    return true;
  };

  // 安全なナビゲーション共通関数
  const safeNavigate = (path: string) => {
    try {
      navigate(path);
      // モバイルメニューを閉じる（存在する場合のみ）
      if (onCloseMobileMenu) {
        onCloseMobileMenu();
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // フォールバックとしてwindow.locationを使用
      // HashRouter形式に修正 (/#/path ではなく #/path 形式にする)
      window.location.href = `#${path}`;
      // モバイルメニューを閉じる（存在する場合のみ）
      if (onCloseMobileMenu) {
        onCloseMobileMenu();
      }
    }
  };

  // LP記事生成をクリックした時の処理
  const handleContentGenClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (confirmNavigation('/generator')) {
      // 回答データをクリア
      localStorage.removeItem('lp_navigator_answers');
      // 生成されたコンテンツもクリア
      localStorage.removeItem('lp_navigator_generated_content');
      // LP記事生成ページに移動
      safeNavigate('/generator');
    }
  };

  // LP履歴 & 保存データをクリックした時の処理
  const handleHistoryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (confirmNavigation('/generator/history')) {
      safeNavigate('/generator/history');
    }
  };

  // 保存して移動
  const handleSaveAndNavigate = () => {
    // 現在の保存リストを取得
    const savedListStr = localStorage.getItem('lp_navigator_saved_list') || '[]';
    const answersStr = localStorage.getItem('lp_navigator_answers') || '{}';
    let savedList = [];
    let answers = {};
    
    try {
      savedList = JSON.parse(savedListStr);
      answers = JSON.parse(answersStr);
    } catch (e) {
      console.error('Failed to parse saved data:', e);
    }
    
    // 進捗率を計算
    const calculateProgress = () => {
      const answeredCount = Object.values(answers).filter(answer => answer && (answer as string).trim() !== '').length;
      return Object.keys(answers).length > 0 ? (answeredCount / Object.keys(answers).length) * 100 : 0;
    };
    
    // 新しい保存データを作成
    const newSaveData = {
      id: Date.now().toString(),
      title: `LP記事 (${new Date().toLocaleDateString()})`,
      date: new Date().toISOString(),
      progress: calculateProgress(),
      answers: answers
    };
    
    // リストに追加
    savedList.push(newSaveData);
    
    // ローカルストレージに保存
    localStorage.setItem('lp_navigator_saved_list', JSON.stringify(savedList));
    localStorage.setItem('lp_navigator_last_saved', newSaveData.id);
    
    // 遷移処理
    if (pendingNavigation) {
      safeNavigate(pendingNavigation);
    }
  };

  // 保存せずに画面遷移
  const handleNavigateWithoutSaving = () => {
    if (pendingNavigation) {
      safeNavigate(pendingNavigation);
    }
  };

  // 管理者メニュー項目のクリック処理（React Router の safeNavigate を利用）
  const handleAdminMenuClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    if (confirmNavigation(path)) {
      safeNavigate(path);
    }
  };

  return (
    <aside className="bg-white h-full flex flex-col">
      <div className="flex items-center justify-between h-16 border-b border-gray-200 px-4">
        <h2 className="text-lg font-bold text-primary-600">LPナビゲーター</h2>
        {/* モバイル表示でのみ閉じるボタンを表示 */}
        {onCloseMobileMenu && (
          <button 
            className="p-2 rounded-full hover:bg-gray-100 lg:hidden"
            onClick={onCloseMobileMenu}
            aria-label="メニューを閉じる"
          >
            <X size={18} />
          </button>
        )}
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {/* Content Generation Section */}
          <li>
            <NavLink
              to="/generator"
              onClick={handleContentGenClick}
              className={({ isActive }) => 
                `flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                  isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <FileText size={18} className="mr-3" />
              LP記事生成
            </NavLink>
          </li>
          
          {/* LP History Section - 新しく追加 */}
          <li>
            <NavLink
              to="/generator/history"
              onClick={handleHistoryClick}
              className={({ isActive }) => 
                `flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                  isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <History size={18} className="mr-3" />
              LP履歴 & 保存データ
            </NavLink>
          </li>

          {/* Admin Section */}
          {isAdmin() && (
            <>
              <li className="mt-6 mb-2">
                <div className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  管理者メニュー
                </div>
              </li>
              
              <li>
                <button
                  className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
                  onClick={() => toggleMenu('questions')}
                >
                  <div className="flex items-center">
                    <List size={18} className="mr-3" />
                    質問管理
                  </div>
                  {isMenuExpanded('questions') ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                
                {isMenuExpanded('questions') && (
                  <ul className="mt-1 pl-10 space-y-1">
                    <li>
                      <NavLink
                        to="/admin/questions"
                        onClick={(e) => handleAdminMenuClick(e, '/admin/questions')}
                        className={({ isActive }) => 
                          `block px-3 py-1.5 text-sm rounded-md ${
                            isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'
                          }`
                        }
                      >
                        質問一覧
                      </NavLink>
                    </li>
                    <li>
                      <NavLink
                        to="/admin/questions/new"
                        onClick={(e) => handleAdminMenuClick(e, '/admin/questions/new')}
                        className={({ isActive }) => 
                          `block px-3 py-1.5 text-sm rounded-md ${
                            isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'
                          }`
                        }
                      >
                        質問作成
                      </NavLink>
                    </li>
                  </ul>
                )}
              </li>
              
              <li>
                <button
                  className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
                  onClick={() => toggleMenu('users')}
                >
                  <div className="flex items-center">
                    <Users size={18} className="mr-3" />
                    ユーザー管理
                  </div>
                  {isMenuExpanded('users') ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                
                {isMenuExpanded('users') && (
                  <ul className="mt-1 pl-10 space-y-1">
                    <li>
                      <NavLink
                        to="/admin/users"
                        onClick={(e) => handleAdminMenuClick(e, '/admin/users')}
                        className={({ isActive }) => 
                          `block px-3 py-1.5 text-sm rounded-md ${
                            isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'
                          }`
                        }
                      >
                        ユーザー一覧
                      </NavLink>
                    </li>
                  </ul>
                )}
              </li>

              <li>
                <NavLink
                  to="/admin/api-settings"
                  onClick={(e) => handleAdminMenuClick(e, '/admin/api-settings')}
                  className={({ isActive }) => 
                    `flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                      isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <Settings size={18} className="mr-3" />
                  API設定
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/admin/analytics"
                  onClick={(e) => handleAdminMenuClick(e, '/admin/analytics')}
                  className={({ isActive }) => 
                    `flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                      isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <BarChart size={18} className="mr-3" />
                  分析
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </nav>

      {/* 確認ダイアログ */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleSaveAndNavigate}
        onCancel={handleNavigateWithoutSaving}
        title="変更が保存されていません"
        message="入力内容が保存されていません。保存しますか？"
        confirmText="保存する"
        cancelText="保存せずに移動"
      />
    </aside>
  );
};

export default Sidebar;