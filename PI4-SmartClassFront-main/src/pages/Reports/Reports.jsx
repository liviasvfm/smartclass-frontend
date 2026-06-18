import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../components/Layout/PageLayout';

const Reports = () => {
  const navigate = useNavigate();
  const [movements, setMovements] = useState([]);
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchName, setSearchName] = useState('');

  useEffect(() => {
    const fetchRooms = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch('https://smartclass-backend-production.up.railway.app/api/rooms', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setSalas(await res.json());
      } catch (err) { console.error(err); }
    };
    fetchRooms();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    const fetchMovements = async () => {
      setLoading(true); setError('');
      try {
        const queryParams = new URLSearchParams({ limit: 100 });
        if (actionFilter !== 'all') queryParams.append('action', actionFilter);
        if (roomFilter !== 'all') queryParams.append('room_id', roomFilter);
        if (startDate) queryParams.append('from', `${startDate} 00:00:00`);
        if (endDate) queryParams.append('to', `${endDate} 23:59:59`);

        const url = `https://smartclass-backend-production.up.railway.app/api/movements?${queryParams.toString()}`;
        const response = await fetch(url, {
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erro ao buscar histórico.');
        setMovements(data.data || data);
      } catch (err) {
        setError(err.message);
        if (err.message.includes('Sessão expirada')) { localStorage.removeItem('token'); navigate('/login'); }
      } finally { setLoading(false); }
    };
    fetchMovements();
  }, [actionFilter, roomFilter, startDate, endDate, navigate]);

  const filteredMovements = movements.filter((mov) =>
    mov.user_name.toLowerCase().includes(searchName.toLowerCase())
  );

  const clearFilters = () => {
    setActionFilter('all'); setRoomFilter('all');
    setStartDate(''); setEndDate(''); setSearchName('');
  };

  return (
    <PageLayout>
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-senac-blue">Relatórios e Auditoria</h1>
        <p className="text-senac-muted mt-2 font-medium text-sm md:text-base">
          Filtre e analise o histórico completo de movimentações do claviculário.
        </p>
      </header>

      {/* FILTROS */}
      <section className="bg-senac-card p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm w-full mb-6">
        <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
          <h2 className="text-base md:text-lg font-bold text-senac-blue">Filtros Avançados</h2>
          <button onClick={clearFilters} className="text-xs font-bold text-senac-muted hover:text-senac-orange transition-colors">
            Limpar Filtros ✕
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-senac-text uppercase tracking-wide">Ação</label>
            <div className="flex bg-senac-bg rounded-lg p-1 border border-gray-300">
              {[
                { value: 'all', label: 'Todos', activeClass: 'bg-white shadow-sm text-senac-blue' },
                { value: 'withdrawal', label: 'Retiradas', activeClass: 'bg-orange-50 shadow-sm text-senac-orange' },
                { value: 'return', label: 'Devoluções', activeClass: 'bg-blue-50 shadow-sm text-senac-blue' },
              ].map(btn => (
                <button key={btn.value} onClick={() => setActionFilter(btn.value)}
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${actionFilter === btn.value ? btn.activeClass : 'text-senac-muted hover:text-senac-text'}`}>
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-senac-text uppercase tracking-wide">Ambiente</label>
            <select value={roomFilter} onChange={(e) => setRoomFilter(e.target.value)}
              className="p-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none text-senac-text">
              <option value="all">Todas as Salas</option>
              {salas.map(s => <option key={s.id} value={s.id}>{s.identification}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-senac-text uppercase tracking-wide">Período</label>
            <div className="flex gap-2">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="w-1/2 p-2 rounded-lg border border-gray-300 bg-white text-xs focus:outline-none text-senac-text" title="Data Inicial" />
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="w-1/2 p-2 rounded-lg border border-gray-300 bg-white text-xs focus:outline-none text-senac-text" title="Data Final" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-senac-text uppercase tracking-wide">Usuário</label>
            <input type="text" placeholder="Buscar por nome..."
              value={searchName} onChange={(e) => setSearchName(e.target.value)}
              className="p-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none text-senac-text" />
          </div>
        </div>
      </section>

      {/* TABELA */}
      <section className="bg-senac-card p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm w-full">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 text-sm">{error}</div>
        )}
        {loading ? (
          <p className="text-senac-muted italic text-center py-8 animate-pulse">Aplicando filtros e buscando registros...</p>
        ) : filteredMovements.length === 0 ? (
          <p className="text-senac-muted italic text-center py-8">Nenhum registro encontrado com os filtros atuais.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-bold text-senac-muted uppercase tracking-wider">
                  <th className="pb-3">Usuário</th>
                  <th className="pb-3 hidden sm:table-cell">Categoria</th>
                  <th className="pb-3">Ambiente</th>
                  <th className="pb-3 text-center">Ação</th>
                  <th className="pb-3 text-right hidden md:table-cell">Data / Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-senac-text">
                {filteredMovements.map((mov) => {
                  const isWithdrawal = mov.action === 'withdrawal';
                  const dateStr = new Date(mov.occurred_at).toLocaleString('pt-BR');
                  return (
                    <tr key={mov.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 font-semibold">
                        {mov.user_name}
                        <div className="text-xs text-senac-muted md:hidden">{dateStr}</div>
                      </td>
                      <td className="py-4 text-senac-muted hidden sm:table-cell">{mov.category}</td>
                      <td className="py-4 font-medium text-senac-blue">{mov.room_name}</td>
                      <td className="py-4 text-center">
                        <span className={`inline-block font-bold px-2 md:px-3 py-1 rounded-full text-xs ${isWithdrawal ? 'bg-orange-50 text-senac-orange' : 'bg-blue-50 text-senac-blue'}`}>
                          {isWithdrawal ? '🔑 Retirada' : '✔️ Devolução'}
                        </span>
                      </td>
                      <td className="py-4 text-right text-senac-muted font-mono text-xs hidden md:table-cell">{dateStr}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PageLayout>
  );
};

export default Reports;
