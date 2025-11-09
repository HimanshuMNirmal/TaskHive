import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RegisterForm } from '../components/forms/RegisterForm';
import styles from './Pages.module.css';

const RegisterPage = () => {
    const { token } = useSelector(s => s.auth);
    if (token) return <Navigate to="/" replace />;
    return (
        <div className={styles.page}>
            <RegisterForm />
        </div>
    );
}

export default RegisterPage;
