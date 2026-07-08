import { useEffect, useState } from 'react';
import { User, Mail, ShieldCheck, GraduationCap, Loader2, BookOpen, Presentation, Settings, X, Key, AlertCircle, CheckCircle, Save } from 'lucide-react';
import { apiFetch } from '../lib/api';

const Profile = () => {
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = localStorage.getItem('userId');
  const role = localStorage.getItem('role') || 'student'; 

  // --- PASSWORD MODAL STATE ---
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // --- PROFILE UPDATE STATE (Avatar & Bio) ---
  const [avatar, setAvatar] = useState('');
  const [bio, setBio] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        setError("No User ID found in local storage. Are you logged in?");
        setLoading(false);
        return;
      }

      try {
        if (role === 'admin') {
          try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/${userId}`);
            if (!res.ok) throw new Error("Admin endpoint failed");
            const data = await res.json();
            setProfileData({ type: 'admin', name: data.name || 'System Admin', email: data.email || 'admin@nexusedu.com', avatar: data.avatar, bio: data.bio });
            setAvatar(data.avatar || '');
            setBio(data.bio || '');
          } catch (e) {
            setProfileData({ type: 'admin', name: 'System Administrator', email: 'admin@nexusedu.com' });
          }
        } 
        else if (role === 'teacher') {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/teacher/${userId}/students`);
          if (!res.ok) throw new Error(`Backend returned status: ${res.status}`);
          const data = await res.json();
          setProfileData({
            type: 'teacher',
            name: data.teacherName || 'Teacher', 
            email: data.teacherEmail || 'teacher@nexusedu.com', 
            assignments: data.dashboardOptions || [],
            avatar: data.avatar,
            bio: data.bio
          });
          setAvatar(data.avatar || '');
          setBio(data.bio || '');
        } 
        else {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/dashboard/${userId}`);
          if (!res.ok) throw new Error(`Backend returned status: ${res.status}`);
          const data = await res.json();
          setProfileData({ type: 'student', ...data });
          setAvatar(data.avatar || '');
          setBio(data.bio || '');
        }
      } catch (err: any) {
        console.error("Profile fetch error:", err);
        setError(`Failed to fetch from backend. (${err.message})`);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, role]);

  // --- HANDLE PROFILE UPDATE ---
  const handleProfileUpdate = async () => {
    setIsUpdatingProfile(true);
    setProfileUpdateSuccess(false);
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/user/${userId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar, bio })
      });

      if (!res.ok) throw new Error("Failed to update profile");
      
      const updatedUser = await res.json();
      
      setProfileData((prev: any) => ({ ...prev, avatar: updatedUser.avatar, bio: updatedUser.bio }));
      setProfileUpdateSuccess(true);
      
      setTimeout(() => setProfileUpdateSuccess(false), 3000);
      
    } catch (err) {
      console.error(err);
      alert("Error saving profile data.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // --- HANDLE PASSWORD CHANGE ---
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (passwords.new !== passwords.confirm) {
      setPasswordError("New passwords do not match!");
      return;
    }
    if (passwords.new.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          role: role,
          currentPassword: passwords.current,
          newPassword: passwords.new
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Incorrect current password");
      }

      setPasswordSuccess(true);
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordSuccess(false);
        setPasswords({ current: '', new: '', confirm: '' });
      }, 2000); 

    } catch (err: any) {
      setPasswordError(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  // --- HANDLE LOGOUT ---
  const handleLogout = async () => {
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => undefined);
    localStorage.clear(); 
    window.location.href = '/login'; 
  };

  if (loading) return <div className="p-20 text-center flex flex-col items-center gap-2"><Loader2 className="animate-spin text-indigo-600" /> Loading Profile...</div>;

  if (error || !profileData) {
    return (
      <div className="p-20 text-center flex flex-col items-center gap-4">
        <div className="p-4 bg-rose-100 text-rose-700 rounded-xl font-bold">🚨 ERROR: {error || "Data is empty."}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-32 pt-10 px-4 min-h-screen relative">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2">
        
        {/* --- MAIN PROFILE CARD --- */}
        <div className="md:col-span-2 bg-white rounded-[1.5rem] border border-slate-200 shadow-sm p-8">
          
          {/* Header Row with Avatar */}
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start mb-8 pb-8 border-b border-slate-100">
            <div className="relative group shrink-0">
              <img 
                src={avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                alt="Profile Avatar" 
                className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 shadow-sm"
              />
            </div>
            
            <div className="text-center sm:text-left flex-1">
               <h3 className="text-xl font-bold text-slate-800 flex items-center justify-center sm:justify-start gap-2 mb-1">
                  {profileData.name}
               </h3>
               <p className="text-sm font-medium text-indigo-600 uppercase tracking-wider">
                  {profileData.type === 'teacher' ? 'Teacher' : profileData.type === 'admin' ? 'Administrator' : 'Student'}
               </p>
               
               {/* Bio Display/Edit */}
               <div className="mt-4">
                 <textarea 
                   value={bio}
                   onChange={(e) => setBio(e.target.value)}
                   placeholder="Add a short bio about yourself..."
                   className="w-full text-sm text-slate-600 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-300 focus:bg-white transition-colors resize-none"
                   rows={2}
                 />
               </div>
            </div>
          </div>
          
          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-8">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Address</p>
              <p className="font-bold text-slate-700 text-base flex items-center gap-2"><Mail size={16} className="text-slate-400"/> {profileData.email}</p>
            </div>
            
            {/* Avatar URL Input */}
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avatar Image URL</p>
               <input 
                  type="text" 
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://link-to-your-image.jpg"
                  className="w-full text-sm font-medium text-slate-700 p-2 border-b border-slate-200 focus:outline-none focus:border-indigo-400 bg-transparent"
               />
            </div>
            
            {profileData.type === 'student' ? (
              <>
                <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Class / Branch</p><p className="font-bold text-slate-700 text-base flex items-center gap-2"><GraduationCap size={16} className="text-slate-400"/> {profileData.branch}</p></div>
                <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Roll Number</p><p className="font-bold text-slate-700 text-base">{profileData.rollNumber || 'Not Assigned'}</p></div>
              </>
            ) : profileData.type === 'teacher' ? (
              <div className="sm:col-span-2 mt-4 pt-4 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Assigned Classes & Subjects</p>
                <div className="flex flex-wrap gap-3">
                  {profileData.assignments.length === 0 ? <span className="text-slate-400 text-sm">No classes assigned.</span> : 
                    profileData.assignments.map((opt: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl hover:border-indigo-200 transition-colors">
                        {opt.role === 'class_teacher' ? <Presentation size={20} className="text-indigo-600"/> : <BookOpen size={20} className="text-emerald-600"/>}
                        <div>
                          <p className="text-sm font-bold text-slate-800">{opt.label}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{opt.subject}</p>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            ) : (
              <>
                <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">System Role</p><p className="font-bold text-slate-700 text-base flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-500"/> Super Administrator</p></div>
                <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Access Level</p><p className="font-bold text-slate-700 text-base flex items-center gap-2"><Settings size={16} className="text-slate-400"/> Full System Access</p></div>
              </>
            )}
          </div>

          {/* Save Profile Button */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
             {profileUpdateSuccess ? (
                <span className="text-sm font-bold text-emerald-600 flex items-center gap-2"><CheckCircle size={16} /> Saved!</span>
             ) : <span />}
             
             <button 
                onClick={handleProfileUpdate}
                disabled={isUpdatingProfile}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-70 shadow-sm shadow-indigo-200"
             >
               {isUpdatingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
               Save Changes
             </button>
          </div>
        </div>

        {/* --- SECURITY CARD --- */}
        <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm p-8 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><ShieldCheck size={20} className="text-emerald-500" /> Account Security</h3>
            <p className="text-sm text-slate-500 mb-6">Manage your password and active sessions here.</p>
            <button 
              onClick={() => setIsPasswordModalOpen(true)} 
              className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200"
            >
              Change Password
            </button>
          </div>
          <button 
            onClick={handleLogout} 
            className="w-full py-4 mt-6 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-all border border-rose-100"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* --- PASSWORD CHANGE MODAL --- */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full relative shadow-2xl animate-in slide-in-from-bottom-8">
            
            <button 
              onClick={() => {
                setIsPasswordModalOpen(false);
                setPasswordError(null);
                setPasswords({ current: '', new: '', confirm: '' });
              }} 
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Key size={20} className="text-indigo-600" /> Update Password
            </h2>
            <p className="text-xs text-slate-500 mb-6">Create a new, strong password for your account.</p>

            {passwordSuccess ? (
              <div className="flex flex-col items-center justify-center py-6 gap-3">
                <CheckCircle size={48} className="text-emerald-500 animate-in zoom-in" />
                <p className="font-bold text-slate-700">Password Updated!</p>
              </div>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {passwordError && (
                  <div className="p-3 bg-rose-50 text-rose-600 text-[11px] font-bold rounded-xl flex items-center gap-2 border border-rose-100">
                    <AlertCircle size={14} className="shrink-0" /> {passwordError}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Current Password</label>
                  <input 
                    type="password" required
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                    value={passwords.current}
                    onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">New Password</label>
                  <input 
                    type="password" required minLength={6}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                    value={passwords.new}
                    onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Confirm New Password</label>
                  <input 
                    type="password" required minLength={6}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={passwordLoading}
                  className="w-full mt-4 p-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-70 shadow-lg shadow-indigo-200"
                >
                  {passwordLoading ? <Loader2 size={18} className="animate-spin" /> : 'Save New Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;