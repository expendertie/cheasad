
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

// Static Structure, but 0 stats
export const forumCategories: { title: string, items: ForumCategory[] }[] = [
    {
        title: "News & Announcements",
        items: [
            { 
                id: 1, 
                title: "Announcements", 
                icon: "custom-neon-megaphone", 
                threads: 0, 
                messages: 0, 
            },
            { 
                id: 2, 
                title: "Community", 
                icon: "ph-users-three", 
                threads: 0, 
                messages: 0, 
            }
        ]
    },
    {
        title: "General",
        items: [
            { 
                id: 3, 
                title: "General Discussion", 
                icon: "ph-chat-circle-text", 
                threads: 0, 
                messages: 0, 
            },
            { 
                id: 4, 
                title: "Hardware & Software", 
                icon: "ph-cpu", 
                threads: 0, 
                messages: 0, 
            }
        ]
    },
    {
        title: "Marketplace",
        items: [
            { 
                id: 5, 
                title: "Configs", 
                icon: "ph-gear", 
                threads: 0, 
                messages: 0, 
                subforums: ["Rage", "Legit", "Semirage"],
            },
            { 
                id: 6, 
                title: "Scripts", 
                icon: "ph-code", 
                threads: 0, 
                messages: 0, 
            }
        ]
    }
];

// Emptied because we use DB now
export const onlineStaff: any[] = [];

// Emptied because we use DB now (and have no posts yet)
export const latestPosts: any[] = [];

// Emptied to remove fake profile comments
export const profilePosts: any[] = [];
