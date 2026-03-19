import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Layout } from './components/Layout';
import { AdminLayout } from './components/AdminLayout';
import { AdminRoute } from './components/AdminRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Feed } from './pages/Feed';
import { Profile } from './pages/Profile';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminPosts } from './pages/admin/AdminPosts';
import { AdminReports } from './pages/admin/AdminReports';
import { Settings } from './pages/Settings';
import Reels from './pages/Reels';

function LoadingSpinner() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#C53030' }} />
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  return isAuthenticated ? <Navigate to="/" /> : children;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastContainer position="top-right" />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Feed />} />
              <Route path="profile" element={<Profile />} />
              <Route path="profile/:userId" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index element={<Navigate to="/admin/reports" replace />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="posts" element={<AdminPosts />} />
              <Route path="reports" element={<AdminReports />} />
            </Route>

            <Route path="/reels" element={<ProtectedRoute><Reels /></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
