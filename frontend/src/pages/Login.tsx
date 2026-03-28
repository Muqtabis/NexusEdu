import { useState } from 'react';
import { Mail, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate(); // Hook to move between pages

  // State to store what the user types
  const [formData, setFormData] = useState({ email: '', password: '' });
  
  // State to handle Errors (e.g., "Wrong password")
  const [error, setError] = useState('');
  
  // State to show loading spinner
  const [loading, setLoading] = useState(false);

  // ---------------------------------------------------------
  // HANDLE LOGIN FUNCTION
  // ---------------------------------------------------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Stop page from reloading
    setError('');       // Clear previous errors
    setLoading(true);   // Start spinner

    try {
      // 1. SEND DATA TO BACKEND (🚀 Updated API URL here)
      const res = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email, 
          pass: formData.password 
        }),
      });

      // If backend says "Unauthorized" (401), show error immediately
      if (!res.ok) throw new Error('Invalid email or password');

      const user = await res.json();

      // 2. LOGIN SUCCESS: SAVE DATA
      // FIXED: Changed 'userRole' to 'role' so Profile.tsx can read it correctly!
      localStorage.setItem('role', user.role); 
      localStorage.setItem('userName', user.name);
      localStorage.setItem('userId', user.id); 

      // 3. REDIRECT BASED ON ROLE
      if (user.role === 'student') navigate('/dashboard/student');
      else if (user.role === 'teacher') navigate('/dashboard/teacher');
      else if (user.role === 'admin') navigate('/dashboard/admin');

    } catch (err: any) {
      // If connection fails or password wrong, show red error box
      setError(err.message || 'Failed to connect to server');
    } finally {
      setLoading(false); // Stop spinner
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 animate-in fade-in">
      <div className="w-full max-w-sm bg-white p-8 rounded-[1.5rem] shadow-sm border border-slate-200">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">NexusEdu</h1>
          <p className="text-slate-500 mt-2 text-sm">Welcome back, scholar.</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* Error Message Box (Only shows if there is an error) */}
          {error && (
            <div className="p-3 bg-rose-50 text-rose-600 text-xs rounded-xl flex items-center gap-2 font-bold border border-rose-100">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Email Input */}
          <div className="relative">
            <Mail size={18} className="absolute left-4 top-3.5 text-slate-400" />
            <input 
              type="email" 
              placeholder="Email Address" 
              className="w-full pl-11 p-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <Lock size={18} className="absolute left-4 top-3.5 text-slate-400" />
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full pl-11 p-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full p-4 mt-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex justify-center items-center gap-2 disabled:opacity-70 shadow-lg shadow-indigo-200"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Login <ArrowRight size={18} /></>}
          </button>
        </form>

        {/* Footer Link to Signup */}
        <div className="mt-8 text-center border-t border-slate-100 pt-6">
          <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-widest">New to NexusEdu?</p>
          <Link to="/signup" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;