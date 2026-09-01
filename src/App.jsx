import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./AuthContext";
import AuthPage from "./pages/AuthPage";
import OAuthCallbackPage from "./pages/OAuthCallbackPage";
import ModulesPage from "./pages/ModulesPage";
import MenuPage from "./pages/MenuPage";
import QuizPage from "./pages/QuizPage";
import MaterialsPage from "./pages/MaterialsPage";
import PracticePage from "./pages/PracticePage";
import PracticeTrackPage from "./pages/PracticeTrackPage";
import PracticeTaskListPage from "./pages/PracticeTaskListPage";
import PracticeTaskPage from "./pages/PracticeTaskPage";
import SettingsPage from "./pages/SettingsPage";
import StatsPage from "./pages/StatsPage";
import AdminPage from "./pages/AdminPage";
import EnglishPage from "./pages/EnglishPage";
import WordsPage from "./pages/WordsPage";
import WordGroupsPage from "./pages/WordGroupsPage";
import WordGroupPage from "./pages/WordGroupPage";
import WordAddPage from "./pages/WordAddPage";

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
      <Route path="/auth/callback" element={<OAuthCallbackPage />} />
      {/* "/" is now the choice between the two modules; the backend menu moved a level down. */}
      <Route path="/" element={<Guard><ModulesPage /></Guard>} />
      <Route path="/backend" element={<Guard><MenuPage /></Guard>} />
      <Route path="/quiz" element={<Guard><QuizPage /></Guard>} />
      <Route path="/materials" element={<Guard><MaterialsPage /></Guard>} />
      <Route path="/materials/:topicId/:sectionId" element={<Guard><MaterialsPage /></Guard>} />
      <Route path="/practice" element={<Guard><PracticePage /></Guard>} />
      <Route path="/practice/:track" element={<Guard><PracticeTrackPage /></Guard>} />
      <Route path="/practice/:track/:difficulty" element={<Guard><PracticeTaskListPage /></Guard>} />
      <Route path="/practice/:track/:difficulty/:taskId" element={<Guard><PracticeTaskPage /></Guard>} />
      <Route path="/settings" element={<Guard><SettingsPage /></Guard>} />
      <Route path="/stats" element={<Guard><StatsPage /></Guard>} />
      <Route path="/admin" element={<Guard admin><AdminPage /></Guard>} />
      <Route path="/english" element={<Guard><EnglishPage /></Guard>} />
      <Route path="/english/words" element={<Guard><WordsPage /></Guard>} />
      <Route path="/english/groups" element={<Guard><WordGroupsPage /></Guard>} />
      <Route path="/english/groups/:groupId" element={<Guard><WordGroupPage /></Guard>} />
      <Route path="/english/add" element={<Guard><WordAddPage /></Guard>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
