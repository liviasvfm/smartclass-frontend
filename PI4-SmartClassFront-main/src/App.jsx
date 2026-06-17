import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Users from './pages/Users/Users';
import Rooms from './pages/Rooms/Rooms';
import Reports from './pages/Reports/Reports';
import Scheduling from './pages/Scheduling/Scheduling';

function App() {
  return (
    <Router>
      <Routes>
        {/* Rota Inicial: Login */}
        <Route path="/login" element={<Login />} />
        
        {/* Rotas do Painel Administrativo  */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/scheduling" element={<Scheduling />} />
        <Route path="/reports" element={<Reports />} />

        {/* Redirecionamento padrão para rotas inexistentes */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;