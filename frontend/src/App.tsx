import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import PredictiveAnalytics from './pages/PredictiveAnalytics';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Finance from './pages/Finance';
import Study from './pages/Study';
import Habits from './pages/Habits';
import ChatAssistant from './components/ChatAssistant';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Secure Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/predictive-analytics" element={<PredictiveAnalytics />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/study" element={<Study />} />
            <Route path="/habits" element={<Habits />} />
          </Route>

          {/* Fallback to Dashboard */}
          <Route path="*" element={<Dashboard />} />
        </Routes>
        <ChatAssistant />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
