
import type { User } from '../types';
import { Role } from '../types';

export interface ForumCategory {
    id: number;
    title: string;
    icon: string;
    threads: number;
    messages: number;
    subforums?: string[];
    lastPost?: {
        title: string;
        user: string;
        time: string;
    }
}

// Emptied because we use DB now
export const shoutboxData: any[] = [];

// Emptied because we use DB now
export const forumCategories: any[] = [];

// Emptied because we use DB now
export const onlineStaff: any[] = [];

// Emptied because we use DB now (and have no posts yet)
export const latestPosts: any[] = [];

// Emptied to remove fake profile comments
export const profilePosts: any[] = [];
