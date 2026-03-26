import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { JobsPage } from '@/pages/JobsPage';
import { JobDetailPage } from '@/pages/JobDetailPage';
import { ResumePage } from '@/pages/ResumePage';
import { AnalysisPage } from '@/pages/AnalysisPage';
import { AnalysisResultPage } from '@/pages/AnalysisResultPage';
import { InterviewSetupPage } from '@/pages/InterviewSetupPage';
import { InterviewPage } from '@/pages/InterviewPage';
import { InterviewResultPage } from '@/pages/InterviewResultPage';
import { ParaphraserPage } from '@/pages/ParaphraserPage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/jobs/:id" element={<JobDetailPage />} />
        <Route path="/resume" element={<ResumePage />} />
        <Route path="/analyze" element={<AnalysisPage />} />
        <Route path="/analysis/:id" element={<AnalysisResultPage />} />
        <Route path="/interview" element={<InterviewSetupPage />} />
        <Route path="/interview/:id" element={<InterviewPage />} />
        <Route path="/interview/:id/result" element={<InterviewResultPage />} />
        <Route path="/paraphraser" element={<ParaphraserPage />} />
      </Route>
    </Routes>
  );
}
