import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AvatarBuilder } from '../components/AvatarBuilder';
import { Settings as SettingsIcon, User, Sun, Moon, LogOut, ShieldCheck, ShieldAlert, ArrowLeft } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, updateName, firebaseUser, logout, setScreen, setShowSavedAccounts, previousScreen, setShowLogoutConfirm } = useApp();
  const [name, setName] = useState(user.name);
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;

    try {
      await updateName(cleanName);
      alert('Hero name updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update name.');
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      
      {/* Header Back & Action Buttons */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => {
            if (previousScreen === 'auth' || previousScreen === 'onboarding') {
              setScreen('dashboard');
            } else {
              setScreen(previousScreen || 'dashboard');
            }
          }}
          className="px-3 py-1.5 rounded-xl bg-slate-950/60 border border-rpg-border/40 text-slate-400 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <span>👋 Welcome,</span>
          <span className="text-rpg-gold font-extrabold">{user.name}</span>
        </div>
      </div>
      
      {/* Round User Icon & User Name header link to Home page */}
      <div className="flex flex-col items-center justify-center gap-2">
        <button 
          onClick={() => setScreen('dashboard')}
          title="Back to Home"
          className="relative group focus:outline-none transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <AvatarBuilder config={user.avatar} size={110} />
          <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Home 🏠</span>
          </div>
        </button>
        <span className="text-sm font-black text-white tracking-tight">
          {user.name}
        </span>
      </div>

      {/* Main Settings panel */}
      <div className="glass-card p-5 space-y-6">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <SettingsIcon className="w-4 h-4 text-slate-400" /> Account Configuration
        </h3>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <div className="mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Hero Username
              </span>
              <span className="text-xs font-extrabold text-rpg-xp">
                @{user.username || 'hero'}
              </span>
            </div>

            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" /> Edit Hero Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-rpg-border/60 text-white placeholder-slate-700 text-xs font-semibold focus:outline-none focus:border-rpg-xp transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-rpg-border/50 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Update
              </button>
            </div>
          </div>
        </form>

        {/* Firebase Authentication Sync Status */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-rpg-border/40">
          <div className="flex items-center gap-2.5">
            {firebaseUser ? (
              <ShieldCheck className="w-5 h-5 text-rpg-discipline" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-slate-500 animate-pulse" />
            )}
            <div>
              <h4 className="text-xs font-bold text-white">
                {firebaseUser ? 'Discipline Cloud Active' : 'Offline Guest Mode'}
              </h4>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                {firebaseUser 
                  ? `Synchronized to ${firebaseUser.email}` 
                  : 'Your progression is bound to this device only.'}
              </p>
            </div>
          </div>
        </div>

        {/* Theme select */}
        <div className="pt-2 border-t border-rpg-border/30">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-rpg-gold" /> System Theme
            </label>
            <div className="flex bg-slate-950 p-1 rounded-xl border border-rpg-border/40 max-w-xs">
              <button
                onClick={() => setThemeMode('dark')}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  themeMode === 'dark' ? 'bg-rpg-border text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Moon className="w-3 h-3" /> Dark mode
              </button>
              <button
                onClick={() => {
                  setThemeMode('light');
                  alert('Light mode theme is currently locked in local sandbox for dark mode focus preference!');
                }}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  themeMode === 'light' ? 'bg-rpg-border text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Sun className="w-3 h-3" /> Light mode
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Switch Account Option */}
      <div>
        <button
          onClick={() => setShowSavedAccounts(true)}
          className="w-full py-3 mb-3 rounded-xl border border-rpg-border/60 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          🔄 Switch Account
        </button>
      </div>

      {/* Logout Option at the bottom */}
      <div>
        {firebaseUser ? (
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        ) : (
          <button
            onClick={logout}
            className="w-full py-3 rounded-xl border border-rpg-xp bg-rpg-xp/10 text-rpg-xp text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer hover:bg-rpg-xp/25"
          >
            Link Account
          </button>
        )}
      </div>

    </div>
  );
};
