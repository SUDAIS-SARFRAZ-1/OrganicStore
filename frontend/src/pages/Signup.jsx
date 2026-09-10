import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Leaf, Lock, Mail, User, Phone, ArrowRight, AlertCircle, ShoppingBag, CheckCircle2, RefreshCw, KeyRound, ArrowLeft } from 'lucide-react';
import { registerUser, verifyOtpApi, resendOtpApi } from '../services/authApi';
import { useAuthStore } from '../store/authStore';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function Signup() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setAuth } = useAuthStore();

  const redirectUrl = searchParams.get('redirect') || '/';
  const isFromCheckout = redirectUrl.includes('/checkout');
  const initialEmail = searchParams.get('email') || '';
  const initialStep = searchParams.get('step') === 'otp' && initialEmail ? 'otp' : 'form';

  const [step, setStep] = useState(initialStep); // 'form' | 'otp'
  const [formData, setFormData] = useState({
    name: '',
    email: initialEmail,
    phone: '',
    password: '',
  });

  const [registeredEmail, setRegisteredEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [resendStatus, setResendStatus] = useState('');
  const [countdown, setCountdown] = useState(60);

  // Countdown timer for OTP resend cooldown
  useEffect(() => {
    if (step !== 'otp' || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, countdown]);

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      const email = data.email || formData.email.trim().toLowerCase();
      setRegisteredEmail(email);
      setStep('otp');
      setCountdown(60);
      setErrorMessage('');
      setResendStatus('');
    },
    onError: (err) => {
      setErrorMessage(err.message || 'Registration failed. Please check your information and try again.');
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: verifyOtpApi,
    onSuccess: (data) => {
      if (data.user && data.token) {
        setAuth(data.user, data.token);
        queryClient.invalidateQueries({ queryKey: ['cart'] });
        navigate(redirectUrl, { replace: true });
      }
    },
    onError: (err) => {
      setErrorMessage(err.message || 'Invalid or expired verification code.');
    },
  });

  const resendMutation = useMutation({
    mutationFn: resendOtpApi,
    onSuccess: (data) => {
      setResendStatus(data.message || 'New verification code dispatched to your email!');
      setCountdown(60);
      setTimeout(() => setResendStatus(''), 6000);
    },
    onError: (err) => {
      setErrorMessage(err.message || 'Failed to dispatch verification code.');
    },
  });

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setErrorMessage('Full name, email address, and password are required.');
      return;
    }

    const cleanEmail = formData.email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email format (e.g. name@example.com).');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    registerMutation.mutate({
      ...formData,
      email: cleanEmail,
    });
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanOtp = otp.trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      setErrorMessage('Please enter a 6-digit numeric verification code.');
      return;
    }

    verifyOtpMutation.mutate({
      email: registeredEmail,
      otp: cleanOtp,
    });
  };

  const handleResendOtp = () => {
    if (countdown > 0 || resendMutation.isPending) return;
    setErrorMessage('');
    setResendStatus('');
    resendMutation.mutate({ email: registeredEmail });
  };

  return (
    <div className="bg-[#f8f6f3] min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Logo and Heading */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 group mb-4">
            <div className="w-12 h-12 rounded-full bg-[#6a9739]/10 flex items-center justify-center text-[#6a9739] group-hover:bg-[#6a9739] group-hover:text-white transition-colors">
              <Leaf className="w-7 h-7" />
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            {step === 'otp' ? 'Enter Verification Code' : 'Create Your Account'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {step === 'otp'
              ? 'Enter the 6-digit code sent to your email address to activate your account.'
              : 'Join Organic Store for certified farm-fresh produce and exclusive member discounts.'}
          </p>
        </div>

        {/* Notice if redirected from Checkout */}
        {isFromCheckout && step === 'form' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <ShoppingBag className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900">
              <span className="font-bold block mb-0.5">Quick Checkout Registration</span>
              Create an account to finalize your delivery details. Your cart items are saved!
            </div>
          </div>
        )}

        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {resendStatus && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-xs text-green-800 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-[#6a9739] shrink-0" />
              <span>{resendStatus}</span>
            </div>
          )}

          {/* ================= STEP 2: OTP VERIFICATION ================= */}
          {step === 'otp' ? (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <span className="text-xs text-gray-500">Verification code sent to:</span>
                <div className="font-mono font-bold text-xs text-gray-900 bg-gray-100 py-1.5 px-3 rounded-lg inline-block">
                  {registeredEmail}
                </div>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-4" autoComplete="off">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2 text-center">
                    6-Digit Security Code
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      autoFocus
                      required
                      placeholder="••••••"
                      value={otp}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOtp(val);
                      }}
                      className="w-full text-center tracking-[0.6em] text-3xl font-mono font-extrabold py-3.5 px-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#6a9739] focus:bg-white text-gray-900 transition-colors"
                    />
                  </div>
                  <span className="text-[11px] text-gray-400 mt-2 block text-center">
                    Code expires in 10 minutes. Check your spam/junk folder if not received.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={verifyOtpMutation.isPending || otp.length !== 6}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-[#6a9739] hover:bg-[#58802d] text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {verifyOtpMutation.isPending ? 'Verifying Code...' : 'Verify & Activate Account'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Resend Cooldown and Edit Email options */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep('form');
                    setErrorMessage('');
                  }}
                  className="text-gray-500 hover:text-gray-800 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change Email</span>
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={countdown > 0 || resendMutation.isPending}
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
          ) : (
            /* ================= STEP 1: REGISTRATION FORM ================= */
            <form onSubmit={handleFormSubmit} className="space-y-4" autoComplete="off">
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
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="os_customer_name"
                    required
                    readOnly
                    onFocus={(e) => { e.target.readOnly = false; }}
                    placeholder="Ahmad Ali"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    autoComplete="off"
                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#6a9739] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    name="os_customer_email"
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
                <span className="text-[11px] text-gray-400 mt-1 block">
                  A 6-digit OTP code will be sent to this email for instant account activation.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    name="os_customer_phone"
                    readOnly
                    onFocus={(e) => { e.target.readOnly = false; }}
                    placeholder="+92 300 1234567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    autoComplete="off"
                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#6a9739] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    name="os_customer_password"
                    required
                    readOnly
                    onFocus={(e) => { e.target.readOnly = false; }}
                    placeholder="At least 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    autoComplete="new-password"
                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#6a9739] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-[#6a9739] hover:bg-[#58802d] text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50 mt-2"
              >
                {registerMutation.isPending ? 'Sending Verification Code...' : 'Register & Receive OTP'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {step === 'form' && (
            <div className="pt-4 border-t border-gray-100 text-center text-xs text-gray-600">
              Already have an account?{' '}
              <Link
                to={`/login?redirect=${encodeURIComponent(redirectUrl)}`}
                className="font-bold text-[#6a9739] hover:underline"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
