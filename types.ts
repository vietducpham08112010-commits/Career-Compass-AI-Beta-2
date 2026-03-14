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
  QUIZ = 'QUIZ',
  PROGRESS = 'PROGRESS',
  PORTFOLIO = 'PORTFOLIO'
}

export enum AIProvider {
  GEMINI = 'GEMINI',
  CUSTOM = 'CUSTOM', // For Llama 3, Mistral, Ollama, etc.
  N8N = 'N8N' // n8n Workflow Webhook
}

export interface Clarification {
  question: string;
  options: string[];
  allowMultiple?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  file?: { data: string; mimeType: string; name: string }; // Base64 file data
  pastedTexts?: string[]; // Array of long pasted texts
  clarification?: Clarification;
}

export interface ChatSession {
  id: string;
  title: string;
  date: Date;
  messages: ChatMessage[];
}

export interface PortfolioItem {
  id: string;
  type: 'Certificate' | 'Grade/Score' | 'Personal Project';
  title: string;
  description: string;
  date: string;
  score?: string;
  link?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  careerGoal?: string;
  careerProfile?: string;
  isGuest?: boolean;
  avatar?: string;
  aiProvider?: AIProvider;
  customEndpoint?: string; // e.g., http://localhost:11434/v1/chat/completions OR n8n Webhook URL
  customModelName?: string; // e.g., llama3 (Not used for n8n)
  streak?: number;
  lastCheckIn?: string;
  provider?: 'google' | 'local';
  portfolio?: PortfolioItem[];
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
}

export interface Transcript {
  isUser: boolean;
  text: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  comments?: string[];
}