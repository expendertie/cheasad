
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForumPage from './pages/ForumPage';
import ProfilePage from './pages/ProfilePage';
import AccountDetailsPage from './pages/AccountDetailsPage';
import PasswordSecurityPage from './pages/PasswordSecurityPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminPage from './pages/AdminPage';
import BannedPage from './pages/BannedPage';
import Layout from './components/Layout';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            
            <Route path="/banned" element={<BannedPage />} />
            
            <Route path="/forum" element={
              <ProtectedRoute>
                <ForumPage />
              </ProtectedRoute>
            } />
            <Route path="/members/:memberId" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/account/details" element={
              <ProtectedRoute>
                <AccountDetailsPage />
              </ProtectedRoute>
            } />
            <Route path="/account/security" element={
              <ProtectedRoute>
                <PasswordSecurityPage />
              </ProtectedRoute>
            } />
            
            <Route path="/admin" element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            } />

            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;