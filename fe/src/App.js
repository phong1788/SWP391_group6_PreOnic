import { BrowserRouter, Navigate, Route, Routes, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ToastContainer from './Component/Toast/Toast';
import ProtectedRoute from './Component/ProtectedRoute/ProtectedRoute';
import Auth from './Component/Auth/Auth';
import Register from './Component/Register/Register';
import ResetPassword from './Component/ResetPassword/ResetPassword';
import VerifyEmail from './Component/VerifyEmail/VerifyEmail';
import BrandLogo from './Component/BrandLogo/BrandLogo';
import './index.css';
import './App.css';

function Account() {
  const { user, logout } = useAuth();
  return <main className="auth-v3-page" style={{ display: 'grid', placeItems: 'center', padding: 24 }}>
    <section className="auth-v3-card">
      <BrandLogo size="lg" />
      <h1 style={{ marginTop: 24 }}>Đăng nhập thành công</h1>
      <p>Xin chào, {user.fullName}!</p>
      <p>{user.email}</p>
      <p>Vai trò: {({ farmer: 'Nông dân', enterprise: 'Doanh nghiệp', admin: 'Quản trị viên' })[user.role]}</p>
      <button className="auth-v3-btn-primary" onClick={() => logout().catch(() => {})}>Đăng xuất</button>
      <Link to="/register">Tạo tài khoản khác</Link>
    </section>
  </main>;
}

export default function App() {
  return <AuthProvider><ToastProvider><BrowserRouter>
    <ToastContainer />
    <Routes>
      <Route path="/" element={<Navigate to="/auth" replace />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      {['/farmer', '/enterprise', '/admin', '/profile'].map(path => <Route key={path} path={path} element={<ProtectedRoute><Account /></ProtectedRoute>} />)}
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  </BrowserRouter></ToastProvider></AuthProvider>;
}
