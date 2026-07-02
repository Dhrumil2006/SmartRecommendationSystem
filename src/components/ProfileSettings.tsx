import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';
import { Tag, Save, Plus, X, Heart, Settings2 } from 'lucide-react';

interface ProfileSettingsProps {
  userProfile: UserProfile;
  onUpdate: (updatedProfile: UserProfile) => void;
}

const ALL_INTEREST_POOL = [
  "Sci-Fi", "Space", "Drama", "Physics", "Mind-Bending", "Adventure",
  "Action", "Thriller", "Crime", "Heroic", "Dark", "Epic",
  "History", "Non-Fiction", "Philosophy", "Science", "Self-Improvement",
  "Productivity", "Success", "RPG", "Fantasy", "Open-World",
  "Audio", "Wireless", "Music", "Gadgets", "Cyberpunk", "Dystopian"
];

export default function ProfileSettings({ userProfile, onUpdate }: ProfileSettingsProps) {
  const [selectedInterests, setSelectedInterests] = useState<string[]>(userProfile.interests);
  const [customTag, setCustomTag] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest) 
        : [...prev, interest]
    );
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = customTag.trim();
    if (!tag) return;
    
    // Capitalize first letter
    const formattedTag = tag.charAt(0).toUpperCase() + tag.slice(1);
    
    if (!selectedInterests.includes(formattedTag)) {
      setSelectedInterests(prev => [...prev, formattedTag]);
    }
    setCustomTag('');
  };

  const removeInterest = (interest: string) => {
    setSelectedInterests(prev => prev.filter(i => i !== interest));
  };

  const handleSave = async () => {
    if (selectedInterests.length === 0) {
      alert("Please select at least 1 interest category.");
      return;
    }

    setSaving(true);
    setSuccess(false);

    try {
      const userRef = doc(db, 'users', userProfile.id);
      await updateDoc(userRef, {
        interests: selectedInterests
      });

      const updated = {
        ...userProfile,
        interests: selectedInterests
      };

      onUpdate(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Error saving interests. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="profile-settings-card" className="glass-card rounded-2xl p-6 md:p-8 shadow-md">
      <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
        <Settings2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        <div>
          <h2 className="text-xl font-display font-semibold text-slate-900 dark:text-white">
            Interests & Preferences
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Customize the AI engine by updating the topics and genres you prefer.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Active tags display */}
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-3">
            Active Profile Tags ({selectedInterests.length})
          </label>
          <div className="flex flex-wrap gap-2 p-3 bg-slate-100/40 dark:bg-slate-950/20 border border-slate-200/40 dark:border-slate-800/40 rounded-xl min-h-16">
            {selectedInterests.length === 0 ? (
              <span className="text-sm text-slate-400 italic flex items-center justify-center w-full">
                No active tags. Select some tags below or write a custom tag.
              </span>
            ) : (
              selectedInterests.map(interest => (
                <span
                  key={interest}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/40 dark:border-indigo-950/60 rounded-full text-xs font-medium shadow-sm transition-all"
                >
                  {interest}
                  <button
                    onClick={() => removeInterest(interest)}
                    className="hover:bg-indigo-200 dark:hover:bg-indigo-900/40 p-0.5 rounded-full transition-colors cursor-pointer"
                    title={`Remove ${interest}`}
                  >
                    <X className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>

        {/* Custom Interest Input */}
        <form onSubmit={handleAddCustomTag} className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Add custom keyword (e.g. Comedy, Cyberpunk)..."
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/50 dark:bg-slate-900/60 text-slate-900 dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Add</span>
          </button>
        </form>

        {/* Category Pool selection */}
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-3">
            Popular Recommendations Tags
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-52 overflow-y-auto pr-1">
            {ALL_INTEREST_POOL.map((tag) => {
              const isSelected = selectedInterests.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleInterest(tag)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium text-left transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-transparent shadow-md shadow-indigo-600/10'
                      : 'bg-white/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{tag}</span>
                    {isSelected && <Heart className="w-3.5 h-3.5 fill-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-sm">
            {success && (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5 animate-bounce">
                ✓ Interests updated and saved successfully!
              </span>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-md shadow-indigo-600/10"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Save className="w-4.5 h-4.5" />
                <span>Save Interests</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
