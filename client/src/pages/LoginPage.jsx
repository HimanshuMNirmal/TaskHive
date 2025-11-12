import { Navigate } from 'react-router-dom';
import LoginForm from '../components/forms/LoginForm';
import { useSelector } from 'react-redux';
import { useTheme } from '../hooks/useTheme';
import styles from './Pages.module.css';

export default function LoginPage() {
  const { theme } = useTheme();
  const { token } = useSelector(s => s.auth);
  if (token) return <Navigate to="/" replace />;

  return (
    <div className={styles.page}>
      <LoginForm />
    </div>
  );
}
