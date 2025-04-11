import React from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import styles from './App.module.css';
import HomePage from './components/HomePage';
import ThemeToggleButton from './components/theme/ThemeToggleButton';
import AuthForm from './components/Auth/AuthForm';

function App() {
    return (
        <Router>
            <AuthProvider>
                <div className={styles.page}>
                    <ThemeToggleButton />
                    <AuthForm />
                    <HomePage />
                </div>
            </AuthProvider>
        </Router>
    );
}

export default App;