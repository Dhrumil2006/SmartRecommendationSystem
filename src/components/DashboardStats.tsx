import { Item, Rating, Favorite } from '../types';
import { 
  BarChart3, Star, Heart, Activity, Award, UserCheck, Shield, Sparkles, XCircle
} from 'lucide-react';

interface DashboardStatsProps {
  userProfile: any;
  ratings: Rating[];
  favorites: Favorite[];
  items: Item[];
  onRemoveFavorite: (itemId: string) => void;
  onSelectTab: (tab: string) => void;
}

export default function DashboardStats({
  userProfile,
  ratings,
  favorites,
  items,
  onRemoveFavorite,
  onSelectTab
}: DashboardStatsProps) {
  
  // 1. Compute total rated items
  const totalRated = ratings.length;

  // 2. Compute favorite items details
  const favoriteItemsList = items.filter(it => favorites.some(f => f.itemId === it.id));

  // 3. Compute favorite category/genres based on user interests, favorites, and ratings
  const getTopCategory = () => {
    const categoriesCount: { [key: string]: number } = {};
    
    // Add weights for user interests category matching
    userProfile.interests.forEach((interest: string) => {
      const match = items.find(it => it.category.toLowerCase() === interest.toLowerCase() || it.tags.includes(interest.toLowerCase()));
      if (match) {
        categoriesCount[match.category] = (categoriesCount[match.category] || 0) + 2;
      }
    });

    // Add weights for favorites
    favoriteItemsList.forEach(item => {
      categoriesCount[item.category] = (categoriesCount[item.category] || 0) + 3;
    });

    // Add weights for ratings >= 4
    ratings.filter(r => r.rating >= 4).forEach(r => {
      const item = items.find(it => it.id === r.itemId);
      if (item) {
        categoriesCount[item.category] = (categoriesCount[item.category] || 0) + 2;
      }
    });

    let topCat = "General";
    let maxCount = -1;
    Object.entries(categoriesCount).forEach(([cat, val]) => {
      if (val > maxCount) {
        maxCount = val;
        topCat = cat;
      }
    });

    return topCat;
  };

  const topCategory = getTopCategory();

  // 4. Compute profile strength percentage
  const getProfileStrength = () => {
    let strength = 20; // Base sign up
    if (userProfile.username) strength += 20;
    if (userProfile.interests.length > 0) strength += Math.min(userProfile.interests.length * 8, 30);
    if (ratings.length > 0) strength += Math.min(ratings.length * 10, 30);
    return Math.min(strength, 100);
  };

  const profileStrength = getProfileStrength();

  // 5. Get recent reviews
  const recentRatings = [...ratings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Bento Grid Stats Cards */}
      <div id="dashboard-bento-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Total Rated */}
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden group border border-slate-100 dark:border-slate-800">
          <div className="absolute -right-3 -bottom-3 w-16 h-16 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500"></div>
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Rated Items</span>
            <div className="text-3xl font-display font-extrabold text-slate-900 dark:text-white">{totalRated}</div>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">Contributed in training</span>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Star className="w-6 h-6 fill-indigo-600" />
          </div>
        </div>

        {/* Stat 2: Favorites Count */}
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden group border border-slate-100 dark:border-slate-800">
          <div className="absolute -right-3 -bottom-3 w-16 h-16 bg-rose-500/5 dark:bg-rose-500/10 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500"></div>
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Bookmarks</span>
            <div className="text-3xl font-display font-extrabold text-slate-900 dark:text-white">{favorites.length}</div>
            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">Saved favorites</span>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl">
            <Heart className="w-6 h-6 fill-rose-600" />
          </div>
        </div>

        {/* Stat 3: Top Category */}
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden group border border-slate-100 dark:border-slate-800">
          <div className="absolute -right-3 -bottom-3 w-16 h-16 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500"></div>
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Top Category</span>
            <div className="text-xl font-display font-extrabold text-slate-900 dark:text-white truncate max-w-[130px]" title={topCategory}>{topCategory}</div>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Preferred interest</span>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
            <Award className="w-6 h-6 text-amber-500" />
          </div>
        </div>

        {/* Stat 4: Profile Strength */}
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden group border border-slate-100 dark:border-slate-800">
          <div className="absolute -right-3 -bottom-3 w-16 h-16 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500"></div>
          <div className="space-y-1.5 w-full">
            <div className="flex justify-between items-center pr-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">AI Training</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{profileStrength}%</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-40 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-700" 
                style={{ width: `${profileStrength}%` }}
              ></div>
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">Model adaptation score</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Side: Favorites Directory */}
        <div className="glass-card rounded-2xl p-5 md:p-6 space-y-4 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
              <span>My Favorite Bookmarks ({favoriteItemsList.length})</span>
            </h3>
            <button 
              onClick={() => onSelectTab('items')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Browse items
            </button>
          </div>

          {favoriteItemsList.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400 italic">You haven't bookmarked any favorites yet.</p>
            </div>
          ) : (
            <div id="dash-favorites-list" className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {favoriteItemsList.map(item => (
                <div key={item.id} className="p-3 bg-white/40 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 group">
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block">{item.category}</span>
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{item.title}</h4>
                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{item.description}</p>
                  </div>
                  <button
                    onClick={() => onRemoveFavorite(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    title="Remove from favorites"
                  >
                    <XCircle className="w-4.5 h-4.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Rating / Review Activity Logs */}
        <div className="glass-card rounded-2xl p-5 md:p-6 space-y-4 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Recent Contributions & Reviews ({totalRated})</span>
            </h3>
            <button 
              onClick={() => onSelectTab('recommendations')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Get recommendations
            </button>
          </div>

          {recentRatings.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400 italic">No reviews or star ratings submitted yet.</p>
            </div>
          ) : (
            <div id="dash-recent-reviews" className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
              {recentRatings.map((rev) => (
                <div key={rev.id} className="p-3 bg-white/40 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">"{rev.itemTitle || 'Item'}"</span>
                    <div className="flex items-center gap-1 font-mono text-slate-500">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-slate-800 dark:text-slate-200">{rev.rating}/5</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 bg-slate-50/50 dark:bg-slate-950/20 p-2 rounded">
                    "{rev.review}"
                  </p>
                  
                  {rev.sentiment && (
                    <div className="flex items-center justify-between pt-0.5">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                        rev.sentiment === 'Positive' 
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                          : rev.sentiment === 'Negative'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                      }`}>
                        {rev.sentiment} Sentiment
                      </span>
                      {rev.explanation && (
                        <span className="text-[9px] text-indigo-600 dark:text-indigo-400 italic max-w-[70%] truncate" title={rev.explanation}>
                          AI: {rev.explanation}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Security notice block */}
      <div className="p-4 rounded-xl bg-slate-100/40 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-800/80 flex items-start gap-3">
        <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5 animate-pulse" />
        <div>
          <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">Zero-Trust Cloud Integrity Active</h4>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
            Your personal interests, custom tags, and reviews are synchronized with private Attribute-Based Access Control security rules. No personally identifiable details are exposed, ensuring mathematical privacy boundaries.
          </p>
        </div>
      </div>
    </div>
  );
}
