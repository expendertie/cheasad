
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