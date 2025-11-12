import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser } from '../../features/auth/authThunks'
import styles from './Forms.module.css'

export function RegisterForm() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    organizationName: '',
    organizationSlug: ''
  })
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      await dispatch(registerUser(formData)).unwrap()
      navigate('/login')
    } catch (err) {
      setError(err.message || 'Failed to register')
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2 className={styles.title}>Create Account</h2>
      
      {error && <div className={styles.error}>{error}</div>}
      
      <div className={styles.formGroup}>
        <label htmlFor="name">Full Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="password">Password</label>
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
        <label htmlFor="organizationName">Organization Name</label>
        <input
          type="text"
          id="organizationName"
          name="organizationName"
          value={formData.organizationName}
          onChange={handleChange}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="organizationSlug">Organization URL Identifier</label>
        <input
          type="text"
          id="organizationSlug"
          name="organizationSlug"
          value={formData.organizationSlug}
          pattern="[a-z0-9-]+"
          title="Only lowercase letters, numbers, and hyphens are allowed"
          placeholder="e.g., my-company"
          onChange={(e) => {
            const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
            setFormData(prev => ({
              ...prev,
              organizationSlug: value
            }));
          }}
          required
        />
        <small className={styles.hint}>This will be used in your organization's URL: taskhive.com/{formData.organizationSlug || 'my-company'}</small>
      </div>

      <button type="submit" className={styles.submitButton}>
        Create Organization
      </button>

      <div className={styles.links}>
        <Link to="/login">Already have an account? Login</Link>
      </div>
    </form>
  )
}