import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import DigitalTwin from './pages/DigitalTwin';
import Finance from './pages/Finance';
import Study from './pages/Study';
import Habits from './pages/Habits';
import Goals from './pages/Goals';
import Simulations from './pages/Simulations';
import SimulationDetail from './pages/SimulationDetail';
import AIAssistant from './pages/AIAssistant';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import PredictiveAnalytics from './pages/PredictiveAnalytics';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Secure Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/digital-twin" element={<DigitalTwin />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/study" element={<Study />} />
            <Route path="/habits" element={<Habits />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/simulations" element={<Simulations />} />
            <Route path="/simulations/:id" element={<SimulationDetail />} />
            <Route path="/ai-assistant" element={<AIAssistant />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/predictive-analytics" element={<PredictiveAnalytics />} />
          </Route>

          {/* Fallback to Dashboard */}
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
