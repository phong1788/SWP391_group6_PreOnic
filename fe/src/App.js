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
import Navbar from './Component/Navbar/Navbar';
import Hero from './Component/Hero/Hero';
import Campaigns from './Component/Campaigns/Campaigns';
import AgricultureBanner from './Component/AgricultureBanner/AgricultureBanner';
import Footer from './Component/Footer/Footer';
import Solutions from './Component/Solutions/Solutions';
import Contact from './Component/Contact/Contact';
import InfoPage from './Component/InfoPage/InfoPage';
import './index.css';
import './App.css';

function HomePage() {
  return <><Navbar /><Hero /><div className="home-mid"><Campaigns /></div><AgricultureBanner /><Footer /></>;
}

function ProductsPage() {
  return <><Navbar /><main style={{ paddingTop: 110, minHeight: '65vh' }}><Campaigns isCatalog /></main><Footer /></>;
}

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
      <Route path="/" element={<HomePage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/solutions" element={<Solutions />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/info/:slug" element={<InfoPage />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/farmer" element={<ProtectedRoute allowedRoles={['farmer']}><HomePage /></ProtectedRoute>} />
      <Route path="/farmer-home" element={<ProtectedRoute allowedRoles={['farmer']}><HomePage /></ProtectedRoute>} />
      <Route path="/enterprise" element={<ProtectedRoute allowedRoles={['enterprise']}><HomePage /></ProtectedRoute>} />
      <Route path="/enterprise-home" element={<ProtectedRoute allowedRoles={['enterprise']}><HomePage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><HomePage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Account /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  </BrowserRouter></ToastProvider></AuthProvider>;
}
