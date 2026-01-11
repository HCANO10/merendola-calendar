
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { StoreProvider, useStore } from './store';
import SignIn from './screens/SignIn';
import TeamSetup from './screens/TeamSetup';
import Profile from './screens/Profile';
import Dashboard from './screens/Dashboard';

const AppRoutes: React.FC = () => {
  const { state, authLoading, loadError, fetchUserData, session } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 0. Robust Recovery Detection
    const hasRecoveryHash = window.location.hash.includes('type=recovery') ||
      window.location.hash.includes('access_token=');

    if (hasRecoveryHash && !location.pathname.includes('reset-password')) {
      const currentHash = window.location.hash;
      console.log('Recovery hash detected, redirecting to /reset-password');
      window.location.hash = `#/reset-password${currentHash.startsWith('#') ? currentHash.substring(1) : currentHash}`;
      return;
    }

    // Auth and Data Rules Navigation
    if (authLoading) return; // Wait for loading to finish

    if (!state.user) {
      if (!['/', '/reset-password'].includes(location.pathname)) {
        navigate('/', { replace: true });
      }
      return;
    }

    // Step-by-step redirection logic
    // 1. Profile completeness check
    const isProfileIncomplete = !state.user.birthday || !state.user.notificationEmail || !state.user.name;
    if (isProfileIncomplete) {
      if (location.pathname !== '/profile') {
        console.log('Incomplete profile detected, redirecting to /profile');
        navigate('/profile', { replace: true });
      }
      return;
    }

    // 2. Team membership check
    const hasNoTeam = !state.team && !state.user.activeTeamId;
    if (hasNoTeam) {
      if (location.pathname !== '/team-setup') {
        console.log('No team detected, redirecting to /team-setup');
        navigate('/team-setup', { replace: true });
      }
      return;
    }

    // 3. Success state
    if (['/', '/reset-password', '/team-setup'].includes(location.pathname)) {
      navigate('/dashboard', { replace: true });
    }
  }, [state.user, state.team, authLoading, location.pathname, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background-light dark:bg-background-dark p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="text-[#60798a] font-medium animate-pulse">Cargando tus datos...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background-light dark:bg-background-dark p-6 text-center">
        <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-5xl">cloud_off</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">Problemas al cargar tus datos</h2>
        <p className="text-[#60798a] dark:text-[#a0b3c1] mb-8 max-w-sm">
          Estamos teniendo problemas para conectar con el servidor. Por favor, reintenta la carga.
        </p>
        <button
          onClick={() => session?.user && fetchUserData(session.user.id)}
          className="px-8 h-14 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined">refresh</span>
          Reintentar ahora
        </button>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<SignIn />} />
      <Route path="/team-setup" element={<TeamSetup />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/reset-password" element={<SignIn />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

import ErrorBoundary from './ErrorBoundary';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </StoreProvider>
    </ErrorBoundary>
  );
};

export default App;
