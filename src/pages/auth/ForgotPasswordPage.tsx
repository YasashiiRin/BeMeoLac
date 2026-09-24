import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { useToast } from '../../context/ToastContext';
import { Mail, ArrowLeft, Flower2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSent(true);
    showToast('Đã gửi liên kết khôi phục mật khẩu đến hòm thư của bạn! ✉️', 'success');
  };

  return (
    <div className="min-h-screen bg-[#FBF4E8] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#FFF8F5] border-1.5 border-[#A67B5B] rounded-3xl p-6 sm:p-8 shadow-botanical-lg flex flex-col gap-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#F6EBDD] flex items-center justify-center text-[#7FAF6B] mb-2">
            <Flower2 size={24} />
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#5E4636]">
            Quên Mật Khẩu? ✿
          </h1>
          <p className="text-xs text-[#806350] mt-1">
            Nhập thư điện tử của bạn để nhận liên kết khôi phục mật khẩu
          </p>
        </div>

        {isSent ? (
          <div className="text-center flex flex-col gap-4">
            <p className="text-sm text-[#3A5230] bg-[#CFE8D5]/60 p-4 rounded-2xl border border-[#7FAF6B]">
              Đã gửi hướng dẫn khôi phục tới <strong>{email}</strong>. Vui lòng kiểm tra hộp thư đến nhé.
            </p>
            <Button variant="honey" onClick={() => navigate('/login')}>
              Quay lại Đăng nhập
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#5E4636] mb-1">
                Thư điện tử
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="congchua@tutruyennho.vn"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[#F6EBDD] rounded-xl border border-[#D9B99B] text-sm text-[#5E4636] focus:border-[#7FAF6B] focus:outline-none"
                />
                <Mail className="w-4 h-4 text-[#A67B5B] absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <Button type="submit" variant="honey" fullWidth className="mt-2">
              Gửi liên kết khôi phục ✿
            </Button>
          </form>
        )}

        <div className="text-center text-xs text-[#806350] border-t border-[#D9B99B]/60 pt-4">
          <Link to="/login" className="font-bold text-[#5E4636] hover:underline flex items-center justify-center gap-1">
            <ArrowLeft size={13} />
            <span>Quay lại trang Đăng nhập</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
