import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(''); 
  const [loading, setLoading] = useState(false); 
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      const response = await fetch('https://smartclass-backend-production.up.railway.app/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password: senha }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao iniciar sessão.');
      }

      // Guardando todas as chaves necessárias no navegador
      localStorage.setItem('token', data.token);
      localStorage.setItem('userName', data.user.name);
      localStorage.setItem('userCategory', data.user.category);
      localStorage.setItem('userId', data.user.id); 

      navigate('/dashboard');
      
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-senac-bg flex items-center justify-center p-5">
      <div className="bg-senac-card p-10 rounded-xl shadow-2xl w-full max-w-md text-center">
        
        <h1 className="text-3xl font-bold text-senac-text mb-2">
          Smart<span className="text-senac-orange">Class</span>
        </h1>
        <p className="text-senac-muted text-sm mb-8">
          Acesso Inteligente
        </p>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          
          {erro && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm text-left">
              <span className="block sm:inline">{erro}</span>
            </div>
          )}

          <div className="flex flex-col text-left gap-2">
            <label htmlFor="email" className="text-xs font-medium text-senac-muted tracking-wide">
              E-mail Institucional
            </label>
            <input 
              type="email" 
              id="email"
              className="p-3 rounded-lg border border-slate-700 bg-senac-bg text-senac-text focus:outline-none focus:border-senac-orange transition-colors"
              placeholder="exemplo@edu.pe.senac.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="flex flex-col text-left gap-2">
            <label htmlFor="senha" className="text-xs font-medium text-senac-muted tracking-wide">
              Palavra-passe
            </label>
            <input 
              type="password" 
              id="senha"
              className="p-3 rounded-lg border border-slate-700 bg-senac-bg text-senac-text focus:outline-none focus:border-senac-orange transition-colors"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full text-white p-4 rounded-lg font-semibold mt-2 shadow-md transition-colors ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-senac-orange hover:bg-senac-orange-hover'
            }`}
          >
            {loading ? 'A verificar...' : 'Entrar no Sistema'}
          </button>
        </form>
        
      </div>
    </div>
  );
};

export default Login;