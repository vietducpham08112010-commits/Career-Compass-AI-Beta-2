import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Language, Theme, AppMode, DashboardTab, ChatMessage, ChatSession, AuthState, Transcript, UserProfile } from './types';
import { AVATARS, CAREER_TAGS, CAREER_QUOTES, SUGGESTION_PROMPTS, TRANSLATIONS, HOT_INDUSTRIES } from './constants';
import { sendChatMessage, LiveSessionManager } from './services/geminiService';
import { decode, encode, decodeAudioData, createPcmBlob } from './utils/audio';
import { Visualizer } from './components/Visualizer';
import emailjs from '@emailjs/browser';

// --- CONFIGURATION ---
// NOTE: Replace these with your actual EmailJS credentials to make email sending work.
// Currently configured for demo/simulation purposes.
const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_u6njafq',
  TEMPLATE_ID: 'template_7yqlm9c',
  PUBLIC_KEY: '8ABxIIEqUTEI3I-oL'
};

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
  EyeOff: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
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
  const [generatedResetLink, setGeneratedResetLink] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [thinkingText, setThinkingText] = useState(''); // New state for dynamic thinking text
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

  // Handle URL Query Params for Reset Token
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

    const newUser = { name, email, password, careerGoal: 'Undecided', avatar: getRandomAvatar() };
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
    
    const mockGoogleUser = {
        name: "Google User (Demo)",
        email: "demo.google@gmail.com",
        password: "", // No password needed for OAuth simulation
        careerGoal: 'Undecided',
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=GoogleUser",
        isGuest: false
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
  
  const handleResetPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthError('');
      setEmailStatus(null);
      const email = emailRef.current?.value;
      if (!email) return setAuthError('Please enter your email');

      const users = getUsers();
      let user = users.find(u => u.email === email);
      
      // --- DEMO FEATURE: Auto-Register for specific demo emails or general test fix ---
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
      
      setResetTokenEmail(user.email); // Save email for the direct bypass flow
      setIsResetSending(true);

      try {
          // Generate a token simulating a server-side JWT or secure token
          const tokenPayload = JSON.stringify({ 
              email: user.email, 
              expiry: Date.now() + 15 * 60 * 1000 
          });
          const token = btoa(tokenPayload);
          
          // Generate the link
          const resetLink = `${window.location.origin}?token=${token}`;
          
          // Set the generated link for display (Demo/Test purpose)
          setGeneratedResetLink(resetLink);

          // Try to send email
          try {
              if (EMAILJS_CONFIG.SERVICE_ID === 'YOUR_SERVICE_ID') {
                  throw new Error("EmailJS Configuration Missing");
              }
              await emailjs.send(
                  EMAILJS_CONFIG.SERVICE_ID,
                  EMAILJS_CONFIG.TEMPLATE_ID,
                  {
                      to_name: user.name,
                      to_email: email,
                      reset_link: resetLink
                  }
              );
              setEmailStatus('success');
          } catch (emailErr) {
             console.warn("Email service failed, switching to demo mode", emailErr);
             setEmailStatus('failed');
          }
          
          setIsResetSent(true);
      } catch (error: any) {
          console.error("Reset Error:", error);
          setAuthError(`Error: ${error?.text || error?.message || JSON.stringify(error)}`);
      } finally {
          setIsResetSending(false);
      }
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
      } else {
          setAuthError("User not found.");
      }
  };

  const handleGuestLogin = () => {
    const guestUser = { name: 'Guest User', email: '', careerGoal: 'Exploring', isGuest: true, avatar: getRandomAvatar() };
    setAuth({ isAuthenticated: true, user: guestUser });
    setMode(AppMode.DASHBOARD);
  };

  const changeAvatar = () => { 
      if (auth.user) { 
          const newUser = { ...auth.user, avatar: getRandomAvatar() };
          setAuth({ ...auth, user: newUser }); 
          if (!auth.user.isGuest) {
              localStorage.setItem('currentUser', JSON.stringify(newUser));
              const users = getUsers();
              const idx = users.findIndex(u => u.email === newUser.email);
              if (idx !== -1) {
                  users[idx] = newUser;
                  localStorage.setItem('users', JSON.stringify(users));
              }
          }
      } 
  };

  const handleLogout = () => {
    