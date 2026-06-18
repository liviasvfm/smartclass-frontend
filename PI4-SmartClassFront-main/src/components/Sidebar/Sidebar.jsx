import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: 'Carregando...', category: '', initials: '--' });

  useEffect(() => {
    const name = localStorage.getItem('userName') || 'Usuário Desconhecido';
    const category = localStorage.getItem('userCategory') || 'Sem Categoria';
    const nameParts = name.split(' ');
    const initials = nameParts.length > 1
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : nameParts[0].substring(0, 2).toUpperCase();
    setUser({ name, category, initials });
  }, []);

  // Fecha a sidebar ao mudar de rota (mobile)
  useEffect(() => {
    if (onClose) onClose();
  }, [location.pathname]);

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.clear();
    navigate('/login');
  };

  const isActive = (path) =>
    location.pathname === path
      ? 'bg-senac-blue text-white shadow-md'
      : 'text-senac-muted hover:bg-senac-bg hover:text-senac-blue';

  const isGestor = user.category === 'Gestor';

  return (
    <>
      {/* Overlay escuro no mobile quando sidebar aberta */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-screen w-64 bg-senac-card border-r border-gray-200
          flex flex-col p-5 z-30 transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* Botão fechar no mobile */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-senac-muted hover:text-senac-blue md:hidden p-1"
          aria-label="Fechar menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold text-senac-blue">
            Smart<span className="text-senac-orange">Class</span>
          </h2>
          <p className="text-xs text-senac-muted mt-1 font-medium">Controle de Chaves</p>
        </div>

        <nav className="flex flex-col gap-3 flex-1">
          <Link to="/dashboard" className={`text-left px-4 py-3 rounded-lg font-bold transition-all ${isActive('/dashboard')}`}>
            Início (Dashboard)
          </Link>

          <Link to="/rooms" className={`text-left px-4 py-3 rounded-lg font-bold transition-all ${isActive('/rooms')}`}>
            Salas e Horários
          </Link>

          {isGestor && (
            <>
              <Link to="/users" className={`text-left px-4 py-3 rounded-lg font-bold transition-all ${isActive('/users')}`}>
                Gerenciar Usuários
              </Link>

              <Link to="/scheduling" className={`text-left px-4 py-3 rounded-lg font-bold transition-all ${isActive('/scheduling')}`}>
                Agendamentos / Reservas
              </Link>

              <Link to="/reports" className={`text-left px-4 py-3 rounded-lg font-bold transition-all ${isActive('/reports')}`}>
                Relatórios / Logs
              </Link>
            </>
          )}
        </nav>

        <div className="mt-auto pt-5 border-t border-gray-200">
          <button onClick={handleLogout} className="text-red-500 text-sm font-bold hover:underline mb-4 block w-full text-left">
            Sair do Sistema
          </button>

          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 shrink-0 rounded-full bg-senac-orange flex items-center justify-center text-white font-bold shadow-sm">
              {user.initials}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-sm font-bold text-senac-text truncate" title={user.name}>{user.name}</span>
              <span className="text-xs text-senac-muted font-medium">{user.category}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
