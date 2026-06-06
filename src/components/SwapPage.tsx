import React from 'react';
import { Repeat, ArrowDown, Info, Zap, ShieldCheck, Clock } from 'lucide-react';

export const SwapPage: React.FC = () => {
  return (
    <div className="flex-1 px-4 sm:px-6 md:px-10 py-8 max-w-5xl mx-auto w-full animate-fadeIn">

      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-text">Swap</h1>
          <span className="inline-flex items-center text-[11px] bg-[#06B6D4]/10 border border-[#06B6D4]/30 px-2.5 py-1 rounded-full uppercase tracking-widest font-bold text-[#06B6D4]">
            Beta
          </span>
        </div>
        <p className="text-muted text-base">Circle App Kit integration is currently under development.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Swap Card — col-span 3 */}
        <div className="lg:col-span-3">
          <div className="glassmorphism-light rounded-3xl border border-border p-6 relative overflow-hidden">

            {/* Ambient glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#06B6D4] opacity-[0.05] blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#7C3AED] opacity-[0.05] blur-[80px] rounded-full pointer-events-none" />

            {/* Coming-soon banner */}
            <div className="relative z-10 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#06B6D4]/8 border border-[#06B6D4]/25 mb-6">
              <Clock size={16} className="text-[#06B6D4] shrink-0" />
              <p className="text-sm text-[#06B6D4] font-medium">
                Coming Soon — Circle App Kit powered swaps
              </p>
            </div>

            {/* From Token */}
            <div className="relative z-10 mb-1">
              <div className="bg-card border border-border rounded-2xl p-4 opacity-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-muted uppercase tracking-wider">From</span>
                  <span className="text-xs text-muted">Balance: —</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="number"
                    placeholder="0.0"
                    disabled
                    className="bg-transparent text-3xl font-bold text-muted placeholder-muted/30 outline-none w-full cursor-not-allowed"
                  />
                  <button
                    disabled
                    className="flex items-center gap-2 bg-cardLight border border-border px-3 py-2 rounded-xl cursor-not-allowed shrink-0"
                  >
                    <div className="w-5 h-5 rounded-full bg-border/60" />
                    <span className="font-semibold text-muted text-sm">Select</span>
                    <ArrowDown size={14} className="text-muted" />
                  </button>
                </div>
              </div>
            </div>

            {/* Swap Direction Arrow */}
            <div className="flex justify-center -my-3 relative z-20">
              <div className="bg-card border border-border/80 p-2 rounded-xl opacity-40">
                <ArrowDown size={18} className="text-muted" />
              </div>
            </div>

            {/* To Token */}
            <div className="relative z-10 mt-1 mb-6">
              <div className="bg-card border border-border rounded-2xl p-4 opacity-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-muted uppercase tracking-wider">To</span>
                  <span className="text-xs text-muted">Balance: —</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-3xl font-bold text-muted/40 w-full">0.0</div>
                  <button
                    disabled
                    className="flex items-center gap-2 bg-cardLight border border-border px-3 py-2 rounded-xl cursor-not-allowed shrink-0"
                  >
                    <div className="w-5 h-5 rounded-full bg-border/60" />
                    <span className="font-semibold text-muted text-sm">Select</span>
                    <ArrowDown size={14} className="text-muted" />
                  </button>
                </div>
              </div>
            </div>

            {/* Info row */}
            <div className="relative z-10 flex items-center gap-2 text-xs text-muted mb-6 px-1 opacity-50">
              <Info size={13} />
              <span>Rate, fees and slippage will appear here once Circle App Kit is integrated.</span>
            </div>

            {/* Disabled Swap Button */}
            <button
              disabled
              className="relative z-10 w-full py-4 rounded-xl text-lg font-bold bg-border text-muted cursor-not-allowed border border-border/80"
            >
              Swap — Coming Soon
            </button>
          </div>
        </div>

        {/* Info Panel — col-span 2 */}
        <div className="lg:col-span-2 space-y-4">

          {/* What's coming */}
          <div className="glassmorphism-light rounded-2xl border border-border p-5">
            <h3 className="text-sm font-bold text-text uppercase tracking-wider mb-4 flex items-center gap-2">
              <Zap size={14} className="text-[#F59E0B]" />
              What's Coming
            </h3>
            <ul className="space-y-3">
              {[
                { label: 'Circle App Kit', desc: 'Native USDC-first swap infrastructure' },
                { label: 'Cross-chain Swaps', desc: 'Bridge assets across Arc and other chains' },
                { label: 'Zero-slippage Pools', desc: 'Concentrated liquidity for stablecoins' },
                { label: 'Gasless Transactions', desc: 'Sponsored by Circle Paymaster' },
              ].map(item => (
                <li key={item.label} className="flex items-start gap-3">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-[#06B6D4] shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-text leading-none mb-0.5">{item.label}</p>
                    <p className="text-xs text-muted">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Security notice */}
          <div className="glassmorphism-light rounded-2xl border border-border p-5">
            <h3 className="text-sm font-bold text-text uppercase tracking-wider mb-3 flex items-center gap-2">
              <ShieldCheck size={14} className="text-[#10B981]" />
              Security First
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              All swap routes will be audited and verified before launch.
              Funds remain in your wallet until you confirm a transaction.
              Never share your seed phrase.
            </p>
          </div>

          {/* Current trading CTA */}
          <div className="glassmorphism-light rounded-2xl border border-border/50 p-5 bg-primary/5">
            <p className="text-xs text-muted mb-3 leading-relaxed">
              Need to trade now? Use the existing token markets while Swap is under development.
            </p>
            <a
              href="/"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/10 border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors"
            >
              <Repeat size={14} />
              Browse Token Markets
            </a>
          </div>

        </div>
      </div>
    </div>
  );
};
