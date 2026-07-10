import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { apiFetch } from '../lib/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await apiFetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid login credentials');
      }

      // Save user details to local storage so the rest of the app knows who is logged in
      const user = data.user ?? data;
      localStorage.setItem('userId', String(user.id));
      localStorage.setItem('role', user.role);
      localStorage.setItem('name', user.name || '');
      localStorage.setItem('email', user.email || '');

      // Redirect to the main dashboard
      window.location.href = '/'; 

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      
      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-xl shadow-indigo-100/50 border border-slate-100 p-8 sm:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-indigo-100/50">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Welcome back</h1>
          <p className="text-sm text-slate-500 mt-2">Enter your credentials to access your account</p>
        </div>

        {/* Error Message Alert */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 text-rose-600 text-sm font-semibold rounded-xl border border-rose-100 flex items-center gap-2 animate-in slide-in-from-top-2">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <Mail size={18} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <Lock size={18} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm text-slate-500 font-medium">Remember me</span>
            </label>
            <a href="#" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>Sign In <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        {/* Signup Link */}
        <p className="mt-8 text-center text-sm font-medium text-slate-500">
          Don't have an account?{' '}
          <Link to="/signup" className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors">
            Create one now
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Login;