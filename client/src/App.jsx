import { useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';
import AuthPage from './pages/AuthPage';
import MainPage from './pages/MainPage';
import LandingPage from './pages/LandingPage';

export default function App() {
  const { isAuthenticated, isCheckingSession, checkSession, logout } = useAuthStore();
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-base">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-accent-cyan" />
      </div>
    );
  }

  return (
    <>
      {!isAuthenticated ? <AuthPage /> : <MainPage />}
      
      {showLanding && (
        <LandingPage 
          onGetStarted={() => {
            logout();
          }}
          onEnter={() => {
            setShowLanding(false);
          }} 
        />
      )}
    </>
  );
}
