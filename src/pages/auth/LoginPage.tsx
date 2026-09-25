import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/Button';
import { useToast } from '../../context/ToastContext';
import { Flower2, Sparkles, Lock, Mail } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('tiennu@tutruyennho.vn');
  const [password, setPassword] = useState('********');
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login('active-mock-session-token');
      showToast('Chào mừng công chúa trở về Tủ Truyện Nhỏ! 🌸', 'success');
      navigate(from, { replace: true });
    } catch (err) {
      showToast('Đăng nhập thất bại', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-raised border-1.5 border-border-strong rounded-3xl p-6 sm:p-8 shadow-botanical-lg flex flex-col gap-6">
        {/* Brand */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-soft to-primary-soft p-0.5 shadow-botanical-sm mb-3">
            <div className="w-full h-full bg-surface-raised rounded-[14px] flex items-center justify-center text-text">
              <Flower2 className="w-8 h-8 text-leaf-ink" />
            </div>
          </div>
          <h1 className="font-serif text-2xl font-bold text-text flex items-center gap-1.5">
            <span>Tủ Truyện Nhỏ</span>
            <span className="text-sm text-accent-ink">✿</span>
          </h1>
          <p className="text-xs text-text-muted mt-1 italic">
            Mở cánh cửa gỗ bước vào thư viện hoa cỏ ấm áp
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Thư điện tử (Email)
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="congchua@tutruyennho.vn"
                className="w-full pl-9 pr-3.5 py-2.5 bg-surface rounded-xl border border-border text-sm text-text focus:border-leaf focus:outline-none"
              />
              <Mail className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-text">
                Mật khẩu
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-text-muted hover:text-text underline"
              >
                Quên mật khẩu?
              </Link>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-surface rounded-xl border border-border text-sm text-text focus:border-leaf focus:outline-none"
              />
              <Lock className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <Button
            type="submit"
            variant="honey"
            fullWidth
            isLoading={isLoading}
            className="mt-2"
            iconLeft={<Sparkles size={16} className="text-text" />}
          >
            Đăng nhập vào tủ truyện ✿
          </Button>
        </form>

        <div className="text-center text-xs text-text-muted border-t border-border/60 pt-4">
          Chưa có chìa khóa thư viện?{' '}
          <Link to="/register" className="font-bold text-text hover:underline">
            Đăng ký tài khoản mới 🌿
          </Link>
        </div>
      </div>
    </div>
  );
};
