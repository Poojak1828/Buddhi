import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.js';
import { DashboardLayout } from './layouts/DashboardLayout.js';

// Pages
import { LandingPage } from './pages/LandingPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { SignupPage } from './pages/SignupPage.js';
import { OnboardingPage } from './pages/OnboardingPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { SubjectsPage } from './pages/SubjectsPage.js';
import { StudyPlannerPage } from './pages/StudyPlannerPage.js';
import { AIAssistantPage } from './pages/AIAssistantPage.js';
import { NotesPage } from './pages/NotesPage.js';
import { FlashcardsPage } from './pages/FlashcardsPage.js';
import { QuizzesPage } from './pages/QuizzesPage.js';
import { FocusTimerPage } from './pages/FocusTimerPage.js';
import { AnalyticsPage } from './pages/AnalyticsPage.js';
import { SwitchHubPage } from './pages/SwitchHubPage.js';
import { SettingsPage } from './pages/SettingsPage.js';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080C14] text-slate-400 flex items-center justify-center text-xs">
        Loading Buddhi Study Companion...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Auth Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected Onboarding Route */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Dashboard Layout and Subpages */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="subjects" element={<SubjectsPage />} />
            <Route path="planner" element={<StudyPlannerPage />} />
            <Route path="assistant" element={<AIAssistantPage />} />
            <Route path="notes" element={<NotesPage />} />
            <Route path="flashcards" element={<FlashcardsPage />} />
            <Route path="quizzes" element={<QuizzesPage />} />
            <Route path="timer" element={<FocusTimerPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="switch-hub" element={<SwitchHubPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
