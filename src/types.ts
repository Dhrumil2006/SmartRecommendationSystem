export interface UserProfile {
  id: string;
  email: string;
  username: string;
  interests: string[];
  createdAt: string;
  theme: 'light' | 'dark';
}

export interface Item {
  id: string;
  title: string;
  description: string;
  category: string; // "Movies" | "Books" | "Tech" | "Games"
  tags: string[];
  averageRating: number;
  ratingCount: number;
  imageUrl?: string;
}

export interface Rating {
  id: string;
  userId: string;
  itemId: string;
  rating: number; // 1-5
  review: string;
  sentiment?: string; // "Positive" | "Neutral" | "Negative"
  explanation?: string; // AI explanation
  createdAt: string;
  username?: string; // Cache for display
  itemTitle?: string; // Cache for display
}

export interface Favorite {
  id: string;
  userId: string;
  itemId: string;
  createdAt: string;
}

export interface RecommendationLog {
  id: string;
  userId: string;
  query: string;
  recommendedItemIds: string[];
  explanations: string[]; // Corresponding explanation for why each was recommended
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  createdAt: string;
  recommendedItems?: Item[];
}
