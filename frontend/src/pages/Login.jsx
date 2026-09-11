import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Leaf, Lock, Mail, ArrowRight, AlertCircle, ShoppingBag, RefreshCw, KeyRound, CheckCircle2 } from 'lucide-react';
import { loginUser, resendOtpApi } from '../services/authApi';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { setAuth } = useAuthStore();

  const redirectUrl = searchParams.get('redirect') || '/';
  const isFromCheckout = redirectUrl.includes('/checkout');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resendStatus, setResendStatus] = useState('');

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      // 1. Wipe all query caches from previous session so no stale member data is displayed
      queryClient.clear();

      // 2. Set new user auth state
      setAuth(data.user);

      // 3. By default, both admin and customer navigate to the home page ('/')
      // Only redirect to checkout if the customer was actively in the checkout flow
      const redirectParam = searchParams.get('redirect');
      const targetDestination = redirectParam && redirectParam.startsWith('/checkout') ? redirectParam : '/';
      navigate(targetDestination, { replace: true });
    },
    onError: (err) => {
      if (err.response?.data?.isUnverified) {
        const email = err.response.data.email || formData.email.trim().toLowerCase();
        setUnverifiedEmail(email);
        setErrorMessage(err.response.data.message || 'Your account is not activated yet.');
      } else {
        setUnverifiedEmail('');
        setErrorMessage(err.message || 'Invalid email or password. Please try again.');
      }
    },
  });

  const resendMutation = useMutation({
    mutationFn: resendOtpApi,
    onSuccess: (data) => {
      setResendStatus(data.message || 'A fresh 6-digit verification code has been dispatched to your email.');
      setTimeout(() => setResendStatus(''), 6000);
    },
    onError: (err) => {
      setErrorMessage(err.message || 'Failed to dispatch verification code.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setResendStatus('');

    if (!formData.email || !formData.password) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }

    loginMutation.mutate(formData);
  };

  const handleResend = () => {
    if (!unverifiedEmail) return;
    setErrorMessage('');
    resendMutation.mutate({ email: unverifiedEmail });
  };

  return (
    <div className="bg-[#f8f6f3] min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Logo and Heading */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 group mb-4">
            <img
              src="/image.png"
              alt="Organic Store"
              className="h-12 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
            />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Welcome Back
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Sign in to access your organic cart, saved addresses, and orders.
          </p>
        </div>

        {/* Informative Notice if redirected from Checkout */}
        {isFromCheckout && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <ShoppingBag className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900">
              <span className="font-bold block mb-0.5">Checkout Requires Sign In</span>
              Please log in to your account or register to confirm delivery details and place your order. Your cart items are saved!
            </div>
          </div>
        )}

        {/* Card Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Unverified Account Action Box */}
          {unverifiedEmail && (
            <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-xl space-y-3 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <KeyRound className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Activate Your Account</span>
              </div>
              <p className="text-amber-800 text-[11px] leading-relaxed">
                Your account for <strong>{unverifiedEmail}</strong> requires email verification before signing in.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                <Link
                  to={`/signup?email=${encodeURIComponent(unverifiedEmail)}&step=otp&redirect=${encodeURIComponent(redirectUrl)}`}
                  className="w-full py-2 bg-[#6a9739] hover:bg-[#58802d] text-white rounded-lg text-xs font-bold transition-colors text-center shadow-xs flex items-center justify-center gap-1"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Enter 6-Digit OTP</span>
                </Link>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendMutation.isPending}
                  className="w-full py-2 bg-white hover:bg-amber-100/50 border border-amber-300 text-amber-900 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resendMutation.isPending ? 'animate-spin' : ''}`} />
                  <span>{resendMutation.isPending ? 'Sending...' : 'Resend Code'}</span>
                </button>
              </div>
            </div>
          )}

          {resendStatus && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-xs text-green-800 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-[#6a9739] shrink-0" />
              <span>{resendStatus}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            {/* Dummy hidden inputs to absorb browser aggressive autofill */}
            <input
              type="text"
              name="prevent_autofill_username"
              tabIndex={-1}
              aria-hidden="true"
              className="hidden"
              autoComplete="off"
              readOnly
            />
            <input
              type="password"
              name="prevent_autofill_password"
              tabIndex={-1}
              aria-hidden="true"
              className="hidden"
              autoComplete="new-password"
              readOnly
            />

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  name="os_login_email"
                  required
                  readOnly
                  onFocus={(e) => { e.target.readOnly = false; }}
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  autoComplete="off"
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#6a9739] focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-[#6a9739] hover:text-[#58802d] hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  name="os_login_password"
                  required
                  readOnly
                  onFocus={(e) => { e.target.readOnly = false; }}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  autoComplete="new-password"
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#6a9739] focus:bg-white transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-[#6a9739] hover:bg-[#58802d] text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50 mt-2"
            >
              {loginMutation.isPending ? 'Signing In...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-gray-100 text-center text-xs text-gray-600">
            Don't have an account?{' '}
            <Link
              to={`/signup?redirect=${encodeURIComponent(redirectUrl)}`}
              className="font-bold text-[#6a9739] hover:underline"
            >
              Create an Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
