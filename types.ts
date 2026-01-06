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

export enum AIProvider {
  GEMINI = 'GEMINI',
  CUSTOM = 'CUSTOM' // For Llama 3, Mistral, Ollama, etc.
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
  aiProvider?: AIProvider;
  customEndpoint?: string; // e.g., http://localhost:11434/v1/chat/completions
  customModelName?: string; // e.g., llama3
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
}

export interface Transcript {
  isUser: boolean;
  text: string;
}