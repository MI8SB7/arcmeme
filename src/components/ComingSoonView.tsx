import React from 'react';
import { ArrowRightLeft, Repeat, ShieldCheck, Zap } from 'lucide-react';

interface ComingSoonViewProps {
  type: 'trade' | 'swap';
}

export const ComingSoonView: React.FC<ComingSoonViewProps> = ({ type }) => {
  const isTrade = type === 'trade';

  return (
    <div className="flex-1 flex items-center justify-center p-6 min-h-[70vh]">
      <div className="max-w-2xl w-full glassmorphism-light p-10 rounded-3xl border border-border text-center relative overflow-hidden">
        
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#7C3AED] opacity-10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="w-20 h-20 mx-auto bg-card border border-border rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(124,58,237,0.2)]">
          {isTrade ? (
            <ArrowRightLeft size={36} className="text-[#3B82F6]" />
          ) : (
            <Repeat size={36} className="text-[#06B6D4]" />
          )}
        </div>

        <h1 className="text-4xl font-bold text-text mb-4 tracking-tight">
          {isTrade ? 'Trade Interface Preview' : 'Swap Integration'}
        </h1>
        
        <div className="inline-block px-4 py-1.5 rounded-full bg-[rgba(124,58,237,0.1)] border border-[rgba(124,58,237,0.3)] text-[#7C3AED] font-semibold text-sm mb-8 animate-pulse-slow">
          Coming Soon
        </div>

        <p className="text-muted text-lg max-w-lg mx-auto mb-10 leading-relaxed">
          {isTrade 
            ? "We are currently building the ultimate trading terminal for the Arc ecosystem. Advanced charting, deep liquidity pools, and zero-latency execution."
            : "Seamless cross-chain swaps and native USDC integration are being developed using the official Arc App Kit."}
        </p>

        {/* Future Integrations Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left border-t border-border pt-8">
          <div className="flex items-start space-x-3 p-4 rounded-xl bg-cardLight border border-border/50">
            <ShieldCheck className="text-[#10B981] mt-1 shrink-0" size={20} />
            <div>
              <h4 className="text-text font-medium mb-1">Arc App Kit</h4>
              <p className="text-xs text-muted">Native compatibility with Arc Network standards</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-4 rounded-xl bg-cardLight border border-border/50">
            <Zap className="text-[#F59E0B] mt-1 shrink-0" size={20} />
            <div>
              <h4 className="text-text font-medium mb-1">USDC & Cross-chain</h4>
              <p className="text-xs text-muted">Bridge assets fluidly across multiple layers</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
