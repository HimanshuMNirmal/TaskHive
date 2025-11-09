import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ForgotPasswordForm } from '../components/forms/ForgotPasswordForm';
import styles from './Pages.module.css';

export default function ForgotPasswordPage() {
  const { token } = useSelector(s => s.auth);
  if (token) return <Navigate to="/" replace />;

  return (
    <div className={styles.page}>
      <ForgotPasswordForm />
    </div>
  );
}
