import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, User, Shield, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';

export const Onboarding: React.FC = () => {
  const { user, checkUsernameExists, completeOnboarding } = useApp();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Initialize name and username based on default created user values (e.g. from Google info)
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setUsername(user.username || '');
    }
  }, [user]);

  // Real-time username check
  useEffect(() => {
    if (!username) {
      setUsernameStatus('idle');
      return;
    }

    if (/\s/.test(username)) {
      setUsernameStatus('invalid');
      return;
    }

    if (/[A-Z]/.test(username)) {
      setUsernameStatus('invalid');
      return;
    }

    const usernameRegex = /^[a-z0-9_.\-@!#$%^&*()+=~`{}|[\]\\:;"'<>,.?/]+$/;
    if (!usernameRegex.test(username)) {
      setUsernameStatus('invalid');
      return;
    }

    setUsernameStatus('checking');

    const delayDebounce = setTimeout(async () => {
      try {
        const exists = await checkUsernameExists(username);
        if (exists) {
          setUsernameStatus('taken');
        } else {
          setUsernameStatus('available');
        }
      } catch (err) {
        console.error(err);
        setUsernameStatus('idle');
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [username, checkUsernameExists]);

  const handleNext = () => {
    setError(null);
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    setError(null);
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanName = name.trim();
    const cleanUsername = username.trim().toLowerCase();

    if (!cleanName) {
      setError("Name is required to forge your account.");
      setLoading(false);
      return;
    }

    if (!cleanUsername) {
      setError("Username is required to forge your account.");
      setLoading(false);
      return;
    }

    if (/\s/.test(cleanUsername)) {
      setError("Username cannot contain spaces.");
      setLoading(false);
      return;
    }

    if (/[A-Z]/.test(cleanUsername)) {
      setError("Username must be in lowercase only.");
      setLoading(false);
      return;
    }

    const usernameRegex = /^[a-z0-9_.\-@!#$%^&*()+=~`{}|[\]\\:;"'<>,.?/]+$/;
    if (!usernameRegex.test(cleanUsername)) {
      setError("Username contains invalid characters.");
      setLoading(false);
      return;
    }

    if (usernameStatus === 'taken') {
      setError("This username is already taken by another Hero.");
      setLoading(false);
      return;
    }

    if (usernameStatus === 'checking') {
      setError("Checking username availability...");
      setLoading(false);
      return;
    }

    try {
      // Complete onboarding and enter dashboard
      await completeOnboarding(cleanName, cleanUsername);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update your Hero profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[#070b13]">
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-rpg-discipline/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-rpg-level/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Onboarding Panel */}
      <div className="w-full max-w-md p-8 rounded-3xl border border-rpg-border/30 bg-rpg-card/40 backdrop-blur-xl shadow-glass flex flex-col relative z-10">
        
        {/* Logo/Icon */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rpg-xp to-rpg-level flex items-center justify-center shadow-lg shadow-rpg-level/20 mb-3">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-white font-sans">
            LevelUp Life
          </h1>
          <p className="text-[10px] font-bold text-rpg-level uppercase tracking-widest mt-1">
            Forge Your Hero Identity
          </p>
        </div>

        {/* Progress Dots */}
        <div className="flex items-center justify-between mb-8">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Step {step} of 2
          </span>
          <div className="flex gap-2">
            {[1, 2].map(idx => (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx <= step ? 'w-6 bg-rpg-discipline' : 'w-2 bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/30 text-red-400 text-xs font-semibold leading-relaxed mb-4">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: NAME */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  What is your Name? <Sparkles className="w-5 h-5 text-rpg-gold animate-pulse" />
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter the name that other heroes in the guild will see. You can change this later.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Display Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ashok Kumar"
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950/50 border border-rpg-border/60 text-white placeholder-slate-700 text-sm focus:outline-none focus:border-rpg-discipline focus:ring-1 focus:ring-rpg-discipline/30 transition-all font-medium"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 rounded-xl bg-rpg-discipline text-slate-950 font-bold text-sm shadow-lg shadow-rpg-discipline/25 hover:opacity-90 hover:scale-[1.01] active:scale-95 transition-all flex items-center gap-1"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: USERNAME */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <h2 className="text-xl font-black text-white tracking-tight">
                  Choose a Unique Username
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  This username is how your friends will find and add you. It must be unique and in lowercase.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Unique Username</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. ashok_k"
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950/50 border border-rpg-border/60 text-white placeholder-slate-700 text-sm focus:outline-none focus:border-rpg-discipline focus:ring-1 focus:ring-rpg-discipline/30 transition-all font-medium"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                {/* Real-time feedback */}
                {usernameStatus === 'checking' && (
                  <span className="text-[10px] font-semibold text-rpg-level mt-1 block">
                    ⏳ Checking username availability...
                  </span>
                )}
                {usernameStatus === 'available' && (
                  <span className="text-[10px] font-semibold text-emerald-400 mt-1 block">
                    ✅ Username is available!
                  </span>
                )}
                {usernameStatus === 'taken' && (
                  <span className="text-[10px] font-semibold text-rose-400 mt-1 block">
                    ⚠️ this username already used or existed
                  </span>
                )}
                {usernameStatus === 'invalid' && (
                  <span className="text-[10px] font-semibold text-amber-500 mt-1 block">
                    ⚠️ Must be small letters only, no uppercase or spaces. Special symbols are allowed.
                  </span>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="flex items-center gap-1 text-slate-400 hover:text-white font-bold text-sm transition-all disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rpg-xp to-rpg-level text-white font-bold text-sm shadow-lg shadow-rpg-level/25 hover:opacity-90 hover:scale-[1.01] active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Forging...
                    </>
                  ) : (
                    <>
                      Forge Profile & Enter <Sparkles className="w-4 h-4 animate-pulse" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
