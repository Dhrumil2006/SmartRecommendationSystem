import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { SEED_ITEMS } from "./src/data/items.js";

// Ensure environment variables are loaded
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry User-Agent as instructed by gemini-api skill
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY environment variable is not defined. AI features will fallback to rule-based logic.");
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

const ai = getGeminiClient();

// 1. Get All Items Directory
app.get("/api/items", (req, res) => {
  try {
    res.json({ success: true, items: SEED_ITEMS });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 2. Recommendation Engine API
app.post("/api/recommend", async (req, res) => {
  try {
    const { interests = [], ratings = [], favorites = [], query = "" } = req.body;

    // Local content-based filtering (to score items)
    // We compute a matching score for each seed item
    const scoredItems = SEED_ITEMS.map(item => {
      let score = 0;

      // 1. Match against interests
      const matchedInterests = item.tags.filter(tag => 
        interests.some((interest: string) => interest.toLowerCase() === tag.toLowerCase() || item.category.toLowerCase() === interest.toLowerCase())
      );
      score += matchedInterests.length * 2.5;

      // 2. Match against user favorites categories/tags
      const favoriteItems = SEED_ITEMS.filter(it => favorites.includes(it.id));
      const favoriteTags = favoriteItems.flatMap(it => it.tags);
      const favoriteCategories = favoriteItems.map(it => it.category);

      if (favoriteCategories.includes(item.category)) {
        score += 3;
      }
      const matchedFavTags = item.tags.filter(tag => favoriteTags.includes(tag));
      score += matchedFavTags.length * 1.5;

      // 3. Match against high ratings (rating >= 4)
      const highlyRatedIds = ratings.filter((r: any) => r.rating >= 4).map((r: any) => r.itemId);
      const ratedItems = SEED_ITEMS.filter(it => highlyRatedIds.includes(it.id));
      const ratedTags = ratedItems.flatMap(it => it.tags);
      const ratedCategories = ratedItems.map(it => it.category);

      if (ratedCategories.includes(item.category)) {
        score += 2;
      }
      const matchedRatedTags = item.tags.filter(tag => ratedTags.includes(tag));
      score += matchedRatedTags.length * 1.0;

      // 4. Heavy discount for poor ratings (rating <= 2)
      const poorlyRatedIds = ratings.filter((r: any) => r.rating <= 2).map((r: any) => r.itemId);
      if (poorlyRatedIds.includes(item.id)) {
        score -= 10;
      }

      return { item, score };
    });

    // If Gemini API is available, use it to select, rank, and explain recommendations
    if (ai) {
      const itemsListText = SEED_ITEMS.map(it => 
        `- ID: ${it.id} | Title: ${it.title} | Category: ${it.category} | Tags: ${it.tags.join(", ")} | Description: ${it.description}`
      ).join("\n");

      const userContextPrompt = `
You are an expert personalized recommendation algorithm.
Here is the directory of all available items in our library:
${itemsListText}

User's current profile context:
- Interested categories/tags: ${interests.join(", ")}
- Favorite Item IDs: ${favorites.join(", ")}
- Item rating history: ${JSON.stringify(ratings)}
- Custom natural language recommendation query: "${query || "None provided"}"

Tasks:
1. Select the top 4 best recommendation items for this user.
2. For each recommended item, provide a detailed, personal, and encouraging "reason" why it fits their specific combination of interests, rating history, and current request. Do not sound generic; mention specific aspects of their preferences or the item.

Please format the response strictly as a JSON object matching this schema:
{
  "recommendations": [
    {
      "itemId": "string (the exact ID of the item)",
      "reason": "string (personalized reason explaining why this matches their profile and/or query)"
    }
  ]
}
`;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: userContextPrompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                recommendations: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      itemId: { type: "STRING" },
                      reason: { type: "STRING" }
                    },
                    required: ["itemId", "reason"]
                  }
                }
              },
              required: ["recommendations"]
            }
          }
        });

        if (response.text) {
          const result = JSON.parse(response.text);
          return res.json({ success: true, source: "AI", recommendations: result.recommendations });
        }
      } catch (geminiError) {
        console.error("Gemini recommendation error, falling back to rule-based:", geminiError);
      }
    }

    // Rule-based fallback if Gemini fails or is not available
    const fallbackRecs = scoredItems
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(entry => {
        let reason = `Recommended based on your interest in ${entry.item.category} and similar tags.`;
        if (query) {
          reason = `Matches your custom query request and contains relevant tags like ${entry.item.tags.slice(0, 2).join(", ")}.`;
        } else if (interests.some(interest => entry.item.tags.includes(interest))) {
          reason = `Perfect match for your selected preferences in ${entry.item.tags.filter(t => interests.includes(t)).join(", ")}.`;
        }
        return {
          itemId: entry.item.id,
          reason: reason
        };
      });

    res.json({ success: true, source: "Rule-Based Engine", recommendations: fallbackRecs });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 3. Sentiment Analysis API
