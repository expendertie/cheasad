
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Role } from '../types';

const Navbar: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getRoleColor = (role: Role) => {
        const r = role.toLowerCase();
        if (r === 'admin') return 'text-red-500 text-glow';
        if (r === 'moderator') return 'text-cyan-400';
        if (r === 'banned') return 'text-[#2a2a2a] drop-shadow-[0_0_2px_rgba(255,255,255,0.5)] font-black uppercase tracking-widest line-through';
        return 'text-purple-400';
    };

    const navItems = [
        { name: 'FORUMS', path: '/forum', icon: 'ph-chats' },
        { name: 'MEMBERS', path: '#', icon: 'ph-users' },
        { name: 'DISCORD', path: '#', icon: 'ph-discord-logo' },
        { name: 'WORKSHOP', path: '#', icon: 'ph-wrench' },
        { name: 'STORE', path: '#', icon: 'ph-shopping-cart' },
        { name: 'ROULETTE', path: '#', icon: 'ph-club' },
        { name: 'WALLET', path: '#', icon: 'ph-wallet' },
    ];

    const isAdmin = currentUser && currentUser.role.toLowerCase() === 'admin';

    return (
        <nav className="w-full bg-[#141416]/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                
                {/* Left: Navigation */}
                <div className="flex items-center space-x-1">
                    {/* ADMIN BUTTON */}
                    {isAdmin && (
                        <Link 
                            to="/admin"
                            className={`
                                relative px-4 py-5 text-sm font-bold tracking-wide transition-all duration-300 flex items-center gap-2 group text-red-500 hover:text-red-400
                                ${location.pathname === '/admin' ? 'bg-red-500/10' : ''}
                            `}
                        >
                            <i className="ph-shield-check text-lg mb-0.5"></i>
                            ADMIN
                            {location.pathname === '/admin' && (
                                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-red-500 shadow-[0_0_10px_red]"></span>
                            )}
                        </Link>
                    )}

                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link 
                                key={item.name} 
                                to={item.path}
                                className={`
                                    relative px-4 py-5 text-sm font-bold tracking-wide transition-all duration-300 flex items-center gap-2 group
                                    ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'}
                                `}
                            >
                                <i className={`${item.icon} text-lg mb-0.5 ${isActive ? 'text-[var(--accent-pink)]' : 'group-hover:text-[var(--accent-pink)] transition-colors'}`}></i>
                                {item.name}
                                {/* Active Indicator line */}
                                {isActive && (
                                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[var(--accent-pink)] shadow-[0_0_10px_var(--accent-pink)]"></span>
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* Right: User Profile */}
                <div className="flex items-center gap-4" ref={menuRef}>
                    {currentUser ? (
                        <>
                             {/* User Trigger */}
                             <div 
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className={`flex items-center gap-3 bg-[#1a1a1d] py-1 px-3 rounded-full border transition-all cursor-pointer group relative z-50
                                ${isMenuOpen ? 'border-[var(--accent-pink)] shadow-[0_0_10px_rgba(240,44,132,0.3)]' : 'border-gray-700/50 hover:border-[var(--accent-pink)]'}`}
                            >
                                <img src={currentUser.avatarUrl} alt="avatar" className="w-8 h-8 rounded-full border border-gray-600" />
                                <span className="font-semibold text-sm group-hover:text-glow text-white">{currentUser.username}</span>
                                <i className={`ph-caret-down text-gray-500 transition-transform ${isMenuOpen ? 'rotate-180 text-[var(--accent-pink)]' : ''}`}></i>
                            </div>
                            
                            {/* Icons (Inbox/Alerts) */}
                            <div className="flex gap-2 text-gray-400">
                                <button className="hover:text-white transition-colors relative w-8 h-8 flex items-center justify-center">
                                    <i className="ph-envelope-simple text-xl"></i>
                                </button>
                                <button className="hover:text-white transition-colors relative w-8 h-8 flex items-center justify-center">
                                    <i className="ph-bell text-xl"></i>
                                </button>
                            </div>

                            {/* DROPDOWN MENU */}
                            {isMenuOpen && (
                                <div className="absolute top-full right-0 mt-2 w-[340px] bg-[#1a1a1d] border border-gray-700 rounded shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50 mr-4">
                                    
                                    {/* Tabs Header */}
                                    <div className="flex border-b border-gray-800 bg-[#141416]">
                                        <div className="flex-1 py-3 text-center text-sm font-semibold text-white border-b-2 border-[var(--accent-pink)] cursor-default">
                                            Your account
                                        </div>
                                        <div className="flex-1 py-3 text-center text-sm font-semibold text-gray-500 hover:text-gray-300 hover:bg-[#1a1a1d] cursor-pointer transition-colors">
                                            Bookmarks
                                        </div>
                                    </div>

                                    {/* Profile Header */}
                                    <div className="p-4 bg-[#111] border-b border-gray-800 flex gap-4 items-start relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-pink)]/5 blur-[50px] rounded-full pointer-events-none"></div>
                                        
                                        <div className="relative">
                                            <img src={currentUser.avatarUrl} alt="av" className="w-14 h-14 rounded-full border border-gray-700 object-cover" />
                                            <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-[#111]"></div>
                                        </div>
                                        
                                        <div className="flex-1 z-10">
                                            <Link 
                                                to={`/members/${currentUser.username}.${currentUser.uid}`} 
                                                onClick={() => setIsMenuOpen(false)}
                                                className={`text-lg font-bold hover:underline ${getRoleColor(currentUser.role)}`}
                                            >
                                                {currentUser.username}
                                            </Link>
                                            <div className="text-xs text-gray-400 font-semibold mb-2">{currentUser.role} Account</div>
                                            
                                            <div className="grid grid-cols-2 gap-x-4 text-xs text-gray-500">
                                                <div className="flex justify-between">
                                                    <span>Messages:</span>
                                                    <span className="text-gray-300">0</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Reaction score:</span>
                                                    <span className="text-gray-300">0</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Links Section */}
                                    <div className="p-2 grid grid-cols-2 gap-x-1 text-sm bg-[#161618]">
                                        <div className="flex flex-col">
                                            <a href="#" className="px-3 py-1.5 text-gray-400 hover:text-white hover:bg-[#222] rounded transition-colors">News feed</a>
                                            <a href="#" className="px-3 py-1.5 text-gray-400 hover:text-white hover:bg-[#222] rounded transition-colors">Your content</a>
                                            <a href="#" className="px-3 py-1.5 text-gray-400 hover:text-white hover:bg-[#222] rounded transition-colors">Reactions received</a>
                                            <div className="h-px bg-gray-800 my-1 mx-2"></div>
                                            <Link to="/account/details" onClick={() => setIsMenuOpen(false)} className="px-3 py-1.5 text-gray-400 hover:text-white hover:bg-[#222] rounded transition-colors">Account details</Link>
                                            <Link to="/account/security" onClick={() => setIsMenuOpen(false)} className="px-3 py-1.5 text-gray-400 hover:text-white hover:bg-[#222] rounded transition-colors">Password and security</Link>
                                            <a href="#" className="px-3 py-1.5 text-gray-400 hover:text-white hover:bg-[#222] rounded transition-colors">Privacy</a>
                                            <a href="#" className="px-3 py-1.5 text-gray-400 hover:text-white hover:bg-[#222] rounded transition-colors">Preferences</a>
                                            <a href="#" className="px-3 py-1.5 text-gray-400 hover:text-white hover:bg-[#222] rounded transition-colors">Signature</a>
                                        </div>
                                        <div className="flex flex-col">
                                            <a href="#" className="px-3 py-1.5 text-gray-400 hover:text-white hover:bg-[#222] rounded transition-colors">Your tickets</a>
                                            <a href="#" className="px-3 py-1.5 text-gray-400 hover:text-white hover:bg-[#222] rounded transition-colors">Your invitations</a>
                                            <div className="h-px bg-gray-800 my-1 mx-2"></div>
                                            <a href="#" className="px-3 py-1.5 text-gray-400 hover:text-white hover:bg-[#222] rounded transition-colors">Account upgrades</a>
                                            <a href="#" className="px-3 py-1.5 text-gray-400 hover:text-white hover:bg-[#222] rounded transition-colors">Connected accounts</a>
                                            <a href="#" className="px-3 py-1.5 text-gray-400 hover:text-white hover:bg-[#222] rounded transition-colors">Following</a>
                                            <a href="#" className="px-3 py-1.5 text-gray-400 hover:text-white hover:bg-[#222] rounded transition-colors">Ignoring</a>
                                        </div>
                                    </div>

                                    {/* Footer Section */}
                                    <div className="border-t border-gray-800 p-2 bg-[#141416]">
                                        <button 
                                            onClick={handleLogout}
                                            className="w-full text-left px-3 py-1.5 text-sm text-gray-400 hover:text-red-400 hover:bg-[#222] rounded transition-colors flex items-center gap-2"
                                        >
                                            <i className="ph-sign-out"></i> Log out
                                        </button>
                                        
                                        <div className="mt-2 px-1 pb-1">
                                            <input 
                                                type="text" 
                                                placeholder="Update your status..." 
                                                className="w-full bg-[#0d0d0f] border border-gray-700 rounded px-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-[var(--accent-pink)] focus:ring-1 focus:ring-[var(--accent-pink)] transition-all"
                                            />
                                        </div>
                                    </div>

                                </div>
                            )}
                        </>
                    ) : (
                        <Link to="/login" className="text-sm font-bold text-[var(--accent-pink)] hover:text-white transition-colors">LOGIN</Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
