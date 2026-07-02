import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { LogIn, UserPlus, Mail, Lock, User as UserIcon, ShieldAlert, Sparkles } from 'lucide-react';

interface LoginModalProps {
  onSuccess: (userId: string) => void;
}

const INTEREST_OPTIONS = [
  "Sci-Fi", "Space", "Drama", "Physics", "Mind-Bending", "Adventure",
  "Action", "Thriller", "Crime", "Heroic", "Dark", "Epic",
  "History", "Non-Fiction", "Philosophy", "Science", "Self-Improvement",
  "Productivity", "Success", "RPG", "Fantasy", "Open-World",
  "Audio", "Wireless", "Music", "Gadgets", "Cyberpunk", "Dystopian"
];

export default function LoginModal({ onSuccess }: LoginModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest) 
        : [...prev, interest]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    if (isRegister && !username) {
      setError('Username is required for registration.');
      setLoading(false);
      return;
    }

    if (isRegister && selectedInterests.length === 0) {
      setError('Please select at least 1 interest to customize your recommendations.');
      setLoading(false);
      return;
    }

    try {
      if (isRegister) {
        // Register user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update auth profile display name
        await updateProfile(user, { displayName: username });

        // Save custom profile record in Firestore
        const userProfile = {
          id: user.uid,
          email: user.email || '',
          username: username,
          interests: selectedInterests,
          createdAt: new Date().toISOString(),
          theme: 'dark'
        };

        await setDoc(doc(db, 'users', user.uid), userProfile);
        onSuccess(user.uid);
      } else {
        // Login user
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        onSuccess(userCredential.user.uid);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let errMsg = "Authentication failed. Please check your inputs.";
      if (err.code === 'auth/email-already-in-use') {
        errMsg = "This email is already registered.";
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errMsg = "Incorrect email or password.";
      } else if (err.code === 'auth/weak-password') {
        errMsg = "Password must be at least 6 characters long.";
      } else if (err.code === 'auth/invalid-email') {
        errMsg = "Please enter a valid email address.";
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Check if user profile already exists
      const profileRef = doc(db, 'users', user.uid);
      const profileDoc = await getDoc(profileRef);

      if (!profileDoc.exists()) {
        const userProfile = {
          id: user.uid,
          email: user.email || '',
          username: user.displayName || user.email?.split('@')[0] || 'user',
          interests: selectedInterests.length > 0 ? selectedInterests : ['Sci-Fi', 'Space', 'Drama'],
          createdAt: new Date().toISOString(),
          theme: 'dark'
        };
        await setDoc(profileRef, userProfile);
      }
      onSuccess(user.uid);
    } catch (err: any) {
      console.error("Google Auth error:", err);
      let errMsg = "Google Authentication failed.";
      if (err.code === 'auth/popup-closed-by-user') {
        errMsg = "Sign-in popup was closed before completing.";
      } else if (err.code === 'auth/operation-not-allowed') {
        errMsg = "Google sign-in is not enabled in the Firebase console.";
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-indigo-50/40 via-neutral-100 to-indigo-100/50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/40 px-4 py-12 transition-colors duration-500">
      <div id="login-container-card" className="w-full max-w-xl glass-card rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
        {/* Decorative ambient blobs */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-violet-500/10 dark:bg-violet-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex items-center justify-center p-3.5 bg-indigo-600/10 dark:bg-indigo-500/25 rounded-2xl text-indigo-600 dark:text-indigo-400 mb-4 animate-pulse">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tight">
            SmartRec AI
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
            {isRegister 
              ? "Create a personalized account to experience next-generation content recommendation."
              : "Welcome back! Connect to access your personalized recommendation hub."}
          </p>
        </div>

        {error && (
          <div id="auth-error-alert" className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm flex items-start gap-3 relative z-10 animate-shake">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Authentication Issue</span>
              <p className="text-xs leading-relaxed">{error}</p>
              <p className="text-[10px] mt-1 text-rose-500/80">
                Note: Email/Password login will fail unless enabled in your Firebase console. Use the Google Auth button below for instant signup.
              </p>
            </div>
          </div>
        )}

        <div className="mb-6 p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/40 dark:border-indigo-900/30 text-slate-700 dark:text-slate-300 text-xs flex items-start gap-3 relative z-10">
          <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5 animate-pulse" />
          <div>
            <span className="font-bold text-slate-900 dark:text-white block mb-0.5">⚡ Instant Signup & Access</span>
            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              Use <strong className="text-indigo-600 dark:text-indigo-400">Google Auth</strong> below for an immediate, zero-setup account. Email/Password registration requires manual provider setup in your Firebase Console.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          {isRegister && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wider uppercase block">
                Username
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="reg-username"
                  type="text"
                  placeholder="e.g. alex_p"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/50 dark:bg-slate-900/60 text-slate-900 dark:text-white transition-all"
                  required={isRegister}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wider uppercase block">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="auth-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/50 dark:bg-slate-900/60 text-slate-900 dark:text-white transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wider uppercase block">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="auth-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/50 dark:bg-slate-900/60 text-slate-900 dark:text-white transition-all"
                required
              />
            </div>
          </div>

          {isRegister && (
            <div className="space-y-3 pt-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wider uppercase block">
                Select Your Interests & Topics (Min 1)
              </label>
              <div id="interest-pills-container" className="max-h-36 overflow-y-auto p-2 rounded-xl bg-slate-100/60 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/50 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {INTEREST_OPTIONS.map((interest) => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-all truncate cursor-pointer ${
                        isSelected 
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                          : 'bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-400 dark:hover:border-indigo-500'
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-4 rounded-xl font-medium bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:shadow-lg hover:shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : isRegister ? (
              <>
                <UserPlus className="w-5 h-5" />
                <span>Create Personalized Account</span>
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Sign In Securely</span>
              </>
            )}
          </button>
        </form>

        <div className="relative my-6 relative z-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-slate-900 px-3 text-slate-500 dark:text-slate-400 font-semibold tracking-wide">
              Or use Google Auth (Instant)
            </span>
          </div>
        </div>

        <button
          id="google-signin-btn"
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3.5 rounded-xl font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-white transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:pointer-events-none shadow-sm relative z-10"
        >
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Sign In / Register with Google</span>
        </button>

        <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400 relative z-10 border-t border-slate-100 dark:border-slate-800/80 pt-6">
          {isRegister ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setError('');
                }}
                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              New to SmartRec AI?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setError('');
                }}
                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
              >
                Register Account
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
