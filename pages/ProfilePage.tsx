
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import Navbar from '../components/Navbar';
import type { User } from '../types';
import { Role } from '../types';
import { profilePosts } from '../services/mockData';

const ProfilePage: React.FC = () => {
    const { memberId } = useParams<{ memberId: string }>();
    const { currentUser, updateUserAvatar, updateUserAvatarColor } = useAuth();
    const [user, setUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState('profile_posts');
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const colorInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            if (memberId) {
                // Parse "username.uid" format (e.g., "wainleka.1")
                const lastDotIndex = memberId.lastIndexOf('.');
                
                if (lastDotIndex !== -1) {
                    const usernameStr = memberId.substring(0, lastDotIndex);
                    const uidStr = memberId.substring(lastDotIndex + 1);
                    const numericUid = parseInt(uidStr, 10);

                    if (!isNaN(numericUid)) {
                        try {
                            // Now we await the async service calls
                            const foundUser = await authService.getUserByUsernameAndUid(usernameStr, numericUid);
                            if (foundUser) {
                                setUser(foundUser);
                            } else {
                                // Fallback: try finding by UID only
                                const byUid = await authService.getUserByUid(numericUid);
                                setUser(byUid);
                            }
                        } catch (e) {
                            console.error("Failed to load profile", e);
                        }
                    } 
                } 
            }
            setLoading(false);
        };
        
        fetchProfile();
    }, [memberId]);

    const getRoleColor = (role: Role) => {
        switch (role) {
            case Role.ADMIN: return 'text-red-500 text-glow';
            case Role.MODERATOR: return 'text-cyan-400';
            case Role.BANNED: return 'text-[#2a2a2a] drop-shadow-[0_0_2px_rgba(255,255,255,0.5)] font-black uppercase tracking-widest line-through';
            default: return 'text-[var(--accent-purple)]';
        }
    };

    const handleAvatarClick = () => {
        if (currentUser && user && currentUser.uid === user.uid) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB Limit for DB
                alert("Image size too large. Please select an image under 2MB.");
                return;
            }

            const reader = new FileReader();
            reader.onloadend = async () => {
                if (typeof reader.result === 'string') {
                    try {
                        await updateUserAvatar(reader.result);
                        // Update local user state immediately for smooth UX
                        if (user) setUser({ ...user, avatarUrl: reader.result as string });
                    } catch (e) {
                        console.error("Avatar update failed UI");
                    }
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleColorChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const color = event.target.value;
        try {
            await updateUserAvatarColor(color);
            if (user) setUser({ ...user, avatarColor: color });
        } catch (e) {
            console.error("Avatar color update failed UI");
        }
    };

    if (loading) {
         return (
            <>
                <Navbar />
                <div className="flex justify-center items-center h-[calc(100vh-64px)]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--accent-pink)]"></div>
                </div>
            </>
        );
    }

    if (!user) {
        return (
            <>
                <Navbar />
                <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] text-gray-500">
                    <i className="ph-user-minus text-6xl mb-4"></i>
                    <h2 className="text-xl font-bold text-gray-300">Member not found</h2>
                    <p className="mt-2">The requested user could not be located.</p>
                </div>
            </>
        );
    }

    const isOwnProfile = currentUser?.uid === user.uid;

    return (
        <>
            <Navbar />
            
            {/* Breadcrumbs */}
            <div className="max-w-7xl mx-auto px-4 py-4 text-xs text-gray-500 flex gap-2 items-center">
                <Link to="/forum" className="hover:text-gray-300"><i className="ph-house"></i></Link> 
                <span>/</span>
                <span className="hover:text-gray-300 cursor-pointer">Members</span>
                <span>/</span>
                <span className="text-gray-300">{user.username}</span>
            </div>

            <div className="w-full max-w-7xl mx-auto px-4 pb-20 fade-in">

                {/* Profile Header Block */}
                <div className="glass-panel rounded-sm p-6 relative bg-[#141416]/90 border border-gray-800">
                    
                    {/* Header Top Actions */}
                    <div className="absolute top-4 right-4 text-[10px] text-gray-500 flex gap-3">
                         <button className="hover:text-white transition-colors">Report</button>
                         {isOwnProfile && (
                             <button className="hover:text-white transition-colors">Edit profile banner</button>
                         )}
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 items-start mt-2">
                        
                        {/* Avatar */}
                        <div 
                            className={`flex-shrink-0 mx-auto md:mx-0 relative group ${isOwnProfile ? 'cursor-pointer' : ''}`}
                            onClick={handleAvatarClick}
                        >
                            <div 
                                className="w-28 h-28 rounded-full p-1 border border-gray-700 relative overflow-hidden transition-colors duration-300"
                                style={{ backgroundColor: user.avatarColor || '#0d0d0f' }}
                            >
                                <img src={user.avatarUrl} alt="av" className="w-full h-full rounded-full object-cover transition-opacity duration-300 group-hover:opacity-80" />
                                
                                {/* Edit Overlay */}
                                {isOwnProfile && (
                                    <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <div className="text-center">
                                            <i className="ph-camera text-2xl text-white mb-1"></i>
                                            <div className="text-[10px] text-gray-300 font-semibold uppercase">Edit</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Color Picker Trigger */}
                            {isOwnProfile && (
                                <>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); colorInputRef.current?.click(); }}
                                        className="absolute -top-1 -right-1 z-20 w-7 h-7 rounded-full bg-[#1a1a1d] border border-gray-700 text-gray-400 hover:text-[var(--accent-pink)] hover:border-[var(--accent-pink)] flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                                        title="Change Background Color"
                                    >
                                        <i className="ph-palette text-sm"></i>
                                    </button>
                                    <input 
                                        type="color" 
                                        ref={colorInputRef} 
                                        onChange={handleColorChange} 
                                        className="hidden" 
                                    />
                                </>
                            )}
                            
                            {/* Online Indicator */}
                            <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 border-4 border-[#141416] rounded-full pointer-events-none"></div>

                            {/* Hidden File Input */}
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileChange} 
                                accept="image/*" 
                                className="hidden" 
                            />
                        </div>
                        
                        {/* User Info */}
                        <div className="flex-1 text-center md:text-left w-full">
                            <h1 className={`text-2xl font-bold ${getRoleColor(user.role)} mb-1`}>{user.username}</h1>
                            <div className="text-xs font-bold text-gray-300 mb-2 uppercase tracking-wide">
                                {user.role}
                            </div>
                            
                            <div className="text-xs text-gray-500 space-y-1 mb-4">
                                <div className="flex justify-center md:justify-start gap-1">
                                    <span>Joined:</span>
                                    <span className="text-gray-300">{new Date(user.registrationDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                                <div className="flex justify-center md:justify-start gap-1">
                                    <span>Last seen:</span>
                                    <span className="text-gray-300">Online now</span>
                                    <span>·</span>
                                    <span>Viewing member profile <em>{user.username}</em></span>
                                </div>
                                {user.location && (
                                    <div className="flex justify-center md:justify-start gap-1">
                                        <span>From:</span>
                                        <span className="text-gray-300">{user.location}</span>
                                    </div>
                                )}
                                {user.website && (
                                    <div className="flex justify-center md:justify-start gap-1">
                                        <span>Website:</span>
                                        <a href={user.website} target="_blank" rel="noreferrer" className="text-[var(--accent-pink)] hover:underline">{user.website}</a>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            {!isOwnProfile && currentUser && (
                                <div className="flex justify-center md:justify-start gap-3 text-xs font-semibold text-[var(--accent-pink)]">
                                    <button className="hover:underline hover:text-white transition-colors">Send points</button>
                                    <button className="hover:underline hover:text-white transition-colors">Find</button>
                                </div>
                            )}
                        </div>

                        {/* Stats - Now 0/None */}
                        <div className="flex flex-row md:flex-col justify-center gap-8 md:gap-4 text-center md:text-right px-4 min-w-[150px] border-t md:border-t-0 md:border-l border-gray-800 pt-4 md:pt-0 w-full md:w-auto">
                            <div>
                                <div className="text-lg font-light text-white">0</div>
                                <div className="text-[10px] text-gray-500 uppercase tracking-wide">Messages</div>
                            </div>
                            <div>
                                <div className="text-lg font-light text-white">0</div>
                                <div className="text-[10px] text-gray-500 uppercase tracking-wide">Reaction score</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex overflow-x-auto border-b border-gray-800 mt-6 mb-4 scrollbar-hide">
                    {['Profile posts', 'Latest activity', 'Postings', 'Referrals', 'About'].map((tab) => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab.toLowerCase().replace(' ', '_'))}
                            className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 
                            ${activeTab === tab.toLowerCase().replace(' ', '_') 
                                ? 'text-white border-[var(--accent-pink)]' 
                                : 'text-gray-500 border-transparent hover:text-gray-300 hover:border-gray-700'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                {activeTab === 'profile_posts' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Status Input */}
                        {isOwnProfile && (
                            <div className="glass-panel p-4 rounded-sm border border-gray-800">
                                <div className="flex gap-3">
                                    <img src={currentUser.avatarUrl} alt="my_av" className="w-10 h-10 rounded-full border border-gray-700" />
                                    <div className="flex-1">
                                        <textarea 
                                            placeholder="Update your status..." 
                                            className="w-full bg-[#0d0d0f] border border-gray-700 rounded p-3 text-sm text-gray-200 focus:border-[var(--accent-pink)] outline-none resize-none h-12 min-h-[48px] focus:h-24 transition-all duration-200"
                                        ></textarea>
                                        <div className="flex justify-end mt-2">
                                            <button className="px-4 py-1.5 bg-[#1a1a1d] text-gray-300 text-xs rounded border border-gray-700 hover:bg-[#222] hover:text-white transition-colors">Post</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Posts Feed */}
                        <div className="space-y-4">
                            <div className="text-center text-gray-600 py-8 text-sm italic">
                                No profile posts yet.
                            </div>
                        </div>
                    </div>
                )}
                
                {activeTab === 'about' && (
                     <div className="glass-panel p-8 rounded-sm border border-gray-800 text-gray-300">
                        {user.about ? (
                            <div className="whitespace-pre-wrap">{user.about}</div>
                        ) : (
                            <div className="text-gray-500 italic">User has not written anything about themselves.</div>
                        )}
                        
                        <div className="mt-8 pt-4 border-t border-gray-800 text-xs text-gray-500 grid grid-cols-2 gap-4 max-w-md">
                            {user.showDobDate && (
                                <div className="flex justify-between">
                                    <span>Born:</span>
                                    <span className="text-gray-300">
                                        {user.dobMonth}/{user.dobDay} {user.showDobYear ? `/${user.dobYear}` : ''}
                                    </span>
                                </div>
                            )}
                        </div>
                     </div>
                )}

                {activeTab !== 'profile_posts' && activeTab !== 'about' && (
                     <div className="glass-panel p-8 text-center text-gray-500">
                        <i className="ph-lock-key text-4xl mb-2 opacity-50"></i>
                        <p>This content is restricted or currently empty.</p>
                     </div>
                )}

            </div>
        </>
    );
};

export default ProfilePage;