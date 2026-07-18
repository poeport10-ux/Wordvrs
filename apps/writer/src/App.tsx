import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { BooksPage } from "./pages/BooksPage";
import { BookDetailPage } from "./pages/BookDetailPage";
import { ChaptersPage } from "./pages/ChaptersPage";
import { ChapterEditorPage } from "./pages/ChapterEditorPage";
import { BookCraftPage } from "./pages/BookCraftPage";
import { FollowersPage } from "./pages/FollowersPage";
import { SubscribersPage } from "./pages/SubscribersPage";
import { RevenuePage } from "./pages/RevenuePage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { PublishingPage } from "./pages/PublishingPage";
import { MarketingPage } from "./pages/MarketingPage";
import { MessagesPage } from "./pages/MessagesPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { SettingsPage } from "./pages/SettingsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/books" element={<BooksPage />} />
        <Route path="/books/:bookId" element={<BookDetailPage />} />
        <Route path="/books/:bookId/chapters" element={<ChaptersPage />} />
        <Route path="/books/:bookId/chapters/:chapterId" element={<ChapterEditorPage />} />
        <Route path="/books/:bookId/craft" element={<BookCraftPage />} />
        <Route path="/followers" element={<FollowersPage />} />
        <Route path="/subscribers" element={<SubscribersPage />} />
        <Route path="/revenue" element={<RevenuePage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/publishing" element={<PublishingPage />} />
        <Route path="/marketing" element={<MarketingPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
