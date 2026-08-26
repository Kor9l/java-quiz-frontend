import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./AuthContext";
import AuthPage from "./pages/AuthPage";
import MenuPage from "./pages/MenuPage";
import QuizPage from "./pages/QuizPage";
import MaterialsPage from "./pages/MaterialsPage";
import SettingsPage from "./pages/SettingsPage";
import StatsPage from "./pages/StatsPage";
import AdminPage from "./pages/AdminPage";

function Guard({ children, admin }) {
  const { user, ready } = useAuth();
  if (!ready) {
    return <div className="page muted">…</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (admin && user.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  const { user, ready } = useAuth();
  if (!ready) {
    return <div className="page muted">…</div>;
  }
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
      <Route path="/" element={<Guard><MenuPage /></Guard>} />
      <Route path="/quiz" element={<Guard><QuizPage /></Guard>} />
      <Route path="/materials" element={<Guard><MaterialsPage /></Guard>} />
      <Route path="/materials/:topicId/:sectionId" element={<Guard><MaterialsPage /></Guard>} />
      <Route path="/settings" element={<Guard><SettingsPage /></Guard>} />
      <Route path="/stats" element={<Guard><StatsPage /></Guard>} />
      <Route path="/admin" element={<Guard admin><AdminPage /></Guard>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
