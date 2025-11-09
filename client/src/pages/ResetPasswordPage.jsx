import React from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ResetPasswordForm from '../components/forms/ResetPasswordForm';
import styles from './Pages.module.css';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const authToken = useSelector(s => s.auth.token);

  if (!token) {
    return (
      <div className={styles.page}>
        <div className={styles.message}>Invalid reset link</div>
      </div>
    );
  }
  
  if (authToken) return <Navigate to="/" replace />;

  return (
    <div className={styles.page}>
      <ResetPasswordForm token={token} />
    </div>
  );
}
