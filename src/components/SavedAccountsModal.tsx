import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AvatarBuilder } from './AvatarBuilder';
import { X, Plus, Trash2, Lock, Check, Loader2 } from 'lucide-react';

export const SavedAccountsModal: React.FC = () => {
  const { 
    showSavedAccounts, 
    setShowSavedAccounts, 
    savedAccounts, 
    switchAccount, 
    removeSavedAccount, 
    logout,
    firebaseUser 
  } = useApp();

  const [switchingAccountUid, setSwitchingAccountUid] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!showSavedAccounts) return null;

  // Determine current active UID
  const currentUid = firebaseUser ? firebaseUser.uid : 'guest';

  const handleSwitch = async (uid: string) => {
    setError(null);
    if (uid === currentUid) {
      setShowSavedAccounts(false);
      return;
    }

    if (uid === 'guest') {
      setLoading(true);
      try {
        await switchAccount('guest');
        setShowSavedAccounts(false);
      } catch (err: any) {
        setError(err.message || 'Failed to switch to guest mode.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Registered account check
    // If they are already authenticated as that Firebase user (unlikely if active UID differs,
    // but possible if Firebase auth state changed or cached), switch immediately.
    // Otherwise, we prompt for password.
    if (firebaseUser && firebaseUser.uid === uid) {
      setLoading(true);
      try {
        await switchAccount(uid);
        setShowSavedAccounts(false);
      } catch (err: any) {
        setError(err.message || 'Failed to switch account.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Set state to show password prompt
    setSwitchingAccountUid(uid);
    setPassword('');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!switchingAccountUid) return;

    setLoading(true);
    setError(null);
    try {
      await switchAccount(switchingAccountUid, password);
      // Success! Close modal and reset state
      setSwitchingAccountUid(null);
      setPassword('');
      setShowSavedAccounts(false);
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else {
        setError(err.message || 'Failed to authenticate.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = () => {
    setShowSavedAccounts(false);
    logout(); // Log out current user to send them back to the login screen
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-sm rounded-3xl bg-slate-950/95 border border-rpg-border/40 overflow-hidden shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-rpg-border/20">
          <h3 className="text-sm font-black text-white uppercase tracking-wider">
            {switchingAccountUid ? 'Enter Password' : 'Switch Account'}
          </h3>
          <button 
            onClick={() => {
              if (switchingAccountUid) {
                setSwitchingAccountUid(null);
                setError(null);
              } else {
                setShowSavedAccounts(false);
              }
            }}
            className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-900 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {switchingAccountUid ? (
            /* Password Prompt Form */
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="text-center space-y-2 mb-4">
                <div className="flex justify-center">
                  {(() => {
                    const acc = savedAccounts.find(a => a.uid === switchingAccountUid);
                    return acc ? (
                      <AvatarBuilder config={acc.avatar} profilePicture={acc.profilePicture} size={70} showCamera={false} />
                    ) : (
                      <div className="w-[70px] h-[70px] rounded-full bg-slate-900 border border-rpg-border/30" />
                    );
                  })()}
                </div>
                <div className="text-xs font-bold text-white">
                  @{savedAccounts.find(a => a.uid === switchingAccountUid)?.username || 'hero'}
                </div>
                <p className="text-[10px] text-slate-500">
                  Please verify your credentials to switch to this account.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-950/20 border border-red-950/60 text-red-400 text-[10px] font-semibold text-center leading-relaxed">
                  ⚠️ {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="Enter account password"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-rpg-border/60 text-white placeholder-slate-700 text-xs font-semibold focus:outline-none focus:border-rpg-xp transition-all rounded-xl"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    autoFocus
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-600 absolute left-3 top-3.5" />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSwitchingAccountUid(null);
                    setError(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-rpg-border/50 text-slate-400 hover:text-white hover:bg-slate-900 text-xs font-bold transition-all cursor-pointer text-center"
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rpg-xp to-indigo-900 border border-rpg-xp/40 text-white text-xs font-bold transition-all hover:brightness-110 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying...
                    </>
                  ) : (
                    'Verify & Switch'
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Saved Accounts List */
            <div className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-950/20 border border-red-950/60 text-red-400 text-[10px] font-semibold text-center">
                  ⚠️ {error}
                </div>
              )}

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {savedAccounts.map((account) => {
                  const isActive = account.uid === currentUid;
                  return (
                    <div 
                      key={account.uid}
                      onClick={() => handleSwitch(account.uid)}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer group ${
                        isActive 
                          ? 'bg-gradient-to-r from-rpg-xp/15 to-indigo-950/10 border-rpg-xp/50' 
                          : 'bg-slate-900/40 border-rpg-border/20 hover:border-rpg-border/50 hover:bg-slate-900/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <AvatarBuilder config={account.avatar} profilePicture={account.profilePicture} size={38} showCamera={false} />
                          {isActive && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-950" />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-black text-white">{account.name}</div>
                          <div className="text-[9px] font-semibold text-slate-500">@{account.username}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {isActive ? (
                          <span className="p-1 rounded-full bg-rpg-xp/20 text-rpg-xp border border-rpg-xp/40">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => removeSavedAccount(account.uid)}
                              title="Remove from saved accounts"
                              className="p-1.5 rounded-lg border border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/40 transition-all cursor-pointer"
                              disabled={loading}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer Actions */}
              <div className="space-y-2.5 pt-3 border-t border-rpg-border/20">
                <button
                  onClick={handleAddAccount}
                  className="w-full py-2.5 rounded-xl border border-dashed border-rpg-border/50 text-slate-400 hover:text-white hover:border-rpg-border flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer bg-slate-900/20"
                >
                  <Plus className="w-4 h-4 text-slate-500" /> Log In to Another Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
