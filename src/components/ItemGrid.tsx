import React, { useState } from 'react';
import { Item, Rating, Favorite } from '../types';
import { 
  Star, Heart, Search, Filter, MessageSquare, Sparkles, Send, Calendar, RefreshCw,
  Film, BookOpen, Gamepad2, Cpu, Layers, Tag, X
} from 'lucide-react';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ItemGridProps {
  items: Item[];
  ratings: Rating[];
  favorites: Favorite[];
  userId: string;
  username: string;
  onRatingSubmit: (newRating: Rating) => void;
  onFavoriteToggle: (itemId: string, isFavorited: boolean) => void;
}

export default function ItemGrid({ 
  items, 
  ratings, 
  favorites, 
  userId, 
  username,
  onRatingSubmit, 
  onFavoriteToggle 
}: ItemGridProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedGenre, setSelectedGenre] = useState('All');
  
  // Review form states
  const [activeReviewItemId, setActiveReviewItemId] = useState<string | null>(null);
  const [selectedStars, setSelectedStars] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [analyzingSentiment, setAnalyzingSentiment] = useState(false);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedGenre('All');
  };

  // Get unique tags/genres for currently selected category
  const availableGenres = React.useMemo(() => {
    const relevantItems = selectedCategory === 'All' 
      ? items 
      : items.filter(item => item.category === selectedCategory);
    
    const tagsSet = new Set<string>();
    relevantItems.forEach(item => {
      item.tags.forEach(tag => tagsSet.add(tag));
    });
    
    return Array.from(tagsSet).sort();
  }, [items, selectedCategory]);

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesGenre = selectedGenre === 'All' || item.tags.includes(selectedGenre);
    return matchesSearch && matchesCategory && matchesGenre;
  });

  const handleFavoriteClick = async (itemId: string) => {
    const existingFavorite = favorites.find(f => f.itemId === itemId && f.userId === userId);
    const isFavorited = !!existingFavorite;

    try {
      if (isFavorited) {
        // Delete favorite
        await deleteDoc(doc(db, 'favorites', existingFavorite.id));
        onFavoriteToggle(itemId, false);
      } else {
        // Create favorite
        const favoriteId = `${userId}_${itemId}`;
        const newFavorite: Favorite = {
          id: favoriteId,
          userId,
          itemId,
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'favorites', favoriteId), newFavorite);
        onFavoriteToggle(itemId, true);
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent, itemId: string) => {
    e.preventDefault();
    if (!reviewText.trim()) return;

    setAnalyzingSentiment(true);

    try {
      // 1. Hit Express Backend to analyze sentiment with Gemini
      const sentimentResponse = await fetch('/api/sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review: reviewText, rating: selectedStars })
      });
      const sentimentData = await sentimentResponse.json();

      const ratingId = `${userId}_${itemId}_${Date.now()}`;
      const newRating: Rating = {
        id: ratingId,
        userId,
        itemId,
        rating: selectedStars,
        review: reviewText,
        sentiment: sentimentData.sentiment || "Neutral",
        explanation: sentimentData.explanation || "",
        createdAt: new Date().toISOString(),
        username: username,
        itemTitle: items.find(it => it.id === itemId)?.title || 'Item'
      };

      // 2. Save rating document to Firestore
      await setDoc(doc(db, 'ratings', ratingId), newRating);
      onRatingSubmit(newRating);

      // Reset form states
      setReviewText('');
      setSelectedStars(5);
      setActiveReviewItemId(null);
    } catch (err) {
      console.error("Failed to submit rating review:", err);
    } finally {
      setAnalyzingSentiment(false);
    }
  };

  const categoriesList = [
    { id: 'All', name: 'All Categories', icon: Layers, color: 'text-slate-500' },
    { id: 'Movies', name: 'Movies', icon: Film, color: 'text-rose-500' },
    { id: 'Books', name: 'Books', icon: BookOpen, color: 'text-amber-500' },
    { id: 'Games', name: 'Games', icon: Gamepad2, color: 'text-emerald-500' },
    { id: 'Tech', name: 'Tech', icon: Cpu, color: 'text-indigo-500' },
  ];

  const getSentimentBadgeColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'Positive': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400';
      case 'Negative': return 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400';
      default: return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters toolbar */}
      <div className="glass-card rounded-2xl p-5 md:p-6 space-y-5 border border-slate-100 dark:border-slate-800/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Filter className="w-4.5 h-4.5 text-indigo-500" />
              <span>Filter & Discover Catalog</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Explore books, movies, games and gadgets filtered by category or specific tag</p>
          </div>
          
          {/* Active filters summary */}
          {(selectedCategory !== 'All' || selectedGenre !== 'All' || searchTerm) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
                setSelectedGenre('All');
              }}
              className="self-start lg:self-auto px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/25 dark:border-indigo-800/35 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1">
          {/* Search Input */}
          <div className="relative md:col-span-5">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="item-search-input"
              type="text"
              placeholder="Search items, descriptions, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/50 dark:bg-slate-900/40 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 transition-all"
            />
          </div>

          {/* Category Selector Tab Buttons */}
          <div id="category-filters" className="md:col-span-7 flex flex-wrap gap-2">
            {categoriesList.map(cat => {
              const IconComp = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide flex items-center gap-2 transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/15'
                      : 'bg-white/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                  }`}
                >
                  <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : cat.color}`} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Genre/Tag Pills Selector */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter by Genre / Tag:</span>
          </div>
          
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
            <button
              onClick={() => setSelectedGenre('All')}
              className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide transition-all cursor-pointer border ${
                selectedGenre === 'All'
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 font-bold'
                  : 'bg-white/30 dark:bg-slate-900/20 border-slate-200/50 dark:border-slate-800/50 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300'
              }`}
            >
              All Genres
            </button>
            {availableGenres.map(tag => {
              const isSelected = selectedGenre === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedGenre(tag)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/40 font-extrabold shadow-sm'
                      : 'bg-white/30 dark:bg-slate-900/20 border-slate-200/50 dark:border-slate-800/50 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Counter and status banner */}
        <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 pt-1">
          <div>
            Showing <strong className="text-slate-700 dark:text-slate-200">{filteredItems.length}</strong> of <strong className="text-slate-700 dark:text-slate-200">{items.length}</strong> available items
          </div>
          {(selectedCategory !== 'All' || selectedGenre !== 'All' || searchTerm) && (
            <div className="text-indigo-600 dark:text-indigo-400 font-bold">
              Active filters applied
            </div>
          )}
        </div>
      </div>

      {/* Grid displays */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-2xl">
          <Filter className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">No Items Found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Try relaxing your search query or choosing another category.</p>
        </div>
      ) : (
        <div id="items-grid-list" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredItems.map(item => {
            const isFavorited = favorites.some(f => f.itemId === item.id && f.userId === userId);
            const itemReviews = ratings.filter(r => r.itemId === item.id);
            const averageStars = itemReviews.length > 0 
              ? (itemReviews.reduce((sum, r) => sum + r.rating, 0) / itemReviews.length).toFixed(1)
              : item.averageRating.toFixed(1);
            const totalReviewsCount = itemReviews.length > 0 ? itemReviews.length : item.ratingCount;

            return (
              <div 
                key={item.id}
                id={`item-card-${item.id}`}
                className="glass-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative border border-slate-100 dark:border-slate-800"
              >
                {/* Image Section */}
                <div className="h-44 relative overflow-hidden bg-slate-900/10">
                  {item.imageUrl ? (
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-3xl font-bold font-display">
                      {item.title.substring(0, 1)}
                    </div>
                  )}
                  {/* Category overlay */}
                  <span className="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-black/50 backdrop-blur-md text-white rounded-full">
                    {item.category}
                  </span>

                  {/* Favorite button overlay */}
                  <button
                    onClick={() => handleFavoriteClick(item.id)}
                    className="absolute top-3 right-3 p-2 bg-white/70 hover:bg-white dark:bg-slate-900/70 dark:hover:bg-slate-900 backdrop-blur-md rounded-xl text-rose-500 hover:scale-105 transition-all shadow-sm cursor-pointer"
                    title={isFavorited ? "Remove from Favorites" : "Add to Favorites"}
                  >
                    <Heart className={`w-4.5 h-4.5 ${isFavorited ? 'fill-rose-500 text-rose-500' : 'text-slate-600 dark:text-slate-300'}`} />
                  </button>
                </div>

                {/* Info block */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white tracking-tight">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {averageStars}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({totalReviewsCount})
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">
                      {item.description}
                    </p>
                  </div>

                  {/* Item tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map(tag => (
                      <span 
                        key={tag} 
                        className="px-2 py-0.5 bg-slate-100 dark:bg-slate-950/40 text-[10px] text-slate-500 dark:text-slate-400 rounded-md font-medium border border-slate-200/20 dark:border-slate-800/20"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Review Expand Action Block */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => setActiveReviewItemId(activeReviewItemId === item.id ? null : item.id)}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{activeReviewItemId === item.id ? 'Close Reviews' : 'Write & View Reviews'}</span>
                    </button>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                      ID: {item.id.replace('movie_', '').replace('book_', '').replace('game_', '').replace('tech_', '')}
                    </span>
                  </div>
                </div>

                {/* Reviews / Feedback Panel Drawer */}
                {activeReviewItemId === item.id && (
                  <div className="bg-slate-50/55 dark:bg-slate-950/35 border-t border-slate-100 dark:border-slate-800/80 p-5 space-y-4 max-h-96 overflow-y-auto">
                    
                    {/* Add Review Form */}
                    <form onSubmit={(e) => handleReviewSubmit(e, item.id)} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Rate this item:</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setSelectedStars(star)}
                              className="text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                            >
                              <Star className={`w-5.5 h-5.5 ${star <= selectedStars ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'}`} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="relative">
                        <textarea
                          placeholder="Write a short review... Our AI engine will analyze your sentiment and adapt future recommendations."
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/80 dark:bg-slate-900/80 text-slate-900 dark:text-white"
                          rows={2}
                          maxLength={300}
                          required
                        />
                        <button
                          type="submit"
                          disabled={analyzingSentiment || !reviewText.trim()}
                          className="absolute bottom-2.5 right-2.5 p-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors flex items-center justify-center cursor-pointer disabled:opacity-40"
                          title="Submit Review"
                        >
                          {analyzingSentiment ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </form>

                    {/* Past Reviews Listing */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span>User Reviews</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px]">
                          {itemReviews.length}
                        </span>
                      </h4>

                      {itemReviews.length === 0 ? (
                        <p className="text-xs italic text-slate-400 text-center py-2">No reviews left yet. Be the first to leave one!</p>
                      ) : (
                        <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800/60 max-h-60 overflow-y-auto">
                          {itemReviews.map((rev) => (
                            <div key={rev.id} className="pt-2.5 first:pt-0 space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">@{rev.username || 'user'}</span>
                                <div className="flex items-center gap-1 text-slate-400 font-mono">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                  <span className="text-slate-800 dark:text-slate-200 font-bold">{rev.rating}/5</span>
                                </div>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white/30 dark:bg-slate-900/30 p-2 rounded-lg">
                                {rev.review}
                              </p>

                              {/* Sentiment indicators */}
                              {rev.sentiment && (
                                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider ${getSentimentBadgeColor(rev.sentiment)}`}>
                                    <Sparkles className="w-2.5 h-2.5" />
                                    <span>Sentiment: {rev.sentiment}</span>
                                  </span>
                                  {rev.explanation && (
                                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 italic">
                                      AI Analysis: "{rev.explanation}"
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
