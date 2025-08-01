import React, { useState } from 'react';
import LoginPage from './components/LoginPage';
import DashboardPage from './components/DashboardPage';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(true);

  const handleLoginSuccess = () => {
    setIsVisible(false);
    setTimeout(() => {
      setIsLoggedIn(true);
      setIsVisible(true);
    }, 500);
  };

  const handleLogout = () => {
    setIsVisible(false);
    setTimeout(() => {
      setIsLoggedIn(false);
      setIsVisible(true);
    }, 500);
  };

  return (
    <div className={`min-h-screen antialiased transition-opacity duration-500 ease-in-out ${!isVisible ? 'opacity-0' : 'opacity-100'}`}>
      {isLoggedIn ? <DashboardPage onLogout={handleLogout} /> : <LoginPage onLoginSuccess={handleLoginSuccess} />}
    </div>
  );
};

export default App;