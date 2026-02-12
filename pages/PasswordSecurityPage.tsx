
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import { Link } from 'react-router-dom';

const PasswordSecurityPage: React.FC = () => {
    const { currentUser, changePassword, logout } = useAuth();
    
    // Form State
    const [existingPassword, setExistingPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [showExisting, setShowExisting] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!existingPassword) {
             setMessage({ type: 'error', text: 'Please enter your existing password.' });
             return;
        }

        if (newPassword && newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match.' });
            return;
        }

        if (newPassword && newPassword.length < 6) {
             setMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
             return;
        }

        setIsSaving(true);

        try {
            if (newPassword) {
                await changePassword(existingPassword, newPassword);
                setMessage({ type: 'success', text: 'Your password has been changed.' });
                setExistingPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                 setMessage({ type: 'success', text: 'Changes saved.' });
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to save changes.' });
        } finally {
            setIsSaving(false);
        }
    };

    // Helper to format dates like "Yesterday at 10:43 PM"
    const formatDateFriendly = (isoString: string) => {
        if (!isoString) return '-';
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        
        const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

        if (date.toDateString() === now.toDateString()) {
            return `Today at ${timeStr}`;
        }
        
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return `Yesterday at ${timeStr}`;
        }
        
        if (diffDays < 7) {
            return `${date.toLocaleDateString('en-US', { weekday: 'long' })} at ${timeStr}`;
        }
        
        return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${timeStr}`;
    };

    // Get real logs or fallback to empty array
    const ipLogs = currentUser?.ipHistory && currentUser.ipHistory.length > 0 
        ? [...currentUser.ipHistory].sort((a, b) => new Date(b.latest).getTime() - new Date(a.latest).getTime())
        : [];

    if (!currentUser) return null;

    return (
        <>
            <Navbar />
            
            <div className="w-full max-w-7xl mx-auto px-4 py-8 pb-20 fade-in">
                
                {/* Warning Banner */}
                <div className="mb-8 border border-orange-500/50 bg-orange-500/10 text-orange-200 px-4 py-3 rounded-sm text-sm flex items-center gap-3">
                    <i className="ph-warning-circle text-lg"></i>
                    <span>The csgo loader will currently not work with the x64 version of steam.</span>
                </div>

                <div className="mb-4 text-xs text-gray-500 flex gap-2">
                    <Link to="/forum" className="hover:text-gray-300">Home</Link> 
                    <span>/</span>
                    <span className="text-gray-300">Your account</span>
                </div>

                <h1 className="text-3xl font-light text-white mb-8">Password and security</h1>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    
                    {/* LEFT SIDEBAR (Replicated from Account Details) */}
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
                                <Link to="/account/details" className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#1a1a1d] rounded transition-colors">Account details</Link>
                                <Link to="/account/security" className="block px-3 py-2 text-sm font-semibold text-white bg-[#1a1a1d] border-l-2 border-[var(--accent-pink)] rounded-r transition-colors">Password and security</Link>
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
                    <div className="lg:col-span-3 space-y-6">
                        
                         {/* Password Form Panel */}
                         <div className="glass-panel p-8 rounded-sm border border-gray-800/50">
                            
                            {message && (
                                <div className={`mb-6 p-4 rounded text-sm border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-400'}`}>
                                    {message.text}
                                </div>
                            )}

                            <form onSubmit={handleSave} className="space-y-6">
                                
                                {/* 2FA Section */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start border-b border-gray-800 pb-6">
                                    <label className="text-right text-sm font-semibold text-gray-400 hidden md:block pt-1">Two-step verification:</label>
                                    <div className="md:col-span-2">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-white font-bold text-sm">Enabled methods</span>
                                            <a href="#" className="text-[var(--accent-pink)] text-xs hover:underline">Change</a>
                                        </div>
                                        <ul className="list-disc pl-5 text-sm text-gray-300 space-y-1">
                                            <li>Verification code via app</li>
                                            <li>Backup codes</li>
                                        </ul>
                                        <p className="text-xs text-gray-500 mt-2">Protect your account by requiring an additional layer of security to sign in.</p>
                                    </div>
                                </div>

                                {/* Existing Password */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center pt-2">
                                    <label className="text-right text-sm font-semibold text-gray-400 hidden md:block">Your existing password:</label>
                                    <div className="md:col-span-2 relative">
                                        <input 
                                            type={showExisting ? 'text' : 'password'}
                                            value={existingPassword}
                                            onChange={(e) => setExistingPassword(e.target.value)}
                                            className="w-full bg-[#0d0d0f] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-[var(--accent-pink)] outline-none transition-colors"
                                        />
                                        <button type="button" onClick={() => setShowExisting(!showExisting)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs flex items-center gap-1">
                                             <i className={`fa-solid ${showExisting ? 'fa-eye-slash' : 'fa-eye'}`}></i> {showExisting ? 'Hide' : 'Show'}
                                        </button>
                                        <p className="text-[10px] text-gray-500 mt-1">For security reasons, you must verify your existing password before you may set a new password.</p>
                                    </div>
                                </div>

                                {/* New Password */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                    <label className="text-right text-sm font-semibold text-gray-400 hidden md:block">New password:</label>
                                    <div className="md:col-span-2 relative">
                                        <input 
                                             type={showNew ? 'text' : 'password'}
                                             value={newPassword}
                                             onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full bg-[#0d0d0f] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-[var(--accent-pink)] outline-none transition-colors"
                                        />
                                         <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs flex items-center gap-1">
                                             <i className={`fa-solid ${showNew ? 'fa-eye-slash' : 'fa-eye'}`}></i> {showNew ? 'Hide' : 'Show'}
                                        </button>
                                         <div className="h-0.5 w-full bg-gray-800 mt-1 overflow-hidden rounded">
                                            <div className={`h-full transition-all duration-300 ${newPassword.length > 0 ? (newPassword.length < 6 ? 'bg-red-500 w-1/3' : 'bg-green-500 w-full') : 'w-0'}`}></div>
                                         </div>
                                         {newPassword && !existingPassword && <p className="text-[10px] text-orange-400 mt-1">Entering a password is required.</p>}
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center border-b border-gray-800 pb-8">
                                    <label className="text-right text-sm font-semibold text-gray-400 hidden md:block">Confirm new password:</label>
                                    <div className="md:col-span-2 relative">
                                        <input 
                                             type={showConfirm ? 'text' : 'password'}
                                             value={confirmPassword}
                                             onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full bg-[#0d0d0f] border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-[var(--accent-pink)] outline-none transition-colors"
                                        />
                                         <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs flex items-center gap-1">
                                             <i className={`fa-solid ${showConfirm ? 'fa-eye-slash' : 'fa-eye'}`}></i> {showConfirm ? 'Hide' : 'Show'}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <div className="w-32">
                                        <Button type="submit" isLoading={isSaving} className="!py-2 !text-sm">
                                            <i className="fa-solid fa-floppy-disk mr-2"></i> Save
                                        </Button>
                                    </div>
                                </div>

                            </form>
                         </div>

                         {/* IP Logs Panel */}
                         <div className="glass-panel rounded-sm border border-gray-800/50 overflow-hidden">
                             {/* Tabs */}
                             <div className="flex border-b border-gray-800 bg-[#141416]/50">
                                 <button className="px-4 py-3 text-sm font-bold text-white border-b-2 border-[var(--accent-pink)] bg-[#1a1a1d]">Your IPs</button>
                                 <button className="px-4 py-3 text-sm font-semibold text-gray-500 hover:text-gray-300 transition-colors">Your sessions ({ipLogs.length})</button>
                             </div>

                             <div className="p-4 bg-[#111]/30">
                                 <div className="text-xs text-gray-300 mb-4 p-3 bg-[#1a1a1d] border border-gray-800 rounded">
                                     If you see any usage on your account from IP addresses that you don't recognize, you should immediately change your account password.
                                 </div>

                                 <div className="overflow-x-auto">
                                     <table className="w-full text-left text-xs">
                                         <thead>
                                             <tr className="border-b border-gray-800 text-gray-500 font-semibold">
                                                 <th className="pb-2 text-[var(--accent-pink)]">IP</th>
                                                 <th className="pb-2 text-[var(--accent-pink)]">Total</th>
                                                 <th className="pb-2 text-[var(--accent-pink)]">Earliest</th>
                                                 <th className="pb-2 text-[var(--accent-pink)]">Latest</th>
                                             </tr>
                                         </thead>
                                         <tbody className="text-gray-300 divide-y divide-gray-800/50">
                                             {ipLogs.length > 0 ? (
                                                 ipLogs.map((log, index) => (
                                                     <tr key={index} className="hover:bg-[#1a1a1d] transition-colors">
                                                         <td className="py-2.5 font-medium">{log.ip}</td>
                                                         <td className="py-2.5">{log.total}</td>
                                                         <td className="py-2.5">{formatDateFriendly(log.earliest)}</td>
                                                         <td className="py-2.5">{formatDateFriendly(log.latest)}</td>
                                                     </tr>
                                                 ))
                                             ) : (
                                                 <tr>
                                                     <td colSpan={4} className="py-4 text-center text-gray-600 italic">No IP logs found.</td>
                                                 </tr>
                                             )}
                                         </tbody>
                                     </table>
                                 </div>
                                 
                                 <div className="text-right mt-3">
                                     <button className="text-[10px] font-bold text-white hover:underline">View more IPs</button>
                                 </div>
                             </div>
                         </div>
                    </div>
                </div>

            </div>
        </>
    );
};

export default PasswordSecurityPage;
