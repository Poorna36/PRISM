import { useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';
import AuthPage from './pages/AuthPage';
import MainPage from './pages/MainPage';
import LandingPage from './pages/LandingPage';

export default function App() {
  const { isAuthenticated, isCheckingSession, checkSession } = useAuthStore();
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (showLanding) {
    return <LandingPage onEnter={() => setShowLanding(false)} />;
  }

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-600 border-t-sky-400" />
      </div>
    );
  }

  if (!isAuthenticated) return <AuthPage />;
  return <MainPage />;
}
