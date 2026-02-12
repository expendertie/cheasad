
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const BannedPage: React.FC = () => {
    const { logout, currentUser } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center p-4">
            <div className="max-w-md w-full glass-panel p-8 rounded border border-red-900 shadow-[0_0_50px_rgba(200,0,0,0.2)] fade-in">
                <i className="ph-skull text-6xl text-red-600 mb-6 animate-pulse"></i>
                
                <h1 className="text-4xl font-black text-white tracking-widest mb-2 uppercase glitch-effect">
                    BANNED
                </h1>
                
                <div className="h-px w-full bg-red-900/50 my-6"></div>
                
                <p className="text-gray-400 mb-6">
                    You have been permanently banned from <span className="text-white font-bold">THW CLUB</span>.
                </p>

                {currentUser?.banReason && (
                    <div className="bg-[#111] border border-red-900/30 p-4 rounded mb-6">
                        <p className="text-xs text-red-500 uppercase font-bold mb-1">Reason:</p>
                        <p className="text-sm text-gray-300 italic">"{currentUser.banReason}"</p>
                    </div>
                )}

                <p className="text-xs text-gray-600 mb-8">
                    If you believe this is an error, contact administration via external channels.
                </p>

                <button 
                    onClick={handleLogout}
                    className="w-full py-3 border border-gray-700 text-gray-400 hover:text-white hover:border-white transition-all uppercase text-xs font-bold tracking-widest"
                >
                    Log Out
                </button>
            </div>
        </div>
    );
};

export default BannedPage;
