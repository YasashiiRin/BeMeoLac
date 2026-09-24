import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/Button';
import { useToast } from '../../context/ToastContext';
import { Flower2, Sparkles, Mail, Lock, User } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login('new-user-token');
      showToast('Chúc mừng bạn đã nhận chìa khóa Tủ Truyện Nhỏ! 🌸', 'success');
      navigate('/');
    } catch (err) {
      showToast('Đăng ký thất bại', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF4E8] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#FFF8F5] border-1.5 border-[#A67B5B] rounded-3xl p-6 sm:p-8 shadow-botanical-lg flex flex-col gap-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F2A7B5] to-[#A8C49A] p-0.5 shadow-botanical-sm mb-3">
            <div className="w-full h-full bg-[#FFF8F5] rounded-[14px] flex items-center justify-center text-[#5E4636]">
              <Flower2 className="w-8 h-8 text-[#7FAF6B]" />
            </div>
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#5E4636]">
            Đăng Ký Tài Khoản Mới ✿
          </h1>
          <p className="text-xs text-[#806350] mt-1 italic">
            Tạo một góc nhỏ riêng cho hành trình đọc truyện của bạn
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#5E4636] mb-1">
              Tên gọi của bạn
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Bé Tiên Trà Xanh"
                className="w-full pl-9 pr-3.5 py-2.5 bg-[#F6EBDD] rounded-xl border border-[#D9B99B] text-sm text-[#5E4636] focus:border-[#7FAF6B] focus:outline-none"
              />
              <User className="w-4 h-4 text-[#A67B5B] absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5E4636] mb-1">
              Thư điện tử (Email)
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@vidu.com"
                className="w-full pl-9 pr-3.5 py-2.5 bg-[#F6EBDD] rounded-xl border border-[#D9B99B] text-sm text-[#5E4636] focus:border-[#7FAF6B] focus:outline-none"
              />
              <Mail className="w-4 h-4 text-[#A67B5B] absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5E4636] mb-1">
              Mật khẩu bí mật
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 8 ký tự"
                className="w-full pl-9 pr-3.5 py-2.5 bg-[#F6EBDD] rounded-xl border border-[#D9B99B] text-sm text-[#5E4636] focus:border-[#7FAF6B] focus:outline-none"
              />
              <Lock className="w-4 h-4 text-[#A67B5B] absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <Button
            type="submit"
            variant="honey"
            fullWidth
            isLoading={isLoading}
            className="mt-2"
          >
            Tạo tủ truyện ✿
          </Button>
        </form>

        <div className="text-center text-xs text-[#806350] border-t border-[#D9B99B]/60 pt-4">
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-bold text-[#5E4636] hover:underline">
            Đăng nhập ngay 🌿
          </Link>
        </div>
      </div>
    </div>
  );
};
