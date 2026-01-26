import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Language, Theme, AppMode, DashboardTab, ChatMessage, ChatSession, AuthState, Transcript, UserProfile, AIProvider } from './types';
import { AVATARS, CAREER_TAGS, CAREER_QUOTES, SUGGESTION_PROMPTS, TRANSLATIONS, HOT_INDUSTRIES } from './constants';
import { sendChatMessage, LiveSessionManager } from './services/geminiService';
import { decode, encode, decodeAudioData, createPcmBlob } from './utils/audio';
import { Visualizer } from './components/Visualizer';
import emailjs from '@emailjs/browser';

// --- CONFIGURATION ---
const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_u6njafq',
  TEMPLATE_ID: 'template_7yqlm9c',
  PUBLIC_KEY: '8ABxIIEqUTEI3I-oL'
};

// --- SECURITY: FIXED RESET CODE (Requested by User) ---
// WARNING: This is a fixed code for all users. Not recommended for production.
const FIXED_RESET_CODE = '19283746';

// --- Icons ---
const Icons = {
  Microphone: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>,
  MessageSquare: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  User: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  LogOut: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>,
  Send: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Globe: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"/></svg>,
  Sun: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  Moon: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  Google: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" {...props}><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>,
  ArrowRight: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  History: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>,
  Refresh: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>,
  FileText: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" /></svg>,
  TrendingUp: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  Briefcase: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>,
  Zap: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
  Compass: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>,
  Target: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  Heart: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  ChevronDown: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M6 9l6 6 6-6"/></svg>,
  Stars: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  Sparkles: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z"/></svg>,
  Leaf: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>,
  Shield: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Activity: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Cpu: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="15" x2="23" y2="15"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="15" x2="4" y2="15"/></svg>,
  CreditCard: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  BookOpen: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  Eye: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  EyeOff: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  Server: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
};

// --- IMPRESSIVE FUTURISTIC COMPASS LOGO ---
const CompassLogo = ({ className = "w-24 h-24", isThinking = false }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="compass-ring-gradient" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#4f46e5" /> {/* Indigo-600 */}
        <stop offset="100%" stopColor="#06b6d4" /> {/* Cyan-500 */}
      </linearGradient>
      <linearGradient id="compass-needle-gradient" x1="50" y1="10" x2="50" y2="90">
        <stop offset="0%" stopColor="#f43f5e" /> {/* Rose-500 */}
        <stop offset="100%" stopColor="#c084fc" /> {/* Purple-400 */}
      </linearGradient>
      <filter id="drop-shadow-compass" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
        <feOffset dx="1" dy="2" result="offsetblur"/>
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.3"/>
        </feComponentTransfer>
        <feMerge> 
          <feMergeNode/>
          <feMergeNode in="SourceGraphic"/> 
        </feMerge>
      </filter>
    </defs>
    
    {/* Rotating Outer Tech Ring */}
    <circle cx="50" cy="50" r="46" stroke="url(#compass-ring-gradient)" strokeWidth="2" strokeDasharray="20 10" strokeLinecap="round" className="animate-spin-slow origin-center" opacity="0.8" />
    
    {/* Inner Static Ring */}
    <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="1" strokeOpacity="0.2" />
    
    {/* Cardinal Marks */}
    <path d="M50 8 V16 M92 50 H84 M50 92 V84 M8 50 H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.5" />
    
    {/* Needle */}
    <g className={isThinking ? "animate-compass-search origin-center" : "origin-center transition-transform duration-1000 ease-out"}>
        <path d="M50 15 L60 50 L50 85 L40 50 Z" fill="url(#compass-needle-gradient)" filter="url(#drop-shadow-compass)" stroke="white" strokeWidth="1" />
        <circle cx="50" cy="50" r="3" fill="white" />
    </g>
  </svg>
);

const ShimmerText = ({ text }: { text: string }) => (
    <div className="inline-block animate-shimmer-text font-medium text-lg tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-gray-500 via-gray-900 to-gray-500 dark:from-gray-400 dark:via-white dark:to-gray-400 bg-[length:200%_auto]">
        {text}
    </div>
);

const cleanText = (text: string) => text.trim();

const FormattedText = ({ text }: { text: string }) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
        <span>
            {parts.map((part, index) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={index} className="font-bold text-indigo-700 dark:text-indigo-300">{part.slice(2, -2)}</strong>;
                }
                return <span key={index}>{part}</span>;
            })}
        </span>
    );
};

// --- HELPER FOR THINKING TEXT ---
const getThinkingMessage = (input: string, lang: Language) => {
    const lower = input.toLowerCase();
    const isVi = lang === Language.VI;
    
    if (lower.includes('đam mê') || lower.includes('passion') || lower.includes('thích') || lower.includes('like')) {
        return isVi ? 'Đang khám phá đam mê của bạn...' : 'Exploring your passions...';
    }
    if (lower.includes('việc') || lower.includes('job') || lower.includes('career') || lower.includes('nghề')) {
        return isVi ? 'Đang phân tích cơ hội nghề nghiệp...' : 'Analyzing career opportunities...';
    }
    if (lower.includes('lương') || lower.includes('salary') || lower.includes('money') || lower.includes('thu nhập')) {
        return isVi ? 'Đang nghiên cứu thị trường lao động...' : 'Researching market compensation...';
    }
    if (lower.includes('cv') || lower.includes('hồ sơ') || lower.includes('resume')) {
        return isVi ? 'Đang đánh giá hồ sơ của bạn...' : 'Reviewing your profile...';
    }
    if (lower.includes('học') || lower.includes('learn') || lower.includes('study') || lower.includes('trường')) {
        return isVi ? 'Đang tìm kiếm lộ trình học tập...' : 'Mapping learning paths...';
    }
    
    return isVi ? 'Đang suy nghĩ...' : 'Thinking...';
};

