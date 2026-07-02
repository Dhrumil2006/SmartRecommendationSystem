import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Item, Rating, Favorite } from '../types';
import { 
  MessageSquare, X, Send, Sparkles, User, ShieldAlert, Star, Compass, RefreshCw
} from 'lucide-react';

interface ChatAssistantProps {
  items: Item[];
  ratings: Rating[];
  favorites: Favorite[];
  interests: string[];
  userId: string;
}

export default function ChatAssistant({
  items,
  ratings,
  favorites,
  interests,
  userId
}: ChatAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Hi! I am your AI Recommendation Assistant. Ask me anything, or explain what you are in the mood for (e.g. 'I want a high-paced action thriller movie' or 'Suggest a great book for self-improvement'). How can I help you today?",
      createdAt: new Date().toISOString()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages list grows
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    const userText = inputText;
    setInputText('');
    setSending(true);

    const userMessage: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text: userText,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Hit server-side Express chatbot helper
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ sender: m.sender, text: m.text })),
          interests,
          favorites: favorites.map(f => f.itemId),
          ratings: ratings.map(r => ({ itemId: r.itemId, rating: r.rating, review: r.review }))
        })
      });

      const data = await response.json();
      if (data.success) {
        const aiMessage: ChatMessage = {
          id: `msg_ai_${Date.now()}`,
          sender: 'ai',
          text: data.text,
          createdAt: new Date().toISOString(),
          recommendedItems: data.recommendedItems || []
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(data.error || "Failed to parse chatbot assist reply.");
      }
    } catch (err) {
      console.error("Chat error:", err);
      const errorMessage: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        sender: 'ai',
        text: "I apologize, but I am currently having trouble connecting to my cognitive hub. Please try asking again in a moment.",
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          id="chat-bubble-trigger"
          onClick={() => setIsOpen(true)}
          className="p-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:scale-105 hover:shadow-lg hover:shadow-indigo-600/30 active:scale-95 text-white rounded-2xl shadow-xl flex items-center gap-2.5 transition-all cursor-pointer font-medium"
        >
          <div className="relative">
            <MessageSquare className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-indigo-600 animate-ping"></span>
          </div>
          <span className="hidden sm:inline text-sm">Ask RecAI Assistant</span>
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div 
          id="chat-window-panel" 
          className="w-full max-w-md sm:w-96 h-[520px] glass-card rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-white/25 dark:border-slate-800/80 animate-fade-in"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-4 py-3.5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/10 rounded-lg text-white">
                <Sparkles className="w-4.5 h-4.5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-semibold tracking-wide">RecAI Chatbot</h3>
                <span className="text-[10px] text-emerald-300 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                  <span>Online Assistant</span>
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Close chat panel"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Messages list area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/20">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div key={msg.id} className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {/* Left Avatar */}
                  {!isUser && (
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/40 border border-indigo-200/20 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 text-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {/* Bubble Container */}
                  <div className="max-w-[75%] space-y-2">
                    <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-800/80'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>

                    {/* Appended recommendations if any */}
                    {msg.recommendedItems && msg.recommendedItems.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block">
                          AI Recommended Matches:
                        </span>
                        {msg.recommendedItems.map(item => (
                          <div 
                            key={item.id} 
                            className="p-2 bg-indigo-50/45 dark:bg-indigo-950/25 border border-indigo-100/40 dark:border-indigo-900/30 rounded-xl flex items-center justify-between gap-2 shadow-xs"
                          >
                            <div className="min-w-0">
                              <span className="text-[8px] font-bold text-slate-400 block uppercase">{item.category}</span>
                              <h4 className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">{item.title}</h4>
                            </div>
                            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span>{item.averageRating}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Avatar */}
                  {isUser && (
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 text-xs shadow-sm">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}
            
            {sending && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl rounded-tl-none shadow-sm max-w-[70%] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce"></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Form input field */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            <input
              type="text"
              placeholder="Type message here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/50 dark:bg-slate-900/40 text-slate-900 dark:text-white"
              maxLength={250}
              required
            />
            <button
              type="submit"
              disabled={sending || !inputText.trim()}
              className="p-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-all cursor-pointer disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
