
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import { Link } from 'react-router-dom';

const AccountDetailsPage: React.FC = () => {
    const { currentUser, updateProfile, updateUserAvatar, logout } = useAuth();
    
    // Form State
    const [location, setLocation] = useState('');
    const [website, setWebsite] = useState('');
    const [about, setAbout] = useState('');
    const [dobDay, setDobDay] = useState<number | string>('');
    const [dobMonth, setDobMonth] = useState<number | string>('');
    const [dobYear, setDobYear] = useState<number | string>('');
    const [showDobDate, setShowDobDate] = useState(true);
    const [showDobYear, setShowDobYear] = useState(false);
    const [receiveEmails, setReceiveEmails] = useState(false);

    const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (currentUser) {
            setLocation(currentUser.location || '');
            setWebsite(currentUser.website || '');
            setAbout(currentUser.about || '');
            setDobDay(currentUser.dobDay || '');
            setDobMonth(currentUser.dobMonth || '');
            setDobYear(currentUser.dobYear || '');
            setShowDobDate(currentUser.showDobDate !== undefined ? currentUser.showDobDate : true);
            setShowDobYear(currentUser.showDobYear || false);
            setReceiveEmails(currentUser.receiveEmails || false);
        }
    }, [currentUser]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        try {
            await updateProfile({
                location,
                website,
                about,
                dobDay: Number(dobDay),
                dobMonth: Number(dobMonth),
                dobYear: Number(dobYear),
                showDobDate,
                showDobYear,
                receiveEmails
            });
            setMessage({ type: 'success', text: 'Your account details have been saved.' });
            
            // Clear message after 3s
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to save changes.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 500 * 1024) {
                 alert("Image too large (Max 500KB)");
                 return;
            }
            const reader = new FileReader();
            reader.onloadend = async () => {
                if (typeof reader.result === 'string') {
                    await updateUserAvatar(reader.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    if (!currentUser) return null;

    return (
        <>
            <Navbar />
            
            <div className="w-full max-w-7xl mx-auto px-4 py-8 pb-20 fade-in">
                
                {/* Warning Banner (similar to screenshot) */}
                <div className="mb-8 border border-orange-500/50 bg-orange-500/10 text-orange-200 px-4 py-3 rounded-sm text-sm flex items-center gap-3">
                    <i className="ph-warning-circle text-lg"></i>
                    <span>Please ensure your email address is up to date to receive important security notifications.</span>
                </div>

                <div className="mb-4 text-xs text-gray-500 flex gap-2">
                    <Link to="/forum" className="hover:text-gray-300">Home</Link> 
                    <span>/</span>
                    <span className="text-gray-300">Your account</span>
                </div>

                <h1 className="text-3xl font-light text-white mb-8">Account details</h1>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    
                    {/* LEFT SIDEBAR */}
                    <div className="lg:col-span-1 space-y-8">
                        {/* Group 1 */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Your Account</h3>
                            <div className="space-y-1">
                                <Link to={`/members/${currentUser.username}.${currentUser.uid}`} className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#1a1a1d] rounded transition-colors">Your profile</Link>
                                <a href="#" className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#1a1a1d] rounded transition-colors">Alerts</a>
                                <a href="#" className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#1a1a1d] rounded transition-colors">Reactions received</a>
                                <a href="#" className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#1a1a1d] rounded transition-colors">Bookmarks</a>
                                <a href="#" className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#1a1a1d] rounded transition-colors">Your invitations</a>
                            </div>
                        </div>

                         {/* Group 2 */}
                         <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Settings</h3>
                            <div className="space-y-1">
                                <Link to="/account/details" className="block px-3 py-2 text-sm font-semibold text-white bg-[#1a1a1d] border-l-2 border-[var(--accent-pink)] rounded-r transition-colors">Account details</Link>
                                <Link to="/account/security" className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#1a1a1d] rounded transition-colors">Password and security</Link>
                                <a href="#" className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#1a1a1d] rounded transition-colors">Privacy</a>
                                <a href="#" className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#1a1a1d] rounded transition-colors">Preferences</a>
                                <a href="#" className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#1a1a1d] rounded transition-colors">Signature</a>
                                <a href="#" className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#1a1a1d] rounded transition-colors">Account upgrades</a>
                                <a href="#" className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#1a1a1d] rounded transition-colors">Connected accounts</a>
                                <a href="#" className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#1a1a1d] rounded transition-colors">Following</a>
                                <a href="#" className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#1a1a1d] rounded transition-colors">Ignoring</a>
                            </div>
                        </div>
                        
                        <div className="pt-4 border-t border-gray-800">
                             <button onClick={logout} className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#1a1a1d] rounded transition-colors">Log out</button>
                        </div>
                    </div>

                    {/* RIGHT CONTENT FORM */}
                    <div className="lg:col-span-3">
                         <div className="glass-panel p-8 rounded-sm border border-gray-800/50">
                            
                            {message && (
                                <div className={`mb-6 p-4 rounded text-sm border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-400'}`}>
                                    {message.text}
                                </div>
                            )}

                            <form onSubmit={handleSave} className="space-y-6">
                                
                                {/* Username */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center border-b border-gray-800 pb-6">
                                    <label className="text-right text-sm font-semibold text-gray-400 hidden md:block">Username:</label>
                                    <div className="md:col-span-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-medium">{currentUser.username}</span>
                                            <a href="#" className="text-[var(--accent-pink)] text-xs hover:underline">Change</a>
                                        </div>
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start border-b border-gray-800 pb-6">
                                    <label className="text-right text-sm font-semibold text-gray-400 hidden md:block pt-1">Email:</label>
                                    <div className="md:col-span-2 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-medium">{currentUser.email}</span>
                                            <a href="#" className="text-[var(--accent-pink)] text-xs hover:underline">Change</a>
                                        </div>
                                    </div>
                                </div>

                                {/* Email Options */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start border-b border-gray-800 pb-6">
                                    <label className="text-right text-sm font-semibold text-gray-400 hidden md:block pt-1">Email options:</label>
                                    <div className="md:col-span-2">
                                        <label className="flex items-start gap-3 cursor-pointer group">
                                            <input 
                                                type="checkbox" 
                                                checked={receiveEmails}
                                                onChange={(e) => setReceiveEmails(e.target.checked)}
                                                className="mt-1 h-4 w-4 bg-[#0d0d0f] border-gray-600 rounded text-[var(--accent-pink)] focus:ring-[var(--accent-pink)]" 
                                            />
                                            <div>
                                                <div className="text-sm text-gray-200 group-hover:text-white transition-colors">Receive news and update emails</div>
                                                <div className="text-xs text-gray-500 mt-1">You may find additional email options under <a href="#" className="text-gray-400 underline hover:text-white">Preferences</a>.</div>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Avatar */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start border-b border-gray-800 pb-6">
                                    <label className="text-right text-sm font-semibold text-gray-400 hidden md:block pt-3">Avatar:</label>
                                    <div className="md:col-span-2 flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full border border-gray-700 overflow-hidden relative group cursor-pointer bg-[#0d0d0f]">
                                            <img src={currentUser.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                            <input type="file" onChange={handleAvatarChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" title="Change Avatar" accept="image/*" />
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                <i className="ph-camera text-white"></i>
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            <p>Click the image to change your avatar.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Profile Banner */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center border-b border-gray-800 pb-6">
                                    <label className="text-right text-sm font-semibold text-gray-400 hidden md:block">Profile banner:</label>
                                    <div className="md:col-span-2">
                                        <a href="#" className="text-[var(--accent-pink)] text-xs hover:underline">Edit profile banner</a>
                                    </div>
                                </div>

                                {/* Date of Birth */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start border-b border-gray-800 pb-6">
                                    <label className="text-right text-sm font-semibold text-gray-400 hidden md:block pt-2">Date of birth:</label>
                                    <div className="md:col-span-2 space-y-3">
                                        <div className="flex gap-2">
                                            <input 
                                                type="number" 
                                                placeholder="Day" 
                                                value={dobDay} 
                                                onChange={e => setDobDay(e.target.value)}
                                                className="bg-[#0d0d0f] border border-gray-700 rounded px-3 py-2 text-sm w-20 focus:border-[var(--accent-pink)] outline-none" 
                                            />
                                            <input 
                                                type="number" 
                                                placeholder="Month" 
                                                value={dobMonth} 
                                                onChange={e => setDobMonth(e.target.value)}
                                                className="bg-[#0d0d0f] border border-gray-700 rounded px-3 py-2 text-sm w-20 focus:border-[var(--accent-pink)] outline-none" 
                                            />
                                            <input 
                                                type="number" 
                                                placeholder="Year" 
                                                value={dobYear} 
                                                onChange={e => setDobYear(e.target.value)}
                                                className="bg-[#0d0d0f] border border-gray-700 rounded px-3 py-2 text-sm w-24 focus:border-[var(--accent-pink)] outline-none" 
                                            />
                                        </div>
                                        <div className="space-y-2 pt-1">
                                            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300 hover:text-white">
                                                <input 
                                                    type="checkbox" 
                                                    checked={showDobDate}
                                                    onChange={e => setShowDobDate(e.target.checked)}
                                                    className="bg-[#0d0d0f] border-gray-600 rounded text-[var(--accent-pink)] focus:ring-[var(--accent-pink)]" 
                                                />
                                                Show day and month of birth
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300 hover:text-white ml-5">
                                                <input 
                                                    type="checkbox" 
                                                    checked={showDobYear}
                                                    onChange={e => setShowDobYear(e.target.checked)}
                                                    className="bg-[#0d0d0f] border-gray-600 rounded text-[var(--accent-pink)] focus:ring-[var(--accent-pink)]" 
                                                />
                                                <div>
                                                    <div>Show year of birth</div>
                                                    <div className="text-[10px] text-gray-500">This will allow people to see your age.</div>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                    <label className="text-right text-sm font-semibold text-gray-400 hidden md:block">Location:</label>
                                    <div className="md:col-span-2">
                                        <input 
                                            type="text" 
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            className="w-full bg-[#0d0d0f] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-[var(--accent-pink)] outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* Website */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                    <label className="text-right text-sm font-semibold text-gray-400 hidden md:block">Website:</label>
                                    <div className="md:col-span-2">
                                        <input 
                                            type="text" 
                                            value={website}
                                            onChange={(e) => setWebsite(e.target.value)}
                                            className="w-full bg-[#0d0d0f] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-[var(--accent-pink)] outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* Auth Code */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center border-b border-gray-800 pb-6">
                                    <label className="text-right text-sm font-semibold text-gray-400 hidden md:block">Authentification Code:</label>
                                    <div className="md:col-span-2">
                                        <input 
                                            type="password" 
                                            disabled
                                            placeholder="****************"
                                            className="w-full bg-[#0d0d0f] border border-gray-700 rounded px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                {/* About You */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                                    <label className="text-right text-sm font-semibold text-gray-400 hidden md:block pt-2">About you:</label>
                                    <div className="md:col-span-2">
                                        <div className="border border-gray-700 rounded bg-[#0d0d0f] overflow-hidden focus-within:border-[var(--accent-pink)] transition-colors">
                                            {/* Fake Toolbar */}
                                            <div className="flex items-center gap-3 px-3 py-2 bg-[#141416] border-b border-gray-700 text-gray-400 text-xs">
                                                <i className="fa-solid fa-bold hover:text-white cursor-pointer"></i>
                                                <i className="fa-solid fa-italic hover:text-white cursor-pointer"></i>
                                                <i className="fa-solid fa-text-height hover:text-white cursor-pointer"></i>
                                                <div className="w-px h-3 bg-gray-600"></div>
                                                <i className="fa-solid fa-list-ul hover:text-white cursor-pointer"></i>
                                                <i className="fa-solid fa-list-ol hover:text-white cursor-pointer"></i>
                                                <div className="w-px h-3 bg-gray-600"></div>
                                                <i className="fa-regular fa-face-smile hover:text-white cursor-pointer"></i>
                                                <i className="fa-regular fa-image hover:text-white cursor-pointer"></i>
                                                <i className="fa-solid fa-ellipsis-vertical ml-auto hover:text-white cursor-pointer"></i>
                                                <i className="fa-solid fa-rotate-left hover:text-white cursor-pointer"></i>
                                            </div>
                                            <textarea 
                                                value={about}
                                                onChange={(e) => setAbout(e.target.value)}
                                                rows={5}
                                                className="w-full bg-[#0d0d0f] text-gray-200 text-sm p-3 outline-none resize-y min-h-[100px]"
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <div className="w-32">
                                        <Button type="submit" isLoading={isSaving} className="!py-2 !text-sm">
                                            <i className="fa-solid fa-floppy-disk mr-2"></i> Save
                                        </Button>
                                    </div>
                                </div>

                            </form>
                         </div>
                    </div>
                </div>

            </div>
        </>
    );
};

export default AccountDetailsPage;
