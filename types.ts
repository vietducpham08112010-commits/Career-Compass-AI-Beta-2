export enum Language {
  EN = 'en',
  VI = 'vi'
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark'
}

export enum AppMode {
  LANDING = 'LANDING',
  AUTH = 'AUTH',
  DASHBOARD = 'DASHBOARD'
}

export enum DashboardTab {
  CHAT = 'CHAT',
  VOICE = 'VOICE',
  PROFILE = 'PROFILE'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  date: Date;
  messages: ChatMessage[];
}

export interface UserProfile {
  name: string;
  email: string;
  careerGoal?: string;
  isGuest?: boolean;
  avatar?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
}