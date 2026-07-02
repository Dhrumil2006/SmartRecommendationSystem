import { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { UserProfile, Item, Rating, Favorite } from './types';

// Import components
import LoginModal from './components/LoginModal';
import ThemeToggle from './components/ThemeToggle';
import DashboardStats from './components/DashboardStats';
import ItemGrid from './components/ItemGrid';
import RecommendationList from './components/RecommendationList';
import ProfileSettings from './components/ProfileSettings';
import ChatAssistant from './components/ChatAssistant';

import { 
  Sparkles, LogOut, LayoutDashboard, Compass, Bookmark, Settings, 
  User, Shield, Loader2, ListCollapse
} from 'lucide-react';

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  
  // App UI states
  const [activeTab, setActiveTab] = useState<'dashboard' | 'items' | 'recommendations' | 'profile'>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // 1. Sync Authentication and fetch user profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          // Fetch user profile from Firestore
          const profileDoc = await getDoc(doc(db, 'users', user.uid));
          if (profileDoc.exists()) {
            setUserProfile(profileDoc.data() as UserProfile);
            // Apply profile theme if saved
            const savedTheme = profileDoc.data().theme || 'dark';
            setTheme(savedTheme as 'light' | 'dark');
          } else {
            // Fallback user profile structure
            const fallbackProfile: UserProfile = {
              id: user.uid,
              email: user.email || '',
              username: user.displayName || 'user',
              interests: ['Sci-Fi', 'Space', 'Drama'],
              createdAt: new Date().toISOString(),
              theme: 'dark'
            };
            setUserProfile(fallbackProfile);
          }
          
          // Fetch data associated with authenticated user
          await Promise.all([
            fetchItemsData(),
            fetchUserRatings(user.uid),
            fetchUserFavorites(user.uid)
          ]);
        } catch (error) {
          console.error("Failed to sync authenticated user profile data:", error);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Track & Apply Dark/Light mode theme change
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // 3. Fetch Items catalog from full-stack API
  const fetchItemsData = async () => {
    try {
      const response = await fetch('/api/items');
      const data = await response.json();
      if (data.success) {
        setItems(data.items || []);
      }
    } catch (err) {
      console.error("Failed to fetch items:", err);
    }
  };

  // 4. Fetch User Ratings from Firestore
  const fetchUserRatings = async (uid: string) => {
    try {
      const ratingsRef = collection(db, 'ratings');
      const q = query(ratingsRef, where('userId', '==', uid));
      const querySnapshot = await getDocs(q);
      const userRatings: Rating[] = [];
      querySnapshot.forEach((docSnap) => {
        userRatings.push(docSnap.data() as Rating);
      });
      setRatings(userRatings);
    } catch (err) {
      console.error("Failed to fetch user ratings:", err);
    }
  };

  // 5. Fetch User Bookmarks from Firestore
  const fetchUserFavorites = async (uid: string) => {
    try {
      const favoritesRef = collection(db, 'favorites');
      const q = query(favoritesRef, where('userId', '==', uid));
      const querySnapshot = await getDocs(q);
      const userFavs: Favorite[] = [];
      querySnapshot.forEach((docSnap) => {
        userFavs.push(docSnap.data() as Favorite);
      });
      setFavorites(userFavs);
    } catch (err) {
      console.error("Failed to fetch user favorites:", err);
    }
  };

  // 6. Support handlers for child components
  const handleRatingSubmit = (newRating: Rating) => {
    setRatings(prev => {
      const index = prev.findIndex(r => r.itemId === newRating.itemId);
      if (index > -1) {
        const copy = [...prev];
        copy[index] = newRating;
        return copy;
      }
      return [...prev, newRating];
    });
  };

  const handleFavoriteToggle = (itemId: string, isFavorited: boolean) => {
    if (isFavorited) {
      const newFav: Favorite = {
        id: `${firebaseUser?.uid}_${itemId}`,
        userId: firebaseUser?.uid || '',
        itemId,
        createdAt: new Date().toISOString()
      };
      setFavorites(prev => [...prev, newFav]);
    } else {
      setFavorites(prev => prev.filter(f => f.itemId !== itemId));
    }
  };

  const handleLogout = async () => {
    if (confirm("Are you sure you want to sign out?")) {
      await signOut(auth);
    }
  };

  // Render Loader spinner on initial auth loading states
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <span className="text-sm font-medium text-slate-400">Loading SmartRec AI environment...</span>
      </div>
    );
  }

  // If no authenticated user, render polished Login and Sign-Up flows
  if (!firebaseUser || !userProfile) {
    return (
      <LoginModal 
        onSuccess={(uid) => {
          console.log("Logged in:", uid);
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-50 via-neutral-100 to-indigo-50/55 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/40 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-500">
      
      {/* 1. Sidebar Navigation */}
      <aside 
        id="app-sidebar"
        className={`${
          sidebarOpen ? 'w-full md:w-64' : 'w-full md:w-20'
        } bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border-b md:border-b-0 md:border-r border-slate-200/60 dark:border-slate-800/80 flex flex-col justify-between p-5 transition-all duration-300 relative z-40`}
      >
        <div className="space-y-8">
          {/* Logo Brand Panel */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-600/10">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              {sidebarOpen && (
                <div>
                  <h1 className="text-base font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
                    SmartRec AI
                  </h1>
                  <span className="text-[9px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold tracking-wider uppercase block">Recommendation</span>
                </div>
              )}
            </div>

            {/* Collapse Sidebar Button on Desktop */}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:flex p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors cursor-pointer"
              title="Toggle sidebar size"
            >
              <ListCollapse className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Nav Links Block */}
          <nav className="space-y-1.5">
            {/* Tab: Dashboard */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>My Dashboard</span>}
            </button>

            {/* Tab: Browse Items */}
            <button
              onClick={() => setActiveTab('items')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'items'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Bookmark className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>Item Directory</span>}
            </button>

            {/* Tab: AI Recommendations */}
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'recommendations'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Compass className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>AI Matcher</span>}
            </button>

            {/* Tab: Profile */}
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>AI Customizer</span>}
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Details */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
          {/* User profile brief card */}
          {sidebarOpen && (
            <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-950/45 border border-slate-200/30 dark:border-slate-800/40 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                <User className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">@{userProfile.username}</p>
                <p className="text-[10px] text-slate-400 truncate">{userProfile.email}</p>
              </div>
            </div>
          )}

          {/* Theme toggler and logout */}
          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} onChange={(t) => setTheme(t)} />
            {sidebarOpen && (
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 dark:text-slate-400 transition-all text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* 2. Main Content panel */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Navigation/Header Bar */}
        <header className="bg-white/40 dark:bg-slate-900/30 border-b border-slate-200/50 dark:border-slate-800/50 py-4 px-6 flex items-center justify-between backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-display font-extrabold text-slate-900 dark:text-white capitalize tracking-tight">
              {activeTab === 'dashboard' ? 'Overview Dashboard' : 
               activeTab === 'items' ? 'Item Catalog Directory' : 
               activeTab === 'recommendations' ? 'AI recommendation hub' : 
               'Interests and engine settings'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick state indicators */}
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-mono px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full font-bold">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
              Secure Database synchronized
            </span>
          </div>
        </header>

        {/* Tab content screens */}
        <div className="p-6 md:p-8 max-w-7xl w-full mx-auto flex-1 space-y-6">
          {activeTab === 'dashboard' && (
            <DashboardStats 
              userProfile={userProfile} 
              ratings={ratings} 
              favorites={favorites} 
              items={items}
              onRemoveFavorite={(itemId) => handleFavoriteToggle(itemId, false)}
              onSelectTab={(tab) => setActiveTab(tab as any)}
            />
          )}

          {activeTab === 'items' && (
            <ItemGrid 
              items={items}
              ratings={ratings}
              favorites={favorites}
              userId={userProfile.id}
              username={userProfile.username}
              onRatingSubmit={handleRatingSubmit}
              onFavoriteToggle={handleFavoriteToggle}
            />
          )}

          {activeTab === 'recommendations' && (
            <RecommendationList 
              items={items}
              ratings={ratings}
              favorites={favorites}
              userId={userProfile.id}
              interests={userProfile.interests}
              onFavoriteToggle={handleFavoriteToggle}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileSettings 
              userProfile={userProfile}
              onUpdate={(updated) => setUserProfile(updated)}
            />
          )}
        </div>

        {/* Interactive Floating Chat Assistant help */}
        <ChatAssistant 
          items={items}
          ratings={ratings}
          favorites={favorites}
          interests={userProfile.interests}
          userId={userProfile.id}
        />
      </main>
    </div>
  );
}
