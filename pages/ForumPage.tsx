
import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import { dbService, forumService } from '../services/db';
import { Role, User, Shout, Forum } from '../types';

const getRoleColor = (role: Role | null) => {
    if (!role) return 'text-gray-400';
    switch (role) {
        case Role.ADMIN: return 'text-red-500 text-glow';
        case Role.MODERATOR: return 'text-cyan-400';
        case Role.BANNED: return 'text-[#2a2a2a] drop-shadow-[0_0_2px_rgba(255,255,255,0.5)] font-black uppercase tracking-widest line-through';
        default: return 'text-[var(--accent-purple)]';
    }
};

const formatTimeAgo = (dateString: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)}y`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)}mo`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)}d`;
     interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)}h`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)}m`;
    return `${Math.floor(seconds)}s`;
};

const ForumPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [onlineStaff, setOnlineStaff] = useState<User[]>([]);
  const [allMembers, setAllMembers] = useState<User[]>([]);
  const [shouts, setShouts] = useState<Shout[]>([]);
  const [shoutInput, setShoutInput] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const shoutboxRef = useRef<HTMLDivElement>(null);
  const [forumCategories, setForumCategories] = useState<{ category: string, forums: Forum[] }[]>([]);

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

          // 4. Fetch Forum Data
          const fetchedForums = await forumService.getForums();
          setForumCategories(fetchedForums);
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

  const handleDeleteShout = async (shoutId: number) => {
      if (!currentUser) return;
      if (!window.confirm("Are you sure you want to delete this shout?")) return;

      try {
          await dbService.deleteShout(shoutId, currentUser.uid);
          setShouts(prevShouts => prevShouts.filter(s => s.id !== shoutId));
      } catch (error) {
          console.error("Failed to delete shout", error);
          alert("You do not have permission to delete this shout.");
      }
  };

  const canDeleteShouts = currentUser && (
    currentUser.role === Role.ADMIN || 
    currentUser.role === Role.MODERATOR ||
    currentUser.permissions?.canDeleteShouts
  );

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
                    
                    <div ref={shoutboxRef} className="h-64 overflow-y-auto bg-[#111]/50 flex flex-col-reverse custom-scrollbar">
                        {shouts.length === 0 && (
                            <div className="flex-1 flex items-center justify-center text-gray-600 text-xs italic">No shouts yet. Be the first!</div>
                        )}
                        <div className="flex flex-col-reverse">
                            {shouts.map((shout) => (
                                <div key={shout.id} className="flex items-start gap-3 p-3 border-b border-gray-800/50 group hover:bg-white/5 transition-colors">
                                    <Link to={`/members/${shout.username}.${shout.uid}`} className="flex-shrink-0">
                                        <div 
                                            className="w-8 h-8 rounded-md border border-gray-700 group-hover:border-[var(--accent-pink)] transition-colors overflow-hidden"
                                            style={{ backgroundColor: shout.avatarColor || '#1a1a1d' }}
                                        >
                                            <img src={shout.avatarUrl} className="w-full h-full object-cover" alt="av" />
                                        </div>
                                    </Link>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline justify-between">
                                            <Link to={`/members/${shout.username}.${shout.uid}`} className={`font-bold text-sm ${getRoleColor(shout.role)} hover:underline`}>
                                                {shout.username}
                                            </Link>
                                            <div className="flex items-center text-xs text-gray-600">
                                                <span>{formatTimeAgo(shout.time)}</span>
                                                {canDeleteShouts && (
                                                    <button 
                                                        onClick={() => handleDeleteShout(shout.id)} 
                                                        className="text-red-500 opacity-50 hover:opacity-100 ml-2 transition-opacity" 
                                                        title="Delete Shout"
                                                    >
                                                        <i className="ph-trash text-sm"></i>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-300 break-words mt-0.5">
                                            {shout.message}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-3 bg-[#141416] border-t border-gray-800 shrink-0">
                        {currentUser ? (
                            <form onSubmit={handlePostShout} className="flex gap-2 items-center">
                                <input 
                                    type="text" 
                                    value={shoutInput}
                                    onChange={(e) => setShoutInput(e.target.value)}
                                    placeholder={cooldown > 0 ? `Wait ${cooldown}s...` : "What's on your mind?"}
                                    className={`flex-1 bg-[#0d0d0f] border border-gray-700 rounded-sm px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[var(--accent-pink)] transition-colors ${cooldown > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    maxLength={200}
                                    disabled={cooldown > 0}
                                />
                                <button 
                                    type="submit"
                                    className={`px-4 py-2 rounded-sm transition-colors text-sm font-semibold ${!shoutInput.trim() || cooldown > 0 ? 'bg-[#1a1a1d] text-gray-600 cursor-not-allowed' : 'bg-[var(--accent-pink)] text-white hover:bg-opacity-80'}`}
                                    title="Post"
                                    disabled={!shoutInput.trim() || cooldown > 0}
                                >
                                    Post
                                </button>
                            </form>
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
                                <h3 className="font-bold text-sm text-white tracking-wider uppercase">{category.category}</h3>
                            </div>
                            
                            <div className="divide-y divide-gray-800 bg-[#111]/40">
                                {category.forums.map((forum) => (
                                    <div key={forum.id} className="p-4 flex items-center gap-4 hover:bg-[#1a1a1d]/50 transition-colors group">
                                        <div className="w-10 h-10 bg-[#141416] rounded-full flex items-center justify-center border border-gray-700 group-hover:border-[var(--accent-pink)] group-hover:shadow-[0_0_10px_var(--accent-pink)] transition-all duration-300 relative overflow-hidden">
                                             <i className={`${forum.icon} text-xl text-gray-500 group-hover:text-white transition-colors`}></i>
                                        </div>
                                        
                                        <div className="flex-1">
                                            <Link to={`/forums/${forum.id}`} className="font-bold text-white text-sm group-hover:text-[var(--accent-pink)] transition-colors cursor-pointer">{forum.title}</Link>
                                             <p className="text-xs text-gray-500 mt-1">{forum.description}</p>
                                        </div>

                                        <div className="hidden md:flex flex-col items-end text-xs text-gray-500 w-32">
                                            <span className="text-gray-300">{forum.thread_count.toLocaleString()}</span> threads
                                            <span className="text-gray-300">{forum.post_count.toLocaleString()}</span> msgs
                                        </div>

                                        <div className="hidden sm:block w-48 border-l border-gray-800 pl-4">
                                            {forum.last_post_thread_id ? (
                                                <div className="flex items-center gap-2">
                                                     <Link to={`/members/${forum.last_post_username}.${forum.last_post_user_uid}`} className="w-8 h-8 rounded bg-gray-800 overflow-hidden flex-shrink-0">
                                                         <img src={`https://ui-avatars.com/api/?name=${forum.last_post_username}&background=random`} alt="av" />
                                                     </Link>
                                                    <div className="overflow-hidden">
                                                         <Link to={`/threads/${forum.last_post_thread_id}`} className="truncate text-xs font-semibold text-[var(--accent-pink)] hover:underline cursor-pointer">{forum.last_post_thread_title}</Link>
                                                        <div className="text-[10px] text-gray-500">
                                                            by <Link to={`/members/${forum.last_post_username}.${forum.last_post_user_uid}`} className={`${getRoleColor(forum.last_post_user_role)} hover:underline`}>{forum.last_post_username}</Link>
                                                        </div>
                                                        <div className="text-[10px] text-gray-600">{formatTimeAgo(forum.last_post_time!)} ago</div>
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
