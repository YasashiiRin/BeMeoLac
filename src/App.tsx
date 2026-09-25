import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { BookshelfPage } from './pages/BookshelfPage';
import { ComicDetailPage } from './pages/ComicDetailPage';
import { AddComicPage } from './pages/AddComicPage';
import { ShelfDetailPage } from './pages/ShelfDetailPage';
import { SearchPage } from './pages/SearchPage';
import { StatsPage } from './pages/StatsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AccountPage } from './pages/AccountPage';

// Auth pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <Routes>
              {/* Auth routes (no app layout) */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Main App Routes (shared responsive layout) */}
              <Route
                path="/"
                element={
                  <AppLayout title="Tủ Truyện Nhỏ" subtitle="Tủ Sách">
                    <BookshelfPage />
                  </AppLayout>
                }
              />

              <Route
                path="/comics/:id"
                element={
                  <AppLayout title="Chi Tiết Truyện" subtitle="Nhà Kính">
                    <ComicDetailPage />
                  </AppLayout>
                }
              />

              <Route
                path="/add"
                element={
                  <AppLayout title="Thêm Truyện" subtitle="Tủ Sách">
                    <AddComicPage />
                  </AppLayout>
                }
              />

              <Route
                path="/shelves/:id"
                element={
                  <AppLayout title="Kệ Sách" subtitle="Góc Riêng">
                    <ShelfDetailPage />
                  </AppLayout>
                }
              />

              <Route
                path="/search"
                element={
                  <AppLayout title="Tìm Kiếm" subtitle="Khám Phá">
                    <SearchPage />
                  </AppLayout>
                }
              />

              <Route
                path="/stats"
                element={
                  <AppLayout title="Thống Kê" subtitle="Nhật Ký Đọc">
                    <StatsPage />
                  </AppLayout>
                }
              />

              <Route
                path="/notifications"
                element={
                  <AppLayout title="Thông Báo" subtitle="Tin Mới">
                    <NotificationsPage />
                  </AppLayout>
                }
              />

              <Route
                path="/account/*"
                element={
                  <ProtectedRoute>
                    <AppLayout title="Tài Khoản" subtitle="Cài Đặt">
                      <AccountPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
