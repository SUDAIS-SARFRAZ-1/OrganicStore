import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, KeyRound, ShieldAlert } from 'lucide-react';
import { forgotPasswordApi } from '../services/authApi';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSent, setIsSent] = useState(false);

  const forgotMutation = useMutation({
    mutationFn: forgotPasswordApi,
    onSuccess: (res) => {
      setSubmittedEmail(email.trim());
      setIsSent(true);
      setErrorMessage('');
    },
    onError: (err) => {
      setErrorMessage(
        err.response?.data?.message || 'Unable to process your request. Please try again later.'
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    forgotMutation.mutate({ email: email.trim().toLowerCase() });
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-width-md w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-[#6a9739]/10 rounded-2xl flex items-center justify-center mx-auto text-[#6a9739] mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Forgot Password?
          </h1>
          <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
            No worries! Enter your registered email address and we will send you a 6-digit code to reset your password.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isSent ? (
            <div className="space-y-5 text-center">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-left">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-[#6a9739] shrink-0" />
                  <span>Reset Code Dispatched</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  If an account exists for <strong>{submittedEmail}</strong>, a 6-digit password reset code has been sent. Please check your inbox (and spam folder).
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/reset-password?email=${encodeURIComponent(submittedEmail)}`)
                  }
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-[#6a9739] hover:bg-[#58802d] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <span>Enter 6-Digit Reset Code</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsSent(false)}
                  className="w-full py-2.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                >
                  Send to a different email
                </button>
              </div>
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

              <button
                type="submit"
                disabled={forgotMutation.isPending}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-[#6a9739] hover:bg-[#58802d] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 mt-2"
              >
                {forgotMutation.isPending ? 'Sending Reset Code...' : 'Send Reset Code'}
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
