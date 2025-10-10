import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import NavbarFixed from './NavbarFixed';
import SidebarFixed from './SidebarFixed';
import { useAuthFixed } from '../../contexts/AuthContextFixed';

const LayoutFixed: React.FC = () => {
  const { currentUser } = useAuthFixed();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  if (!currentUser) {
    return <Outlet />;
  }

  // モバイルメニューの開閉を切り替える関数
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // サイドバーの折りたたみを切り替える関数
  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* モバイルメニュー表示時のオーバーレイ */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* サイドバー - モバイル表示時は条件付きで表示 */}
      <div className={`fixed inset-y-0 left-0 z-30 ${isSidebarCollapsed ? 'w-16' : 'w-64'} bg-white transform transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:block`}>
        <SidebarFixed 
          onClose={() => setIsMobileMenuOpen(false)} 
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
        />
      </div>
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <NavbarFixed isMobileMenuOpen={isMobileMenuOpen} toggleMobileMenu={toggleMobileMenu} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="container mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default LayoutFixed;