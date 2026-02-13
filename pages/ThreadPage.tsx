
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';
import { forumService } from '../services/db';
import { Thread, Post, Role } from '../types';
import Button from '../components/Button';

const getRoleColor = (role: Role) => {
    switch (role) {
        case Role.ADMIN: return 'text-red-500 text-glow';
        case Role.MODERATOR: return 'text-cyan-400';
        case Role.BANNED: return 'text-gray-600 line-through';
        default: return 'text-[var(--accent-purple)]';
    }
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
    });
};

const ThreadPage: React.FC = () => {
    const { threadId } = useParams<{ threadId: string }>();
    const [thread, setThread] = useState<Thread | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();
    const [replyContent, setReplyContent] = useState('');
    const [isReplying, setIsReplying] = useState(false);
    const replyTextAreaRef = useRef<HTMLTextAreaElement>(null);
    
    useEffect(() => {
        if (threadId) {
            setLoading(true);
            forumService.getThreadById(parseInt(threadId))
                .then(data => {
                    setThread(data.thread);
                    setPosts(data.posts);
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [threadId]);
    
    const handleReplySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !threadId || !replyContent.trim()) return;
        
        setIsReplying(true);
        try {
            const newPost = await forumService.createPost(currentUser.uid, parseInt(threadId), replyContent.trim());
            setPosts([...posts, newPost]);
            setReplyContent('');
            if(replyTextAreaRef.current) {
                replyTextAreaRef.current.style.height = 'auto';
            }
        } catch(err) {
            alert("Failed to post reply.");
        } finally {
            setIsReplying(false);
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

    if (!thread || posts.length === 0) return <div>Thread not found.</div>;

    return (
        <>
            <Navbar />
            <div className="w-full max-w-7xl mx-auto px-4 py-8 pb-20 fade-in">
                
                 <div className="mb-4 text-xs text-gray-500 flex gap-2 items-center">
                    <Link to="/forum" className="hover:text-gray-300"><i className="ph-house"></i></Link> 
                    <span>/</span>
                    <Link to={`/forums/${thread.forum_id}`} className="hover:text-gray-300">Forum</Link>
                    <span>/</span>
                    <span className="text-gray-300 truncate max-w-xs">{thread.title}</span>
                </div>

                <h1 className="text-3xl font-light text-white mb-6">{thread.title}</h1>

                <div className="space-y-4">
                    {posts.map((post, index) => (
                        <div key={post.id} className="glass-panel rounded-sm flex gap-4 p-4 border-l-2 border-transparent hover:border-[var(--accent-pink)] transition-colors duration-300">
                            {/* User Info Sidebar */}
                            <div className="w-40 flex-shrink-0 text-center flex flex-col items-center">
                                <Link to={`/members/${post.username}.${post.uid}`}>
                                    <div className="w-20 h-20 rounded-full p-1 border border-gray-700" style={{backgroundColor: post.avatarColor}}>
                                        <img src={post.avatarUrl} alt={post.username} className="w-full h-full object-cover rounded-full" />
                                    </div>
                                </Link>
                                <Link to={`/members/${post.username}.${post.uid}`} className={`mt-2 font-bold text-sm ${getRoleColor(post.role)} hover:underline`}>
                                    {post.username}
                                </Link>
                                <div className="text-xs text-gray-500">{post.role}</div>
                                <div className="mt-3 pt-3 border-t border-gray-800/50 w-full text-xs text-gray-500 space-y-1">
                                    <div>Joined: {new Date(post.registrationDate).toLocaleDateString()}</div>
                                    <div>Messages: {post.post_count?.toLocaleString() ?? 0}</div>
                                </div>
                            </div>

                            {/* Post Content */}
                            <div className="flex-1 border-l border-gray-800/50 pl-4">
                                <div className="flex justify-between items-center text-xs text-gray-500 pb-2 border-b border-gray-800/50 mb-4">
                                    <span>{formatDate(post.created_at)}</span>
                                    <span>#{index + 1}</span>
                                </div>
                                <div className="prose prose-sm prose-invert max-w-none text-gray-300" dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }}>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Reply Box */}
                 <div className="mt-8 pt-6 border-t border-gray-800/50">
                     <h3 className="text-lg font-bold text-white mb-4">Write a reply</h3>
                     <div className="glass-panel p-4 rounded-sm flex gap-3 items-start">
                         <img src={currentUser?.avatarUrl} alt="your avatar" className="w-12 h-12 rounded-full border border-gray-700 mt-1" />
                         <form onSubmit={handleReplySubmit} className="flex-1">
                             <textarea
                                ref={replyTextAreaRef}
                                value={replyContent}
                                onChange={e => {
                                    setReplyContent(e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = `${e.target.scrollHeight}px`;
                                }}
                                placeholder="Your reply..."
                                className="w-full bg-[#0d0d0f] border border-gray-700 rounded p-3 text-sm text-gray-200 outline-none focus:border-[var(--accent-pink)] resize-none min-h-[80px] transition-all"
                             ></textarea>
                             <div className="flex justify-end mt-3">
                                <Button type="submit" isLoading={isReplying} className="!w-auto !py-2 px-6 !text-sm" disabled={!replyContent.trim()}>
                                    Post reply
                                </Button>
                             </div>
                         </form>
                     </div>
                 </div>

            </div>
        </>
    );
};

export default ThreadPage;
