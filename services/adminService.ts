
import type { User, UserPermissions } from '../types';

const API_URL = '/api/admin';

export interface InviteCode {
    id: number;
    code: string;
    uses_left: number;
    created_at: string;
    expires_at: string | null;
}

export const adminService = {
    getAllUsers: async (adminUid: number): Promise<User[]> => {
        const response = await fetch(`${API_URL}/users`, {
            headers: { 'Content-Type': 'application/json', 'x-admin-uid': adminUid.toString() }
        });
        if (!response.ok) throw new Error("Failed to fetch users");
        return await response.json();
    },

    updateUser: async (adminUid: number, targetUid: number, data: { role: string, isBanned: boolean, isMuted: boolean, banReason: string, permissions: UserPermissions }): Promise<void> => {
        const response = await fetch(`${API_URL}/users/${targetUid}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-admin-uid': adminUid.toString() },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || "Failed to update user");
        }
    },

    getInviteCodes: async (adminUid: number): Promise<InviteCode[]> => {
        const response = await fetch(`${API_URL}/invite-codes`, {
            headers: { 'Content-Type': 'application/json', 'x-admin-uid': adminUid.toString() }
        });
        if (!response.ok) throw new Error("Failed to fetch codes");
        return await response.json();
    },

    createInviteCode: async (adminUid: number, code: string, usesLeft: number, expiresAt: string | null): Promise<void> => {
        const response = await fetch(`${API_URL}/invite-codes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-admin-uid': adminUid.toString() },
            body: JSON.stringify({ code, usesLeft, expiresAt })
        });
        if (!response.ok) throw new Error("Failed to create code");
    },

    deleteInviteCode: async (adminUid: number, id: number): Promise<void> => {
        const response = await fetch(`${API_URL}/invite-codes/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'x-admin-uid': adminUid.toString() }
        });
        if (!response.ok) throw new Error("Failed to delete code");
    }
};