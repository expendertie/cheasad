
export enum Role {
  USER = 'User',
  MODERATOR = 'Moderator',
  ADMIN = 'Admin',
  BANNED = 'Banned',
}

export interface IpLog {
  ip: string;
  total: number;
  earliest: string; // ISO Date
  latest: string; // ISO Date
}

export interface User {
  uid: number;
  username: string;
  email: string;
  passwordHash: string;
  role: Role;
  registrationDate: string;
  avatarUrl: string;
  avatarColor?: string;
  
  // Extended Profile Fields
  location?: string;
  website?: string;
  about?: string;
  dobDay?: number;
  dobMonth?: number;
  dobYear?: number;
  showDobDate?: boolean;
  showDobYear?: boolean;
  receiveEmails?: boolean;
  
  // Security
  ipHistory?: IpLog[];

  // Moderation
  isBanned?: boolean;
  isMuted?: boolean;
  banReason?: string;
  // FIX: Add optional permissions property to align with the backend API response and resolve type errors.
  permissions?: {
    canMute?: boolean;
    canBan?: boolean;
    canDeleteShouts?: boolean;
  };
}

export interface InviteCode {
  code: string;
  uses: number; // -1 for infinite
  usedBy: number[]; // Array of UIDs
}

export interface Shout {
  id: number;
  uid: number;
  username: string;
  role: Role;
  message: string;
  time: string; // ISO string
  avatarUrl: string;
  avatarColor?: string;
}

export interface Forum {
    id: number;
    title: string;
    description: string;
    icon: string;
    thread_count: number;
    post_count: number;
    last_post_time: string | null;
    last_post_thread_id: number | null;
    last_post_thread_title: string | null;
    last_post_username: string | null;
    last_post_user_role: Role | null;
    last_post_user_uid: number | null;
}

export interface Thread {
  id: number;
  forum_id: number;
  title: string;
  is_pinned: boolean;
  is_locked: boolean;
  view_count: number;
  reply_count: number;
  
  // Author info
  author_uid: number;
  author_username: string;
  author_role: Role;
  author_avatar_url: string;
  author_avatar_color?: string;
  created_at: string;

  // Last post info
  last_post_time: string;
  last_post_uid: number;
  last_post_username: string;
  last_post_role: Role;
}

export interface Post {
    id: number;
    thread_id: number;
    uid: number;
    content: string;
    created_at: string;

    // Joined user data
    username: string;
    role: Role;
    avatarUrl: string;
    avatarColor?: string;
    registrationDate: string;
    post_count?: number;
}
