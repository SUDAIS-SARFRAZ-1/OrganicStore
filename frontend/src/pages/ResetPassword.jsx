import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { 
  Lock, 
  KeyRound, 
  Mail, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldCheck
} from 'lucide-react';
import { resetPasswordApi } from '../services/authApi';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const codeParam = searchParams.get('code');
    if (emailParam) setEmail(emailParam);
    if (codeParam) setCode(codeParam);
  }, [searchParams]);

  const resetMutation = useMutation({
    mutationFn: resetPasswordApi,
    onSuccess: () => {
      setIsSuccess(true);
      setErrorMessage('');
    },
    onError: (err) => {
      setErrorMessage(
        err.message || err.response?.data?.message || 'Failed to reset password. Please check your code and try again.'
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!code.trim() || code.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit code received in your email.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    resetMutation.mutate({
      email: email.trim().toLowerCase(),
      code: code.trim(),
      newPassword,
    });
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-[#6a9739]/10 rounded-2xl flex items-center justify-center mx-auto text-[#6a9739] mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Create New Password
          </h1>
          <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
            Enter the 6-digit code sent to your email along with your desired new password.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isSuccess ? (
            <div className="text-center space-y-5">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-[#6a9739]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900">Password Reset Complete!</h3>
                <p className="text-xs text-gray-600 leading-relaxed max-w-xs mx-auto">
                  Your password has been securely updated and all previous sessions have been signed out.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-[#6a9739] hover:bg-[#58802d] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <span>Sign In with New Password</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#6a9739] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  6-Digit Reset Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-10 pr-3 py-2.5 text-base tracking-widest font-mono font-bold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#6a9739] focus:bg-white transition-colors"
                  />
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[10px] text-gray-400">Received via email</span>
                  <Link
                    to="/forgot-password"
                    className="text-[10px] font-semibold text-[#6a9739] hover:underline"
                  >
                    Resend code?
                  </Link>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="Minimum 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#6a9739] focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#6a9739] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={resetMutation.isPending}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-[#6a9739] hover:bg-[#58802d] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 mt-2"
              >
                {resetMutation.isPending ? 'Resetting Password...' : 'Reset Password'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-gray-100 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-[#6a9739] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
