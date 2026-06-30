import { useState } from 'react';
import Sidebar from '../Sidebar/Sidebar';

/**
 * Layout padrão das páginas internas.
 * Gerencia o estado aberto/fechado da sidebar e renderiza
 * o botão hambúrguer no topo em mobile.
 */
const PageLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-senac-bg flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Área de conteúdo principal */}
      <div className="flex-1 flex flex-col md:ml-64">

        {/* Topbar mobile com botão hambúrguer */}
        <header className="md:hidden sticky top-0 z-10 bg-senac-card border-b border-gray-200 flex items-center px-4 py-3 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-senac-blue hover:bg-senac-bg transition-colors"
            aria-label="Abrir menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="ml-3 text-lg font-bold text-senac-blue">
            Smart<span className="text-senac-orange">Class</span>
          </span>
        </header>

        {/* Conteúdo da página */}
        <main className="flex-1 p-4 md:p-10">
          {children}
        </main>
      </div>
    </div>
  );
};

export default PageLayout;
