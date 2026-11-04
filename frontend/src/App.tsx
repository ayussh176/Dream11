import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TacticalProvider } from './context/TacticalContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { TacticalRadarPage } from './pages/TacticalRadarPage';
import { ExplainerPage } from './pages/ExplainerPage';
import { ShadowCaptainPage } from './pages/ShadowCaptainPage';
import { LiveArenaPage } from './pages/LiveArenaPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <TacticalProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="live" element={<LiveArenaPage />} />
              <Route path="radar" element={<TacticalRadarPage />} />
              <Route path="explainer" element={<ExplainerPage />} />
              <Route path="simulator" element={<ShadowCaptainPage />} />
              <Route path="shadow-captain" element={<Navigate to="/simulator" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TacticalProvider>
    </ToastProvider>
  );
};

export default App;

