import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { HomePage } from "./pages/HomePage";
import { DiscoverPage } from "./pages/DiscoverPage";
import { BookDetailPage } from "./pages/BookDetailPage";
import { ReadPage } from "./pages/ReadPage";
import { LibraryPage } from "./pages/LibraryPage";
import { FollowingPage } from "./pages/FollowingPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { AuthorProfilePage } from "./pages/AuthorProfilePage";
import { SettingsPage } from "./pages/SettingsPage";
import { AudiobooksPage } from "./pages/AudiobooksPage";

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
        <Route path="/home" element={<HomePage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/audiobooks" element={<AudiobooksPage />} />
        <Route path="/following" element={<FollowingPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/book/:slug" element={<BookDetailPage />} />
        <Route path="/read/:bookId/:chapterId" element={<ReadPage />} />
        <Route path="/author/:username" element={<AuthorProfilePage />} />
        <Route path="/profile" element={<AuthorProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
