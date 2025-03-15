import React from 'react';
import styles from './App.module.css'; 
import HomePage from './components/HomePage'; // Добавляем HomePage

function App() {
  return (
    <div className={styles.page}>
      <HomePage />  {/* Рендерим HomePage, где будут уже маршруты */}
    </div>
  );
}

export default App;
