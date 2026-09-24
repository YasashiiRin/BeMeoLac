import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { useToast } from '../../context/ToastContext';
import { Lock } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showToast('Mật khẩu nhập lại không khớp!', 'warning');
      return;
    }
    showToast('Mật khẩu mới đã được lưu thành công! 🌿', 'success');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#FBF4E8] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#FFF8F5] border-1.5 border-[#A67B5B] rounded-3xl p-6 sm:p-8 shadow-botanical-lg flex flex-col gap-6">
        <div className="text-center">
          <h1 className="font-serif text-2xl font-bold text-[#5E4636]">
            Đặt Lại Mật Khẩu Mới ✿
          </h1>
          <p className="text-xs text-[#806350] mt-1">
            Thiết lập mật khẩu an toàn mới cho tủ truyện nhỏ của bạn
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#5E4636] mb-1">
              Mật khẩu mới
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

          <div>
            <label className="block text-xs font-semibold text-[#5E4636] mb-1">
              Nhập lại mật khẩu mới
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                className="w-full pl-9 pr-3.5 py-2.5 bg-[#F6EBDD] rounded-xl border border-[#D9B99B] text-sm text-[#5E4636] focus:border-[#7FAF6B] focus:outline-none"
              />
              <Lock className="w-4 h-4 text-[#A67B5B] absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <Button type="submit" variant="honey" fullWidth className="mt-2">
            Lưu mật khẩu mới ✿
          </Button>
        </form>
      </div>
    </div>
  );
};
