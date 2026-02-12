
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { dbService } from '../services/db';
import { User, Role } from '../types';

const getRoleColor = (role: Role) => {
    switch (role) {
        case Role.ADMIN: return 'text-red-500 text-glow';
        case Role.MODERATOR: return 'text-cyan-400';
        case Role.BANNED: return 'text-gray-600 line-through';
        default: return 'text-[var(--accent-purple)]';
    }
};

const MembersPage: React.FC = () => {
    const [members, setMembers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchMembers = async () => {
            setLoading(true);
            try {
                const users = await dbService.getAllUsers();
                setMembers(users);
            } catch (error) {
                console.error("Failed to fetch members", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMembers();
    }, []);

    const filteredMembers = members.filter(member =>
        member.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <Navbar />
            <div className="w-full max-w-7xl mx-auto px-4 py-8 pb-20 fade-in">
                <h1 className="text-3xl font-light text-white mb-2">Members</h1>
                <p className="text-gray-500 mb-8">Browse the community's registered members.</p>

                <div className="mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search members..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full max-w-sm bg-[#1a1a1d] border border-gray-700 rounded-md py-2 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--accent-pink)] transition-colors"
                        />
                        <i className="ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--accent-pink)]"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredMembers.map(member => (
                            <div key={member.uid} className="glass-panel p-4 rounded-sm flex flex-col items-center text-center transition-all duration-300 hover:border-[var(--accent-pink)]/50 hover:-translate-y-1">
                                <Link to={`/members/${member.username}.${member.uid}`} className="block">
                                    <div 
                                        className="w-20 h-20 rounded-full p-1 border border-gray-700"
                                        style={{ backgroundColor: member.avatarColor || '#0d0d0f' }}
                                    >
                                        <img src={member.avatarUrl} alt={`${member.username}'s avatar`} className="w-full h-full rounded-full object-cover" />
                                    </div>
                                </Link>
                                <Link to={`/members/${member.username}.${member.uid}`}>
                                    <h3 className={`mt-3 font-bold text-sm ${getRoleColor(member.role)} hover:underline`}>{member.username}</h3>
                                </Link>
                                <p className="text-xs text-gray-500">{member.role}</p>
                                <p className="text-[10px] text-gray-600 mt-2">
                                    Joined: {new Date(member.registrationDate).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default MembersPage;
