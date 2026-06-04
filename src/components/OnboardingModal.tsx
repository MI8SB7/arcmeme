import React, { useState } from 'react';
import { Rocket } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export const OnboardingModal: React.FC = () => {
  const { showOnboarding, createProfile, disconnectWallet } = useAppContext();
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');

  if (!showOnboarding) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (displayName.trim().length < 3) {
      setError('Display name must be at least 3 characters.');
      return;
    }
    createProfile(displayName.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050816]/90 backdrop-blur-sm px-4">
      <div className="glassmorphism-light p-8 md:p-10 rounded-3xl border border-primary shadow-lg max-w-md w-full animate-fadeIn relative overflow-hidden">
        
        {/* Background glow */}
        <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-primary opacity-20 blur-[80px] pointer-events-none"></div>

        <div className="flex flex-col items-center text-center relative z-10 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#3B82F6] to-[#7C3AED] p-[2px] mb-4 shadow-md">
            <div className="w-full h-full rounded-2xl bg-sidebar flex items-center justify-center">
              <Rocket size={32} className="text-text" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-text mb-2">Welcome to ArcMeme 🚀</h2>
          <p className="text-muted">Choose a display name for your creator profile to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div>
            <label className="block text-sm font-medium text-muted mb-2">Display Name</label>
            <input 
              type="text" 
              required
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setError('');
              }}
              placeholder="e.g. Kakarot, ArcBuilder" 
              className="w-full bg-sidebar border border-border rounded-xl px-4 py-3.5 text-text focus:outline-none focus:border-primary transition-colors"
            />
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
          </div>

          <button 
            type="submit"
            className="w-full glow-btn-primary py-4 rounded-xl text-lg font-bold transition-transform hover:scale-[1.02]"
          >
            Create Profile
          </button>
        </form>

        <div className="mt-6 text-center relative z-10">
          <button 
            onClick={() => disconnectWallet()}
            className="text-sm text-muted hover:text-[#EF4444] transition-colors"
          >
            Disconnect Wallet
          </button>
        </div>
      </div>
    </div>
  );
};
