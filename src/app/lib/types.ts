
export type UserRole = 'korjob' | 'korfarmo';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  lastSeen?: number;
  createdAt?: string;
  warningCount?: number;
  reportsCount?: number;
  isBlocked?: boolean;
  blockReason?: string;
  favorites?: string[];
  isPremium?: boolean;
  premiumUntil?: string;
  profileImage?: string; // Data URI
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  city: string;
  salary?: string;
  hours?: string;
  age?: string;
  phone?: string;
  gender: string;
  desc: string;
  postedBy: string;
  postedEmail: string;
  postedUid: string;
  postedAt: string;
  views: number;
  active: boolean;
  image?: string; // Data URI for Premium users
  isPremium?: boolean;
}

export interface ChatMessage {
  id?: string;
  sender: string;
  text: string;
  time: string;
  read: boolean;
}

export interface UserReport {
  id: string;
  reportedUid: string;
  reporterUid: string;
  reason: string;
  timestamp: number;
}

export interface PremiumRequest {
  id: string;
  uid: string;
  email: string;
  userName: string;
  receiptImage: string; // Data URI
  timestamp: number;
  isPremium: boolean;
}
