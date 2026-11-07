import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  Sparkles,
  CalendarDays,
  Network,
  HeartHandshake,
  Layers,
  HelpCircle,
  Timer,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Brain,
  MessageSquare,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.js';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleDemoAccess = async () => {
    await demoLogin();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 selection:bg-sky-500/30 font-sans">
      {/* Top Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#080C14]/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-white via-sky-100 to-sky-300 font-mono drop-shadow-sm flex items-center gap-2">
              BUDDHI
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 font-bold border border-sky-500/20 tracking-normal font-sans">
                AI
              </span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#switch-teammate" className="hover:text-white transition flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Switch Integration
            </a>
            <a href="#psychology" className="hover:text-white transition">AI Study Assistant</a>
            <a href="#how-it-works" className="hover:text-white transition">How It Works</a>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-semibold hover:bg-sky-400 transition shadow-sm"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <button
                  onClick={handleDemoAccess}
                  className="hidden sm:inline-flex px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition"
                >
                  ⚡ Instant Demo
                </button>
                <Link
                  to="/login"
                  className="px-3.5 py-2 rounded-xl text-slate-300 hover:text-white text-sm font-medium transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-sm font-semibold hover:opacity-95 shadow-md shadow-sky-500/20 transition"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none mb-6">
          Your Personal <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-emerald-400">AI Study Companion</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          Stop juggling disconnected tools. Buddhi unifies syllabus planning, concept tutoring, mental-wellness pacing, and a **Switch-connected AI teammate** inside your daily study room.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            to="/signup"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-semibold text-base hover:shadow-xl hover:shadow-sky-500/25 transition-all flex items-center justify-center gap-2"
          >
            Start Studying with Buddhi
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={handleDemoAccess}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#0F172A] hover:bg-slate-800 text-slate-200 font-semibold text-base border border-slate-700 transition flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            Explore Pre-loaded Demo
          </button>
        </div>

        {/* Hero Dashboard Preview Card */}
        <div className="relative rounded-3xl p-1 bg-gradient-to-b from-sky-500/30 via-slate-800/40 to-transparent shadow-2xl max-w-5xl mx-auto">
          <div className="rounded-[22px] bg-[#0F172A] border border-slate-800 p-6 sm:p-8 text-left">
            <div className="flex flex-wrap items-center justify-between pb-6 border-b border-slate-800 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                  ST
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base">Student's Study Command Center</h3>
                  <p className="text-xs text-slate-400">Class 11–12 (JEE Advanced & CBSE Prep) • 8 Day Streak 🔥</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Switch Teammate Active in Mattermost
                </span>
              </div>
            </div>

            {/* Quick Metrics Bar in Mockup */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs text-slate-400">Study Streak</span>
                <p className="text-xl font-bold text-amber-400 mt-1">8 Days</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs text-slate-400">Total Hours</span>
                <p className="text-xl font-bold text-sky-400 mt-1">36.5 Hrs</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs text-slate-400">Physics Mastery</span>
                <p className="text-xl font-bold text-indigo-400 mt-1">68% Done</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs text-slate-400">Quiz Accuracy</span>
                <p className="text-xl font-bold text-emerald-400 mt-1">94% Top</p>
              </div>
            </div>

            {/* Teammate Dialogue Snippet in Mockup */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-sky-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Compass className="w-4 h-4" />
              </div>
              <div className="text-xs text-slate-300 space-y-1">
                <p className="font-semibold text-sky-400">Buddhi Study Teammate (Switch Connected):</p>
                <p className="leading-relaxed">
                  "Good evening Aarav! You have accomplished 2 key milestones today. Since your Physics exam is in 28 days, let's complete a 45-min review on Rotational Mechanics, then take a deliberate 10-minute mental breather. No rush—consistency compounds."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/60">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold text-sky-400 uppercase tracking-widest mb-3">All-in-One Learning Operating System</h2>
          <p className="text-3xl sm:text-4xl font-bold text-white">Everything You Need to Excel Without Burnout</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-5">
              <CalendarDays className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">AI Syllabus & Exam Planner</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Input your syllabus and exam dates. Buddhi divides topics into manageable daily tasks with built-in active recall and revision milestones.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center mb-5">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Psychological Empathy Guardrails</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Trained with adolescent psychologist principles. When you feel anxious or behind, Buddhi never shames. It softens deadlines, decompresses schedules, and restores confidence.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-5">
              <Network className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Switch-Powered Study Teammate</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Buddhi lives in your Mattermost chat rooms via Switch. Ask for tasks, request quick quizzes, or report progress directly from chat, and watch your database sync instantly.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-5">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">AI Flashcards & Spaced Recall</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Turn any chapter or note into 3D interactive flashcards. Track mastery, revise difficult formulas, and conquer the Ebbinghaus forgetting curve.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-5">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">AI Quizzes & Diagnostic Scoring</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Generate custom multiple-choice question sets with level-appropriate difficulty. Receive instant scores and detailed concept-building explanations.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-5">
              <Timer className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Pomodoro Focus Timer & Analytics</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Log focus sessions, measure daily and weekly study hours, track subject completion bars, and maintain an unbroken study streak.
            </p>
          </div>
        </div>
      </section>

      {/* Switch Hackathon Integration Spotlight */}
      <section id="switch-teammate" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/60">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-950/40 via-[#0F172A] to-slate-900 border border-emerald-500/30 p-8 sm:p-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="space-y-4 max-w-xl">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                Flip the Switch Hackathon Core Architecture
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                Not Just a Web Chatbot.<br />
                A True Switch Study Teammate.
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Buddhi leverages Switch Console to join team communication rooms in Mattermost. You interact naturally, asking for syllabus breakdowns, quizzes, or schedule reorganizations.
              </p>
              <ul className="space-y-2 text-sm text-slate-300 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  Mattermost Room Integration with Webhook Protocol
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  Real-time Database synchronization with PostgreSQL
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  Dual workflow: Human and Agent collaborating on tasks
                </li>
              </ul>
              <div className="pt-4">
                <Link
                  to="/switch-hub"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition"
                >
                  Open Switch Teammate Hub
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Architecture Flow Chart Box */}
            <div className="w-full lg:w-[460px] p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4 text-xs font-mono">
              <div className="text-slate-400 font-semibold uppercase tracking-wider text-[11px] pb-2 border-b border-slate-800">
                Switch Teammate Workflow
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300">1. Student in Mattermost:</span>
                <span className="text-sky-400">"What are my tasks?"</span>
              </div>
              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-emerald-300">
                2. Switch passes event to Buddhi Backend API
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                3. PostgreSQL queries active tasks for student
              </div>
              <div className="p-3 rounded-lg bg-sky-950/30 border border-sky-500/20 text-sky-300">
                4. Agent returns formatted list + advice to room
              </div>
              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-emerald-300">
                5. "Completed task #1" immediately syncs Dashboard!
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2 text-slate-300">
          <Compass className="w-4 h-4 text-sky-400" />
          <span className="font-bold tracking-wider">BUDDHI</span>
        </div>
        <div>
          Built with React, Express, PostgreSQL, Prisma & Switch AI.
        </div>
      </footer>
    </div>
  );
};
