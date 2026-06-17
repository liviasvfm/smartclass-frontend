import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';

const DAYS_OF_WEEK = [
  { id: '1', label: 'Seg' },
  { id: '2', label: 'Ter' },
  { id: '3', label: 'Qua' },
  { id: '4', label: 'Qui' },
  { id: '5', label: 'Sex' },
  { id: '6', label: 'Sáb' },
  { id: '0', label: 'Dom' },
];

const Rooms = () => {
  const navigate = useNavigate();
  const userCategory = localStorage.getItem('userCategory');
  const isGestor = userCategory === 'Gestor';
  
  const [salas, setSalas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [regras, setRegras] = useState([]); 
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [novaSala, setNovaSala] = useState('');
  
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [formRegra, setFormRegra] = useState({
    usuarioId: '',
    salaId: '',
    inicio: '',
    fim: '',
    dias: [] // 👈 Armazena os dias selecionados como array de strings ex: ['1', '3']
  });

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [resRooms, resUsers, resRules] = await Promise.all([
        fetch('https://smartclass-backend-production.up.railway.app/api/rooms', { headers }),
        fetch('https://smartclass-backend-production.up.railway.app/api/users', { headers }),
        fetch('https://smartclass-backend-production.up.railway.app/api/rooms/rules', { headers })
      ]);

      if (resRooms.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      if (resRooms.ok) setSalas(await resRooms.json());
      if (resUsers.ok) setUsuarios(await resUsers.json());
      if (resRules.ok) setRegras(await resRules.json());

    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  const handleFormRegraChange = (e) => {
    const { name, value } = e.target;
    setFormRegra(prev => ({ ...prev, [name]: value }));
  };

  // Manipula a seleção das caixas dos dias da semana
  const handleDayCheckboxChange = (dayId) => {
    setFormRegra(prev => {
      const currentDays = prev.dias;
      if (currentDays.includes(dayId)) {
        return { ...prev, dias: currentDays.filter(d => d !== dayId) };
      } else {
        return { ...prev, dias: [...currentDays, dayId].sort() };
      }
    });
  };

  const handleAddSala = async (e) => {
    e.preventDefault();
    if (!novaSala) return;
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('https://smartclass-backend-production.up.railway.app/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ identification: novaSala })
      });

      if (response.ok) {
        setNovaSala('');
        fetchData(); 
        alert("Sala cadastrada com sucesso!");
      }
    } catch (err) { console.error(err); }
  };

  const handleSaveRegra = async (e) => {
    e.preventDefault();
    if (formRegra.dias.length === 0) {
      alert("Por favor, selecione pelo menos um dia da semana para esta regra.");
      return;
    }

    const token = localStorage.getItem('token');
    const method = editingRuleId ? 'PUT' : 'POST';
    const url = editingRuleId 
      ? `https://smartclass-backend-production.up.railway.app/api/rooms/rules/${editingRuleId}` 
      : `https://smartclass-backend-production.up.railway.app/api/rooms/rules`;

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          user_id: formRegra.usuarioId,
          room_id: formRegra.salaId,
          allowed_start: formRegra.inicio,
          allowed_end: formRegra.fim,
          allowed_days: formRegra.dias.join(',') // 👈 Transforma ['1','3'] para string "1,3" antes de enviar
        })
      });

      if (response.ok) {
        handleCancelEdit();
        fetchData(); 
        alert(`Regra ${editingRuleId ? 'atualizada' : 'vinculada'} com sucesso!`);
      } else {
        const err = await response.json();
        alert(err.error || "Erro ao salvar regra.");
      }
    } catch (err) { console.error(err); }
  };

  const handleEditClick = (regra) => {
    setEditingRuleId(regra.id);
    setFormRegra({
      usuarioId: regra.user_id,
      salaId: regra.room_id,
      inicio: regra.allowed_start,
      fim: regra.allowed_end,
      dias: regra.allowed_days ? regra.allowed_days.split(',') : [] // 👈 Converte string "1,3" de volta para array
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingRuleId(null);
    setFormRegra({ usuarioId: '', salaId: '', inicio: '', fim: '', dias: [] });
  };

  const handleDeleteRule = async (id) => {
    if (!window.confirm("Atenção: Deseja realmente excluir esta permissão de acesso?")) return;
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`https://smartclass-backend-production.up.railway.app/api/rooms/rules/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setRegras(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) { console.error(err); }
  };

  const filteredRegras = regras.filter((regra) => {
    const term = searchTerm.toLowerCase();
    return (
      regra.user_name.toLowerCase().includes(term) ||
      regra.room_name.toLowerCase().includes(term)
    );
  });

  // Função auxiliar para renderizar os dias de forma visual e amigável na tabela
  const renderDaysBadges = (allowedDaysStr) => {
    if (!allowedDaysStr) return null;
    const daysArray = allowedDaysStr.split(',');
    
    return (
      <div className="flex gap-1 justify-center flex-wrap max-w-xs mx-auto">
        {DAYS_OF_WEEK.map(d => {
          const isAllowed = daysArray.includes(d.id);
          return (
            <span 
              key={d.id} 
              className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md transition-colors ${
                isAllowed 
                  ? 'bg-senac-orange text-white shadow-sm' 
                  : 'bg-gray-100 text-gray-300'
              }`}
            >
              {d.label}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-senac-bg flex">
      <Sidebar />

      <main className="flex-1 ml-64 p-10">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-senac-blue">Salas e Horários</h1>
          <p className="text-senac-muted mt-2 font-medium">
            {isGestor 
              ? 'Gerencie os ambientes e conceda, edite ou revogue permissões de acesso.' 
              : 'Consulte os ambientes e as regras de acesso ativas.'}
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {isGestor && (
            <div className="lg:col-span-1">
              <section className="bg-senac-card p-6 rounded-xl border border-gray-200 shadow-sm sticky top-6">
                <h2 className="text-lg font-bold text-senac-blue mb-4">Cadastrar Nova Sala</h2>
                <form onSubmit={handleAddSala} className="flex flex-col gap-4">
                  <input 
                    type="text" value={novaSala} onChange={(e) => setNovaSala(e.target.value)}
                    className="p-3 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:border-senac-orange" 
                    placeholder="Ex: Laboratório 202 - Bloco B" required
                  />
                  <button type="submit" className="bg-senac-blue text-white p-3 rounded-lg font-bold text-sm hover:bg-senac-blue-hover transition-colors">
                    Adicionar Sala
                  </button>
                </form>
              </section>
            </div>
          )}

          <div className={`${isGestor ? 'lg:col-span-2' : 'lg:col-span-3'} flex flex-col gap-8`}>
            
            {isGestor && (
              <section className={`bg-senac-card p-6 rounded-xl border shadow-sm transition-all ${editingRuleId ? 'border-senac-orange ring-1 ring-senac-orange/30 bg-orange-50/10' : 'border-gray-200'}`}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-senac-blue">
                    {editingRuleId ? '✏️ Editando Regra de Acesso' : 'Vincular Regra de Acesso'}
                  </h2>
                  {editingRuleId && (
                    <button type="button" onClick={handleCancelEdit} className="text-xs font-bold text-senac-muted hover:text-red-500">
                      Cancelar Edição ✕
                    </button>
                  )}
                </div>
                
                <form onSubmit={handleSaveRegra} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-senac-text uppercase tracking-wide">Usuário</label>
                    <select
                      name="usuarioId" value={formRegra.usuarioId} onChange={handleFormRegraChange} required
                      className="p-3 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:border-senac-orange text-senac-text"
                    >
                      <option value="">Selecione...</option>
                      {usuarios.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.category})</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-senac-text uppercase tracking-wide">Sala</label>
                    <select
                      name="salaId" value={formRegra.salaId} onChange={handleFormRegraChange} required
                      className="p-3 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:border-senac-orange text-senac-text"
                    >
                      <option value="">Selecione...</option>
                      {salas.map(s => (
                        <option key={s.id} value={s.id}>{s.identification}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-senac-text uppercase tracking-wide">Início (HH:MM)</label>
                    <input
                      type="time" name="inicio" value={formRegra.inicio} onChange={handleFormRegraChange} required
                      className="p-3 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:border-senac-orange text-senac-text"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-senac-text uppercase tracking-wide">Fim (HH:MM)</label>
                    <input
                      type="time" name="fim" value={formRegra.fim} onChange={handleFormRegraChange} required
                      className="p-3 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:border-senac-orange text-senac-text"
                    />
                  </div>

                  {/* NOVO CAMPO: SELEÇÃO DE DIAS DA SEMANA */}
                  <div className="md:col-span-2 flex flex-col gap-2 mt-2">
                    <label className="text-xs font-bold text-senac-text uppercase tracking-wide">Dias da Semana Permitidos</label>
                    <div className="flex flex-wrap gap-3 p-3 rounded-lg border border-gray-300 bg-white">
                      {DAYS_OF_WEEK.map(day => (
                        <label key={day.id} className="flex items-center gap-2 text-sm text-senac-text font-medium cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={formRegra.dias.includes(day.id)}
                            onChange={() => handleDayCheckboxChange(day.id)}
                            className="w-4 h-4 rounded border-gray-300 text-senac-orange focus:ring-senac-orange"
                          />
                          {day.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-2 flex justify-end mt-2">
                    <button type="submit" className={`text-white px-6 py-3 rounded-lg font-bold text-sm transition-colors shadow-md ${editingRuleId ? 'bg-green-600 hover:bg-green-700' : 'bg-senac-orange hover:bg-senac-orange-hover'}`}>
                      {editingRuleId ? 'Salvar Alterações' : 'Permitir Acesso'}
                    </button>
                  </div>
                </form>
              </section>
            )}

            <section className="bg-senac-card p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b border-gray-100 pb-4 gap-4">
                <h2 className="text-lg font-bold text-senac-blue">Regras de Uso Ativas</h2>
                
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Buscar usuário ou sala..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 pl-3 rounded-lg border border-gray-300 bg-senac-bg text-sm focus:outline-none focus:border-senac-blue text-senac-text transition-colors"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold">✕</button>
                  )}
                </div>
              </div>
              
              {loading ? (
                <p className="text-senac-muted italic animate-pulse">Carregando permissões...</p>
              ) : regras.length === 0 ? (
                <p className="text-senac-muted italic">Nenhuma regra cadastrada no momento.</p>
              ) : filteredRegras.length === 0 ? (
                <p className="text-senac-muted italic py-4">Nenhum resultado encontrado para "{searchTerm}".</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-xs font-bold text-senac-muted uppercase tracking-wider">
                        <th className="pb-3">Usuário</th>
                        <th className="pb-3">Ambiente</th>
                        <th className="pb-3 text-center">Dias Permitidos</th> {/* 👈 ADICIONADO À TABELA */}
                        <th className="pb-3 text-center">Horário Permitido</th>
                        {isGestor && <th className="pb-3 text-right">Ações</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm text-senac-text">
                      {filteredRegras.map(regra => (
                        <tr key={regra.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 font-semibold">{regra.user_name}</td>
                          <td className="py-3 text-senac-muted">{regra.room_name}</td>
                          <td className="py-3 text-center">{renderDaysBadges(regra.allowed_days)}</td> {/* 👈 COMPONENTE DOS DIAS */}
                          <td className="py-3 text-center">
                            <span className="bg-blue-50 text-senac-blue font-bold px-3 py-1 rounded-full text-xs">
                              {regra.allowed_start} às {regra.allowed_end}
                            </span>
                          </td>
                          {isGestor && (
                            <td className="py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => handleEditClick(regra)}
                                  className="text-senac-blue bg-blue-50 hover:bg-blue-100 p-2 rounded text-xs font-bold transition-colors"
                                  title="Editar Horário/Sala"
                                >
                                  ✏️
                                </button>
                                <button 
                                  onClick={() => handleDeleteRule(regra.id)}
                                  className="text-red-600 bg-red-50 hover:bg-red-100 p-2 rounded text-xs font-bold transition-colors"
                                  title="Excluir Permissão"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Rooms;