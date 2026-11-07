import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Trash2,
  Bot,
  User,
  Heart,
  Lightbulb,
  RotateCw,
  Compass,
  BookOpen,
  CalendarDays,
  HelpCircle,
  Code2,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.js';

interface MessageItem {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  emotionalTone?: string;
}

export const AIAssistantPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [followups, setFollowups] = useState<string[]>([
    'Give us a project to work on',
    'Explain recursion in simple words',
    'Suggest five beginner coding projects',
    'Make a study plan for tomorrow',
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadHistory = async () => {
    try {
      const res = await api.getAssistantHistory();
      if (res.conversations && res.conversations.length > 0) {
        const latest = res.conversations[0];
        setConversationId(latest.id);
        const mapped = latest.messages.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          emotionalTone: m.emotionalTone,
        }));
        setMessages(mapped);
      } else {
        // Welcome message
        const greeting = user?.name?.trim() ? `Hello ${user.name}!` : `Hello!`;
        setMessages([
          {
            role: 'assistant',
            content: `${greeting} I am **Buddhi**, your personal AI study companion and academic mentor.\n\nI am here to help you accelerate your learning:\n• 🚀 **Hands-on Projects:** Suggest beginner-to-advanced coding and academic project ideas with complete architectural breakdowns.\n• 💡 **Conceptual Tutoring:** Break down difficult concepts in Computer Science, Physics, Chemistry, Biology, and Math into clear mental models and everyday analogies.\n• 💻 **Programming & Algorithms:** Explain algorithms (like recursion and dynamic programming), debug code, and walk through data structures.\n• 📅 **Study & Revision Schedules:** Plan structured daily study timetables tailored to your milestones with built-in rest intervals.\n• 📝 **Practice Quizzes & Assessments:** Create customized quizzes in Multiple Choice, Short Answer, or Long Answer formats with detailed feedback on mistakes.\n• 🌿 **Empathetic Pacing:** Support your mental well-being with zero guilt when you feel overwhelmed or behind schedule.\n\nWhat would you like to explore or work on right now?`,
            emotionalTone: 'calming-supportive',
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    const userMessage: MessageItem = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const res = await api.chatWithAssistant(text, conversationId);
      setConversationId(res.conversationId);
      setMessages((prev) => [
        ...prev,
        {
          id: (res.message as any)?.id,
          role: 'assistant',
          content: res.message.content,
          emotionalTone: res.emotionalTone,
        },
      ]);
      if (res.suggestedFollowups && res.suggestedFollowups.length > 0) {
        setFollowups(res.suggestedFollowups);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `I'm having a brief connection pause: ${err.message}. Please try asking again.`,
          emotionalTone: 'calming-supportive',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!confirm('Clear this study conversation?')) return;
    if (conversationId) {
      try {
        await api.clearAssistantConversation(conversationId);
      } catch (e) {
        // Continue
      }
    }
    setConversationId(undefined);
    setMessages([
      {
        role: 'assistant',
        content: `Chat cleared! What concept or question can we master together now?`,
        emotionalTone: 'calming-supportive',
      },
    ]);
  };

  return (
    <div className="w-full max-w-6xl mx-auto h-[calc(100vh-100px)] flex flex-col font-sans animate-fade-in shadow-2xl rounded-3xl overflow-hidden border border-white/10 bg-[#0A0F1D]">
      {/* Top Header Bar */}
      <div className="p-4 sm:p-5 bg-[#0D1527] border-b border-slate-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-400 via-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25 ring-1 ring-white/20">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              Buddhi AI Study Assistant
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-extrabold border border-emerald-500/30 flex items-center gap-1 shadow-sm">
                <Heart className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                Psychological Pacing Active
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {user?.name ? `Personalized for ${user.name}` : 'Personalized AI Study Companion'}
              {user?.profile?.courseOrDegree ? ` • ${user.profile.courseOrDegree}` : ''}
              {user?.profile?.academicLevel ? ` (${user.profile.academicLevel.replace(/_/g, ' ')})` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClearChat}
            className="p-2 sm:px-3 sm:py-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition text-xs flex items-center gap-1.5 font-bold"
            title="Clear Conversation"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Clear Chat</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#080C14] space-y-6">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-4 ${
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 text-xs font-bold shadow-md ${
                msg.role === 'user'
                  ? 'bg-sky-500 text-white ring-1 ring-sky-400/30'
                  : 'bg-gradient-to-tr from-indigo-600 via-sky-600 to-sky-400 text-white ring-1 ring-white/20'
              }`}
            >
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[88%] lg:max-w-[82%] rounded-3xl p-5 sm:p-6 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap shadow-xl ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-tr-md font-medium'
                  : 'bg-[#0F172A]/95 border border-slate-700/60 text-slate-100 rounded-tl-md'
              }`}
            >
              {msg.role === 'assistant' && msg.emotionalTone && (
                <div className="mb-3 pb-2 border-b border-slate-800 flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  {msg.emotionalTone === 'calming-supportive'
                    ? 'AI Study Assistant'
                    : msg.emotionalTone === 'formative-assessment'
                    ? 'Diagnostic Assessment'
                    : msg.emotionalTone === 'structured-planning'
                    ? 'Structured Study Blueprint'
                    : 'Concept Deep-Dive'}
                </div>
              )}
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3.5 animate-fade-in">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <RotateCw className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-4 rounded-3xl rounded-tl-md bg-[#0F172A] border border-white/5 text-xs text-slate-400 flex items-center gap-2.5 shadow-lg">
              <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
              <span className="font-medium">Buddhi is reasoning through your request with academic precision...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Followups Row */}
      {followups.length > 0 && (
        <div className="px-4 py-3 bg-[#0D1527] border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs shrink-0 no-scrollbar">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Prompts:</span>
          {followups.map((f, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(f)}
              className="px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-sky-300 hover:border-sky-500/40 text-[11px] font-semibold whitespace-nowrap transition shadow-sm hover:scale-[1.02]"
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <div className="p-4 sm:p-5 bg-[#0D1527] border-t border-slate-800/80 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask a project idea, explain recursion, solve equations, generate a quiz..."
            className="flex-1 h-12 px-5 rounded-2xl bg-slate-900 border border-slate-700/80 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 font-medium transition"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="h-12 px-6 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:brightness-110 text-white font-extrabold text-xs transition flex items-center gap-2 shadow-lg shadow-sky-500/25 disabled:opacity-40 ring-1 ring-white/20"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