// --- Main Component ---
export default function App() {
  const [lang, setLang] = useState<Language>(Language.EN);
  const [theme, setTheme] = useState<Theme>(Theme.DARK);
  const [mode, setMode] = useState<AppMode>(AppMode.LANDING);
  const [tab, setTab] = useState<DashboardTab>(DashboardTab.CHAT);
  
  const [auth, setAuth] = useState<AuthState>({ isAuthenticated: false, user: null });
  const [authType, setAuthType] = useState<'login' | 'register' | 'forgot-password' | 'new-password'>('login');
  const [authError, setAuthError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [isResetSending, setIsResetSending] = useState(false);
  const [isResetSent, setIsResetSent] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'success' | 'failed' | null>(null);
  const [resetTokenEmail, setResetTokenEmail] = useState<string | null>(null);
  
  // State for Fixed Code Verification
  const [resetCodeInput, setResetCodeInput] = useState('');
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [thinkingText, setThinkingText] = useState(''); 
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const liveSessionRef = useRef<LiveSessionManager | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  
  // Custom Model State
  const [customEndpoint, setCustomEndpoint] = useState('http://localhost:11434/v1/chat/completions');
  const [customModelName, setCustomModelName] = useState('llama3');

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (theme === Theme.DARK) { document.documentElement.classList.add('dark'); } 
    else { document.documentElement.classList.remove('dark'); }
  }, [theme]);

  // Initialize EmailJS public key
  useEffect(() => {
      try {
          emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
      } catch (e) { console.error("EmailJS Init Error", e); }
  }, []);
  
  // Sync custom model state with auth user if available
  useEffect(() => {
      if (auth.user?.customEndpoint) setCustomEndpoint(auth.user.customEndpoint);
      if (auth.user?.customModelName) setCustomModelName(auth.user.customModelName);
  }, [auth.user]);

  // Handle URL Query Params for Reset Token (Keep for legacy/link compatibility)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    if (token) {
        try {
            const decoded = JSON.parse(atob(token));
            // Check expiry
            if (decoded.expiry > Date.now()) {
                setResetTokenEmail(decoded.email);
                setMode(AppMode.AUTH);
                setAuthType('new-password');
            } else {
                setAuthError('Reset link has expired.');
                setMode(AppMode.AUTH);
                setAuthType('login');
            }
        } catch (e) {
            console.error(e);
            setAuthError('Invalid reset link.');
            setMode(AppMode.AUTH);
            setAuthType('login');
        }
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
          setAuth({ isAuthenticated: true, user: JSON.parse(storedUser) });
          setMode(AppMode.DASHBOARD);
      }
  }, []);

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
  useEffect(() => { scrollToBottom(); }, [messages, isChatLoading]);
  useEffect(() => { transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [transcripts]);

  const toggleLang = () => { setLang(l => l === Language.EN ? Language.VI : Language.EN); };
  const toggleTheme = () => { setTheme(t => t === Theme.LIGHT ? Theme.DARK : Theme.LIGHT); };
  const getRandomAvatar = () => AVATARS[Math.floor(Math.random() * AVATARS.length)];

  const getUsers = (): any[] => {
      const users = localStorage.getItem('users');
      return users ? JSON.parse(users) : [];
  }
  
  const updateUserProfile = (updates: Partial<UserProfile>) => {
      if (!auth.user) return;
      
      const newUser = { ...auth.user, ...updates };
      setAuth({ ...auth, user: newUser });
      
      if (!newUser.isGuest) {
          localStorage.setItem('currentUser', JSON.stringify(newUser));
          const users = getUsers();
          const idx = users.findIndex(u => u.email === newUser.email);
          if (idx !== -1) {
              users[idx] = newUser;
              localStorage.setItem('users', JSON.stringify(users));
          }
      }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const name = nameRef.current?.value;
    const email = emailRef.current?.value;
    const password = passwordRef.current?.value;

    if (!name || !email || !password) return setAuthError('Please fill all fields');

    const users = getUsers();
    if (users.find(u => u.email === email)) {
        setAuthError('Email already registered');
        return;
    }

    const newUser: UserProfile = { 
        name, 
        email, 
        // @ts-ignore
        password, 
        careerGoal: 'Undecided', 
        avatar: getRandomAvatar(),
        aiProvider: AIProvider.GEMINI,
        customEndpoint: 'http://localhost:11434/v1/chat/completions',
        customModelName: 'llama3'
    };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    setAuth({ isAuthenticated: true, user: newUser });
    setMode(AppMode.DASHBOARD);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const email = emailRef.current?.value;
    const password = passwordRef.current?.value;

    if (!email || !password) return setAuthError('Please fill all fields');

    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        setAuth({ isAuthenticated: true, user });
        setMode(AppMode.DASHBOARD);
    } else {
        setAuthError('Invalid email or password');
    }
  };
  
  const handleGoogleLogin = async () => {
    setAuthError('');
    setIsGoogleLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockGoogleUser: UserProfile = {
        name: "Google User (Demo)",
        email: "demo.google@gmail.com",
        // @ts-ignore
        password: "", 
        careerGoal: 'Undecided', 
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=GoogleUser",
        isGuest: false,
        aiProvider: AIProvider.GEMINI
    };

    localStorage.setItem('currentUser', JSON.stringify(mockGoogleUser));
    
    // Also save to users list if not exists so they can re-login later technically
    const users = getUsers();
    if (!users.find(u => u.email === mockGoogleUser.email)) {
        users.push(mockGoogleUser);
        localStorage.setItem('users', JSON.stringify(users));
    }

    setAuth({ isAuthenticated: true, user: mockGoogleUser });
    setMode(AppMode.DASHBOARD);
    setIsGoogleLoading(false);
  };
  
  // Send Verification Code (Simulated)
  const handleSendResetCode = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthError('');
      setEmailStatus(null);
      const email = emailRef.current?.value;
      if (!email) return setAuthError('Please enter your email');

      const users = getUsers();
      let user = users.find(u => u.email === email);
      
      // Auto-Register demo user for testing
      if (!user && (email === 'demo@example.com' || email.includes('test'))) {
           user = { 
               name: 'Demo User', 
               email: email, 
               password: 'password123', 
               careerGoal: 'Undecided', 
               avatar: getRandomAvatar() 
           };
           users.push(user);
           localStorage.setItem('users', JSON.stringify(users));
      }
      
      if (!user) return setAuthError('Email not found. Please Register an account first.');
      
      setResetTokenEmail(user.email);
      setIsResetSending(true);

      // Simulate network delay for sending email
      try {
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Here you would normally call EmailJS to send `FIXED_RESET_CODE`
          // e.g. await emailjs.send(..., { code: FIXED_RESET_CODE, to_email: email });
          // For now, we simulate success.
          
          setIsResetSent(true);
          setEmailStatus('success');
      } catch (error) {
          console.error("Error sending code:", error);
          setAuthError("Failed to send code. Please try again.");
      } finally {
          setIsResetSending(false);
      }
  };

  // Verify Fixed Code
  const handleVerifyCode = (e: React.FormEvent) => {
      e.preventDefault();
      setIsVerifyingCode(true);
      
      setTimeout(() => {
          if (resetCodeInput === FIXED_RESET_CODE) {
              setAuthType('new-password');
              setResetCodeInput(''); // Clear for security
          } else {
              setAuthError('Invalid verification code.');
          }
          setIsVerifyingCode(false);
      }, 800);
  };
  
  const handleNewPasswordSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const pass = passwordRef.current?.value;
      const confirmPass = confirmPasswordRef.current?.value;
      
      if (!pass || !confirmPass) {
          setAuthError("Please fill all fields"); return;
      }
      if (pass !== confirmPass) {
          setAuthError("Passwords do not match"); return;
      }
      
      const users = getUsers();
      const userIndex = users.findIndex(u => u.email === resetTokenEmail);
      
      if (userIndex > -1) {
          users[userIndex].password = pass;
          localStorage.setItem('users', JSON.stringify(users));
          alert("Password updated successfully! Please login.");
          setAuthType('login');
          setAuthError('');
          setIsResetSent(false); // Reset flow state
          setResetCodeInput('');
      } else {
          setAuthError("User not found.");
      }
  };

  const handleGuestLogin = () => {
    const guestUser = { name: 'Guest User', email: '', careerGoal: 'Exploring', isGuest: true, avatar: getRandomAvatar(), aiProvider: AIProvider.GEMINI };
    setAuth({ isAuthenticated: true, user: guestUser });
    setMode(AppMode.DASHBOARD);
  };

  const changeAvatar = () => { 
      updateUserProfile({ avatar: getRandomAvatar() });
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setAuth({ isAuthenticated: false, user: null });
    setMode(AppMode.LANDING);
    setMessages([]);
    if (isVoiceActive) handleVoiceToggle();
  };

  const startNewChat = () => {
      if (messages.length > 0) {
          const newSession: ChatSession = { id: Date.now().toString(), title: messages[0].text.substring(0, 30) + "...", date: new Date(), messages: [...messages] };
          setChatHistory(prev => [newSession, ...prev]);
      }
      setMessages([]);
      setTab(DashboardTab.CHAT);
  };

  const loadSession = (session: ChatSession) => {
      if (messages.length > 0) {
           const currentSession: ChatSession = { id: Date.now().toString(), title: messages[0].text.substring(0, 30) + "...", date: new Date(), messages: [...messages] };
           setChatHistory(prev => [currentSession, ...prev]);
      }
      setMessages(session.messages);
      setChatHistory(prev => prev.filter(s => s.id !== session.id));
      setTab(DashboardTab.CHAT);
  };

  const handleSendMessage = async (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    if (isChatLoading) return; // Prevent double submission
    
    const textToSend = overrideText || inputMsg;
    if (!textToSend.trim()) return;
    if (!overrideText) setInputMsg('');
    
    // Set dynamic thinking text based on input
    setThinkingText(getThinkingMessage(textToSend, lang));
    
    const newMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: textToSend, timestamp: new Date() };
    setMessages(prev => [...prev, newMsg]);
    setIsChatLoading(true);
    try {
      // IMPORTANT: Filter out previous error messages from history to prevent context pollution
      const history = messages
        .filter(m => !m.text.startsWith('⚠️ Error'))
        .map(m => ({ role: m.role, text: m.text }));
        
      const responseText = await sendChatMessage(history, textToSend, lang, auth.user);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: responseText || '', timestamp: new Date() }]);
    } catch (error: any) {
        // Show clearer error message
        const errorMsg = error.message || JSON.stringify(error) || t.error;
        console.error("Chat Error UI:", error);
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: `⚠️ Error: ${errorMsg}\n(Please check your connection or try again later)`, timestamp: new Date() }]);
    } finally { setIsChatLoading(false); }
  };

  useEffect(() => {
    const loadDevices = async () => {
        const tempSession = new LiveSessionManager(lang); 
        const devices = await tempSession.getAudioInputDevices();
        setInputDevices(devices);
        if (devices.length > 0) setSelectedDeviceId(devices[0].deviceId);
    };
    if (tab === DashboardTab.VOICE) loadDevices();
  }, [tab, lang]);

  const handleVoiceToggle = useCallback(async () => {
    if (isVoiceActive) {
      setVoiceStatus(t.disconnecting);
      liveSessionRef.current?.disconnect();
      setIsVoiceActive(false);
      setVoiceStatus('');
      setAudioLevel(0);
    } else {
      setVoiceStatus(t.connecting);
      setTranscripts([]);
      const session = new LiveSessionManager(lang);
      session.onConnect = () => { setIsVoiceActive(true); setVoiceStatus(t.listening); };
      session.onDisconnect = () => { setIsVoiceActive(false); setVoiceStatus(''); };
      session.onError = (err: any) => { console.error(err); setVoiceStatus(t.error); setIsVoiceActive(false); };
      session.onAudioLevel = (level: number) => { setAudioLevel(level); };
      session.onTranscript = (text: string, isUser: boolean) => {
          setTranscripts(prev => {
              const last = prev[prev.length - 1];
              if (last && last.isUser === isUser) { return [...prev.slice(0, -1), { isUser, text: last.text + text }]; }
              return [...prev, { isUser, text }];
          });
      };
      liveSessionRef.current = session;
      await session.connect(selectedDeviceId, decodeAudioData, createPcmBlob, decode);
    }
  }, [isVoiceActive, lang, t, selectedDeviceId]);

  const switchToVoice = () => {
      setTab(DashboardTab.VOICE);
      if (!isVoiceActive) { handleVoiceToggle(); }
  };

  useEffect(() => { return () => { liveSessionRef.current?.disconnect(); }; }, []);
  
  // Save Custom Model Settings
  const saveCustomSettings = () => {
      updateUserProfile({ 
          customEndpoint, 
          customModelName,
          aiProvider: auth.user?.aiProvider || AIProvider.GEMINI 
      });
      alert("Settings Saved!");
  };

  const renderLanding = () => {
    return (
      <div className="min-h-screen bg-white dark:bg-[#050505] text-slate-900 dark:text-white transition-colors duration-500 overflow-x-hidden">
        <nav className="fixed w-full z-50 px-6 py-4 flex justify-between items-center backdrop-blur-sm bg-white/70 dark:bg-[#050505]/70 border-b border-gray-200 dark:border-white/5">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.location.reload()}>
            <div className="group-hover:rotate-180 transition-transform duration-700">
                <CompassLogo className="w-8 h-8" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-fuchsia-500">Career Compass</span>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={toggleLang} className="flex items-center gap-1 text-sm font-medium hover:text-indigo-500 transition-colors text-gray-600 dark:text-gray-300">
                <Icons.Globe className="w-4 h-4" />
                <span>{lang === Language.EN ? 'VI' : 'EN'}</span>
             </button>
             <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                {theme === Theme.LIGHT ? <Icons.Moon className="w-5 h-5"/> : <Icons.Sun className="w-5 h-5"/>}
              </button>
             <button onClick={() => { setMode(AppMode.AUTH); setAuthType('login'); }} className="hidden md:block font-medium hover:text-indigo-500 transition-colors">{t.login}</button>
             <button onClick={() => { setMode(AppMode.AUTH); setAuthType('register'); }} className="bg-black dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-full font-bold hover:scale-105 transition-transform hover:shadow-lg hover:shadow-indigo-500/20">{t.getStarted}</button>
          </div>
        </nav>

        <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center relative">
          {/* Animated Background Blobs */}
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob dark:opacity-10"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000 dark:opacity-10"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000 dark:opacity-10"></div>

          <div className="max-w-4xl space-y-8 animate-fade-in-up flex flex-col items-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-900/10 text-sm font-medium text-indigo-600 dark:text-indigo-300">
               <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
               {t.heroBadge}
            </div>
            <h1 className="text-6xl md:text-8xl font-bold leading-[1.1] tracking-tight text-balance">
              {t.heroTitlePrefix}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-cyan-500 animate-gradient-x">{t.heroTitleSuffix}</span>
            </h1>
            <p className="text-xl text-gray-500 dark:text-gray-400 max-w-lg leading-relaxed">
              {t.subTagline}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => { setMode(AppMode.AUTH); setAuthType('register'); }} className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-1">{t.getStarted}</button>
              <button onClick={handleGuestLogin} className="px-8 py-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl font-bold text-lg hover:bg-gray-50 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-2 backdrop-blur-sm">
                <Icons.Zap className="w-5 h-5 text-yellow-500" />
                {t.guestLogin}
              </button>
            </div>
          </div>
        </section>

        <div className="py-10 bg-gray-50 dark:bg-[#0a0a0a] border-y border-gray-200 dark:border-white/5 overflow-hidden relative">
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-gray-50 via-transparent to-gray-50 dark:from-[#0a0a0a] dark:via-transparent dark:to-[#0a0a0a] z-10"></div>
            <div className="flex gap-8 whitespace-nowrap animate-marquee">
                {[...CAREER_TAGS, ...CAREER_TAGS].map((tag, i) => (
                    <div key={i} className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-gray-300 to-gray-400 dark:from-white/20 dark:to-white/5 uppercase tracking-widest">{lang === Language.EN ? tag.en : tag.vi}</div>
                ))}
            </div>
        </div>
        
        <section className="py-20 px-6 max-w-7xl mx-auto">
             <div className="mb-12 text-center md:text-left relative">
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl"></div>
                <h2 className="text-3xl md:text-5xl font-bold mb-4 relative z-10">{t.hotIndustriesTitle}</h2>
                <p className="text-xl text-gray-500 max-w-2xl relative z-10">{t.hotIndustriesSub}</p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {HOT_INDUSTRIES.map((industry) => {
                     // @ts-ignore
                     const IconComponent = Icons[industry.icon] || Icons.TrendingUp;
                     
                     return (
                        <div key={industry.id} className="glass-card rounded-3xl p-6 relative overflow-hidden group hover:-translate-y-2 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-500/30">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-transparent to-white/5 rounded-bl-full pointer-events-none group-hover:to-indigo-500/10 transition-colors"></div>
                             <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${industry.color} flex items-center justify-center text-white mb-6 shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                                 <IconComponent className="w-7 h-7" />
                             </div>
                             <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-500 group-hover:to-fuchsia-500 transition-colors">
                                 {lang === Language.EN ? industry.name_en : industry.name_vi}
                             </h3>
                             <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                                 {lang === Language.EN ? industry.desc_en : industry.desc_vi}
                             </p>
                        </div>
                     );
                 })}
             </div>
        </section>

        <section className="py-24 px-6 max-w-7xl mx-auto">
             <div className="mb-16">
                 <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">{t.featureHeader} <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-fuchsia-500 italic">{t.featureHeaderHighlight}</span> {t.featureHeaderSuffix}</h2>
                 <p className="text-xl text-gray-500 max-w-2xl">{t.featureSub}</p>
             </div>

             <div className="bento-grid">
                 <div className="glass-card rounded-3xl p-8 relative overflow-hidden group hover:border-red-500/50 transition-colors col-span-2">
                     <div className="relative z-10">
                         <div className="w-12 h-12 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                             <Icons.Microphone className="w-6 h-6" />
                         </div>
                         <h3 className="text-2xl font-bold mb-2">{t.featureVoiceTitle}</h3>
                         <p className="text-gray-500 dark:text-gray-400">{t.featureVoiceDesc}</p>
                     </div>
                     <div className="absolute right-0 bottom-0 w-64 h-64 bg-gradient-to-tl from-red-500/10 to-transparent rounded-full translate-x-20 translate-y-20 group-hover:scale-110 transition-transform duration-500"></div>
                 </div>

                 <div className="glass-card rounded-3xl p-8 relative overflow-hidden group hover:border-blue-500/50 transition-colors">
                     <div className="relative z-10">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                             <Icons.Stars className="w-6 h-6" />
                         </div>
                         <h3 className="text-2xl font-bold mb-2">{t.feature247Title}</h3>
                         <p className="text-gray-500 dark:text-gray-400">{t.feature247Desc}</p>
                     </div>
                     <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/5 rounded-bl-full group-hover:bg-blue-500/10 transition-colors"></div>
                 </div>

                 <div className="glass-card rounded-3xl p-8 relative overflow-hidden group hover:border-purple-500/50 transition-colors">
                     <div className="relative z-10">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                             <Icons.FileText className="w-6 h-6" />
                         </div>
                         <h3 className="text-2xl font-bold mb-2">{t.featureScanTitle}</h3>
                         <p className="text-gray-500 dark:text-gray-400">{t.featureScanDesc}</p>
                     </div>
                     <div className="absolute left-0 bottom-0 w-32 h-32 bg-purple-500/5 rounded-tr-full group-hover:bg-purple-500/10 transition-colors"></div>
                 </div>

                 <div className="glass-card rounded-3xl p-8 relative overflow-hidden group hover:border-green-500/50 transition-colors col-span-2">
                     <div className="relative z-10">
                         <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                             <Icons.Compass className="w-6 h-6" />
                         </div>
                         <h3 className="text-2xl font-bold mb-2">{t.featureRoadmapTitle}</h3>
                         <p className="text-gray-500 dark:text-gray-400">{t.featureRoadmapDesc}</p>
                     </div>
                      <div className="absolute right-0 bottom-0 w-64 h-64 bg-gradient-to-tl from-green-500/10 to-transparent rounded-full translate-x-20 translate-y-20 group-hover:scale-110 transition-transform duration-500"></div>
                 </div>
             </div>
        </section>

        <section className="py-20 px-6 bg-gray-100 dark:bg-[#0a0a0a] relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-30"></div>
             <div className="max-w-4xl mx-auto text-center relative z-10">
                 <div className="inline-block mb-6 p-3 bg-white dark:bg-white/5 rounded-full shadow-md">
                    <Icons.MessageSquare className="w-6 h-6 text-indigo-500" />
                 </div>
                 <p className="text-2xl md:text-4xl font-serif italic leading-relaxed text-gray-800 dark:text-gray-200">
                     "{lang === Language.EN ? CAREER_QUOTES[1].text : CAREER_QUOTES[1].text_vi}"
                 </p>
                 <div className="mt-8 flex items-center justify-center gap-4">
                     <div className="w-12 h-[1px] bg-gradient-to-r from-transparent to-indigo-500"></div>
                     <span className="text-sm font-bold uppercase tracking-widest text-indigo-500">{CAREER_QUOTES[1].author}</span>
                     <div className="w-12 h-[1px] bg-gradient-to-l from-transparent to-indigo-500"></div>
                 </div>
             </div>
        </section>

        <footer className="py-12 px-6 border-t border-gray-200 dark:border-white/5 text-center">
             <div className="flex items-center justify-center gap-2 mb-6 opacity-50 hover:opacity-100 transition-opacity duration-300">
                 <CompassLogo className="w-6 h-6" />
                 <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-gray-600 to-gray-900 dark:from-gray-400 dark:to-white">Career Compass</span>
             </div>
             <p className="text-gray-500 text-sm">© 2025 Career Compass AI. Empowering Futures.</p>
        </footer>
      </div>
    );
  }

  const renderAuth = () => (
    <div className="min-h-screen bg-white dark:bg-[#050505] flex items-center justify-center p-4 transition-colors duration-300 relative overflow-hidden">
      {/* Auth Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px] animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-500/20 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
      
      <div className="glass-card bg-white/60 dark:bg-[#111]/80 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-gray-100 dark:border-white/10 relative z-10 p-8 transform transition-all duration-300 hover:scale-[1.01] hover:shadow-indigo-500/20">
            <div className="flex justify-center mb-6">
                <CompassLogo className="w-16 h-16" />
            </div>
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2 tracking-tight">
                {authType === 'login' ? t.login : authType === 'register' ? t.register : authType === 'new-password' ? 'Reset Password' : t.resetPasswordTitle}
            </h2>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-8 text-sm">
                {authType === 'forgot-password' ? (isResetSent ? 'Enter the 8-digit code sent to your email.' : t.resetPasswordDesc) : authType === 'new-password' ? 'Enter your new password below.' : t.tagline}
            </p>
            
            {authError && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-xl text-center animate-shake">
                    <p className="text-red-600 dark:text-red-400 text-sm font-semibold">{authError}</p>
                </div>
            )}
            
            {authType === 'forgot-password' && isResetSent ? (
                <form onSubmit={handleVerifyCode} className="text-center animate-fade-in-up space-y-6">
                    <div className="flex items-center justify-center gap-2 mb-2">
                         <div className="bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 p-2 rounded-full">
                            <Icons.Zap className="w-5 h-5" />
                         </div>
                         <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Code sent!</span>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Verification Code</label>
                        <input 
                            type="text" 
                            maxLength={8}
                            value={resetCodeInput}
                            onChange={(e) => setResetCodeInput(e.target.value.replace(/[^0-9]/g, ''))}
                            className="w-full text-center text-3xl tracking-[0.5em] font-mono font-bold px-4 py-4 rounded-xl border border-gray-200 dark:border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-300" 
                            placeholder="00000000"
                            autoFocus
                        />
                        {/* Demo Hint */}
                        <p className="text-[10px] text-indigo-400 font-mono opacity-80">(Demo Code: {FIXED_RESET_CODE})</p>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isVerifyingCode || resetCodeInput.length !== 8} 
                        className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold py-3.5 rounded-xl hover:from-indigo-500 hover:to-violet-500 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isVerifyingCode ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Verify Code'}
                    </button>

                    <button type="button" onClick={() => { setIsResetSent(false); setResetCodeInput(''); setAuthError(''); }} className="text-xs text-gray-400 hover:text-indigo-500 underline">Resend Code / Change Email</button>
                </form>
            ) : (
                <form onSubmit={authType === 'forgot-password' ? handleSendResetCode : authType === 'new-password' ? handleNewPasswordSubmit : authType === 'login' ? handleLogin : handleRegister} className="space-y-4">
                    {authType === 'register' && (<div><label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Full Name</label><input ref={nameRef} type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white" placeholder="John Doe" /></div>)}
                    
                    {authType === 'new-password' ? (
                        <>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">New Password</label>
                                <div className="relative">
                                    <input ref={passwordRef} type={showPassword ? "text" : "password"} required className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white" placeholder="••••••••" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500">{showPassword ? <Icons.EyeOff className="w-5 h-5" /> : <Icons.Eye className="w-5 h-5" />}</button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Confirm Password</label>
                                <div className="relative">
                                    <input ref={confirmPasswordRef} type={showPassword ? "text" : "password"} required className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white" placeholder="••••••••" />
                                     {/* Reusing showPassword state for simplicity, or could add separate state */}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div><label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{t.email}</label><input ref={emailRef} type="email" required className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white" placeholder="you@example.com" /></div>
                    )}
                    
                    {authType !== 'forgot-password' && authType !== 'new-password' && (
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{t.password}</label>
                            <div className="relative">
                                <input ref={passwordRef} type={showPassword ? "text" : "password"} required className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white" placeholder="••••••••" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500">{showPassword ? <Icons.EyeOff className="w-5 h-5" /> : <Icons.Eye className="w-5 h-5" />}</button>
                            </div>
                        </div>
                    )}

                    {authType === 'login' && (<div className="flex justify-end"><button type="button" onClick={() => { setAuthType('forgot-password'); setIsResetSent(false); setAuthError(''); }} className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">{t.forgotPassword}</button></div>)}
                    
                    <button type="submit" disabled={isResetSending} className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold py-3.5 rounded-xl hover:from-indigo-500 hover:to-violet-500 transition-all shadow-lg shadow-indigo-500/20 mt-2 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95">
                        {isResetSending && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                        {authType === 'login' ? t.login : authType === 'register' ? t.register : authType === 'new-password' ? 'Update Password' : "Send Verification Code"}
                    </button>
                </form>
            )}

            {authType !== 'forgot-password' && authType !== 'new-password' && (
                <>
                    <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-white/10"></div></div><div className="relative flex justify-center text-sm"><span className="px-2 bg-white dark:bg-[#111] text-gray-500">{t.or}</span></div></div>
                    <button onClick={handleGoogleLogin} disabled={isGoogleLoading} className="w-full flex items-center justify-center gap-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white font-medium py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/10 transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
                        {isGoogleLoading ? <div className="w-5 h-5 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div> : <Icons.Google className="w-5 h-5" />}
                        {isGoogleLoading ? 'Connecting...' : t.loginWithGoogle}
                    </button>
                    <button onClick={handleGuestLogin} className="w-full mt-3 flex items-center justify-center gap-3 bg-transparent border border-dashed border-gray-300 dark:border-white/20 text-gray-500 dark:text-gray-400 font-medium py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">{t.guestLogin}</button>
                    <div className="mt-8 text-center text-sm"><span className="text-gray-500">{authType === 'login' ? t.dontHaveAccount : t.alreadyHaveAccount}{' '}</span><button onClick={() => { setAuthType(authType === 'login' ? 'register' : 'login'); setAuthError(''); }} className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">{authType === 'login' ? t.register : t.login}</button></div>
                </>
            )}
            
            {authType === 'forgot-password' && !isResetSent && (
                 <div className="mt-8 text-center text-sm">
                    <button onClick={() => { setAuthType('login'); setAuthError(''); }} className="font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">{t.backToLogin}</button>
                 </div>
            )}
            
        <div className="mt-6 text-center"><button onClick={() => setMode(AppMode.LANDING)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">← Back to Home</button></div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="flex h-screen bg-gray-50 dark:bg-[#050505] overflow-hidden transition-colors duration-300 relative font-sans">
      <aside className="hidden md:flex w-72 bg-white/80 dark:bg-[#0a0a0a]/90 backdrop-blur-lg flex-col transition-colors duration-300 h-full border-r border-gray-200 dark:border-white/5 z-10">
        <div className="p-6 flex items-center gap-3">
            <CompassLogo className="w-8 h-8" />
            <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-fuchsia-600 dark:from-white dark:to-gray-300">Career Compass</span>
        </div>
        <div className="px-4 mb-2"><button onClick={startNewChat} className="w-full flex items-center gap-3 px-4 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:scale-[1.02] active:scale-95 transition-all font-bold shadow-lg"><span className="text-xl leading-none">+</span> {t.newChat}</button></div>
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            <button onClick={() => setTab(DashboardTab.CHAT)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${tab === DashboardTab.CHAT ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}><Icons.MessageSquare className="w-5 h-5" /><span>{t.chatMode}</span></button>
            <button onClick={() => setTab(DashboardTab.VOICE)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${tab === DashboardTab.VOICE ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}><Icons.Microphone className="w-5 h-5" /><span>{t.voiceMode}</span></button>
             <button onClick={() => setTab(DashboardTab.PROFILE)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${tab === DashboardTab.PROFILE ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}><Icons.User className="w-5 h-5" /><span>{t.profile}</span></button>
            {chatHistory.length > 0 && (<div className="mt-8"><div className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Icons.History className="w-3 h-3" />{t.chatHistory}</div><div className="space-y-1">{chatHistory.map((session) => (<button key={session.id} onClick={() => loadSession(session)} className="w-full text-left px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg truncate transition-colors">{session.title}</button>))}</div></div>)}
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-white/5 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
            <div onClick={changeAvatar} title="Click to change avatar" className="flex items-center gap-3 mb-4 px-2 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors group"><img src={auth.user?.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm"/><div className="overflow-hidden flex-1"><p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{auth.user?.name}</p><p className="text-[10px] text-gray-500 truncate">{auth.user?.isGuest ? 'Guest Session' : auth.user?.email}</p></div><Icons.Refresh className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
             <div className="flex gap-2 mb-2"><button onClick={toggleLang} className="flex-1 flex items-center justify-center px-3 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-lg hover:bg-gray-50 transition-all"><span className="uppercase">{lang}</span></button><button onClick={toggleTheme} className="flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-lg hover:bg-gray-50 transition-all">{theme === Theme.LIGHT ? <Icons.Moon className="w-4 h-4"/> : <Icons.Sun className="w-4 h-4"/>}</button></div>
            <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"><Icons.LogOut className="w-4 h-4" />Logout</button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col h-full relative w-full bg-white dark:bg-[#050505] z-10">
        <header className="md:hidden h-16 bg-white dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-4 z-20"><div className="flex items-center gap-2"><CompassLogo className="w-8 h-8" /><span className="font-bold text-gray-800 dark:text-white">Career Compass</span></div><div className="flex gap-2"><button onClick={toggleTheme} className="p-2 text-gray-500 dark:text-gray-400">{theme === Theme.LIGHT ? <Icons.Moon className="w-5 h-5"/> : <Icons.Sun className="w-5 h-5"/>}</button><button onClick={() => setTab(DashboardTab.CHAT)} className={`p-2 rounded-lg ${tab === DashboardTab.CHAT ? 'bg-gray-100 dark:bg-white/10 text-black dark:text-white' : 'text-gray-500'}`}><Icons.MessageSquare className="w-5 h-5"/></button><button onClick={handleLogout} className="p-2 text-red-500"><Icons.LogOut className="w-5 h-5"/></button></div></header>
        {tab === DashboardTab.CHAT && (
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 animate-fade-in-up">
                            <div className="bg-gradient-to-tr from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 p-6 rounded-full mb-6 shadow-xl"><CompassLogo className="w-16 h-16 opacity-100" /></div>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t.welcomeBack} {auth.user?.name}</h2>
                            <p className="text-base max-w-md mx-auto leading-relaxed mb-8 opacity-70">{t.greetingSub}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl px-4">
                                {SUGGESTION_PROMPTS.map((prompt) => (
                                    <button key={prompt.id} onClick={() => handleSendMessage(undefined, lang === Language.VI ? prompt.text_vi : prompt.text_en)} className="flex items-center gap-4 p-4 text-left rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all group shadow-sm hover:shadow-md">
                                        <div className={`p-2 rounded-lg ${prompt.color} group-hover:scale-110 transition-transform`}><Icons.Target className="w-5 h-5" /></div>
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{lang === Language.VI ? prompt.text_vi : prompt.text_en}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {messages.map((m) => (
                        <div key={m.id} className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                            {m.role === 'model' && (<div className="hidden md:flex w-8 h-8 mr-4 flex-shrink-0 bg-indigo-600 rounded-full items-center justify-center text-white shadow-sm mt-1"><CompassLogo className="w-5 h-5 text-white" /></div>)}
                            <div className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[70%]`}>
                                <div className={`px-6 py-3.5 rounded-2xl shadow-sm relative transition-all duration-300 ${m.role === 'user' ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-tr-none' : 'bg-white dark:bg-white/10 text-gray-900 dark:text-white border border-gray-200 dark:border-white/5 rounded-tl-none shadow-sm'}`}>
                                    <p className="leading-relaxed whitespace-pre-wrap text-[15px]"><FormattedText text={cleanText(m.text)} /></p>
                                </div>
                                <span className={`text-[10px] mt-1.5 opacity-40 font-bold px-1 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>{m.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                        </div>
                    ))}
                    {isChatLoading && (
                        <div className="flex w-full justify-start items-center">
                            <div className="hidden md:flex w-8 h-8 mr-4 flex-shrink-0 bg-indigo-600 rounded-full items-center justify-center mt-1">
                                {/* Pass isThinking=true to animate the logo */}
                                <CompassLogo className="w-5 h-5 text-white" isThinking={true} />
                            </div>
                            <div className="px-6 py-4 bg-gray-50 dark:bg-white/5 rounded-2xl rounded-tl-none border border-gray-100 dark:border-white/5">
                                {/* Use the dynamic thinkingText */}
                                <ShimmerText text={thinkingText} />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} className="h-4" />
                </div>
                <div className="p-6 bg-white dark:bg-[#050505] w-full flex justify-center border-t border-gray-200 dark:border-white/5 relative">
                    <form onSubmit={handleSendMessage} className="relative w-full max-w-4xl flex items-center bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all shadow-sm">
                        <input type="text" value={inputMsg} onChange={(e) => setInputMsg(e.target.value)} placeholder={t.typeMessage} className="w-full pl-6 pr-24 py-4 bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400 text-base font-medium"/>
                         <button type="button" onClick={switchToVoice} className="absolute right-14 p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-white transition-colors" title={t.switchToVoice}><Icons.Microphone className="w-5 h-5" /></button>
                        <button type="submit" disabled={!inputMsg.trim() || isChatLoading} className="absolute right-3 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:grayscale transition-all shadow-md active:scale-95">{isChatLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Icons.Send className="w-5 h-5" />}</button>
                    </form>
                </div>
                 <div className="text-center pb-2 text-[10px] text-gray-400 uppercase tracking-widest font-bold opacity-60">{t.footerDisclaimer}</div>
            </div>
        )}
        {tab === DashboardTab.VOICE && (
             <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#050505]">
                 <div className="w-full p-6 flex justify-between items-center z-20">
                    <div className="flex flex-col"><h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{t.voiceMode}</h2><span className="text-sm text-gray-500 font-medium">{voiceStatus || t.micPermission}</span></div>
                     <div className="px-4 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-black rounded-full flex items-center gap-2 animate-pulse"><div className="w-2 h-2 bg-red-500 rounded-full"></div>LIVE</div>
                 </div>
                 <div className="flex-1 flex flex-col md:flex-row p-6 gap-6 overflow-hidden">
                    <div className="flex-1 flex flex-col items-center justify-center relative rounded-[2rem] bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/5 p-6">
                        <div className={`relative w-56 h-56 transition-all duration-700 cursor-pointer group mb-10`} onClick={handleVoiceToggle}>
                             <div className={`absolute inset-0 rounded-full blur-3xl transition-opacity duration-1000 ${isVoiceActive ? 'bg-indigo-500 opacity-40' : 'bg-gray-200 dark:bg-indigo-900 opacity-10'}`}></div>
                             <div className={`relative w-full h-full rounded-full flex items-center justify-center shadow-2xl border-[6px] transition-all duration-500 overflow-hidden ${isVoiceActive ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-400/50 scale-105' : 'bg-white dark:bg-[#111] border-gray-100 dark:border-white/5 group-hover:scale-105'}`}>
                                 <Icons.Microphone className={`w-20 h-20 z-10 transition-colors duration-300 ${isVoiceActive ? 'text-white' : 'text-gray-300 dark:text-gray-700'}`} />
                             </div>
                        </div>
                        <div className="w-full max-w-sm h-24 rounded-2xl overflow-hidden mb-8 bg-black/5 dark:bg-white/5 backdrop-blur-sm p-4 border border-white/10"><Visualizer isActive={isVoiceActive} level={audioLevel} /></div>
                        <div className="w-full max-w-sm space-y-4">
                             <div className="relative group">
                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">{t.selectMic}</label>
                                <div className="relative">
                                    <select value={selectedDeviceId} onChange={(e) => setSelectedDeviceId(e.target.value)} disabled={isVoiceActive} className="w-full appearance-none bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white py-3.5 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:border-indigo-500 font-medium transition-colors">
                                        {inputDevices.map((device) => (<option key={device.deviceId} value={device.deviceId}>{device.label || `Microphone ${device.deviceId.slice(0, 5)}...`}</option>))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500"><Icons.ChevronDown className="w-4 h-4" /></div>
                                </div>
                             </div>
                             <button onClick={handleVoiceToggle} className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-xl active:scale-[0.98] ${isVoiceActive ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white'}`}>{isVoiceActive ? t.endVoice : t.startVoice}</button>
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col rounded-[2rem] bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm">
                        <div className="p-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5"><h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">{t.transcript}</h3></div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {transcripts.length === 0 ? (<div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-600 text-sm font-medium italic">{isVoiceActive ? t.listening : "Ready to start..."}</div>) : (transcripts.map((t, i) => (<div key={i} className={`flex ${t.isUser ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm font-medium ${t.isUser ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-900 dark:text-indigo-200 rounded-tr-none' : 'bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-gray-200 rounded-tl-none'}`}>{t.text}</div></div>)))}
                            <div ref={transcriptEndRef} />
                        </div>
                    </div>
                 </div>
             </div>
        )}
        {tab === DashboardTab.PROFILE && (
            <div className="flex-1 p-8 overflow-y-auto bg-white dark:bg-[#050505] flex justify-center">
                <div className="max-w-2xl w-full">
                    <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">{t.profile}</h2>
                    <div className="glass-card bg-white dark:bg-[#0a0a0a] rounded-[2rem] border border-gray-200 dark:border-white/10 p-10">
                        <div className="flex items-center gap-8 mb-10">
                             <div className="relative group cursor-pointer" onClick={changeAvatar}><img src={auth.user?.avatar} alt="Profile" className="w-28 h-28 rounded-full object-cover border-4 border-gray-100 dark:border-white/5 shadow-xl group-hover:scale-105 transition-transform"/><div className="absolute bottom-0 right-0 w-10 h-10 bg-indigo-600 border-4 border-white dark:border-black rounded-full flex items-center justify-center text-white"><Icons.Refresh className="w-5 h-5" /></div></div>
                            <div><h3 className="text-3xl font-bold text-gray-900 dark:text-white">{auth.user?.name}</h3><p className="text-gray-500 text-lg">{auth.user?.isGuest ? t.guestMode : auth.user?.email}</p>{auth.user?.isGuest && <span className="inline-block mt-3 px-4 py-1.5 bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-xs rounded-full font-black uppercase tracking-wider">{t.guestMode}</span>}</div>
                        </div>
                        <div className="space-y-8">
                            <div><label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{t.careerGoal}</label><input disabled value={auth.user?.careerGoal} className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all" /></div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{t.prefLang}</label>
                                <select value={lang} onChange={(e) => setLang(e.target.value as Language)} className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"><option value={Language.EN}>English</option><option value={Language.VI}>Tiếng Việt</option></select>
                            </div>
                            
                            {/* --- CUSTOM MODEL SETTINGS (Self-Hosted) --- */}
                            <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Icons.Server className="w-5 h-5 text-indigo-500" />
                                    {t.aiConfigTitle}
                                </h3>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{t.aiProvider}</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            <button 
                                                onClick={() => updateUserProfile({ aiProvider: AIProvider.GEMINI })}
                                                className={`py-3 px-2 rounded-xl border font-medium text-xs md:text-sm transition-all truncate ${(!auth.user?.aiProvider || auth.user.aiProvider === AIProvider.GEMINI) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-transparent border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-indigo-500'}`}
                                            >
                                                {t.providerGemini}
                                            </button>
                                            <button 
                                                onClick={() => updateUserProfile({ aiProvider: AIProvider.CUSTOM })}
                                                className={`py-3 px-2 rounded-xl border font-medium text-xs md:text-sm transition-all truncate ${auth.user?.aiProvider === AIProvider.CUSTOM ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-transparent border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-indigo-500'}`}
                                            >
                                                {t.providerCustom}
                                            </button>
                                            <button 
                                                onClick={() => updateUserProfile({ aiProvider: AIProvider.N8N })}
                                                className={`py-3 px-2 rounded-xl border font-medium text-xs md:text-sm transition-all truncate ${auth.user?.aiProvider === AIProvider.N8N ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-transparent border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-indigo-500'}`}
                                            >
                                                {t.providerN8N}
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {auth.user?.aiProvider === AIProvider.CUSTOM && (
                                        <div className="space-y-4 animate-fade-in-up">
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{t.endpointUrl}</label>
                                                <input 
                                                    value={customEndpoint} 
                                                    onChange={(e) => setCustomEndpoint(e.target.value)} 
                                                    placeholder="http://localhost:11434/v1/chat/completions"
                                                    className="w-full px-6 py-4 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                                                />
                                                <p className="mt-1 text-[10px] text-gray-400">{t.endpointNote}</p>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{t.modelName}</label>
                                                <input 
                                                    value={customModelName} 
                                                    onChange={(e) => setCustomModelName(e.target.value)} 
                                                    placeholder="llama3"
                                                    className="w-full px-6 py-4 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {auth.user?.aiProvider === AIProvider.N8N && (
                                        <div className="space-y-4 animate-fade-in-up">
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{t.n8nWebhookUrl}</label>
                                                <input 
                                                    value={customEndpoint} 
                                                    onChange={(e) => setCustomEndpoint(e.target.value)} 
                                                    placeholder="https://your-n8n-instance.com/webhook/..."
                                                    className="w-full px-6 py-4 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                                                />
                                                <p className="mt-1 text-[10px] text-gray-400">{t.n8nNote}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="mt-12 pt-8 border-t border-gray-100 dark:border-white/5 flex justify-end gap-4">
                            <button onClick={saveCustomSettings} className="px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-500 hover:to-purple-500 hover:-translate-y-1 shadow-lg shadow-indigo-500/20 transition-all active:scale-95">{t.saveChanges}</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );

  switch (mode) {
    case AppMode.AUTH: return renderAuth();
    case AppMode.DASHBOARD: return renderDashboard();
    case AppMode.LANDING: default: return renderLanding();
  }
}