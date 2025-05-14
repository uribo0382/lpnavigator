import React, { useEffect, useRef, useState } from 'react';
import { Menu, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import ConfirmDialog from '../ui/ConfirmDialog';

interface NavbarProps {
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isMobileMenuOpen, toggleMobileMenu }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
    setIsProfileMenuOpen(false);
  };
  
  const confirmLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm px-4 py-2.5">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <button 
            className="lg:hidden mr-2 p-2 rounded-full hover:bg-gray-100"
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? 'メニューを閉じる' : 'メニューを開く'}
          >
            <Menu size={20} />
          </button>
        </div>

        <div className="flex items-center">
          <div ref={profileMenuRef} className="relative">
            <button 
              className="flex items-center text-sm font-medium text-gray-700 hover:text-primary-600"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            >
              <span className="sr-only">ユーザーメニューを開く</span>
              <div className="bg-primary-100 text-primary-600 p-2 rounded-full">
                <User size={20} />
              </div>
              <span className="ml-2 hidden md:block">{currentUser?.name || '一般ユーザー'}</span>
            </button>

            {isProfileMenuOpen && (
              <div className="slide-in absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                <div className="px-4 py-2 text-sm text-gray-700 border-b">
                  <div className="font-semibold">{currentUser?.name || '一般ユーザー'}</div>
                  <div className="text-gray-500">{currentUser?.email || ''}</div>
                </div>
                <Link
                  to="/profile"
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsProfileMenuOpen(false)}
                >
                  <Settings size={16} className="mr-2" />
                  プロフィール設定
                </Link>
                <button
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={handleLogout}
                >
                  <LogOut size={16} className="mr-2" />
                  ログアウト
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
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
    </nav>
  );
};

export default Navbar;