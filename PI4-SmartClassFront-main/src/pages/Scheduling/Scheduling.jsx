import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';

const Scheduling = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedRoomFilter, setSelectedRoomFilter] = useState('all');
  
  const [salas, setSalas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [reservas, setReservas] = useState([]);

  const [formData, setFormData] = useState({
    usuarioId: '',
    salaId: '',
    data_agendamento: '',
    horario_inicio: '',
    horario_fim: ''
  });

  // Busca os dados reais do backend ao carregar a página
 useEffect(() => {
  const token = localStorage.getItem('token');
  if (!token) {
    navigate('/login');
    return;
  }

  const fetchData = async () => {
    try {
      const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      };

      const [resSalas, resUsuarios, resReservas] = await Promise.all([
        fetch('https://smartclass-backend-production.up.railway.app/api/rooms', { headers }),
        fetch('https://smartclass-backend-production.up.railway.app/api/users', { headers }),
        fetch('https://smartclass-backend-production.up.railway.app/api/scheduling', { headers })
      ]);

      // Se o backend rejeitar o token por expiração (Status 401)
      if (resSalas.status === 401 || resUsuarios.status === 401 || resReservas.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      if (resSalas.ok) setSalas(await resSalas.json());
      if (resUsuarios.ok) setUsuarios(await resUsuarios.json());
      if (resReservas.ok) setReservas(await resReservas.json());

    } catch (error) {
      console.error("Erro ao buscar dados do banco:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateAgendamento = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    if (!formData.usuarioId || !formData.salaId || !formData.data_agendamento || !formData.horario_inicio || !formData.horario_fim) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    try {
      const response = await fetch('https://smartclass-backend-production.up.railway.app/api/scheduling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: formData.usuarioId,
          room_id: formData.salaId,
          scheduled_date: formData.data_agendamento,
          start_time: formData.horario_inicio,
          end_time: formData.horario_fim
        })
      });

      if (response.ok) {
        alert("Reserva de sala agendada com sucesso!");
        // Recarrega a página para atualizar a tabela com o novo ID gerado pelo banco
        window.location.reload(); 
      } else {
        const err = await response.json();
        alert("Erro: " + err.error);
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  };

  const handleUpdateStatus = async (id, novoStatus) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`https://smartclass-backend-production.up.railway.app/api/scheduling/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: novoStatus })
      });

      if (response.ok) {
        setReservas(prev => prev.map(res => res.id === id ? { ...res, status: novoStatus } : res));
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const filteredReservas = selectedRoomFilter === 'all' 
    ? reservas 
    : reservas.filter(res => res.room_id === parseInt(selectedRoomFilter));

  return (
    <div className="min-h-screen bg-senac-bg flex">
      <Sidebar />

      <main className="flex-1 ml-64 p-10">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-senac-blue">Agendamentos de Salas</h1>
          <p className="text-senac-muted mt-2 font-medium">
            Gerencie o calendário de reservas e verifique a ocupação dos ambientes.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUNA 1: Formulário de Reserva */}
          <div className="lg:col-span-1">
            <section className="bg-senac-card p-6 rounded-xl border border-gray-200 shadow-sm sticky top-6">
              <h2 className="text-lg font-bold text-senac-blue mb-4 pb-2 border-b border-gray-100">Nova Reserva</h2>
              
              <form onSubmit={handleCreateAgendamento} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-senac-text uppercase tracking-wide">Usuário</label>
                  <select
                    name="usuarioId" value={formData.usuarioId} onChange={handleInputChange} required
                    className="p-3 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none text-senac-text"
                  >
                    <option value="">Selecione quem vai usar...</option>
                    {usuarios.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.category})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-senac-text uppercase tracking-wide">Sala / Ambiente</label>
                  <select
                    name="salaId" value={formData.salaId} onChange={handleInputChange} required
                    className="p-3 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none text-senac-text"
                  >
                    <option value="">Selecione a sala...</option>
                    {salas.map(s => (
                      <option key={s.id} value={s.id}>{s.identification}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-senac-text uppercase tracking-wide">Data</label>
                  <input
                    type="date" name="data_agendamento" value={formData.data_agendamento} onChange={handleInputChange} required
                    className="p-3 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none text-senac-text"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-senac-text uppercase tracking-wide">Início</label>
                    <input
                      type="time" name="horario_inicio" value={formData.horario_inicio} onChange={handleInputChange} required
                      className="p-3 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none text-senac-text"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-senac-text uppercase tracking-wide">Fim</label>
                    <input
                      type="time" name="horario_fim" value={formData.horario_fim} onChange={handleInputChange} required
                      className="p-3 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none text-senac-text"
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="bg-senac-orange text-white p-3 rounded-lg font-bold text-sm hover:bg-senac-orange-hover transition-colors shadow-md mt-2 disabled:bg-gray-400">
                  Confirmar Agendamento
                </button>
              </form>
            </section>
          </div>

          {/* COLUNA 2 e 3: Filtro Interativo e Tabela de Horários */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <section className="bg-senac-card p-6 rounded-xl border border-gray-200 shadow-sm">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-gray-100 pb-4">
                <h2 className="text-lg font-bold text-senac-blue">Agenda de Ocupação</h2>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <label className="text-xs font-bold text-senac-muted text-right uppercase tracking-wider hidden sm:block">Filtrar Sala:</label>
                  <select
                    value={selectedRoomFilter}
                    onChange={(e) => setSelectedRoomFilter(e.target.value)}
                    className="p-2 rounded-lg border border-gray-300 bg-senac-bg text-xs font-bold text-senac-blue focus:outline-none w-full sm:w-auto"
                  >
                    <option value="all">Todas as Salas</option>
                    {salas.map(s => (
                      <option key={s.id} value={s.id}>{s.identification}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                {loading ? (
                  <p className="text-senac-muted italic text-center py-6 animate-pulse">Carregando agenda...</p>
                ) : filteredReservas.length === 0 ? (
                  <p className="text-senac-muted italic text-center py-6">Nenhuma reserva encontrada para o filtro selecionado.</p>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-xs font-bold text-senac-muted uppercase tracking-wider">
                        <th className="pb-3">Ambiente / Usuário</th>
                        <th className="pb-3">Data</th>
                        <th className="pb-3 text-center">Horário</th>
                        <th className="pb-3 text-center">Status</th>
                        <th className="pb-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm text-senac-text">
                      {filteredReservas.map((res) => {
                        const isScheduled = res.status === 'Scheduled';
                        const isDone = res.status === 'Completed';
                        
                        return (
                          <tr key={res.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-4">
                              <div className="font-bold text-senac-blue">{res.room_name}</div>
                              <div className="text-xs text-senac-muted mt-0.5">{res.user_name}</div>
                            </td>
                            <td className="py-4 text-senac-text font-medium">
                              {new Date(res.scheduled_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                            </td>
                            <td className="py-4 text-center">
                              <span className="bg-slate-100 text-slate-700 font-mono text-xs px-2.5 py-1 rounded-md font-bold">
                                {res.start_time.slice(0,5)} - {res.end_time.slice(0,5)}
                              </span>
                            </td>
                            <td className="py-4 text-center">
                              <span className={`inline-block font-bold px-2.5 py-1 rounded-full text-xs ${
                                isScheduled ? 'bg-orange-50 text-senac-orange' :
                                isDone ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                              }`}>
                                {isScheduled ? 'Agendado' : isDone ? 'Concluído' : 'Cancelado'}
                              </span>
                            </td>
                            <td className="py-4 text-right">
                              {isScheduled && (
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    onClick={() => handleUpdateStatus(res.id, 'Completed')}
                                    className="bg-green-600 text-white text-xs font-bold px-2.5 py-1.5 rounded hover:bg-green-700 transition-colors shadow-sm"
                                    title="Concluir Reserva"
                                  >
                                    ✓
                                  </button>
                                  <button
                                    onClick={() => handleUpdateStatus(res.id, 'Canceled')}
                                    className="bg-red-500 text-white text-xs font-bold px-2.5 py-1.5 rounded hover:bg-red-600 transition-colors shadow-sm"
                                    title="Cancelar Reserva"
                                  >
                                    ✕
                                  </button>
                                </div>
                              )}
                              {!isScheduled && (
                                <span className="text-xs text-senac-muted italic font-medium">Finalizado</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Scheduling;