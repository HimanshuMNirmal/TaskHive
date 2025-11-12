import { loginUser } from '../../features/auth/authThunks';
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Forms.module.css';

const LoginForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector(s => s.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    const resultAction = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(resultAction)) {
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 100);
    }
  };

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <h2 className={styles.title}>Login to TaskHive</h2>
      
      {error && <div className={styles.error}>{error.message || JSON.stringify(error)}</div>}
      
      <div className={styles.formGroup}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
      </div>

      <button
        type="submit"
        className={styles.submitButton}
        disabled={status === 'loading'}
      >
        {status === 'loading' ? 'Logging in...' : 'Login'}
      </button>

      <div className={styles.links}>
        <Link to="/forgot-password">Forgot Password?</Link>
        <Link to="/register">Don't have an account? Sign up</Link>
      </div>
    </form>
  );
};

export default LoginForm;