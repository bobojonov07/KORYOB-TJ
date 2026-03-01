
export type UserRole = 'korjob' | 'korfarmo';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  lastSeen?: number;
  createdAt?: string;
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
}

export interface ChatMessage {
  id?: string;
  senderUid: string;
  receiverUid: string;
  text: string;
  time: number;
  read: boolean;
}

export interface Conversation {
  partnerUid: string;
  lastMessage?: ChatMessage;
}
