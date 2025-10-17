import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, Settings, Users, FileText, List, BarChart, ChevronRight, ChevronDown, History, Clock, X, BookTemplate, MessageSquare, BrainCircuit, NotebookText, Megaphone, FileEdit, ChevronLeft, ChevronLeftSquare, ChevronRightSquare, PanelLeftClose, PanelLeftOpen, TestTube } from 'lucide-react';
import { useAuthFixed } from '../../contexts/AuthContextFixed';
import ConfirmDialog from '../ui/ConfirmDialog';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

// プロパティ名の調整（元のSidebarとの互換性のため）
const SidebarFixed: React.FC<SidebarProps> = ({ 
  isOpen,
  onClose: onCloseMobileMenu, 
  isCollapsed: isSidebarCollapsed = false,
  onToggleCollapse: toggleSidebar 
}) => {
  const { isAdmin } = useAuthFixed();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['basic_info', 'ad_copy', 'lp_article']);
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
      <div className="flex items-center justify-between h-16 px-4">
        {!isSidebarCollapsed ? (
          <h2 className="text-lg font-bold text-primary-600 flex items-center">LPナビゲーター</h2>
        ) : (
          <div className="w-full flex justify-center">
            <span className="text-lg font-bold text-primary-600">LP</span>
          </div>
        )}
        
        <div className="flex items-center">
          {/* サイドバー折り畳みボタン - デスクトップ表示 */}
          {toggleSidebar && (
            <button 
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              onClick={toggleSidebar}
              aria-label={isSidebarCollapsed ? "メニューを開く" : "メニューを折り畳む"}
            >
              {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          )}
          
          {/* モバイル表示でのみ閉じるボタンを表示 */}
          {onCloseMobileMenu && !isSidebarCollapsed && (
            <button 
              className="p-2 rounded-full hover:bg-gray-100 lg:hidden"
              onClick={onCloseMobileMenu}
              aria-label="メニューを閉じる"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>
      
      <nav className={`flex-1 overflow-y-auto pt-0 pb-4 ${isSidebarCollapsed ? 'px-1' : ''}`}>
        <ul className={`space-y-1 ${isSidebarCollapsed ? 'px-1' : 'px-3'}`}>
          {/* 基本情報管理セクション */}
          <li>
            {!isSidebarCollapsed ? (
              <button
                className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
                onClick={() => toggleMenu('basic_info')}
              >
                <div className="flex items-center">
                  <FileText size={18} className="mr-3" />
                  基本情報管理
                </div>
                {isMenuExpanded('basic_info') ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>
            ) : (
              <div className="flex justify-center w-full">
                <button
                  className="p-2 rounded-md hover:bg-gray-100"
                  onClick={() => {
                    if (confirmNavigation('/generator')) {
                      // 回答データをクリア
                      localStorage.removeItem('lp_navigator_answers');
                      // 生成されたコンテンツもクリア
                      localStorage.removeItem('lp_navigator_generated_content');
                      // LP記事生成ページに移動
                      safeNavigate('/generator');
                    }
                  }}
                  title="基本情報管理"
                >
                  <FileText size={18} />
                </button>
              </div>
            )}
            
            {!isSidebarCollapsed && isMenuExpanded('basic_info') && (
              <ul className="mt-1 pl-10 space-y-1">
                <li>
                  <NavLink
                    to="/generator"
                    onClick={handleContentGenClick}
                    className={({ isActive }) => 
                      `flex items-center px-3 py-1.5 text-sm rounded-md ${
                        isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'
                      }`
                    }
                  >
                    <FileText size={16} className="mr-2" />
                    基本情報作成
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/generator/history"
                    onClick={handleHistoryClick}
                    className={({ isActive }) => 
                      `flex items-center px-3 py-1.5 text-sm rounded-md ${
                        isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'
                      }`
                    }
                  >
                    <History size={16} className="mr-2" />
                    基本情報一覧
                  </NavLink>
                </li>
              </ul>
            )}
          </li>
          
          {/* 広告文管理セクション - 新規追加 */}
          <li>
            {!isSidebarCollapsed ? (
              <button
                className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
                onClick={() => toggleMenu('ad_copy')}
              >
                <div className="flex items-center">
                  <Megaphone size={18} className="mr-3" />
                  広告文管理
                </div>
                {isMenuExpanded('ad_copy') ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>
            ) : (
              <div className="flex justify-center w-full">
                <button
                  className="p-2 rounded-md hover:bg-gray-100"
                  onClick={() => {
                    if (confirmNavigation('/generator/adcopy/create')) {
                      safeNavigate('/generator/adcopy/create');
                    }
                  }}
                  title="広告文管理"
                >
                  <Megaphone size={18} />
                </button>
              </div>
            )}
            
            {!isSidebarCollapsed && isMenuExpanded('ad_copy') && (
              <ul className="mt-1 pl-10 space-y-1">
                <li>
                  <NavLink
                    to="/generator/adcopy/create"
                    className={({ isActive }) => 
                      `flex items-center px-3 py-1.5 text-sm rounded-md ${
                        isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'
                      }`
                    }
                  >
                    <Megaphone size={16} className="mr-2" />
                    広告文作成
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/generator/adcopy/history"
                    className={({ isActive }) => 
                      `flex items-center px-3 py-1.5 text-sm rounded-md ${
                        isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'
                      }`
                    }
                  >
                    <History size={16} className="mr-2" />
                    広告文一覧
                  </NavLink>
                </li>
              </ul>
            )}
          </li>

          {/* LP記事管理セクション - 新規追加 */}
          <li>
            {!isSidebarCollapsed ? (
              <button
                className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
                onClick={() => toggleMenu('lp_article')}
              >
                <div className="flex items-center">
                  <FileEdit size={18} className="mr-3" />
                  LP記事管理
                </div>
                {isMenuExpanded('lp_article') ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>
            ) : (
              <div className="flex justify-center w-full">
                <button
                  className="p-2 rounded-md hover:bg-gray-100"
                  onClick={() => {
                    if (confirmNavigation('/generator/lparticle/create')) {
                      safeNavigate('/generator/lparticle/create');
                    }
                  }}
                  title="LP記事管理"
                >
                  <FileEdit size={18} />
                </button>
              </div>
            )}
            
            {!isSidebarCollapsed && isMenuExpanded('lp_article') && (
              <ul className="mt-1 pl-10 space-y-1">
                <li>
                  <NavLink
                    to="/generator/lparticle/history"
                    className={({ isActive }) => 
                      `flex items-center px-3 py-1.5 text-sm rounded-md ${
                        isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'
                      }`
                    }
                  >
                    <History size={16} className="mr-2" />
                    LP記事一覧
                  </NavLink>
                </li>
              </ul>
            )}
          </li>

          {/* Admin Section */}
          {isAdmin() && (
            <>
              {!isSidebarCollapsed && (
                <li className="mt-6 mb-2">
                  <div className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    管理者メニュー
                  </div>
                </li>
              )}
              
              <li>
                {!isSidebarCollapsed ? (
                  <button
                    className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
                    onClick={() => toggleMenu('formula')}
                  >
                    <div className="flex items-center">
                      <BookTemplate size={18} className="mr-3" />
                      フォーミュラ管理
                    </div>
                    {isMenuExpanded('formula') ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </button>
                ) : (
                  <div className="flex justify-center w-full">
                    <button
                      className="p-2 rounded-md hover:bg-gray-100"
                      onClick={() => {
                        if (confirmNavigation('/admin/questions')) {
                          safeNavigate('/admin/questions');
                        }
                      }}
                      title="フォーミュラ管理"
                    >
                      <BookTemplate size={18} />
                    </button>
                  </div>
                )}
                
                {!isSidebarCollapsed && isMenuExpanded('formula') && (
                  <ul className="mt-1 pl-10 space-y-1">
                    <li>
                      <NavLink
                        to="/admin/questions"
                        onClick={(e) => handleAdminMenuClick(e, '/admin/questions')}
                        className={({ isActive }) => 
                          `flex items-center px-3 py-1.5 text-sm rounded-md ${
                            isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'
                          }`
                        }
                      >
                        <MessageSquare size={16} className="mr-2" />
                        質問
                      </NavLink>
                    </li>
                    <li>
                      <NavLink
                        to="/admin/formula/basic-info"
                        onClick={(e) => handleAdminMenuClick(e, '/admin/formula/basic-info')}
                        className={({ isActive }) => 
                          `flex items-center px-3 py-1.5 text-sm rounded-md ${
                            isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'
                          }`
                        }
                      >
                        <FileText size={16} className="mr-2" />
                        基本情報
                      </NavLink>
                    </li>
                    <li>
                      <NavLink
                        to="/admin/formula/ad-copy"
                        onClick={(e) => handleAdminMenuClick(e, '/admin/formula/ad-copy')}
                        className={({ isActive }) => 
                          `flex items-center px-3 py-1.5 text-sm rounded-md ${
                            isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'
                          }`
                        }
                      >
                        <BrainCircuit size={16} className="mr-2" />
                        広告文
                      </NavLink>
                    </li>
                    <li>
                      <NavLink
                        to="/admin/formula/lp-article"
                        onClick={(e) => handleAdminMenuClick(e, '/admin/formula/lp-article')}
                        className={({ isActive }) => 
                          `flex items-center px-3 py-1.5 text-sm rounded-md ${
                            isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'
                          }`
                        }
                      >
                        <NotebookText size={16} className="mr-2" />
                        LP記事
                      </NavLink>
                    </li>
                  </ul>
                )}
              </li>
              
              <li>
                {!isSidebarCollapsed ? (
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
                ) : (
                  <div className="flex justify-center w-full">
                    <button
                      className="p-2 rounded-md hover:bg-gray-100"
                      onClick={() => {
                        if (confirmNavigation('/admin/users')) {
                          safeNavigate('/admin/users');
                        }
                      }}
                      title="ユーザー管理"
                    >
                      <Users size={18} />
                    </button>
                  </div>
                )}
                
                {!isSidebarCollapsed && isMenuExpanded('users') && (
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
                {!isSidebarCollapsed ? (
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
                ) : (
                  <div className="flex justify-center w-full">
                    <button
                      className="p-2 rounded-md hover:bg-gray-100"
                      onClick={() => {
                        if (confirmNavigation('/admin/api-settings')) {
                          safeNavigate('/admin/api-settings');
                        }
                      }}
                      title="API設定"
                    >
                      <Settings size={18} />
                    </button>
                  </div>
                )}
              </li>

              <li>
                {!isSidebarCollapsed ? (
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
                ) : (
                  <div className="flex justify-center w-full">
                    <button
                      className="p-2 rounded-md hover:bg-gray-100"
                      onClick={() => {
                        if (confirmNavigation('/admin/analytics')) {
                          safeNavigate('/admin/analytics');
                        }
                      }}
                      title="分析"
                    >
                      <BarChart size={18} />
                    </button>
                  </div>
                )}
              </li>

              <li>
                {!isSidebarCollapsed ? (
                  <NavLink
                    to="/admin/api-test"
                    onClick={(e) => handleAdminMenuClick(e, '/admin/api-test')}
                    className={({ isActive }) => 
                      `flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                        isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    <TestTube size={18} className="mr-3" />
                    APIテスト
                  </NavLink>
                ) : (
                  <div className="flex justify-center w-full">
                    <button
                      className="p-2 rounded-md hover:bg-gray-100"
                      onClick={() => {
                        if (confirmNavigation('/admin/api-test')) {
                          safeNavigate('/admin/api-test');
                        }
                      }}
                      title="APIテスト"
                    >
                      <TestTube size={18} />
                    </button>
                  </div>
                )}
              </li>
            </>
          )}
        </ul>
      </nav>

      {/* 確認ダイアログ */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="変更が保存されていません"
        message="入力した内容を保存しますか？保存しない場合、内容は失われます。"
        confirmLabel="保存する"
        cancelLabel="保存しない"
        onConfirm={() => {
          setShowConfirmDialog(false);
          handleSaveAndNavigate();
        }}
        onCancel={() => {
          setShowConfirmDialog(false);
          handleNavigateWithoutSaving();
        }}
        onClose={() => {
          setShowConfirmDialog(false);
        }}
      />
    </aside>
  );
};

export default SidebarFixed;