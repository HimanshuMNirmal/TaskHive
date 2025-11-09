import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../../api/auth.api'
import styles from './Forms.module.css'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      await authApi.forgotPassword(email)
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email')
    }
  }

  if (success) {
    return (
      <div className={styles.form}>
        <h2 className={styles.title}>Check Your Email</h2>
        <p className={styles.message}>
          If an account exists with {email}, you will receive a password reset link.
        </p>
        <div className={styles.links}>
          <Link to="/login">Return to Login</Link>
        </div>
      </div>
    )
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2 className={styles.title}>Reset Password</h2>
      
      {error && <div className={styles.error}>{error}</div>}
      
      <div className={styles.formGroup}>
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <button type="submit" className={styles.submitButton}>
        Send Reset Link
      </button>

      <div className={styles.links}>
        <Link to="/login">Remember your password? Login</Link>
      </div>
    </form>
  )
}