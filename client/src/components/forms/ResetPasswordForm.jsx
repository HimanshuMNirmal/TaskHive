import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import styles from './Forms.module.css';

const ResetPasswordForm = ({ token }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await authApi.resetPassword(token, formData.password);
      navigate('/login', { 
        state: { message: 'Password reset successful. Please login with your new password.' }
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2 className={styles.title}>Reset Your Password</h2>
      
      {error && <div className={styles.error}>{error}</div>}
      
      <div className={styles.formGroup}>
        <label htmlFor="password">New Password</label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          minLength={6}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          minLength={6}
        />
      </div>

      <button type="submit" className={styles.submitButton}>
        Reset Password
      </button>

      <div className={styles.links}>
        <Link to="/login">Return to Login</Link>
      </div>
    </form>
  );
};

export default ResetPasswordForm;