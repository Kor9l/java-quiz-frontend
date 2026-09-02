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
import EnglishSectionsPage from "./pages/EnglishSectionsPage";
import GrammarPage from "./pages/GrammarPage";
import WordsPage from "./pages/WordsPage";
import WordGroupsPage from "./pages/WordGroupsPage";
import WordGroupPage from "./pages/WordGroupPage";
import WordAddPage from "./pages/WordAddPage";
import QuizSetupPage from "./pages/QuizSetupPage";
import EnglishQuizSetupPage from "./pages/EnglishQuizSetupPage";
import EnglishQuizPage from "./pages/EnglishQuizPage";
import EnglishStatsPage from "./pages/EnglishStatsPage";

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
      {/* Topics, count and behaviour are chosen here, between pressing start and the
          first question, and the round that follows remembers them. */}
      <Route path="/quiz/setup" element={<Guard><QuizSetupPage /></Guard>} />
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
      {/* "/english" is now the choice between words and grammar; the words menu moved a
          level down, the way the backend menu did when modules arrived. */}
      <Route path="/english" element={<Guard><EnglishSectionsPage /></Guard>} />
      <Route path="/english/vocabulary" element={<Guard><EnglishPage /></Guard>} />
      {/* Grammar is topics of the same shape as the backend's, so it reuses those pages with
          the module passed in rather than growing copies of them. */}
      <Route path="/english/grammar" element={<Guard><GrammarPage /></Guard>} />
      <Route path="/english/grammar/materials" element={<Guard><MaterialsPage module="english" /></Guard>} />
      <Route path="/english/grammar/materials/:topicId/:sectionId" element={<Guard><MaterialsPage module="english" /></Guard>} />
      <Route path="/english/grammar/quiz/setup" element={<Guard><QuizSetupPage module="english" /></Guard>} />
      <Route path="/english/words" element={<Guard><WordsPage /></Guard>} />
      <Route path="/english/groups" element={<Guard><WordGroupsPage /></Guard>} />
      <Route path="/english/groups/:groupId" element={<Guard><WordGroupPage /></Guard>} />
      <Route path="/english/add" element={<Guard><WordAddPage /></Guard>} />
      <Route path="/english/quiz/setup" element={<Guard><EnglishQuizSetupPage /></Guard>} />
      <Route path="/english/quiz" element={<Guard><EnglishQuizPage /></Guard>} />
      <Route path="/english/stats" element={<Guard><EnglishStatsPage /></Guard>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
