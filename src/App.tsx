
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute';

// Pages are code-split (see routes/lazyPages.ts)
import {
  BookshelfPage,
  ComicDetailPage,
  AddComicPage,
  ShelfDetailPage,
  SearchPage,
  StatsPage,
  NotificationsPage,
  AccountPage,
} from './routes/lazyPages';

// Auth pages
import { LoginPage } from './pages/auth/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            {/* plain wrappers; the login arrival animates them (features/login/arrivalReveal.ts) */}
            <div data-reveal="outer">
            <div data-reveal="inner">
            <Routes>
              {/* Auth routes (no app layout) */}
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <LoginPage />
                  </PublicOnlyRoute>
                }
              />

              {/* Main App Routes: login required (shared responsive layout) */}
              <Route element={<ProtectedRoute />}>
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
                    <AppLayout title="Tìm Kiếm" subtitle="Kính Lúp Hoa Cỏ">
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
                    <AppLayout title="Tài Khoản" subtitle="Cài Đặt">
                      <AccountPage />
                    </AppLayout>
                  }
                />

                {/* Unknown URL (after login, so a shared link still lands here) */}
                <Route
                  path="*"
                  element={
                    <AppLayout title="Lạc Lối" subtitle="Không Tìm Thấy">
                      <NotFoundPage />
                    </AppLayout>
                  }
                />
              </Route>
            </Routes>
            </div>
            </div>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
