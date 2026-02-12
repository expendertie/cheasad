
import React from 'react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#0d0d0f] text-gray-200 relative overflow-x-hidden">
        {/* Background Effects */}
        <div className="fixed inset-0 pointer-events-none z-0">
             <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--accent-purple)] rounded-full blur-[120px] opacity-10 animate-pulse"></div>
             <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--accent-pink)] rounded-full blur-[120px] opacity-10 animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>

        <main className="relative z-10 w-full min-h-screen flex flex-col">
            {children}
        </main>
    </div>
  );
};

export default Layout;
