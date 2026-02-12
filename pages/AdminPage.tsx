
import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import { adminService, InviteCode } from '../services/adminService';
import { User, Role } from '../types';

const AdminPage: React.FC = () => {
    const { currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'users' | 'invites'>('users');
    
    const [newCode, setNewCode] = useState('');
    const [newUsesLeft, setNewUsesLeft] = useState(1);
    const [newExpiresAt, setNewExpiresAt] = useState('');
    const [creatingCode, setCreatingCode] = useState(false);
    
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editRole, setEditRole] = useState<Role>(Role.USER);
    const [editBanned, setEditBanned] = useState(false);
    const [editMuted, setEditMuted] = useState(false);
    const [editReason, setEditReason] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, [currentUser]);

    const fetchData = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const [usersData, codesData] = await Promise.all([
                adminService.getAllUsers(currentUser.uid),
                adminService.getInviteCodes(currentUser.uid)
            ]);
            setUsers(usersData);
            setInviteCodes(codesData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !newCode.trim()) return;
        
        setCreatingCode(true);
        try {
            await adminService.createInviteCode(
                currentUser.uid, 
                newCode.trim(), 
                newUsesLeft, 
                newExpiresAt ? newExpiresAt : null
            );
            setNewCode('');
            setNewUsesLeft(1);
            setNewExpiresAt('');
            fetchData();
        } catch (error) {
            alert("Failed to create invite code");
        } finally {
            setCreatingCode(false);
        }
    };

    const handleDeleteCode = async (id: number) => {
        if (!currentUser || !confirm('Delete this invite code?')) return;
        try {
            await adminService.deleteInviteCode(currentUser.uid, id);
            fetchData();
        } catch (error) {
            alert("Failed to delete invite code");
        }
    };

    const handleEditClick = (user: User) => {
        setEditingUser(user);
        setEditRole(user.role);
        setEditBanned(!!user.isBanned);
        setEditMuted(!!user.isMuted);
        setEditReason(user.banReason || '');
    };

    const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newRole = e.target.value as Role;
        setEditRole(newRole);
        if (newRole === Role.BANNED) setEditBanned(true);
        else if (editRole === Role.BANNED) setEditBanned(false);
    };

    const handleBanCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        setEditBanned(isChecked);
        if (isChecked) setEditRole(Role.BANNED);
        else if (editRole === Role.BANNED) setEditRole(Role.USER);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !editingUser) return;

        setSaving(true);
        try {
            await adminService.updateUser(currentUser.uid, editingUser.uid, {
                role: editRole,
                isBanned: editBanned,
                isMuted: editMuted,
                banReason: editReason
            });
            setEditingUser(null);
            fetchData();
        } catch (error) {
            alert("Failed to update user");
        } finally {
            setSaving(false);
        }
    };

    const filteredUsers = users.filter(u => 
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const generateRandomCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setNewCode(code);
    };

    return (
        <>
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 py-8 fade-in">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-white text-glow">
                        <i className="ph-shield-check mr-3"></i>ADMINISTRATION
                    </h1>
                    
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`px-4 py-2 rounded font-bold text-sm transition-colors ${
                                activeTab === 'users' ? 'bg-[var(--accent-pink)] text-white' : 'bg-[#1a1a1d] text-gray-400 hover:text-white'
                            }`}
                        >
                            <i className="ph-users mr-2"></i>Users
                        </button>
                        <button
                            onClick={() => setActiveTab('invites')}
                            className={`px-4 py-2 rounded font-bold text-sm transition-colors ${
                                activeTab === 'invites' ? 'bg-[var(--accent-pink)] text-white' : 'bg-[#1a1a1d] text-gray-400 hover:text-white'
                            }`}
                        >
                            <i className="ph-ticket mr-2"></i>Invite Codes
                        </button>
                    </div>
                </div>

                {activeTab === 'users' && (
                    <>
                        <div className="relative mb-4">
                            <input 
                                type="text" 
                                placeholder="Search users..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="bg-[#1a1a1d] border border-gray-700 rounded-full py-2 px-4 pl-10 text-sm text-white focus:border-[var(--accent-pink)] outline-none w-64"
                            />
                            <i className="ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
                        </div>

                        <div className="glass-panel rounded-sm overflow-hidden">
                            <div className="bg-[#141416] px-4 py-3 border-b border-gray-800 flex justify-between items-center">
                                <span className="font-bold text-sm text-gray-300">USER MANAGEMENT</span>
                                <span className="text-xs text-gray-500">{filteredUsers.length} users found</span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-[#0d0d0f] text-gray-500 uppercase text-xs font-bold tracking-wider">
                                        <tr>
                                            <th className="px-6 py-3">User</th>
                                            <th className="px-6 py-3">Role</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3">Joined</th>
                                            <th className="px-6 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800 bg-[#111]/50">
                                        {loading ? (
                                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading...</td></tr>
                                        ) : filteredUsers.length === 0 ? (
                                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">No users found.</td></tr>
                                        ) : (
                                            filteredUsers.map(user => (
                                                <tr key={user.uid} className="hover:bg-[#1a1a1d] transition-colors group">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded border border-gray-700" />
                                                            <div>
                                                                <div className="font-semibold text-white">{user.username}</div>
                                                                <div className="text-xs text-gray-500">{user.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${
                                                            user.role === Role.ADMIN ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                                                            user.role === Role.MODERATOR ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' :
                                                            user.role === Role.BANNED ? 'bg-black/80 border-gray-800 text-gray-400' :
                                                            'bg-gray-700/20 border-gray-700 text-gray-400'
                                                        }`}>
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex gap-2">
                                                            {(user.isBanned || user.role === Role.BANNED) && (
                                                                <span className="px-2 py-0.5 rounded bg-red-900/50 border border-red-700 text-red-200 text-[10px] font-bold">BANNED</span>
                                                            )}
                                                            {user.isMuted && (
                                                                <span className="px-2 py-0.5 rounded bg-orange-900/50 border border-orange-700 text-orange-200 text-[10px] font-bold">MUTED</span>
                                                            )}
                                                            {!user.isBanned && user.role !== Role.BANNED && !user.isMuted && (
                                                                <span className="text-green-500 text-xs flex items-center gap-1"><i className="ph-check-circle"></i> Active</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-xs">
                                                        {new Date(user.registrationDate).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <button 
                                                            onClick={() => handleEditClick(user)}
                                                            className="px-3 py-1.5 bg-[#1a1a1d] border border-gray-700 hover:border-[var(--accent-pink)] hover:text-[var(--accent-pink)] rounded text-xs font-semibold transition-all"
                                                        >
                                                            Manage
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'invites' && (
                    <>
                        <div className="glass-panel rounded-sm overflow-hidden mb-6">
                            <div className="bg-[#141416] px-4 py-3 border-b border-gray-800">
                                <span className="font-bold text-sm text-gray-300">CREATE NEW INVITE CODE</span>
                            </div>
                            <form onSubmit={handleCreateCode} className="p-4 bg-[#111]/50">
                                <div className="flex flex-wrap gap-4 items-end">
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="block text-xs text-gray-500 mb-1">Code</label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={newCode}
                                                onChange={e => setNewCode(e.target.value.toUpperCase())}
                                                placeholder="ENTERCODE"
                                                className="flex-1 bg-[#0d0d0f] border border-gray-700 rounded py-2 px-3 text-white focus:border-[var(--accent-pink)] outline-none font-mono"
                                                required
                                            />
                                            <button 
                                                type="button"
                                                onClick={generateRandomCode}
                                                className="px-3 py-2 bg-[#1a1a1d] border border-gray-700 rounded hover:border-[var(--accent-pink)] text-gray-400 hover:text-white transition-colors"
                                                title="Generate random"
                                            >
                                                <i className="ph-arrows-clockwise"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="w-32">
                                        <label className="block text-xs text-gray-500 mb-1">Uses</label>
                                        <input 
                                            type="number" 
                                            value={newUsesLeft}
                                            onChange={e => setNewUsesLeft(parseInt(e.target.value) || 1)}
                                            min={-1}
                                            className="w-full bg-[#0d0d0f] border border-gray-700 rounded py-2 px-3 text-white focus:border-[var(--accent-pink)] outline-none"
                                        />
                                    </div>
                                    <div className="w-48">
                                        <label className="block text-xs text-gray-500 mb-1">Expires (optional)</label>
                                        <input 
                                            type="datetime-local" 
                                            value={newExpiresAt}
                                            onChange={e => setNewExpiresAt(e.target.value)}
                                            className="w-full bg-[#0d0d0f] border border-gray-700 rounded py-2 px-3 text-white focus:border-[var(--accent-pink)] outline-none"
                                        />
                                    </div>
                                    <Button type="submit" isLoading={creatingCode} className="!py-2">
                                        <i className="ph-plus mr-2"></i>Create
                                    </Button>
                                </div>
                                <div className="mt-2 text-xs text-gray-500">
                                    Uses: 1 = Single, -1 = Unlimited
                                </div>
                            </form>
                        </div>

                        <div className="glass-panel rounded-sm overflow-hidden">
                            <div className="bg-[#141416] px-4 py-3 border-b border-gray-800 flex justify-between items-center">
                                <span className="font-bold text-sm text-gray-300">INVITE CODES</span>
                                <span className="text-xs text-gray-500">{inviteCodes.length} codes</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-[#0d0d0f] text-gray-500 uppercase text-xs font-bold tracking-wider">
                                        <tr>
                                            <th className="px-6 py-3">Code</th>
                                            <th className="px-6 py-3">Uses Left</th>
                                            <th className="px-6 py-3">Created</th>
                                            <th className="px-6 py-3">Expires</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800 bg-[#111]/50">
                                        {loading ? (
                                            <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading...</td></tr>
                                        ) : inviteCodes.length === 0 ? (
                                            <tr><td colSpan={6} className="p-8 text-center text-gray-500">No codes yet.</td></tr>
                                        ) : (
                                            inviteCodes.map(code => {
                                                const isExpired = code.expires_at && new Date(code.expires_at) < new Date();
                                                const isUsedUp = code.uses_left === 0;
                                                
                                                return (
                                                    <tr key={code.id} className="hover:bg-[#1a1a1d] transition-colors">
                                                        <td className="px-6 py-4">
                                                            <span className="font-mono font-bold text-white">{code.code}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`${code.uses_left === -1 ? 'text-green-400' : code.uses_left <= 3 ? 'text-orange-400' : 'text-gray-300'}`}>
                                                                {code.uses_left === -1 ? '∞' : code.uses_left}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-500 text-xs">
                                                            {new Date(code.created_at).toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-500 text-xs">
                                                            {code.expires_at ? new Date(code.expires_at).toLocaleString() : '-'}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {isExpired ? (
                                                                <span className="px-2 py-0.5 rounded bg-red-900/50 border border-red-700 text-red-200 text-[10px] font-bold">EXPIRED</span>
                                                            ) : isUsedUp ? (
                                                                <span className="px-2 py-0.5 rounded bg-gray-800 border border-gray-600 text-gray-400 text-[10px] font-bold">USED UP</span>
                                                            ) : (
                                                                <span className="px-2 py-0.5 rounded bg-green-900/50 border border-green-700 text-green-200 text-[10px] font-bold">ACTIVE</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button 
                                                                onClick={() => handleDeleteCode(code.id)}
                                                                className="px-3 py-1.5 bg-red-900/30 border border-red-800 hover:border-red-500 hover:text-red-400 rounded text-xs font-semibold transition-all"
                                                            >
                                                                <i className="ph-trash"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {editingUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#141416] w-full max-w-md border border-gray-700 rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-[#1a1a1d] rounded-t-lg">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <i className="ph-pencil-simple"></i> Edit User: <span className="text-[var(--accent-pink)]">{editingUser.username}</span>
                            </h3>
                            <button onClick={() => setEditingUser(null)} className="text-gray-500 hover:text-white">
                                <i className="ph-x text-lg"></i>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-6 space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Role</label>
                                <select 
                                    value={editRole} 
                                    onChange={handleRoleChange}
                                    className="w-full bg-[#0d0d0f] border border-gray-700 rounded p-2 text-white focus:border-[var(--accent-pink)] outline-none"
                                >
                                    <option value={Role.USER}>User</option>
                                    <option value={Role.MODERATOR}>Moderator</option>
                                    <option value={Role.ADMIN}>Admin</option>
                                    <option value={Role.BANNED}>Banned</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <label className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-colors ${editBanned ? 'bg-red-900/20 border-red-500' : 'bg-[#0d0d0f] border-gray-700'}`}>
                                    <input 
                                        type="checkbox" 
                                        checked={editBanned} 
                                        onChange={handleBanCheckboxChange} 
                                        className="w-4 h-4 accent-red-500"
                                    />
                                    <span className={editBanned ? 'text-red-400 font-bold' : 'text-gray-300'}>Ban User</span>
                                </label>

                                <label className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-colors ${editMuted ? 'bg-orange-900/20 border-orange-500' : 'bg-[#0d0d0f] border-gray-700'}`}>
                                    <input 
                                        type="checkbox" 
                                        checked={editMuted} 
                                        onChange={e => setEditMuted(e.target.checked)} 
                                        className="w-4 h-4 accent-orange-500"
                                    />
                                    <span className={editMuted ? 'text-orange-400 font-bold' : 'text-gray-300'}>Mute User</span>
                                </label>
                            </div>

                            {(editBanned || editMuted || editRole === Role.BANNED) && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Reason</label>
                                    <textarea 
                                        value={editReason}
                                        onChange={e => setEditReason(e.target.value)}
                                        placeholder="Reason..."
                                        className="w-full bg-[#0d0d0f] border border-gray-700 rounded p-2 text-sm text-white focus:border-[var(--accent-pink)] outline-none resize-none h-20"
                                    ></textarea>
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-2 rounded border border-gray-600 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">Cancel</button>
                                <Button type="submit" isLoading={saving} className="flex-1 !py-2">Save Changes</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminPage;
