import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { APP_CONFIG } from '../config/constants';
import {
  LayoutDashboard,
  PlusCircle,
  Trophy,
  Repeat,
  ExternalLink,
  Droplet,
  ShieldAlert,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { address, isConnected } = useAccount();


  const isAdmin = isConnected && address && APP_CONFIG.ADMIN_WALLET_ADDRESS 
    ? address.toLowerCase() === APP_CONFIG.ADMIN_WALLET_ADDRESS.toLowerCase()
    : false;

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/create', label: 'Launch Token', icon: <PlusCircle size={20} /> },
    { path: '/leaderboard', label: 'Leaderboard', icon: <Trophy size={20} /> },
    { path: '/swap', label: 'Swap', icon: <Repeat size={20} />, isBeta: true },
    { path: 'faucet', label: 'Faucet', icon: <Droplet size={20} />, isExternal: true, url: 'https://faucet.circle.com/' },
  ];

  if (isAdmin) {
    navItems.push({ path: '/admin', label: 'Admin Panel', icon: <ShieldAlert size={20} className="text-red-500" /> });
  }

  return (
    <>
      <aside className="fixed left-0 top-0 h-screen w-64 glassmorphism border-r border-border flex flex-col z-40 hidden md:flex">
        <Link to="/" className="p-6 flex items-center space-x-3 mb-8 cursor-pointer">
          <img src="/arc_logo.png" alt="ArcMeme Logo" className="h-8 w-auto object-contain" />
          <span className="text-xl font-extrabold text-text tracking-wider">ArcMeme</span>
        </Link>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));

            if (item.isExternal) {
              return (
                <a
                  key={item.label}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-muted hover:bg-cardLight hover:text-text transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-muted">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <ExternalLink size={14} className="opacity-50" />
                </a>
              );
            }

            if (item.isBeta) {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-primary/20 text-primary border border-primary/30 shadow-sm'
                      : 'text-muted hover:bg-cardLight hover:text-text'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`${isActive ? 'text-accent' : ''}`}>{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <span className="inline-flex items-center text-[10px] bg-[#06B6D4]/10 border border-[#06B6D4]/30 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold text-[#06B6D4]">
                    Beta
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-primary/20 text-primary border border-primary/30 shadow-sm'
                    : 'text-muted hover:bg-cardLight hover:text-text'
                }`}
              >
                <span className={`${isActive ? 'text-accent' : ''}`}>
                  {item.icon}
                </span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}

          <a
            href="https://testnet.arcscan.app"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-muted hover:bg-cardLight hover:text-text transition-all duration-300 mt-2"
          >
            <div className="flex items-center space-x-3">
              <ExternalLink size={20} />
              <span className="font-medium">ArcScan</span>
            </div>
          </a>
        </nav>

        <div className="p-4 mt-auto w-full mb-2 shrink-0">
          <a
            href="https://x.com/prasath177"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-3 w-full p-3 rounded-xl bg-cardLight border border-border hover:border-[#7C3AED]/40 hover:bg-card transition-all group shadow-sm hover:shadow-md dark:hover:shadow-[0_0_15px_rgba(124,58,237,0.15)] cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border border-border group-hover:border-[#7C3AED] transition-colors shrink-0 shadow-sm">
              <img src="/profile.png" alt="kakarot.eth" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col min-w-0 justify-center">
              <span className="text-[9px] text-muted uppercase tracking-wider mb-0.5 font-medium">Built by</span>
              <span className="text-sm font-bold text-text truncate leading-none mb-1">kakarot.eth</span>
              <span className="text-[11px] text-[#06B6D4] opacity-85 truncate leading-none font-mono">@prasath177</span>
            </div>
          </a>
        </div>
      </aside>


    </>
  );
};
