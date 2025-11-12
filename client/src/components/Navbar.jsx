import { Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useTheme } from '../hooks/useTheme'
import { logout } from '../features/auth/authSlice'
import styles from './Navbar.module.css'

export function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const dispatch = useDispatch()
  const { token, user } = useSelector((state) => state.auth)
  const handleLogout = () => {
    dispatch(logout())
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <Link to="/">TaskHive</Link>
      </div>

      <div className={styles.navLinks}>
        {token ? (
          <>
            <Link to="/dashboard" className={styles.navLink}>Dashboard</Link>
            <Link to="/tasks" className={styles.navLink}>Tasks</Link>
            <Link to="/teams" className={styles.navLink}>Teams</Link>
            {user?.role === 'admin' && (
              <Link to="/admin" className={styles.navLink}>Admin</Link>
            )}
            <button onClick={handleLogout} className={styles.navButton}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className={styles.navLink}>Login</Link>
            <Link to="/register" className={styles.navLink}>Register</Link>
          </>
        )}
        
        <button 
          onClick={toggleTheme} 
          className={styles.themeToggle}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
    </nav>
  )
}