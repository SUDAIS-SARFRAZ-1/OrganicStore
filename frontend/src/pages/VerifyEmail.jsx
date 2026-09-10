import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, AlertCircle, RefreshCw, ArrowRight, Leaf, Mail, ShoppingBag, KeyRound } from 'lucide-react';
import { verifyEmailApi, verifyOtpApi, resendOtpApi } from '../services/authApi';
import { useAuthStore } from '../store/authStore';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email') || '';
  const { setAuth } = useAuthStore();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState('');
  const [resendSuccess, setResendSuccess] = useState('');
  const [resendError, setResendError] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const verifyTokenMutation = useMutation({
    mutationFn: (tok) => verifyEmailApi({ token: tok }),
    onSuccess: (data) => {
      if (data?.user && data?.token) {
        setAuth(data.user, data.token);
        queryClient.invalidateQueries({ queryKey: ['cart'] });
      }
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: verifyOtpApi,
    onSuccess: (data) => {
      if (data?.user && data?.token) {
        setAuth(data.user, data.token);
        queryClient.invalidateQueries({ queryKey: ['cart'] });
      }
    },
  });

  const resendMutation = useMutation({
    mutationFn: resendOtpApi,
    onSuccess: (data) => {
      setResendSuccess(data.message || 'A fresh 6-digit verification code has been dispatched to your email.');
      setResendError('');
      setCountdown(60);
    },
    onError: (err) => {
      setResendError(err.message || 'Failed to dispatch verification code.');
      setResendSuccess('');
    },
  });

  useEffect(() => {
    if (token) {
      verifyTokenMutation.mutate(token);
    }
  }, [token]);

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !/^\d{6}$/.test(otp.trim())) return;
    verifyOtpMutation.mutate({
      email: email.trim().toLowerCase(),
      otp: otp.trim(),
    });
  };

  const handleResend = (e) => {
    e.preventDefault();
    if (!email.trim() || countdown > 0 || resendMutation.isPending) return;
    setResendSuccess('');
    setResendError('');
    resendMutation.mutate({ email: email.trim().toLowerCase() });
  };

  const isVerified = verifyTokenMutation.isSuccess || verifyOtpMutation.isSuccess;
  const verifiedUser = verifyTokenMutation.data?.user || verifyOtpMutation.data?.user;

  return (
    <div className="bg-[#f8f6f3] min-h-[80vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Logo */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 group mb-4">
            <div className="w-12 h-12 rounded-full bg-[#6a9739]/10 flex items-center justify-center text-[#6a9739] group-hover:bg-[#6a9739] group-hover:text-white transition-colors">
              <Leaf className="w-7 h-7" />
            </div>
          </Link>
        </div>

        {/* Loading Token Activation */}
        {verifyTokenMutation.isPending && (
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center space-y-4">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[#6a9739] border-t-transparent"></div>
            <h2 className="text-lg font-bold text-gray-900">Activating Your Account...</h2>
            <p className="text-xs text-gray-500">
              Verifying your credentials and preparing your Organic Store account.
            </p>
          </div>
        )}

        {/* Success State */}
        {isVerified && (
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center space-y-6 animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 text-[#6a9739] flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                Account Activated!
              </h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                Welcome to Organic Store, <span className="font-bold text-gray-800">{verifiedUser?.name || 'Valued Customer'}</span>! Your account has been verified successfully.
              </p>
            </div>

            <div className="p-4 bg-green-50/70 border border-green-200/70 rounded-2xl text-xs text-green-900">
              You are now signed in and ready to enjoy farm-fresh organic groceries and exclusive discounts!
            </div>

            <div className="space-y-2.5 pt-2">
              <Link
                to="/shop"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-[#6a9739] hover:bg-[#58802d] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Start Shopping</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/account/profile"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl shadow-2xs transition-colors"
              >
                Go to My Account
              </Link>
            </div>
          </div>
        )}

        {/* OTP Input Card when without token or after token error */}
        {!isVerified && !verifyTokenMutation.isPending && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-green-50 text-[#6a9739] flex items-center justify-center mx-auto mb-2">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-gray-900">Verify Your Account</h2>
              <p className="text-xs text-gray-500">
                Enter your email address and 6-digit verification code.
              </p>
            </div>

            {verifyOtpMutation.isError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{verifyOtpMutation.error?.message || 'Invalid or expired code.'}</span>
              </div>
            )}

            {resendSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-xs text-green-800 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#6a9739] shrink-0" />
                <span>{resendSuccess}</span>
              </div>
            )}

            {resendError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{resendError}</span>
              </div>
            )}



            <form onSubmit={handleOtpSubmit} className="space-y-4" autoComplete="off">
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
                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#6a9739] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5 text-center">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  placeholder="••••••"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full text-center tracking-[0.6em] text-3xl font-mono font-extrabold py-3 px-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#6a9739] focus:bg-white text-gray-900 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={verifyOtpMutation.isPending || otp.length !== 6 || !email.trim()}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-[#6a9739] hover:bg-[#58802d] text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {verifyOtpMutation.isPending ? 'Verifying Code...' : 'Verify & Activate'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <Link to="/login" className="text-gray-500 hover:text-gray-800 font-medium">
                Return to Sign In
              </Link>

              <button
                type="button"
                onClick={handleResend}
                disabled={!email.trim() || countdown > 0 || resendMutation.isPending}
                className="font-bold text-[#6a9739] hover:underline disabled:text-gray-400 disabled:no-underline transition-colors cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${resendMutation.isPending ? 'animate-spin' : ''}`} />
                {countdown > 0 ? (
                  <span>Resend in {countdown}s</span>
                ) : resendMutation.isPending ? (
                  <span>Sending...</span>
                ) : (
                  <span>Resend Code</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
