import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { CreateToken } from './components/CreateToken';
import { ComingSoonView } from './components/ComingSoonView';
import { LeaderboardTable } from './components/LeaderboardTable';
import { Trade } from './components/Trade';
import { CreatorProfile } from './components/CreatorProfile';
import { OnboardingModal } from './components/OnboardingModal';
import { AdminDeploy } from './components/AdminDeploy';
import { AdminDashboard } from './components/AdminDashboard';

const MainContent: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-background text-text font-sans selection:bg-[#7C3AED] selection:text-white relative">
      {/* Background glow effects */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#7C3AED] opacity-[0.03] blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#06B6D4] opacity-[0.03] blur-[120px] pointer-events-none"></div>
      
      <Sidebar />
      
      {/* Main content area shifted to right of sidebar on desktop */}
      <div className="flex-1 flex flex-col md:ml-64 w-full relative z-10 transition-all duration-300 min-h-screen overflow-x-hidden">
        <Navbar />
        
        <main className="flex-1 flex flex-col w-full py-6 pb-24 md:pb-8 animate-fadeIn">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create" element={<CreateToken />} />
            <Route path="/creator/:address" element={<CreatorProfile />} />
            <Route path="/token/:address" element={<Trade />} />
            <Route path="/trade/:address" element={<Trade />} />
            <Route path="/trade" element={<ComingSoonView type="trade" />} />
            <Route path="/swap" element={<ComingSoonView type="swap" />} />
            <Route path="/leaderboard" element={<LeaderboardTable />} />
            <Route path="/admin-deploy" element={<AdminDeploy />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
      
      {/* Global Modals */}
      <OnboardingModal />
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

export default App;
