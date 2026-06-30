import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../components/Layout/PageLayout';

const Users = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', cpf: '', category: '', password: '' });

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    try {
      const response = await fetch('https://smartclass-backend-production.up.railway.app/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 401) { localStorage.removeItem('token'); navigate('/login'); return; }
      if (response.ok) setUsers(await response.json());
    } catch (err) {
      console.error("Erro ao carregar usuários:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [navigate]);

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === 'cpf') {
      value = value.replace(/\D/g, '');
      if (value.length > 11) value = value.slice(0, 11);
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const method = editingUserId ? 'PUT' : 'POST';
    const url = editingUserId 
      ? `https://smartclass-backend-production.up.railway.app/api/users/${editingUserId}` 
      : `https://smartclass-backend-production.up.railway.app/api/users`;
    const payload = { ...formData };
    if (editingUserId && !payload.password) delete payload.password;
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        handleCancelEdit();
        fetchUsers();
        alert(`Usuário ${editingUserId ? 'atualizado' : 'cadastrado'} com sucesso!`);
      } else {
        const err = await response.json();
        alert(`Erro: ${err.error || 'Falha ao salvar usuário.'}`);
      }
    } catch (err) { console.error("Erro ao salvar:", err); }
  };

  const handleEditClick = (user) => {
    setEditingUserId(user.id);
    setFormData({ name: user.name, email: user.email, cpf: user.cpf || '', category: user.category, password: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setFormData({ name: '', email: '', cpf: '', category: '', password: '' });
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Atenção: Deseja realmente excluir este usuário do sistema?")) return;
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`https://smartclass-backend-production.up.railway.app/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setUsers(prev => prev.filter(u => u.id !== id));
      } else {
        const err = await response.json();
        alert(`Erro ao excluir: ${err.error}`);
      }
    } catch (err) { console.error(err); }
  };

  const filteredUsers = users.filter((user) => {
    const term = searchTerm.toLowerCase();
    return (
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      (user.cpf && user.cpf.includes(term))
    );
  });

  return (
    <PageLayout>
      <header className="mb-6 md:mb-10">
        <h1 className="text-2xl md:text-3xl font-bold text-senac-blue">Gerenciar Usuários</h1>
        <p className="text-senac-muted mt-2 font-medium text-sm md:text-base">
          Cadastre, edite e acompanhe os professores, gestores e funcionários da instituição.
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8 mb-8">

        {/* FORMULÁRIO */}
        <div className="xl:col-span-1">
          <section className={`bg-senac-card p-4 md:p-6 rounded-xl border shadow-sm xl:sticky xl:top-6 transition-all ${editingUserId ? 'border-senac-orange ring-1 ring-senac-orange/30 bg-orange-50/10' : 'border-gray-200'}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-senac-blue">
                {editingUserId ? '✏️ Editando Usuário' : 'Novo Cadastro'}
              </h2>
              {editingUserId && (
                <button type="button" onClick={handleCancelEdit} className="text-xs font-bold text-senac-muted hover:text-red-500">
                  Cancelar ✕
                </button>
              )}
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {[
                { label: 'Nome Completo', name: 'name', type: 'text', placeholder: 'Ex: Carlos Eduardo Silva' },
                { label: 'E-mail Institucional', name: 'email', type: 'email', placeholder: 'exemplo@edu.pe.senac.br' },
                { label: 'CPF', name: 'cpf', type: 'text', placeholder: '000.000.000-00' },
              ].map(field => (
                <div key={field.name} className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-senac-text uppercase tracking-wide">{field.label}</label>
                  <input
                    type={field.type} name={field.name} value={formData[field.name]} onChange={handleChange} required
                    className="p-3 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:border-senac-orange text-senac-text"
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-senac-text uppercase tracking-wide">Categoria</label>
                <select name="category" value={formData.category} onChange={handleChange} required
                  className="p-3 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:border-senac-orange text-senac-text">
                  <option value="" disabled>Selecione o perfil...</option>
                  <option value="Professor">Professor(a)</option>
                  <option value="Gestor">Equipe de Gestão</option>
                  <option value="Funcionario">Funcionário (Limpeza/TI)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-senac-text uppercase tracking-wide">
                  Senha de Acesso {editingUserId && <span className="text-gray-400 font-normal lowercase">(opcional na edição)</span>}
                </label>
                <input
                  type="password" name="password" value={formData.password} onChange={handleChange}
                  required={!editingUserId}
                  className="p-3 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:border-senac-orange text-senac-text"
                  placeholder={editingUserId ? "Deixe em branco para manter a atual" : "Defina uma senha"}
                />
              </div>
              <button type="submit"
                className={`mt-2 text-white px-6 py-3 rounded-lg font-bold text-sm shadow-md transition-colors ${editingUserId ? 'bg-green-600 hover:bg-green-700' : 'bg-senac-orange hover:bg-senac-orange-hover'}`}>
                {editingUserId ? 'Salvar Alterações' : 'Cadastrar Usuário'}
              </button>
            </form>
          </section>
        </div>

        {/* TABELA */}
        <div className="xl:col-span-2 flex flex-col gap-8">
          <section className="bg-senac-card p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-gray-100 pb-4 gap-4">
              <h2 className="text-lg font-bold text-senac-blue">Base de Usuários Ativos</h2>
              <div className="relative w-full sm:w-72">
                <input type="text" placeholder="Buscar por nome, email ou CPF..."
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2.5 pl-3 rounded-lg border border-gray-300 bg-senac-bg text-sm focus:outline-none focus:border-senac-blue text-senac-text transition-colors"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold">✕</button>
                )}
              </div>
            </div>

            {loading ? (
              <p className="text-senac-muted italic animate-pulse">Carregando base de usuários...</p>
            ) : users.length === 0 ? (
              <p className="text-senac-muted italic">Nenhum usuário cadastrado no momento.</p>
            ) : filteredUsers.length === 0 ? (
              <p className="text-senac-muted italic">Nenhum resultado encontrado para "{searchTerm}".</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs font-bold text-senac-muted uppercase tracking-wider">
                      <th className="pb-3">Dados do Usuário</th>
                      <th className="pb-3 text-center">Categoria</th>
                      <th className="pb-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm text-senac-text">
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4">
                          <div className="font-bold text-senac-blue">{user.name}</div>
                          <div className="text-xs text-senac-muted mt-0.5">{user.email}</div>
                          <div className="text-xs text-gray-400 mt-0.5 font-mono">{user.cpf}</div>
                        </td>
                        <td className="py-4 text-center">
                          <span className={`inline-block font-bold px-3 py-1 rounded-full text-xs ${
                            user.category === 'Gestor' ? 'bg-purple-50 text-purple-700' :
                            user.category === 'Professor' ? 'bg-blue-50 text-senac-blue' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {user.category}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleEditClick(user)}
                              className="text-senac-blue bg-blue-50 hover:bg-blue-100 p-2 rounded text-xs font-bold transition-colors" title="Editar Usuário">✏️</button>
                            <button onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 bg-red-50 hover:bg-red-100 p-2 rounded text-xs font-bold transition-colors" title="Excluir Usuário">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </PageLayout>
  );
};

export default Users;
