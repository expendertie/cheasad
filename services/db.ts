
import type { User, InviteCode, Shout, Forum, Thread, Post } from '../types';
import { Role } from '../types';

// Use relative path for Vercel deployment
const API_URL = '/api';

export const dbService = {
    
    // --- USERS ---

    getAllUsers: async (): Promise<User[]> => {
        try {
            const response = await fetch(`${API_URL}/users`);
            if (!response.ok) return [];
            return await response.json();
        } catch (e) {
            console.error("DB Error: Failed to fetch users", e);
            return [];
        }
    },

    // --- SHOUTBOX ---

    getShouts: async (): Promise<Shout[]> => {
        try {
            const response = await fetch(`${API_URL}/shouts`);
            if (!response.ok) return [];
            return await response.json();
        } catch (e) {
            console.error("DB Error: Failed to fetch shouts", e);
            return [];
        }
    },

    addShout: async (user: User, message: string): Promise<Shout> => {
        const response = await fetch(`${API_URL}/shouts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: user.uid, message })
        });
        
        if (!response.ok) throw new Error("Failed to post shout");
        return await response.json();
    },

    deleteShout: async (shoutId: number, requesterUid: number): Promise<void> => {
        const response = await fetch(`${API_URL}/shouts/${shoutId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'x-user-uid': requesterUid.toString()
            }
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to delete shout");
        }
    },

    // --- IP LOGGING ---

    logUserIp: async (uid: number, ip: string): Promise<void> => {
        try {
            await fetch(`${API_URL}/users/${uid}/ip`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ip })
            });
        } catch (e) {
            console.warn("Failed to log IP");
        }
    }
};

export const forumService = {
    getForums: async (): Promise<{ category: string, forums: Forum[] }[]> => {
        const res = await fetch(`${API_URL}/forums`);
        if (!res.ok) throw new Error("Failed to fetch forums");
        return res.json();
    },
    
    getThreadsByForumId: async (forumId: number): Promise<{ forum: Forum, threads: Thread[] }> => {
        const res = await fetch(`${API_URL}/forums/${forumId}/threads`);
        if (!res.ok) throw new Error("Failed to fetch threads");
        return res.json();
    },

    getThreadById: async (threadId: number): Promise<{ thread: Thread, posts: Post[] }> => {
        const res = await fetch(`${API_URL}/threads/${threadId}`);
        if (!res.ok) throw new Error("Failed to fetch thread");
        return res.json();
    },

    createThread: async (uid: number, forumId: number, title: string, content: string): Promise<Thread> => {
        const res = await fetch(`${API_URL}/threads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid, forumId, title, content })
        });
        if (!res.ok) throw new Error("Failed to create thread");
        return res.json();
    },

    createPost: async (uid: number, threadId: number, content: string): Promise<Post> => {
        const res = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid, threadId, content })
        });
        if (!res.ok) throw new Error("Failed to create post");
        return res.json();
    }
};


export const _mockAddUser = (user: User) => {};
export const _mockGetUsers = () => [];
