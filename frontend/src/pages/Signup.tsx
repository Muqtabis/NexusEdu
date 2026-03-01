import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, BookOpen, Layers, Hash } from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    role: 'student',
    branch: 'Class 10-A', 
    rollNumber: '', // <--- NEW FIELD
    secretCode: '' 
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.role === 'admin' && formData.secretCode !== 'ADMIN2026') {
      setError("Invalid Admin Secret Code!");
      return;
    }

    try {
      const res = await fetch('http://localhost:4000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("Account Created Successfully! Please Login.");
        navigate('/');
      } else {
        const data = await res.json();
        setError(data.message || "Signup Failed");
      }
    } catch (err) {
      setError("Server Error. Is Backend running?");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Create Account</h2>
          <p className="text-slate-500">Join NexusEdu today</p>
        </div>

        {error && <div className="p-3 mb-4 bg-rose-100 text-rose-600 rounded-lg text-sm text-center font-bold">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="relative">
            <User className="absolute left-3 top-3 text-slate-400" size={20} />
            <input name="name" type="text" placeholder="Full Name" required className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" onChange={handleChange} />
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-3 text-slate-400" size={20} />
            <input name="email" type="email" placeholder="Email Address" required className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" onChange={handleChange} />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
            <input name="password" type="password" placeholder="Password" required className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" onChange={handleChange} />
          </div>

          <div className="relative">
            <BookOpen className="absolute left-3 top-3 text-slate-400" size={20} />
            <select name="role" className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none" onChange={handleChange} value={formData.role}>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Principal (Admin)</option>
            </select>
          </div>

          {/* STUDENT SPECIFIC FIELDS */}
          {formData.role === 'student' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              
              {/* Branch Selection */}
              <div className="relative">
                <Layers className="absolute left-3 top-3 text-slate-400" size={20} />
                <select name="branch" className="w-full pl-10 p-3 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none" onChange={handleChange} value={formData.branch}>
                  <option value="Class 10-A">Class 10-A (Science)</option>
                  <option value="Class 10-B">Class 10-B (Commerce)</option>
                  <option value="Class 11-A">Class 11-A (Physics)</option>
                  <option value="Class 12-A">Class 12-A (Engineering)</option>
                </select>
              </div>

              {/* Roll Number Input */}
              <div className="relative">
                <Hash className="absolute left-3 top-3 text-slate-400" size={20} />
                <input 
                  name="rollNumber" 
                  type="text" 
                  placeholder="Roll Number (e.g. 12)" 
                  required 
                  className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                  onChange={handleChange} 
                />
              </div>

            </div>
          )}

          {formData.role === 'admin' && (
            <input name="secretCode" type="password" placeholder="Admin Secret Code" className="w-full p-3 bg-rose-50 border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none animate-in fade-in" onChange={handleChange} />
          )}

          <button type="submit" className="w-full p-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
            Sign Up
          </button>
        </form>

        <p className="text-center mt-6 text-slate-500">
          Already have an account? <a href="/" className="text-indigo-600 font-bold hover:underline">Login</a>
        </p>
      </div>
    </div>
  );
};

export default Signup;