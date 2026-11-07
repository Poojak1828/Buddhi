import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Sparkles,
  FileText,
  Layers,
  HelpCircle,
  Timer,
  BarChart3,
  Network,
  Settings,
  LogOut,
  Flame,
  Menu,
  X,
  Compass,
  Search,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.js';

interface NavItem {
  to: string;
  label: string;
  icon: any;
  badge?: string;
  highlight?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navSections: NavSection[] = [
    {
      title: 'WORKSPACE',
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/subjects', label: 'Subjects & Syllabus', icon: BookOpen },
        { to: '/planner', label: 'AI Study Planner', icon: CalendarDays },
      ],
    },
    {
      title: 'LEARNING SUITE',
      items: [
        { to: '/assistant', label: 'AI Study Assistant', icon: Sparkles },
        { to: '/notes', label: 'Notes Manager', icon: FileText },
        { to: '/flashcards', label: 'Flashcards', icon: Layers },
        { to: '/quizzes', label: 'Practice Quizzes', icon: HelpCircle },
        { to: '/timer', label: 'Focus Timer', icon: Timer },
      ],
    },
    {
      title: 'AGENT & ANALYTICS',
      items: [
        { to: '/switch-hub', label: 'Switch Teammate Hub', icon: Network, highlight: true },
        { to: '/analytics', label: 'Progress & Analytics', icon: BarChart3 },
        { to: '/settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  const mobileBottomItems = [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/planner', label: 'Planner', icon: CalendarDays },
    { to: '/assistant', label: 'Buddhi', icon: Sparkles, highlight: true },
    { to: '/notes', label: 'Notes', icon: FileText },
    { to: '/switch-hub', label: 'Switch', icon: Network },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getAcademicLevelLabel = (level?: string) => {
    switch (level) {
      case 'SCHOOL_SECONDARY':
        return 'Class 1–10';
      case 'SENIOR_SECONDARY_PREP':
        return 'Class 11–12 (JEE/NEET/Boards)';
      case 'UNDERGRADUATE_DEGREE':
        return 'College / Degree';
      case 'POSTGRADUATE':
        return 'Postgraduate';
      default:
        return 'Senior Secondary Prep';
    }
  };

  return (
    <div className="flex h-screen bg-[#080C14] text-slate-100 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-[#0A0F1D] border-r border-slate-800/80 p-4 justify-between select-none shrink-0 shadow-2xl z-20">
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo Brand Header */}
          <div className="flex items-center gap-3 px-2 py-3 mb-4 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-400 via-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/25 ring-1 ring-white/20">
              <Compass className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <span className="text-xl font-black tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-white via-sky-100 to-sky-300 font-mono drop-shadow-sm flex items-center gap-2">
                BUDDHI
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400 font-bold border border-sky-500/30 tracking-normal font-sans">
                  AI
                </span>
              </span>
              <p className="text-[11px] text-slate-400 font-medium">Your AI Study Teammate</p>
            </div>
          </div>

          {/* Grouped Navigation Links */}
          <nav className="flex-1 space-y-6 overflow-y-auto pr-1 no-scrollbar pt-2">
            {navSections.map((sec, sIdx) => (
              <div key={sIdx} className="space-y-1">
                <p className="text-[10px] font-bold tracking-widest text-slate-500 px-3 uppercase mb-2">
                  {sec.title}
                </p>
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                          isActive
                            ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm shadow-sky-500/10 font-bold'
                            : item.highlight
                            ? 'text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 bg-emerald-500/5'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                        }`
                      }
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${item.highlight ? 'text-emerald-400' : ''}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                          {item.badge}
                        </span>
                      )}
                      {item.highlight && (
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* User Profile Summary & Logout */}
          <div className="pt-3 border-t border-slate-800/80 shrink-0">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-md">
                  {user?.name?.charAt(0) || 'S'}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-200 truncate">{user?.name || 'Student'}</p>
                  <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                    <GraduationCap className="w-3 h-3 text-sky-400" />
                    {getAcademicLevelLabel(user?.profile?.academicLevel)}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800/80 bg-[#0A0F1D]/80 backdrop-blur-md px-4 lg:px-8 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/60"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Breadcrumb / Title */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider hidden sm:inline">Buddhi</span>
                <ChevronRight className="w-3 h-3 text-slate-600 hidden sm:inline" />
                <h1 className="text-sm lg:text-base font-bold text-white capitalize">
                  {location.pathname.replace('/', '').replace('-', ' ') || 'Dashboard'}
                </h1>
              </div>
            </div>
          </div>

          {/* Right Header Status Badges */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Switch Teammate status pill */}
            <NavLink
              to="/switch-hub"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition shadow-sm shadow-emerald-500/5"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Switch Room Active</span>
            </NavLink>

            {/* Study Streak Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-bold shadow-sm shadow-amber-500/5">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{user?.profile?.streakCount || 1} Day Streak</span>
            </div>

            {/* Quick AI Tutor Trigger */}
            <button
              onClick={() => navigate('/assistant')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-xs font-bold hover:brightness-110 shadow-md shadow-sky-500/20 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ask Buddhi</span>
              <kbd className="hidden md:inline-block ml-1 px-1.5 py-0.2 rounded bg-black/20 text-[9px] font-mono text-white/80">AI</kbd>
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#0A0F1D] border-b border-slate-800 px-4 py-4 space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto animate-fade-in z-20">
            {navSections.map((sec, sIdx) => (
              <div key={sIdx} className="space-y-1">
                <p className="text-[10px] font-bold tracking-wider text-slate-500 px-2 uppercase">{sec.title}</p>
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold ${
                          isActive ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'text-slate-300 hover:bg-slate-800'
                        }`
                      }
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        )}

        {/* Page View Body */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-[#080C14] pb-24 lg:pb-8 relative">
          <Outlet />
        </main>

        {/* Mobile Sticky Bottom Navigation Bar (Linear / Superhuman style) */}
        <div className="lg:hidden fixed bottom-0 inset-x-0 bg-[#0A0F1D]/90 backdrop-blur-xl border-t border-slate-800 px-3 py-2 flex items-center justify-around z-30">
          {mobileBottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
                  isActive ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className={`p-1 rounded-lg ${isActive ? 'bg-sky-500/15' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] tracking-tight">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
};
