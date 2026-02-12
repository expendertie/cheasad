
import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';
import { forumCategories, latestPosts } from '../services/mockData';
import { authService } from '../services/authService';
import { dbService } from '../services/db.ts';
import { Role, User, Shout } from '../types';

const getRoleColor = (role: Role) => {
    switch (role) {
        case Role.ADMIN: return 'text-red-500 text-glow';
        case Role.MODERATOR: return 'text-cyan-400';
        case Role.BANNED: return 'text-[#2a2a2a] drop-shadow-[0_0_2px_rgba(255,255,255,0.5)] font-black uppercase tracking-widest line-through';
        default: return 'text-[var(--accent-purple)]';
    }
};

const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return date.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
};

const ForumPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [onlineStaff, setOnlineStaff] = useState<User[]>([]);
  const [allMembers, setAllMembers] = useState<User[]>([]);
  const [shouts, setShouts] = useState<Shout[]>([]);
  const [shoutInput, setShoutInput] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const shoutboxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      const fetchData = async () => {
          // 1. Fetch Staff (Async)
          const staff = await authService.getStaffUsers();
          setOnlineStaff(staff);
          
          // 2. Fetch All Members (Async)
          const users = await dbService.getAllUsers();
          setAllMembers(users);

          // 3. Fetch Shouts (Async)
          const fetchedShouts = await dbService.getShouts();
          setShouts(fetchedShouts);
      };
      
      fetchData();
  }, []);

  // Cooldown Timer Effect
  useEffect(() => {
    let timer: number;
    if (cooldown > 0) {
        timer = window.setInterval(() => {
            setCooldown((prev) => prev - 1);
        }, 1000);
    }
    return () => {
        if (timer) clearInterval(timer);
    };
  }, [cooldown]);

  const handlePostShout = async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!shoutInput.trim() || !currentUser) return;
      if (cooldown > 0) return;

      try {
          const newShout = await dbService.addShout(currentUser, shoutInput);
          setShouts(prev => [newShout, ...prev]);
          setShoutInput("");
          setCooldown(5); // Set 5 seconds cooldown
          
          // Scroll to top
          if (shoutboxRef.current) {
              shoutboxRef.current.scrollTop = 0;
          }
      } catch (error) {
          console.error("Failed to post shout", error);
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handlePostShout();
      }
  }

  return (
    <>
      <Navbar />
      
      <div className="w-full max-w-7xl mx-auto px-4 py-8 pb-20 fade-in">
        
        {/* Main Logo Header */}
        <div className="flex justify-center mb-12 relative">
             <h1 className="text-6xl font-black tracking-widest text-white text-glow glitch-effect select-none">
                THW CLUB
            </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* LEFT COLUMN (Main Content) */}
            <div className="lg:col-span-3 space-y-6">
                
                {/* SHOUTBOX */}
                <div className="glass-panel rounded-sm overflow-hidden flex flex-col">
                    <div className="bg-[#1a1a1d]/80 px-4 py-2 border-b border-gray-800 flex justify-between items-center shrink-0">
                        <span className="font-bold text-sm tracking-wide text-gray-300"><i className="ph-megaphone-simple mr-2"></i>SHOUTBOX</span>
                        <div className="text-gray-500 text-xs flex gap-2">
                             <i className="ph-arrows-out-simple hover:text-white cursor-pointer"></i>
                             <i className="ph-minus hover:text-white cursor-pointer"></i>
                        </div>
                    </div>
                    
                    <div ref={shoutboxRef} className="h-64 overflow-y-auto bg-[#111]/50 flex flex-col-reverse custom-scrollbar pr-1">
                        {shouts.length === 0 && (
                            <div className="flex-1 flex items-center justify-center text-gray-600 text-xs italic">No shouts yet. Be the first!</div>
                        )}
                        {shouts.map((shout) => (
                            <div key={shout.id} className="flex gap-2 items-center text-sm py-1.5 px-3 hover:bg-[#1a1a1d] transition-colors group border-b border-gray-800/20 last:border-0">
                                <Link to={`/members/${shout.username}.${shout.uid}`} className="flex-shrink-0">
                                    <div 
                                        className="w-5 h-5 rounded-sm border border-gray-800 group-hover:border-[var(--accent-pink)] transition-colors overflow-hidden"
                                        style={{ backgroundColor: shout.avatarColor || '#1a1a1d' }}
                                    >
                                        <img src={shout.avatarUrl} className="w-full h-full object-cover" alt="av" />
                                    </div>
                                </Link>
                                
                                {/* Shout Content Container */}
                                <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-hidden">
                                    <Link to={`/members/${shout.username}.${shout.uid}`} className={`font-bold text-xs ${getRoleColor(shout.role)} hover:underline whitespace-nowrap shrink-0`}>
                                        {shout.username}:
                                    </Link>
                                    <span className="text-gray-300 text-xs truncate shrink" title={shout.message}>
                                        {shout.message}
                                    </span>
                                    <span className="text-[10px] text-gray-600 whitespace-nowrap shrink-0">
                                        {formatTimeAgo(shout.time)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-3 bg-[#141416] border-t border-gray-800 shrink-0">
                        {currentUser ? (
                            <div className="flex gap-2 relative">
                                <input 
                                    type="text" 
                                    value={shoutInput}
                                    onChange={(e) => setShoutInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={cooldown > 0 ? `Wait ${cooldown}s...` : "What's on your mind?"}
                                    className={`flex-1 bg-[#0d0d0f] border border-gray-700 rounded-sm pl-3 pr-10 py-2 text-sm text-gray-200 focus:outline-none focus:border-[var(--accent-pink)] transition-colors ${cooldown > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    maxLength={200}
                                    disabled={cooldown > 0}
                                />
                                <button 
                                    onClick={() => handlePostShout()} 
                                    className={`absolute right-1 top-1/2 -translate-y-1/2 p-1.5 transition-colors ${cooldown > 0 ? 'text-gray-700 cursor-not-allowed' : 'text-gray-500 hover:text-[var(--accent-pink)]'}`}
                                    title="Send"
                                    disabled={cooldown > 0}
                                >
                                    <i className="ph-paper-plane-right text-lg"></i>
                                </button>
                            </div>
                        ) : (
                             <div className="w-full text-center text-xs text-gray-500 py-2">
                                 <Link to="/login" className="text-[var(--accent-pink)] hover:underline">Log in</Link> to shout.
                             </div>
                        )}
                    </div>
                </div>

                {/* FORUM CATEGORIES */}
                <div className="space-y-6">
                    {forumCategories.map((category, idx) => (
                        <div key={idx} className="glass-panel rounded-sm overflow-hidden border-t-2 border-t-[var(--accent-pink)]">
                            <div className="bg-[#1a1a1d]/90 px-4 py-3 border-b border-gray-800">
                                <h3 className="font-bold text-sm text-white tracking-wider uppercase">{category.title}</h3>
                            </div>
                            
                            <div className="divide-y divide-gray-800 bg-[#111]/40">
                                {category.items.map((forum) => (
                                    <div key={forum.id} className="p-4 flex items-center gap-4 hover:bg-[#1a1a1d]/50 transition-colors group">
                                        <div className="w-10 h-10 bg-[#141416] rounded-full flex items-center justify-center border border-gray-700 group-hover:border-[var(--accent-pink)] group-hover:shadow-[0_0_10px_var(--accent-pink)] transition-all duration-300 relative overflow-hidden">
                                            {forum.icon === 'custom-neon-megaphone' ? (
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:drop-shadow-[0_0_5px_rgba(240,44,132,0.8)] transition-all duration-300 z-10">
                                                    <defs>
                                                        <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                            <stop offset="0%" stopColor="#f02c84" />
                                                            <stop offset="100%" stopColor="#00ffff" />
                                                        </linearGradient>
                                                    </defs>
                                                    <path d="M11 7.5L17 4.5V20L11 16.5H7C5.89543 16.5 5 15.6046 5 14.5V9.5C5 8.39543 5.89543 7.5 7 7.5H11Z" stroke="url(#neonGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d="M17 11.5C18.5 11.5 20 11.8 20 12.5C20 13.2 18.5 13.5 17 13.5" stroke="url(#neonGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d="M7 16.5L5.5 19.5C5.1 20.4 4 20.5 3.5 20" stroke="url(#neonGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d="M11 7.5V16.5" stroke="url(#neonGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            ) : (
                                                <i className={`${forum.icon} text-xl text-gray-500 group-hover:text-white transition-colors`}></i>
                                            )}
                                        </div>
                                        
                                        <div className="flex-1">
                                            <h4 className="font-bold text-white text-sm group-hover:text-[var(--accent-pink)] transition-colors cursor-pointer">{forum.title}</h4>
                                            {forum.subforums && (
                                                <div className="flex gap-2 mt-1">
                                                    {forum.subforums.map(sf => (
                                                        <span key={sf} className="text-[10px] bg-[#1a1a1d] border border-gray-700 px-1 rounded text-gray-400 hover:text-white cursor-pointer hover:border-gray-500">{sf}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="hidden md:flex flex-col items-end text-xs text-gray-500 w-32">
                                            <span className="text-gray-300">{forum.threads.toLocaleString()}</span> threads
                                            <span className="text-gray-300">{forum.messages.toLocaleString()}</span> msgs
                                        </div>

                                        <div className="hidden sm:block w-48 border-l border-gray-800 pl-4">
                                            {forum.lastPost ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded bg-gray-800 overflow-hidden">
                                                        <img src={`https://ui-avatars.com/api/?name=${forum.lastPost.user}&background=random`} alt="av" />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <div className="truncate text-xs font-semibold text-[var(--accent-pink)] hover:underline cursor-pointer">{forum.lastPost.title}</div>
                                                        <div className="text-[10px] text-gray-500">
                                                            by <span className="text-gray-300">{forum.lastPost.user}</span>
                                                        </div>
                                                        <div className="text-[10px] text-gray-600">{forum.lastPost.time}</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-xs text-gray-600 italic pl-2">No posts yet</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

            </div>

            {/* RIGHT COLUMN (Sidebar) */}
            <div className="lg:col-span-1 space-y-6">
                
                {/* STAFF ONLINE */}
                <div className="glass-panel rounded-sm">
                    <div className="bg-[#1a1a1d]/80 px-4 py-2 border-b border-gray-800">
                        <span className="font-bold text-xs tracking-wide text-gray-300">STAFF ONLINE</span>
                    </div>
                    <div className="p-4 space-y-3 bg-[#111]/50">
                        {onlineStaff.length > 0 ? (
                             onlineStaff.map((staff) => (
                                <Link to={`/members/${staff.username}.${staff.uid}`} key={staff.uid} className="flex items-center gap-3 group">
                                    <div 
                                        className="w-10 h-10 rounded-md border border-gray-700 group-hover:border-[var(--accent-pink)] transition-colors overflow-hidden"
                                        style={{ backgroundColor: staff.avatarColor || '#1a1a1d' }}
                                    >
                                        <img src={staff.avatarUrl} className="w-full h-full object-cover" alt="staff" />
                                    </div>
                                    <div>
                                        <div className={`text-sm font-bold ${getRoleColor(staff.role)}`}>{staff.username}</div>
                                        <div className="text-[10px] text-gray-500">{staff.role === Role.ADMIN ? 'Administrator' : 'Moderator'}</div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="text-xs text-gray-500 italic">No staff online.</div>
                        )}
                    </div>
                </div>

                {/* MEMBERS ONLINE */}
                <div className="glass-panel rounded-sm">
                     <div className="bg-[#1a1a1d]/80 px-4 py-2 border-b border-gray-800">
                        <span className="font-bold text-xs tracking-wide text-gray-300">MEMBERS ONLINE</span>
                    </div>
                    <div className="p-4 text-xs leading-5 bg-[#111]/50">
                        {allMembers.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                                {allMembers.map((member, index) => (
                                    <React.Fragment key={member.uid}>
                                        <Link 
                                            to={`/members/${member.username}.${member.uid}`} 
                                            className={`${getRoleColor(member.role)} hover:underline font-semibold`}
                                        >
                                            {member.username}
                                        </Link>
                                        {index < allMembers.length - 1 && <span className="text-gray-600">,</span>}
                                    </React.Fragment>
                                ))}
                            </div>
                        ) : (
                            <span className="text-gray-500 italic">No members online.</span>
                        )}

                        <div className="mt-4 pt-3 border-t border-gray-800 text-[10px] text-gray-500">
                            Total: {allMembers.length} (members: {allMembers.length}, guests: 0)
                        </div>
                    </div>
                </div>

                {/* LATEST POSTS */}
                <div className="glass-panel rounded-sm">
                     <div className="bg-[#1a1a1d]/80 px-4 py-2 border-b border-gray-800">
                        <span className="font-bold text-xs tracking-wide text-gray-300">LATEST POSTS</span>
                    </div>
                    <div className="divide-y divide-gray-800 bg-[#111]/50">
                        {latestPosts && latestPosts.length > 0 ? (
                            latestPosts.map((post: any, i: number) => (
                                <div key={i} className="p-3 flex gap-3 hover:bg-[#1a1a1d] transition-colors">
                                    <img src={post.avatar} className="w-8 h-8 rounded bg-gray-800" alt="av" />
                                    <div className="overflow-hidden">
                                        <div className="truncate text-xs font-semibold text-[var(--accent-pink)] hover:underline cursor-pointer">{post.title}</div>
                                        <div className="text-[10px] text-gray-500">
                                            Latest: <span className="text-gray-300">{post.user}</span>
                                        </div>
                                        <div className="text-[10px] text-gray-600">{post.time}</div>
                                        <div className="text-[10px] text-gray-500 mt-0.5">{post.location}</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-xs text-gray-600 italic text-center">
                                No recent posts.
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-xs text-gray-600 flex flex-col gap-2">
            <div className="flex justify-center gap-4 text-gray-400">
                <a href="#" className="hover:text-white">Contact Us</a>
                <a href="#" className="hover:text-white">Terms and Rules</a>
                <a href="#" className="hover:text-white">Privacy Policy</a>
                <a href="#" className="hover:text-white">Help</a>
            </div>
            <p>&copy; 2025 THW CLUB. All rights reserved.</p>
        </div>

      </div>
    </>
  );
};

export default ForumPage;