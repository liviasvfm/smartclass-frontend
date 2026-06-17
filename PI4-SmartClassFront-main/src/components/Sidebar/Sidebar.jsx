import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: 'Carregando...', category: '', initials: '--' });

  useEffect(() => {
    // Busca os dados salvos no momento do Login
    const name = localStorage.getItem('userName') || 'Usuário Desconhecido';
    const category = localStorage.getItem('userCategory') || 'Sem Categoria';
    
    // Extrai as iniciais do nome (Ex: Carlos Silva -> CS)
    const nameParts = name.split(' ');
    const initials = nameParts.length > 1 
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : nameParts[0].substring(0, 2).toUpperCase();

    setUser({ name, category, initials });
  }, []);

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.clear(); // Limpa token e dados do usuário
    navigate('/login');
  };

  const isActive = (path) => 
    location.pathname === path 
      ? "bg-senac-blue text-white shadow-md" 
      : "text-senac-muted hover:bg-senac-bg hover:text-senac-blue";

  const isGestor = user.category === 'Gestor';

  return (
    <aside className="w-64 h-screen bg-senac-card border-r border-gray-200 flex flex-col p-5 fixed z-10">
      <div className="mb-10 text-center">
        <h2 className="text-2xl font-bold text-senac-blue">
          Smart<span className="text-senac-orange">Class</span>
        </h2>
        <p className="text-xs text-senac-muted mt-1 font-medium">Controle de Chaves</p>
      </div>

      <nav className="flex flex-col gap-3 flex-1">
        {/* Rotas Comuns a Todos */}
        <Link to="/dashboard" className={`text-left px-4 py-3 rounded-lg font-bold transition-all ${isActive('/dashboard')}`}>
          Início (Dashboard)
        </Link>
        
        <Link to="/rooms" className={`text-left px-4 py-3 rounded-lg font-bold transition-all ${isActive('/rooms')}`}>
          Salas e Horários
        </Link>

        {/* Rotas Exclusivas do Gestor */}
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
  );
};

export default Sidebar;