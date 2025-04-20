import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import SearchPage from "./pages/SearchPage";
import DocumentDetailPage from "./pages/DocumentDetailPage";
import UploadPage from "./pages/UploadPage";
import ForumPage from "./pages/ForumPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import AdminDashboard from "./pages/AdminDashboard";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/documents/:id" element={<DocumentDetailPage />} />
      <Route path="/upload" element={<UploadPage />} />
      <Route path="/forum" element={<ForumPage />} />
      <Route path="/forum/:postId" element={<ForumPage />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/login" element={<HomePage />} />
    </Routes>
  );
};

export default App;