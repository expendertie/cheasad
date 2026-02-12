
import type { User, InviteCode, Shout } from '../types';
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

    deleteShout: async (shoutId: number, userUid: number): Promise<void> => {
        const response = await fetch(`${API_URL}/shouts/${shoutId}`, {
            method: 'DELETE',
            headers: { 
                'Content-Type': 'application/json',
                'x-user-uid': userUid.toString()
            },
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || "Failed to delete shout");
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

export const _mockAddUser = (user: User) => {};
export const _mockGetUsers = () => [];