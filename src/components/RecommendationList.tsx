import React, { useState, useEffect } from 'react';
import { Item, Rating, Favorite } from '../types';
import { 
  Sparkles, Search, Compass, AlertCircle, Bookmark, Star, Heart, RefreshCw, Send
} from 'lucide-react';

interface RecommendationListProps {
  items: Item[];
  ratings: Rating[];
  favorites: Favorite[];
  userId: string;
  onFavoriteToggle: (itemId: string, isFavorited: boolean) => void;
  interests: string[];
}

interface RecommendedItemEntry {
  itemId: string;
  reason: string;
}

export default function RecommendationList({
  items,
  ratings,
  favorites,
  userId,
  onFavoriteToggle,
  interests
}: RecommendationListProps) {
  const [query, setQuery] = useState('');
  const [recommendations, setRecommendations] = useState<RecommendedItemEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [engineSource, setEngineSource] = useState('Rule-Based Engine');

  const fetchRecommendations = async (customQuery = '') => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interests,
          favorites: favorites.map(f => f.itemId),
          ratings: ratings.map(r => ({ itemId: r.itemId, rating: r.rating, review: r.review })),
          query: customQuery
        })
      });

      const data = await response.json();
      if (data.success) {
        setRecommendations(data.recommendations || []);
        setEngineSource(data.source || 'AI Engine');
      } else {
        setError(data.error || 'Failed to fetch recommendations.');
      }
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
      setError('Connection to recommendation backend failed.');
    } finally {
      setLoading(false);
    }
  };

  // Run on load and whenever interests, favorites, or ratings changes
  useEffect(() => {
    fetchRecommendations();
  }, [interests.length, favorites.length, ratings.length]);

  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecommendations(query);
  };

  const getFullItemDetails = (itemId: string): Item | undefined => {
    return items.find(it => it.id === itemId);
  };

  return (
    <div className="space-y-6">
      {/* Search Header banner */}
      <div className="glass p-5 md:p-6 rounded-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Decorative lighting glow */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/15 dark:bg-indigo-500/25 rounded-full blur-2xl pointer-events-none"></div>

        <div className="space-y-1 relative z-10 max-w-xl">
          <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500 dark:text-indigo-400 animate-pulse" />
            <span>AI recommendation wizard</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tell the AI model what you are craving in natural language, or let it recommend matching items dynamically.
          </p>
        </div>

        {engineSource && (
          <span className="px-3 py-1 bg-indigo-600/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200/40 dark:border-indigo-900/40 text-[10px] font-mono font-semibold uppercase tracking-wider rounded-full relative z-10">
            Powered by: {engineSource}
          </span>
        )}
      </div>

      {/* Query input form */}
      <form onSubmit={handleQuerySubmit} id="ai-query-form" className="flex gap-2">
        <div className="relative flex-1">
          <Compass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="e.g. recommend a deeply immersive RPG game with magical themes and challenging gameplay..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/50 dark:bg-slate-900/40 text-slate-900 dark:text-white"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all font-medium flex items-center gap-1.5 cursor-pointer text-sm"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Ask AI</span>
            </>
          )}
        </button>
      </form>

      {/* Recommended items view list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400 font-medium">Drafting custom recommendations with Gemini AI...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="text-center py-12 glass-card rounded-xl">
          <Bookmark className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-500 dark:text-slate-400">No recommended matches. Fill out some interests or type a custom request!</p>
        </div>
      ) : (
        <div id="ai-recs-grid" className="space-y-4">
          {recommendations.map((entry) => {
            const item = getFullItemDetails(entry.itemId);
            if (!item) return null;

            const isFavorited = favorites.some(f => f.itemId === item.id && f.userId === userId);

            return (
              <div 
                key={entry.itemId} 
                className="glass-card rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-5 items-start border border-slate-100 dark:border-slate-800"
              >
                {/* Visual Thumbnail */}
                <div className="w-full md:w-36 h-28 rounded-xl overflow-hidden flex-shrink-0 bg-slate-900/10">
                  {item.imageUrl ? (
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold font-display">
                      {item.title[0]}
                    </div>
                  )}
                </div>

                {/* Content details & explanation */}
                <div className="flex-1 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                        {item.category}
                      </span>
                      <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white tracking-tight">
                        {item.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Rating details */}
                      <div className="flex items-center gap-1 text-xs font-semibold text-slate-800 dark:text-slate-300">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span>{item.averageRating}</span>
                      </div>

                      {/* Favorite button */}
                      <button
                        onClick={() => onFavoriteToggle(item.id, !isFavorited)}
                        className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isFavorited 
                            ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30' 
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-rose-400'
                        }`}
                        title={isFavorited ? "Favorited" : "Add to Favorites"}
                      >
                        <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-500' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {item.description}
                  </p>

                  {/* AI Explanation block */}
                  <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/25 border border-indigo-100/50 dark:border-indigo-950/50 space-y-1 relative">
                    <div className="flex items-center gap-1 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Why this is recommended:</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                      "{entry.reason}"
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
