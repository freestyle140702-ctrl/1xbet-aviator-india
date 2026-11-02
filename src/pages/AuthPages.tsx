import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { Plane, AlertTriangle, CheckCircle2, Lock, Mail, User as UserIcon, Phone, KeyRound, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  initialMode?: 'login' | 'register' | 'forgot';
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ initialMode = 'login', onClose, onSuccess }) => {
  const { login, register, showToast } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>(initialMode);

  // Form states
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [resetKey, setResetKey] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg('Email and password are required.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name || !email || !password) {
      setErrorMsg('Name, email, and password are required.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone ? phone.trim() : undefined,
      });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email) {
      setErrorMsg('Please enter your account email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.auth.forgotPassword(email.trim());
      setSuccessMsg(res.message);
      if (res.resetKey) {
        setResetKey(res.resetKey);
        setMode('reset');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!resetKey || !newPassword) {
      setErrorMsg('Reset token and new password are required.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.auth.resetPassword({
        email: email.trim(),
        resetKey: resetKey.trim(),
        newPassword,
      });
      showToast(res.message, 'success');
      setMode('login');
      setPassword('');
      setErrorMsg('');
      setSuccessMsg('Password reset successfully! Please log in with your new password.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#10121a] border border-red-950/60 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative select-none">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
        >
          ✕
        </button>

        {/* Brand header */}
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-600 to-red-700 flex items-center justify-center shadow-[0_0_12px_rgba(225,29,72,0.4)]">
            <Plane className="w-4 h-4 text-white transform -rotate-45" />
          </div>
          <span className="font-black text-sm tracking-wider text-white font-['Outfit']">
            AVIATOR<span className="text-rose-500">AERO</span>
          </span>
        </div>

        {/* Tab switch between Login and Register */}
        {mode !== 'forgot' && mode !== 'reset' && (
          <div className="grid grid-cols-2 bg-[#090a0f] p-1 rounded-xl border border-zinc-800 mb-5">
            <button
              onClick={() => {
                setMode('login');
                setErrorMsg('');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition ${
                mode === 'login' ? 'bg-rose-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode('register');
                setErrorMsg('');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition ${
                mode === 'register' ? 'bg-rose-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Alerts */}
        {errorMsg && (
          <div className="p-3 mb-4 bg-red-950/60 border border-red-700/60 rounded-xl text-xs text-rose-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 mb-4 bg-emerald-950/60 border border-emerald-700/60 rounded-xl text-xs text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Mode: LOGIN */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                Username or Email
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter username or email"
                  className="w-full bg-[#090a0f] border border-zinc-800 focus:border-rose-500 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none transition"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setErrorMsg('');
                  }}
                  className="text-[11px] text-rose-400 hover:text-rose-300 transition"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#090a0f] border border-zinc-800 focus:border-rose-500 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold rounded-xl shadow-[0_0_18px_rgba(225,29,72,0.4)] border border-rose-500/50 transition active:scale-95 disabled:opacity-50 cursor-pointer text-xs"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Mode: REGISTER */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full bg-[#090a0f] border border-zinc-800 focus:border-rose-500 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none transition"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-[#090a0f] border border-zinc-800 focus:border-rose-500 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none transition"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full bg-[#090a0f] border border-zinc-800 focus:border-rose-500 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#090a0f] border border-zinc-800 focus:border-rose-500 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none transition"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                  Confirm
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#090a0f] border border-zinc-800 focus:border-rose-500 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none transition"
                  required
                />
              </div>
            </div>

            <div className="text-[10px] text-zinc-400">
              By creating an account, you agree to simulated platform rules. Initial balance starts at ₹0.00.
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold rounded-xl shadow-[0_0_18px_rgba(225,29,72,0.4)] border border-rose-500/50 transition active:scale-95 disabled:opacity-50 cursor-pointer text-xs"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Mode: FORGOT PASSWORD */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <h3 className="text-sm font-bold text-white">Reset Account Password</h3>
            <p className="text-xs text-zinc-400">
              Enter your registered email address and we will generate a security reset code.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full bg-[#090a0f] border border-zinc-800 focus:border-rose-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none transition"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-1/2 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs transition"
              >
                Back to Sign In
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition active:scale-95"
              >
                {isLoading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </div>
          </form>
        )}

        {/* Mode: RESET CONFIRMATION */}
        {mode === 'reset' && (
          <form onSubmit={handleResetSubmit} className="space-y-3.5">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-rose-500" />
              <span>Enter Reset Key & New Password</span>
            </h3>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                Reset Code
              </label>
              <input
                type="text"
                value={resetKey}
                onChange={(e) => setResetKey(e.target.value)}
                placeholder="RESET-XXXXXX"
                className="w-full bg-[#090a0f] border border-zinc-800 focus:border-rose-500 rounded-xl px-4 py-2 text-xs font-mono text-white focus:outline-none transition"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-[#090a0f] border border-zinc-800 focus:border-rose-500 rounded-xl px-4 py-2 text-xs text-white focus:outline-none transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition active:scale-95"
            >
              {isLoading ? 'Updating...' : 'Set New Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
