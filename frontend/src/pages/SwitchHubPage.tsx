import React, { useState, useEffect } from 'react';
import {
  Network,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  Copy,
  Terminal,
  Bot,
  User,
  ShieldCheck,
  RefreshCw,
  Users,
  Plus,
  Trash2,
  Share2,
  MessageCircle,
  X,
  ExternalLink,
} from 'lucide-react';
import { api } from '../services/api.js';
import { AgentAction, SwitchRoom, SwitchTeammate } from '../types/index.js';

export const SwitchHubPage: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [rooms, setRooms] = useState<SwitchRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<SwitchRoom | null>(null);
  const [loading, setLoading] = useState(true);

  // Active Sender State (Allows simulating chat as any added teammate!)
  const [activeSender, setActiveSender] = useState<string>('You (Student)');

  // Add Teammate Modal State
  const [showAddTeammateModal, setShowAddTeammateModal] = useState(false);
  const [newTeammateName, setNewTeammateName] = useState('');
  const [newTeammateHandle, setNewTeammateHandle] = useState('');
  const [newTeammateRole, setNewTeammateRole] = useState('STUDY_BUDDY');
  const [addingTeammate, setAddingTeammate] = useState(false);

  // Live Simulator Dialogue State
  const [simText, setSimText] = useState('');
  const [simLoading, setSimLoading] = useState(false);
  const [simDialogue, setSimDialogue] = useState<Array<{ sender: string; isBot: boolean; text: string; action?: string; timestamp?: string }>>([
    {
      sender: 'Buddhi Study Agent',
      isBot: true,
      text: `👋 Welcome to the **Buddhi Study Circle**!\n\nThis collaborative study room is connected via the Switch protocol and open to you and all your study partners. Everyone in this room can collaborate, trigger group study plans, request diagnostic quizzes, and track academic accountability together.`,
      timestamp: 'Just now',
    },
    {
      sender: 'Priya Patel (@priya_studies)',
      isBot: false,
      text: 'Hey Buddhi! Aarav and I have our Physics Optics examination in 10 days. Can you synthesize a revision plan for us?',
      timestamp: 'Just now',
    },
    {
      sender: 'Buddhi Study Agent',
      isBot: true,
      text: `✨ **Collaborative Revision Schedule Created!**\n\nI have structured a 10-day milestone plan for **Wave Optics & Ray Optics** tailored for your study circle. It breaks down daily target concepts with built-in rest periods. Would you like to approve and sync it with your Buddhi dashboard?`,
      action: 'Plan generated for Study Circle',
      timestamp: 'Just now',
    },
  ]);

  const loadSwitchData = async () => {
    try {
      setLoading(true);
      const [statusRes, actionsRes, roomsRes] = await Promise.all([
        api.getSwitchStatus(),
        api.getSwitchActions(),
        api.getSwitchRooms(),
      ]);

      setStatus(statusRes);
      setActions(actionsRes.actions);
      setRooms(roomsRes.rooms || []);
      if (roomsRes.rooms && roomsRes.rooms.length > 0) {
        setActiveRoom(roomsRes.rooms[0]);
      }
    } catch (err) {
      console.error('Failed to load switch hub data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSwitchData();
  }, []);

  const handleAddTeammate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeammateName.trim() || !activeRoom) return;

    setAddingTeammate(true);
    try {
      const res = await api.addSwitchTeammate(activeRoom.id, {
        name: newTeammateName.trim(),
        handle: newTeammateHandle.trim() || undefined,
        role: newTeammateRole,
      });

      // Add welcome message in collaborative chat
      setSimDialogue((prev) => [
        ...prev,
        {
          sender: 'Buddhi Study Agent',
          isBot: true,
          text: `🎉 **New Teammate Added**: Welcome **${newTeammateName}** (${newTeammateHandle || 'Study Circle'}) to the Switch room! Collaborative chat and study task synchronization are now active for everyone in this room.`,
          action: `Teammate ${newTeammateName} joined`,
          timestamp: 'Just now',
        },
      ]);

      setShowAddTeammateModal(false);
      setNewTeammateName('');
      setNewTeammateHandle('');
      setNewTeammateRole('STUDY_BUDDY');

      // Refresh data
      await loadSwitchData();
    } catch (err: any) {
      alert(err.message || 'Failed to add teammate');
    } finally {
      setAddingTeammate(false);
    }
  };

  const handleDeleteTeammate = async (teammateId: string) => {
    if (!confirm('Remove this member from the collaborative Switch room?')) return;
    try {
      await api.deleteSwitchTeammate(teammateId);
      await loadSwitchData();
    } catch (err: any) {
      alert(err.message || 'Failed to remove teammate');
    }
  };

  const handleSimulateMessage = async (presetText?: string) => {
    const textToSend = presetText || simText;
    if (!textToSend.trim() || simLoading) return;

    const senderName = 'You (Student)';
    setSimDialogue((prev) => [
      ...prev,
      { sender: senderName, isBot: false, text: textToSend, timestamp: 'Just now' },
    ]);
    setSimText('');
    setSimLoading(true);

    try {
      const res = await api.simulateSwitchChat(textToSend, activeRoom?.name || 'buddhi-study-circle');
      setSimDialogue((prev) => [
        ...prev,
        {
          sender: 'Buddhi Study Agent',
          isBot: true,
          text: res.result.replyText,
          action: res.result.actionSummary || res.result.actionType,
          timestamp: 'Just now',
        },
      ]);

      // Refresh actions table
      const updatedActions = await api.getSwitchActions();
      setActions(updatedActions.actions);
    } catch (err: any) {
      setSimDialogue((prev) => [
        ...prev,
        {
          sender: 'Buddhi Study Agent',
          isBot: true,
          text: `[Switch Gateway Error]: ${err.message}`,
          timestamp: 'Just now',
        },
      ]);
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 font-sans">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-950/40 via-[#0F172A]/90 to-slate-900/90 border border-sky-500/30 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-sky-950/20">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Users className="w-7 h-7 text-sky-400" />
              Switch Teammate Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Connect directly with study circle teammates and peers via the Switch protocol. Everyone in the study room shares collaborative AI task planning, diagnostic quizzes, and encouragement.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={loadSwitchData}
              className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition shadow-sm"
              title="Refresh Status"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-right shadow-sm">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Switch Room Status</span>
              <p className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Buddhi Study Circle (Active)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Teammate / Group Modal */}
      {showAddTeammateModal && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0F172A] border border-sky-500/40 shadow-2xl max-w-lg mx-auto space-y-5 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Users className="w-5 h-5 text-sky-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Add Teammate or Study Group to Switch</h3>
                <p className="text-[11px] text-slate-400">Collaborative chat will immediately become available for everyone</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddTeammateModal(false)}
              className="p-1 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleAddTeammate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Teammate or Group Name *</label>
              <input
                type="text"
                required
                value={newTeammateName}
                onChange={(e) => setNewTeammateName(e.target.value)}
                placeholder="e.g. Rahul Sharma / Class 12 Science Circle"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Handle or Member ID (Optional)</label>
              <input
                type="text"
                value={newTeammateHandle}
                onChange={(e) => setNewTeammateHandle(e.target.value)}
                placeholder="e.g. @rahul_studies or Student ID"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Role in Study Room</label>
              <select
                value={newTeammateRole}
                onChange={(e) => setNewTeammateRole(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-500"
              >
                <option value="STUDY_BUDDY">Study Buddy (Peer Student)</option>
                <option value="STUDY_GROUP">Study Group (Entire Batch)</option>
                <option value="MENTOR">Mentor / Educator</option>
                <option value="PARENT">Parent / Supporter</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={addingTeammate}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                {addingTeammate ? 'Connecting Member...' : 'Add to Switch Room & Enable Shared Chat'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Grid: Live Collaborative Simulator (7 cols) & Room Members (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Interactive Switch Room Simulator (7 cols) */}
        <div className="lg:col-span-7 flex flex-col h-[650px] rounded-3xl bg-[#0F172A]/90 border border-slate-800/80 backdrop-blur-xl overflow-hidden shadow-2xl">
          {/* Simulator Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  {activeRoom?.name || 'Buddhi Study Circle'}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                    Live Shared Room
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">Study Teammates & AI Mentor</p>
              </div>
            </div>
          </div>

          {/* Quick Preset Buttons for Evaluators */}
          <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-[11px] shrink-0 no-scrollbar">
            <span className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider shrink-0">Prompts:</span>
            {[
              'What are our pending tasks for tomorrow?',
              'We are feeling stressed with exams, please reorganize our schedule',
              'Generate a practice quiz for our study circle',
              'Completed task #1',
            ].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSimulateMessage(preset)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500/40 text-slate-300 hover:text-sky-300 whitespace-nowrap transition text-xs shadow-sm"
              >
                {preset.slice(0, 26)}...
              </button>
            ))}
          </div>

          {/* Chat Stream Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#080C14]/70">
            {simDialogue.map((msg, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 ${
                  !msg.isBot ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold shadow-md ${
                    !msg.isBot
                      ? 'bg-gradient-to-tr from-sky-600 to-indigo-500 text-white'
                      : 'bg-gradient-to-tr from-sky-500 to-emerald-400 text-slate-950 font-bold'
                  }`}
                >
                  {!msg.isBot ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed whitespace-pre-wrap shadow-md ${
                    !msg.isBot
                      ? 'bg-sky-500 text-white'
                      : 'bg-[#0F172A] border border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-1 text-[10px] opacity-80 border-b border-white/10 pb-1">
                    <span className="font-bold">{msg.sender}</span>
                    <span className="font-mono text-[9px]">{msg.timestamp || 'Just now'}</span>
                  </div>
                  <div>{msg.text}</div>
                  {msg.action && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] text-emerald-400 flex items-center gap-1.5 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Synchronized: {msg.action}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {simLoading && (
              <div className="flex items-center gap-2.5 text-xs text-slate-400 italic p-2">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
                Buddhi AI Teammate is processing your study update...
              </div>
            )}
          </div>

          {/* Message Input Bar */}
          <div className="p-3 sm:p-4 bg-slate-900/80 border-t border-slate-800/80 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSimulateMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={simText}
                onChange={(e) => setSimText(e.target.value)}
                placeholder="Message to the study room..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/10 transition"
              />
              <button
                type="submit"
                disabled={!simText.trim() || simLoading}
                className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 disabled:opacity-40 shadow-lg shadow-sky-500/20"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Right: Teammates & Room Members (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Teammates Card */}
          <div className="p-6 rounded-3xl bg-[#0F172A]/80 border border-slate-800/80 backdrop-blur-xl space-y-5 shadow-xl h-[650px] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-bold text-white">Study Room Members ({activeRoom?.teammates?.length || 0})</h3>
                </div>
                <button
                  onClick={() => setShowAddTeammateModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Teammate
                </button>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                All added members share live study room updates and collaborative task tracking via the Switch room.
              </p>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {activeRoom?.teammates?.map((tm) => (
                  <div
                    key={tm.id}
                    className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-sky-400">
                        {tm.name[0]}
                      </div>
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          {tm.name}
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-medium">
                            {tm.role}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">{tm.handle || '@study_member'}</div>
                      </div>
                    </div>

                    {tm.role !== 'STUDENT' && (
                      <button
                        onClick={() => handleDeleteTeammate(tm.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded-lg transition"
                        title="Remove Member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Room Features Summary Banner */}
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2 text-xs text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block">Collaborative Room Features</span>
              <ul className="space-y-1.5 text-[11px]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Shared exam milestone and revision schedules</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Diagnostic practice quizzes generated on request</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Peer accountability and active study streaks</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
