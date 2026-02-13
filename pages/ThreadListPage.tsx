
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';
import { forumService } from '../services/db';
import { Forum, Thread, Role } from '../types';
import Button from '../components/Button';

const getRoleColor = (role: Role) => {
    switch (role) {
        case Role.ADMIN: return 'text-red-500 text-glow';
        case Role.MODERATOR: return 'text-cyan-400';
        case Role.BANNED: return 'text-gray-600 line-through';
        default: return 'text-[var(--accent-purple)]';
    }
};

const formatTimeAgo = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)} years ago`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)} months ago`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)} days ago`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)} hours ago`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)} minutes ago`;
    return `A moment ago`;
};

const ThreadListPage: React.FC = () => {
    const { forumId } = useParams<{ forumId: string }>();
    const [forum, setForum] = useState<Forum | null>(null);
    const [threads, setThreads] = useState<Thread[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const {currentUser} = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (forumId) {
            setLoading(true);
            forumService.getThreadsByForumId(parseInt(forumId))
                .then(data => {
                    setForum(data.forum);
                    setThreads(data.threads);
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [forumId]);

    const handleCreateThread = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !forumId || !newTitle.trim() || !newContent.trim()) return;
        
        try {
            const newThread = await forumService.createThread(currentUser.uid, parseInt(forumId), newTitle, newContent);
            navigate(`/threads/${newThread.id}`);
        } catch (error) {
            console.error(error);
            alert("Failed to create thread.");
        }
    };

    if (loading) return (
        <>
            <Navbar />
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-500"></div>
            </div>
        </>
    );

    if (!forum) return <div>Forum not found.</div>;

    return (
        <>
            <Navbar />
            <div className="w-full max-w-7xl mx-auto px-4 py-8 pb-20 fade-in">

                <div className="mb-4 text-xs text-gray-500 flex gap-2 items-center">
                    <Link to="/forum" className="hover:text-gray-300"><i className="ph-house"></i></Link> 
                    <span>/</span>
                    <span className="text-gray-300">{forum.title}</span>
                </div>

                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-light text-white">{forum.title}</h1>
                        <p className="text-gray-400 text-sm mt-1">{forum.description}</p>
                    </div>
                    <Button onClick={() => setIsCreating(true)} className="!w-auto !py-2 px-4 !text-sm"><i className="ph-plus-circle mr-2"></i>Post thread</Button>
                </div>

                {isCreating && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setIsCreating(false)}>
                        <form onSubmit={handleCreateThread} className="glass-panel w-full max-w-2xl rounded-lg p-6 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                            <h2 className="text-xl font-bold text-white mb-4">Create new thread in <span className="text-[var(--accent-pink)]">{forum.title}</span></h2>
                            <input 
                                type="text"
                                placeholder="Thread Title..."
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                className="w-full bg-[#0d0d0f] border border-gray-700 rounded p-3 text-lg text-white mb-4 focus:border-[var(--accent-pink)] outline-none"
                                required
                            />
                            <textarea
                                placeholder="Start your post here..."
                                value={newContent}
                                onChange={e => setNewContent(e.target.value)}
                                className="w-full bg-[#0d0d0f] border border-gray-700 rounded p-3 text-sm text-gray-200 h-40 resize-y focus:border-[var(--accent-pink)] outline-none"
                                required
                            ></textarea>
                            <div className="flex justify-end gap-3 mt-4">
                                <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 rounded text-sm text-gray-400 hover:text-white">Cancel</button>
                                <Button type="submit" className="!w-auto !py-2 px-6 !text-sm">Post thread</Button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="glass-panel rounded-sm overflow-hidden border-t-2 border-t-[var(--accent-pink)]">
                     <div className="bg-[#1a1a1d]/90 px-4 py-3 border-b border-gray-800 text-xs text-gray-500 uppercase font-bold tracking-wider grid grid-cols-12 gap-4">
                        <div className="col-span-7">Title</div>
                        <div className="col-span-2 text-right">Replies / Views</div>
                        <div className="col-span-3 text-right">Last message</div>
                    </div>
                    
                    <div className="divide-y divide-gray-800 bg-[#111]/40">
                        {threads.length > 0 ? threads.map(thread => (
                             <div key={thread.id} className="p-4 grid grid-cols-12 gap-4 items-center group hover:bg-white/5 transition-colors">
                                <div className="col-span-7 flex items-center gap-3">
                                    <div className="flex-shrink-0">
                                        <img src={thread.author_avatar_url} alt="av" className="w-10 h-10 rounded-full border-2 border-gray-700" style={{backgroundColor: thread.author_avatar_color}}/>
                                    </div>
                                    <div className="overflow-hidden">
                                        <Link to={`/threads/${thread.id}`} className="font-bold text-white text-sm hover:underline truncate block">
                                            {thread.title}
                                        </Link>
                                        <div className="text-xs text-gray-500 mt-1">
                                            by <Link to={`/members/${thread.author_username}.${thread.author_uid}`} className={`${getRoleColor(thread.author_role)} hover:underline`}>{thread.author_username}</Link>
                                            <span className="ml-2">{new Date(thread.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-span-2 text-right text-sm">
                                    <div className="text-gray-300">Replies: <span className="font-semibold">{thread.reply_count}</span></div>
                                    <div className="text-gray-500 text-xs">Views: {thread.view_count}</div>
                                </div>

                                <div className="col-span-3 text-right text-xs">
                                     <Link to={`/members/${thread.last_post_username}.${thread.last_post_uid}`} className={`${getRoleColor(thread.last_post_role)} font-semibold hover:underline`}>
                                        {thread.last_post_username}
                                    </Link>
                                    <div className="text-gray-500">{formatTimeAgo(thread.last_post_time)}</div>
                                </div>
                            </div>
                        )) : (
                            <div className="p-8 text-center text-gray-500 text-sm">
                                No threads in this forum yet.
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </>
    );
};

export default ThreadListPage;
