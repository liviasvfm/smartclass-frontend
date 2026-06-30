import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../components/Layout/PageLayout';

const Dashboard = () => {
  const navigate = useNavigate();
  
  const userCategory = localStorage.getItem('userCategory');
  const userId = localStorage.getItem('userId');
  const isGestor = userCategory === 'Gestor';
  
  const [summary, setSummary] = useState({ keysInUse: 0, roomsAvailable: 0, overdueReturns: 0 });
  const [recentMovements, setRecentMovements] = useState([]);
  const [overdueKeys, setOverdueKeys] = useState([]);
  const [rooms, setRooms] = useState([]); 
  const [myRules, setMyRules] = useState([]);
  const [myReservations, setMyReservations] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const [summaryRes, recentRes, overdueRes, roomsRes, rulesRes, reservationsRes] = await Promise.all([
        fetch('https://smartclass-backend-production.up.railway.app/api/movements/summary', { headers }),
        fetch('https://smartclass-backend-production.up.railway.app/api/movements?limit=5', { headers }),
        fetch('https://smartclass-backend-production.up.railway.app/api/movements/overdue', { headers }),
        fetch('https://smartclass-backend-production.up.railway.app/api/rooms', { headers }),
        fetch('https://smartclass-backend-production.up.railway.app/api/rooms/rules', { headers }),
        fetch('https://smartclass-backend-production.up.railway.app/api/reservations/me', { headers }).catch(() => null)
      ]);

      if (summaryRes.status === 401 || rulesRes.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      if (summaryRes.ok) setSummary(await summaryRes.json());
      if (recentRes.ok) {
        const recentData = await recentRes.json();
        setRecentMovements(recentData.data || recentData);
      }
      if (overdueRes.ok) setOverdueKeys(await overdueRes.json());
      if (roomsRes.ok) setRooms(await roomsRes.json());

      if (rulesRes.ok) {
        const allRules = await rulesRes.json();
        const filteredRules = allRules.filter(r => r.user_id === parseInt(userId, 10));
        setMyRules(filteredRules);
      }

      if (reservationsRes && reservationsRes.ok) {
        setMyReservations(await reservationsRes.json());
      }

    } catch (error) {
      console.error('Erro ao carregar o dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const intervalId = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(intervalId);
  }, [navigate]);

  const handleHardwareIntent = async (roomId, roomName, action) => {
    const actionText = action === 'withdrawal' ? 'retirada' : 'devolução';
    alert(`Solicitação de ${actionText} registrada para a ${roomName}.\n\nDirija-se ao claviculário físico e aproxime seu crachá RFID no leitor para concluir a operação.`);
  };

  const handleToggleKeyStatus = async (keyId, currentStatus) => {
    const token = localStorage.getItem('token');
    if (!keyId) return;

    const nextStatus = currentStatus === 'in_use' ? 'available' : 'in_use';
    const actionConfirm = currentStatus === 'in_use' ? 'forçar a devolução' : 'forçar a retirada';

    if (!window.confirm(`Tem certeza que deseja ${actionConfirm} desta chave manualmente?`)) return;

    setActionLoading(keyId);
    try {
      const response = await fetch(`https://smartclass-backend-production.up.railway.app/api/keys/${keyId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });

      if (response.ok) {
        setRooms(prevRooms => prevRooms.map(room => room.key_id === keyId ? { ...room, key_status: nextStatus } : room));
        fetchDashboardData(); 
      } else {
        const errData = await response.json();
        alert(`Erro ao atualizar status: ${errData.error}`);
      }
    } catch (err) {
      console.error('Erro na contingência:', err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <PageLayout>
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-senac-blue">
          {isGestor ? 'Painel de Controle Administrativo' : 'Meu Painel de Acesso'}
        </h1>
        <p className="text-senac-muted mt-2 font-medium text-sm md:text-base">
          {isGestor 
            ? 'Acompanhe os indicadores globais, despache contingências e gerencie suas próprias chaves.' 
            : 'Gerencie suas solicitações de chaves, horários fixos e agendamentos pontuais.'}
        </p>
      </header>

      {loading ? (
        <p className="text-senac-muted italic animate-pulse">A carregar interface...</p>
      ) : (
        <div className="flex flex-col gap-6 md:gap-8">

          {isGestor && (
            <>
              {/* PAINEL DE ALERTAS */}
              {overdueKeys.length > 0 && (
                <section className="bg-red-50 border border-red-300 p-4 md:p-6 rounded-xl shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-red-600 text-2xl">⚠️</span>
                    <h2 className="text-base md:text-lg font-bold text-red-700">Atenção: Chaves em Atraso</h2>
                  </div>
                  <div className="flex flex-col gap-3">
                    {overdueKeys.map((key) => (
                      <div key={key.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white rounded-lg p-3 border border-red-200 gap-2">
                        <div>
                          <span className="font-bold text-senac-text text-sm">{key.room_name}</span>
                          <span className="text-senac-muted text-xs ml-2">— {key.user_name}</span>
                        </div>
                        <span className="text-xs font-mono text-red-600 bg-red-100 px-2 py-1 rounded self-start sm:self-auto">
                          Desde: {new Date(key.occurred_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* INDICADORES GLOBAIS */}
              <div className="grid grid-cols-3 gap-3 md:gap-6">
                {[
                  { label: 'Chaves em Uso', value: summary.keysInUse, color: 'text-senac-orange', bg: 'bg-orange-50', border: 'border-orange-200' },
                  { label: 'Salas Livres', value: summary.roomsAvailable, color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
                  { label: 'Atrasos', value: summary.overdueReturns, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
                ].map((item) => (
                  <div key={item.label} className={`${item.bg} border ${item.border} p-3 md:p-6 rounded-xl shadow-sm text-center`}>
                    <p className={`text-2xl md:text-4xl font-bold ${item.color}`}>{item.value}</p>
                    <p className="text-senac-muted font-medium mt-1 text-xs md:text-sm">{item.label}</p>
                  </div>
                ))}
              </div>

              {/* STATUS DAS SALAS + LOGS RECENTES */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                {/* STATUS DAS SALAS */}
                <section className="bg-senac-card p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h2 className="text-base md:text-lg font-bold text-senac-blue mb-4 md:mb-6 border-b border-gray-100 pb-4">
                    Status das Salas
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-xs font-bold text-senac-muted uppercase tracking-wider">
                          <th className="pb-3">Sala</th>
                          <th className="pb-3 text-center">Status</th>
                          <th className="pb-3 text-right">Contingência</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {rooms.map((room) => {
                          const hasKey = !!room.key_id;
                          const isInUse = room.key_status === 'in_use';
                          return (
                            <tr key={room.id} className="hover:bg-gray-50 transition-colors">
                              <td className="py-3 font-semibold text-senac-blue text-xs md:text-sm">{room.identification}</td>
                              <td className="py-3 text-center">
                                {hasKey ? (
                                  <span className={`inline-block font-bold px-2 py-1 rounded text-xs ${isInUse ? 'bg-orange-50 text-senac-orange' : 'bg-green-50 text-green-700'}`}>
                                    {isInUse ? 'Em Uso' : 'Livre'}
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-400">S/ Tag</span>
                                )}
                              </td>
                              <td className="py-3 text-right">
                                {hasKey ? (
                                  <button
                                    onClick={() => handleToggleKeyStatus(room.key_id, room.key_status)}
                                    disabled={actionLoading === room.key_id}
                                    className={`text-xs font-bold px-2 md:px-3 py-1.5 rounded shadow-sm text-white transition-colors ${isInUse ? 'bg-green-600 hover:bg-green-700' : 'bg-senac-orange hover:bg-senac-orange-hover'} disabled:bg-gray-300`}
                                  >
                                    {actionLoading === room.key_id ? '...' : isInUse ? 'Devolver' : 'Retirar'}
                                  </button>
                                ) : (
                                  <span className="text-xs text-gray-300 italic">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* LOGS RECENTES */}
                <section className="bg-senac-card p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                  <h2 className="text-base md:text-lg font-bold text-senac-blue mb-4 md:mb-6 border-b border-gray-100 pb-4">
                    Últimas Movimentações
                  </h2>
                  <div className="flex flex-col gap-4 text-sm flex-1">
                    {recentMovements.length === 0 ? (
                      <p className="text-senac-muted italic">Nenhuma movimentação registrada.</p>
                    ) : (
                      recentMovements.map((mov) => {
                        const isWithdrawal = mov.action === 'withdrawal';
                        const timeStr = new Date(mov.occurred_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                        return (
                          <div key={mov.id} className="flex items-center justify-between pb-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded">
                            <p className="text-senac-text truncate pr-2 text-xs md:text-sm">
                              <span className="mr-2">{isWithdrawal ? '🔑' : '✔️'}</span>
                              <strong className="font-semibold">{mov.user_name}</strong>{' '}
                              {isWithdrawal ? 'retirou' : 'devolveu'} a{' '}
                              <span className={`font-bold ${isWithdrawal ? 'text-senac-orange' : 'text-senac-blue'}`}>{mov.room_name}</span>
                            </p>
                            <span className="text-senac-muted font-medium text-xs bg-senac-bg py-1 px-2 rounded-md border border-gray-200 whitespace-nowrap">
                              {timeStr}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <button 
                    onClick={() => navigate('/reports')}
                    className="w-full text-center mt-4 py-2.5 text-xs font-bold text-senac-blue bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Ver Histórico Completo →
                  </button>
                </section>
              </div>
            </>
          )}

          {/* SEÇÃO DE REGRAS FIXAS */}
          <section className="bg-senac-card p-4 md:p-8 rounded-xl border border-gray-200 shadow-sm w-full">
            <h2 className="text-lg md:text-xl font-bold text-senac-blue mb-4 md:mb-6 border-b border-gray-100 pb-4">
              {isGestor ? 'Minhas Permissões Fixas (Como Usuário)' : 'Minhas Permissões Fixas'}
            </h2>
            {myRules.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-senac-muted italic">Você não possui permissões recorrentes vinculadas ao seu perfil.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {myRules.map(rule => (
                  <div key={rule.id} className="border border-gray-200 rounded-xl p-4 md:p-5 hover:shadow-md transition-shadow bg-white flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-base md:text-lg text-senac-blue">{rule.room_name}</h3>
                        <p className="text-xs text-senac-muted font-bold mt-1 uppercase tracking-wide">Horário Fixo</p>
                        <span className="inline-block mt-1 bg-blue-50 text-senac-blue px-3 py-1 rounded-full text-xs font-bold">
                          {rule.allowed_start} às {rule.allowed_end}
                        </span>
                      </div>
                      <span className="text-2xl">🔑</span>
                    </div>
                    <div className="mt-auto pt-4 border-t border-gray-100 flex flex-col gap-2">
                      <button onClick={() => handleHardwareIntent(rule.room_id, rule.room_name, 'withdrawal')} className="w-full bg-senac-orange hover:bg-senac-orange-hover text-white font-bold py-2.5 rounded-lg text-sm transition-colors shadow-sm">
                        Solicitar Retirada
                      </button>
                      <button onClick={() => handleHardwareIntent(rule.room_id, rule.room_name, 'return')} className="w-full bg-senac-bg hover:bg-gray-200 text-senac-text font-bold py-2.5 rounded-lg text-sm transition-colors border border-gray-300">
                        Solicitar Devolução
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SEÇÃO DE AGENDAMENTOS */}
          <section className="bg-senac-card p-4 md:p-8 rounded-xl border border-gray-200 shadow-sm w-full">
            <h2 className="text-lg md:text-xl font-bold text-senac-blue mb-4 md:mb-6 border-b border-gray-100 pb-4">
              {isGestor ? 'Meus Agendamentos / Reservas Pessoais' : 'Meus Agendamentos (Reservas)'}
            </h2>
            {myReservations.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-senac-muted italic">Nenhum agendamento futuro encontrado para o seu perfil.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {myReservations.map(reserva => (
                  <div key={reserva.id} className="border border-green-200 rounded-xl p-4 md:p-5 hover:shadow-md transition-shadow bg-green-50/30 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-base md:text-lg text-green-700">{reserva.room_name}</h3>
                        <p className="text-xs text-green-600 font-bold mt-1 uppercase tracking-wide">Data Reservada</p>
                        <span className="inline-block mt-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">
                          📅 {reserva.formatted_date} • {reserva.start_time} às {reserva.end_time}
                        </span>
                      </div>
                    </div>
                    <div className="mt-auto pt-4 border-t border-green-200 flex flex-col gap-2">
                      <button onClick={() => handleHardwareIntent(reserva.room_id, reserva.room_name, 'withdrawal')} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-lg text-sm transition-colors shadow-sm">
                        Solicitar Retirada
                      </button>
                      <button onClick={() => handleHardwareIntent(reserva.room_id, reserva.room_name, 'return')} className="w-full bg-white hover:bg-gray-50 text-green-700 font-bold py-2.5 rounded-lg text-sm transition-colors border border-green-300">
                        Solicitar Devolução
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      )}
    </PageLayout>
  );
};

export default Dashboard;