app.post("/api/sentiment", async (req, res) => {
  try {
    const { review = "", rating = 3 } = req.body;

    if (!review.trim()) {
      return res.json({
        success: true,
        sentiment: rating >= 4 ? "Positive" : rating <= 2 ? "Negative" : "Neutral",
        explanation: "Based entirely on star rating since no review text was written."
      });
    }

    if (ai) {
      const prompt = `
Analyze the sentiment of the following user review for an item:
"Review: ${review}"
"Star Rating given: ${rating} out of 5"

Determine if the sentiment is "Positive", "Neutral", or "Negative".
Provide a concise, 1-2 sentence AI explanation summary analyzing the user's emotions or feedback details.

Format response strictly as a JSON object matching this schema:
{
  "sentiment": "Positive" | "Neutral" | "Negative",
  "explanation": "string"
}
`;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                sentiment: { type: "STRING", enum: ["Positive", "Neutral", "Negative"] },
                explanation: { type: "STRING" }
              },
              required: ["sentiment", "explanation"]
            }
          }
        });

        if (response.text) {
          const result = JSON.parse(response.text);
          return res.json({ success: true, source: "AI", ...result });
        }
      } catch (geminiError) {
        console.error("Gemini sentiment error, falling back:", geminiError);
      }
    }

    // Fallback logic
    let sentiment = "Neutral";
    if (rating >= 4) sentiment = "Positive";
    if (rating <= 2) sentiment = "Negative";

    res.json({
      success: true,
      source: "Rule-Based",
      sentiment,
      explanation: `Sentiment inferred as ${sentiment} based on your rating of ${rating}/5 stars.`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 4. AI Chatbot Recommendation Assistant API
app.post("/api/chat", async (req, res) => {
  try {
    const { messages = [], interests = [], ratings = [], favorites = [] } = req.body;

    if (!messages || messages.length === 0) {
      return res.status(400).json({ success: false, error: "Messages list is required." });
    }

    const recentMessage = messages[messages.length - 1].text;

    if (ai) {
      const itemsListText = SEED_ITEMS.map(it => 
        `- ID: ${it.id} | Title: ${it.title} | Category: ${it.category} | Tags: ${it.tags.join(", ")} | Description: ${it.description}`
      ).join("\n");

      const prompt = `
You are the Smart Recommendation Assistant, an friendly, knowledgeable AI helper. Your job is to help users find the perfect movies, books, games, or tech gadgets.

Our full item catalog:
${itemsListText}

User profile context:
- Selected interests: ${interests.join(", ")}
- Favorites: ${favorites.join(", ")}
- Rating history: ${JSON.stringify(ratings)}

Conversation History:
${messages.map((m: any) => `${m.sender === "user" ? "User" : "Assistant"}: ${m.text}`).join("\n")}

Task:
Generate a helpful, welcoming, and concise response to the user's latest query ("${recentMessage}").
If you want to suggest specific items from our catalog, list their exact IDs in the "recommendedItemIds" field. Offer a clear explanation.

Format response strictly as a JSON object matching this schema:
{
  "text": "Your helpful chat response message, written in Markdown.",
  "recommendedItemIds": ["array", "of", "exact", "matching", "item", "IDs", "from", "the", "catalog", "if", "applicable"]
}
`;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                text: { type: "STRING" },
                recommendedItemIds: {
                  type: "ARRAY",
                  items: { type: "STRING" }
                }
              },
              required: ["text", "recommendedItemIds"]
            }
          }
        });

        if (response.text) {
          const result = JSON.parse(response.text);
          // Map recommended IDs to full items
          const recommendedItems = SEED_ITEMS.filter(it => result.recommendedItemIds.includes(it.id));
          return res.json({
            success: true,
            text: result.text,
            recommendedItems
          });
        }
      } catch (geminiError) {
        console.error("Gemini chat error:", geminiError);
      }
    }

    // Fallback chatbot response
    const keyword = recentMessage.toLowerCase();
    let reply = "I am here to help you get recommendations! Tell me what you're in the mood for: Movies, Books, Games, or Tech.";
    let itemsToRecommend: any[] = [];

    if (keyword.includes("movie") || keyword.includes("watch")) {
      reply = "I see you are interested in movies! I recommend checking out **Interstellar** (sci-fi space epic) or **Inception** (mind-bending dream heist). What kind of genres do you like?";
      itemsToRecommend = SEED_ITEMS.filter(it => it.category === "Movies").slice(0, 2);
    } else if (keyword.includes("book") || keyword.includes("read")) {
      reply = "For books, Frank Herbert's **Dune** is an incredible epic. If you're looking for self-improvement, **Atomic Habits** is highly productive!";
      itemsToRecommend = SEED_ITEMS.filter(it => it.category === "Books").slice(0, 2);
    } else if (keyword.includes("game") || keyword.includes("play")) {
      reply = "For immersive gaming, **The Witcher 3** offers a magnificent dark fantasy story, while **Elden Ring** has a beautiful challenging open world.";
      itemsToRecommend = SEED_ITEMS.filter(it => it.category === "Games").slice(0, 2);
    } else if (keyword.includes("tech") || keyword.includes("gadget") || keyword.includes("headphone") || keyword.includes("keyboard")) {
      reply = "If you love productivity gadgets, I highly recommend the **Sony WH-1000XM5** noise-cancelling headphones or the tactile **Keychron Q1** mechanical keyboard.";
      itemsToRecommend = SEED_ITEMS.filter(it => it.category === "Tech").slice(0, 2);
    }

    res.json({
      success: true,
      text: `${reply} (Note: Running in offline/rule-based backup mode)`,
      recommendedItems: itemsToRecommend
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Setup Vite Dev server or Production static files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server loaded as middleware");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving production build from dist");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
