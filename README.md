# Smart Recommendation System 🌌

A highly polished, modern, full-stack **AI-Powered Recommendation System** built with **React**, **Vite**, **Express**, and **Firebase Firestore** with robust ABAC security rules. 

This system matches items (movies, books, games, tech gadgets) using **content-based filtering** and dynamically adapting **Gemini 3.5 Flash** models to generate personalized dashboards, reviews, custom natural-language recommendations, and an active helper chatbot.

---

## 🎨 Design and Visuals

- **Modern Glassmorphism Theme**: Visual depth through custom blur filters (`backdrop-filter`), elegant off-white light profiles, deep slate dark canvases, and smooth interactive layout transitions.
- **Micro-Animations**: Staggered entrances, loading adaptions, dynamic rating star selections, and ambient background light blobs.
- **Adaptive Spacing**: Spacious layouts, high negative space contrast, elegant typography pairings using **Outfit** (display headings) and **Inter** (standard body).

---

## 🚀 Key Features

1. **User Auth**: Secure sign-up, email verification, password security, custom username, and initial interests selection using **Firebase Authentication** coupled with dedicated Firestore user profiles.
2. **Dashboard**: Interactive bento-grid styled stats block tracking total contributions, bookmarks list, most preferred categories, and profile model-adaptation score.
3. **Item Directory**: Live filtering by categories, real-time search, interactive star rating controls (1-5 stars), and review submissions.
4. **Sentiment Analysis**: Submitting a rating/review triggers backend analysis using **Gemini 3.5 Flash** to analyze positive/neutral/negative sentiment and return helpful concise details.
5. **AI Recommendation Wizard**: A natural-language query field where users can describe what they want (e.g., *"moody dystopian game with magical open world"*) to receive curated lists with AI-generated explanations of *why* they match.
6. **Chat Assistant**: A responsive floating chatbot assisting users in finding items by conversing naturally, suggesting item links directly within the chat window.

---

## 🛠️ Backend APIs (`server.ts`)

- `GET /api/items`: Returns the full dictionary catalog of seed items (movies, books, games, tech).
- `POST /api/recommend`: Content-based matching combined with Gemini 3.5 Flash reasoning to rank and explain recommended items.
- `POST /api/sentiment`: Sentiment classification for reviews and ratings.
- `POST /api/chat`: Context-aware conversational recommendation system.

---

## 📂 Database Collections Schema (`firebase-blueprint.json`)

- `/users/{userId}`: Details, interests, and UI settings.
- `/items/{itemId}`: Available items in the directory.
- `/ratings/{ratingId}`: User rating points, text reviews, and analyzed sentiment logs.
- `/favorites/{favoriteId}`: Relational bookmark links between users and items.

---

## 🚀 Quick Setup & Installation

### 1. Install dependencies
```bash
npm install
```

### 2. Run the full-stack development server
This runs Express as a middleware serving the Vite development server simultaneously on port 3000:
```bash
npm run dev
```

### 3. Build for Production
This bundles client assets with Vite and compiles the TypeScript server into a standalone CommonJS bundle at `dist/server.cjs` using `esbuild`:
```bash
npm run build
```

### 4. Start Production Server
```bash
npm run start
```
