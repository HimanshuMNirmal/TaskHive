// src/routes/AppRoutes.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import ProtectedRoute from '../components/ProtectedRoute';
import { Navbar } from '../components/Navbar';
import RegisterPage from '../pages/RegisterPage';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<ProtectedRoute><div>App home</div></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><div>Dashboard</div></ProtectedRoute>} />
            <Route path="/tasks" element={<ProtectedRoute><div>Tasks</div></ProtectedRoute>} />
            <Route path="/teams" element={<ProtectedRoute><div>Teams</div></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><div>Admin Panel</div></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
