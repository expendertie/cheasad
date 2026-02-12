
import type { User } from '../types';

// Use relative path for Vercel deployment
const API_URL = '/api/admin';

export const adminService = {
    getAllUsers: async (adminUid: number): Promise<User[]> => {
        const response = await fetch(`${API_URL}/users`, {
            headers: {
                'Content-Type': 'application/json',
                'x-admin-uid': adminUid.toString()
            }
        });
        if (!response.ok) throw new Error("Failed to fetch users");
        return await response.json();
    },

    updateUser: async (adminUid: number, targetUid: number, data: { role: string, isBanned: boolean, isMuted: boolean, banReason: string }): Promise<void> => {
        const response = await fetch(`${API_URL}/users/${targetUid}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-uid': adminUid.toString()
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Failed to update user");
    }
};