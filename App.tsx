import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Language, Theme, AppMode, DashboardTab, ChatMessage, ChatSession, AuthState, Transcript, UserProfile } from './types';
import { AVATARS, CAREER_TAGS, CAREER_QUOTES, SUGGESTION_PROMPTS, TRANSLATIONS, HOT_INDUSTRIES } from './constants';
import { sendChatMessage, LiveSessionManager } from './services/geminiService';
import { decode, encode, decodeAudioData, createPcmBlob } from './utils/audio';
import { Visualizer } from './components/Visualizer';
import emailjs from '@emailjs/browser';

// --- CONFIGURATION ---
// IMPORTANT: keys provided by user
const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_u6njafq',
  TEMPLATE_ID: 'template_7yqlm9c', // Updated Correct Template ID
  PUBLIC_KEY: '8ABxIIEqUTEI3I-oL'
};

// --- Icons ---
const Icons = {
  Microphone: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>,
  MessageSquare: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  User: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  LogOut: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>,
  Send: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Globe: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
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
  BookOpen: (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
};

const CompassLogo = ({ className = "w-24 h-24", needleClassName = "" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="tech-grad" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#ec4899" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="1.5" opacity="0.1" className="text-indigo-500" />
    <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" className="text-gray-400 dark:text-gray-600" />
    <circle cx="50" cy="10" r="2" fill="#ec4899" />
    <circle cx="50" cy="90" r="2" fill="currentColor" className="text-gray-400" />
    <circle cx="90" cy="50" r="2" fill="currentColor" className="text-gray-400" />
    <circle cx="10" cy="50" r="2" fill="currentColor" className="text-gray-400" />
    <g className={needleClassName} style={{ transformOrigin: "50px 50px" }}>
      <path d="M50 15 L58 50 L50 85 L42 50 Z" fill="url(#tech-grad)" filter="url(#glow)" />
      <circle cx="50" cy="50" r="4" fill="white" />
    </g>
  </svg>
);

const ShimmerText = ({ text }: { text: string }) => (
    <div className="inline-block animate-shimmer-text font-medium text-lg tracking-wide">
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

// --- Main Component ---
export default function App() {
  const [lang, setLang] = useState<Language>(Language.EN);
  const [theme, setTheme] = useState<Theme>(Theme.DARK); // Default to Dark for premium look
  const [mode, setMode] = useState<AppMode>(AppMode.LANDING);
  const [tab, setTab] = useState<DashboardTab>(DashboardTab.CHAT);
  
  const [auth, setAuth] = useState<AuthState>({ isAuthenticated: false, user: null });
  const [authType, setAuthType] = useState<'login' | 'register' | 'forgot-password'>('login');
  const [authError, setAuthError] = useState('');
  
  // Forgot Password State
  const [isResetSending, setIsResetSending] = useState(false);
  const [isResetSent, setIsResetSent] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const liveSessionRef = useRef<LiveSessionManager | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Form Refs
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (theme === Theme.DARK) { document.documentElement.classList.add('dark'); } 
    else { document.documentElement.classList.remove('dark'); }
  }, [theme]);

  // Check for persistent login
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
    
    // Auto login
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
  
  const handleResetPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthError('');
      const email = emailRef.current?.value;
      if (!email) return setAuthError('Please enter your email');

      // Check if user exists in our local "database"
      const users = getUsers();
      const user = users.find(u => u.email === email);
      
      if (!user) {
          // Security practice: Don't reveal if email exists or not, but for this demo we will mimic success
          // or you could show "If this email exists..."
      }

      setIsResetSending(true);

      // --- SEND REAL EMAIL WITH EMAILJS ---
      try {
          if (EMAILJS_CONFIG.SERVICE_ID === 'YOUR_SERVICE_ID') {
              throw new Error("EmailJS Configuration Missing. Please update constants.");
          }

          await emailjs.send(
              EMAILJS_CONFIG.SERVICE_ID,
              EMAILJS_CONFIG.TEMPLATE_ID,
              {
                  to_name: user ? user.name : 'User',
                  to_email: email, // This corresponds to the variable in EmailJS template
                  reset_link: `https://career-compass.ai/reset-password?token=${Date.now()}` // Mock link
              },
              EMAILJS_CONFIG.PUBLIC_KEY
          );
          setIsResetSent(true);
      } catch (error: any) {
          console.error("Email Error:", error);
          // Show explicit error to the user
          setAuthError(`Email Error: ${error?.text || error?.message || JSON.stringify(error)}`);
      } finally {
          setIsResetSending(false);
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
          // Update in local storage if not guest
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
    const textToSend = overrideText || inputMsg;
    if (!textToSend.trim()) return;
    if (!overrideText) setInputMsg('');
    const newMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: textToSend, timestamp: new Date() };
    setMessages(prev => [...prev, newMsg]);
    setIsChatLoading(true);
    try {
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      const responseText = await sendChatMessage(history, textToSend, lang);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: responseText || '', timestamp: new Date() }]);
    } catch (error) {
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: t.error, timestamp: new Date() }]);
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

  // --- Render Functions ---

  const renderLanding = () => {
    return (
      <div className="min-h-screen bg-white dark:bg-[#050505] text-slate-900 dark:text-white transition-colors duration-500 overflow-x-hidden">
        {/* Navbar */}
        <nav className="fixed w-full z-50 px-6 py-4 flex justify-between items-center backdrop-blur-sm bg-white/70 dark:bg-[#050505]/70 border-b border-gray-200 dark:border-white/5">
          <div className="flex items-center gap-2">
            <CompassLogo className="w-8 h-8" />
            <span className="font-bold text-xl tracking-tight">CareerCompass</span>
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
             <button onClick={() => { setMode(AppMode.AUTH); setAuthType('register'); }} className="bg-black dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-full font-bold hover:scale-105 transition-transform">{t.getStarted}</button>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

          <div className="max-w-4xl space-y-8 animate-fade-in-up flex flex-col items-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm font-medium">
               <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
               {t.heroBadge}
            </div>
            <h1 className="text-6xl md:text-8xl font-bold leading-[1.1] tracking-tight text-balance">
              {t.heroTitlePrefix}
              <span className="italic font-serif text-indigo-500">{t.heroTitleSuffix}</span>.
            </h1>
            <p className="text-xl text-gray-500 dark:text-gray-400 max-w-lg leading-relaxed">
              {t.subTagline}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => { setMode(AppMode.AUTH); setAuthType('register'); }} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-indigo-500/20">{t.getStarted}</button>
              <button onClick={handleGuestLogin} className="px-8 py-4 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl font-bold text-lg hover:bg-gray-50 dark:hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                <Icons.Zap className="w-5 h-5" />
                {t.guestLogin}
              </button>
            </div>
          </div>
        </section>

        {/* Marquee Section */}
        <div className="py-10 bg-gray-50 dark:bg-[#0a0a0a] border-y border-gray-200 dark:border-white/5 overflow-hidden">
            <div className="flex gap-8 whitespace-nowrap animate-marquee">
                {[...CAREER_TAGS, ...CAREER_TAGS].map((tag, i) => (
                    <div key={i} className="text-4xl font-bold text-gray-300 dark:text-white/10 uppercase tracking-widest">{lang === Language.EN ? tag.en : tag.vi}</div>
                ))}
            </div>
        </div>
        
        {/* Hot Industries Section */}
        <section className="py-20 px-6 max-w-7xl mx-auto">
             <div className="mb-12 text-center md:text-left">
                <h2 className="text-3xl md:text-5xl font-bold mb-4">{t.hotIndustriesTitle}</h2>
                <p className="text-xl text-gray-500 max-w-2xl">{t.hotIndustriesSub}</p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {HOT_INDUSTRIES.map((industry) => {
                     // Dynamically select icon component
                     // @ts-ignore
                     const IconComponent = Icons[industry.icon] || Icons.TrendingUp;
                     
                     return (
                        <div key={industry.id} className="glass-card rounded-3xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                             <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${industry.color} flex items-center justify-center text-white mb-6 shadow-lg`}>
                                 <IconComponent className="w-6 h-6" />
                             </div>
                             <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-indigo-500 transition-colors">
                                 {lang === Language.EN ? industry.name_en : industry.name_vi}
                             </h3>
                             <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                 {lang === Language.EN ? industry.desc_en : industry.desc_vi}
                             </p>
                        </div>
                     );
                 })}
             </div>
        </section>

        {/* How it Works / Features (Bento Grid) */}
        <section className="py-24 px-6 max-w-7xl mx-auto">
             <div className="mb-16">
                 <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">{t.featureHeader} <br/><span className="text-indigo-500 italic">{t.featureHeaderHighlight}</span> {t.featureHeaderSuffix}</h2>
                 <p className="text-xl text-gray-500 max-w-2xl">{t.featureSub}</p>
             </div>

             <div className="bento-grid">
                 {/* Card 1: Voice */}
                 <div className="glass-card rounded-3xl p-8 relative overflow-hidden group hover:border-indigo-500/50 transition-colors col-span-2">
                     <div className="relative z-10">
                         <div className="w-12 h-12 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mb-6">
                             <Icons.Microphone className="w-6 h-6" />
                         </div>
                         <h3 className="text-2xl font-bold mb-2">{t.featureVoiceTitle}</h3>
                         <p className="text-gray-500 dark:text-gray-400">{t.featureVoiceDesc}</p>
                     </div>
                     <div className="absolute right-0 bottom-0 w-64 h-64 bg-gradient-to-tl from-red-500/10 to-transparent rounded-full translate-x-20 translate-y-20"></div>
                 </div>

                 {/* Card 2: 24/7 */}
                 <div className="glass-card rounded-3xl p-8 relative overflow-hidden group hover:border-blue-500/50 transition-colors">
                     <div className="relative z-10">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6">
                             <Icons.Stars className="w-6 h-6" />
                         </div>
                         <h3 className="text-2xl font-bold mb-2">{t.feature247Title}</h3>
                         <p className="text-gray-500 dark:text-gray-400">{t.feature247Desc}</p>
                     </div>
                 </div>

                 {/* Card 3: Analysis */}
                 <div className="glass-card rounded-3xl p-8 relative overflow-hidden group hover:border-purple-500/50 transition-colors">
                     <div className="relative z-10">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mb-6">
                             <Icons.FileText className="w-6 h-6" />
                         </div>
                         <h3 className="text-2xl font-bold mb-2">{t.featureScanTitle}</h3>
                         <p className="text-gray-500 dark:text-gray-400">{t.featureScanDesc}</p>
                     </div>
                 </div>

                  {/* Card 4: Roadmap */}
                 <div className="glass-card rounded-3xl p-8 relative overflow-hidden group hover:border-green-500/50 transition-colors col-span-2">
                     <div className="relative z-10">
                         <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center mb-6">
                             <Icons.Compass className="w-6 h-6" />
                         </div>
                         <h3 className="text-2xl font-bold mb-2">{t.featureRoadmapTitle}</h3>
                         <p className="text-gray-500 dark:text-gray-400">{t.featureRoadmapDesc}</p>
                     </div>
                      <div className="absolute right-0 bottom-0 w-64 h-64 bg-gradient-to-tl from-green-500/10 to-transparent rounded-full translate-x-20 translate-y-20"></div>
                 </div>
             </div>
        </section>

        {/* Quote Section */}
        <section className="py-20 px-6 bg-gray-100 dark:bg-[#0a0a0a]">
             <div className="max-w-4xl mx-auto text-center">
                 <p className="text-2xl md:text-4xl font-serif italic leading-relaxed text-gray-800 dark:text-gray-200">
                     "{lang === Language.EN ? CAREER_QUOTES[1].text : CAREER_QUOTES[1].text_vi}"
                 </p>
                 <div className="mt-8 flex items-center justify-center gap-4">
                     <div className="w-12 h-[1px] bg-gray-300 dark:bg-gray-700"></div>
                     <span className="text-sm font-bold uppercase tracking-widest text-gray-500">{CAREER_QUOTES[1].author}</span>
                     <div className="w-12 h-[1px] bg-gray-300 dark:bg-gray-700"></div>
                 </div>
             </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-6 border-t border-gray-200 dark:border-white/5 text-center">
             <div className="flex items-center justify-center gap-2 mb-6 opacity-50">
                 <CompassLogo className="w-6 h-6" />
                 <span className="font-bold text-lg">CareerCompass</span>
             </div>
             <p className="text-gray-500 text-sm">© 2024 Career Compass AI. Empowering Futures.</p>
        </footer>
      </div>
    );
  }

  const renderAuth = () => (
    <div className="min-h-screen bg-white dark:bg-[#050505] flex items-center justify-center p-4 transition-colors duration-300 relative">
      <div className="glass-card bg-white/50 dark:bg-[#111]/80 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-gray-100 dark:border-white/10 relative z-10 p-8">
            <div className="flex justify-center mb-6">
                <CompassLogo className="w-16 h-16 text-indigo-500" />
            </div>
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2 tracking-tight">
                {authType === 'login' ? t.login : authType === 'register' ? t.register : t.resetPasswordTitle}
            </h2>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-8 text-sm">
                {authType === 'forgot-password' ? t.resetPasswordDesc : t.tagline}
            </p>
            
            {/* Error Message Display */}
            {authError && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-xl text-center">
                    <p className="text-red-600 dark:text-red-400 text-sm font-semibold">{authError}</p>
                </div>
            )}
            
            {authType === 'forgot-password' && isResetSent ? (
                <div className="text-center animate-fade-in-up">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <p className="text-green-600 dark:text-green-400 font-medium mb-6">{t.linkSent}</p>
                    <button onClick={() => { setAuthType('login'); setIsResetSent(false); }} className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20">{t.backToLogin}</button>
                </div>
            ) : (
                <form onSubmit={authType === 'forgot-password' ? handleResetPassword : authType === 'login' ? handleLogin : handleRegister} className="space-y-4">
                    {authType === 'register' && (<div><label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Full Name</label><input ref={nameRef} type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white" placeholder="John Doe" /></div>)}
                    
                    <div><label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{t.email}</label><input ref={emailRef} type="email" required className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white" placeholder="you@example.com" /></div>
                    
                    {authType !== 'forgot-password' && (
                        <div><label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{t.password}</label><input ref={passwordRef} type="password" required className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white" placeholder="••••••••" /></div>
                    )}

                    {authType === 'login' && (<div className="flex justify-end"><button type="button" onClick={() => setAuthType('forgot-password')} className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">{t.forgotPassword}</button></div>)}
                    
                    <button type="submit" disabled={isResetSending} className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 mt-2 flex items-center justify-center gap-2">
                        {isResetSending && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                        {authType === 'login' ? t.login : authType === 'register' ? t.register : t.sendLink}
                    </button>
                </form>
            )}

            {authType !== 'forgot-password' && (
                <>
                    <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-white/10"></div></div><div className="relative flex justify-center text-sm"><span className="px-2 bg-white dark:bg-[#111] text-gray-500">{t.or}</span></div></div>
                    <button onClick={handleLogin} className="w-full flex items-center justify-center gap-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white font-medium py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"><Icons.Google className="w-5 h-5" />{t.loginWithGoogle}</button>
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
        <div className="p-6 flex items-center gap-3"><CompassLogo className="w-8 h-8" /><span className="font-bold text-lg text-gray-800 dark:text-white tracking-tight">Career Compass</span></div>
        <div className="px-4 mb-2"><button onClick={startNewChat} className="w-full flex items-center gap-3 px-4 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:scale-[1.02] active:scale-95 transition-all font-bold shadow-lg"><span className="text-xl leading-none">+</span> {t.newChat}</button></div>
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            <button onClick={() => setTab(DashboardTab.CHAT)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${tab === DashboardTab.CHAT ? 'bg-gray-100 dark:bg-white/10 text-black dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}><Icons.MessageSquare className="w-5 h-5" /><span>{t.chatMode}</span></button>
            <button onClick={() => setTab(DashboardTab.VOICE)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${tab === DashboardTab.VOICE ? 'bg-gray-100 dark:bg-white/10 text-black dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}><Icons.Microphone className="w-5 h-5" /><span>{t.voiceMode}</span></button>
             <button onClick={() => setTab(DashboardTab.PROFILE)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${tab === DashboardTab.PROFILE ? 'bg-gray-100 dark:bg-white/10 text-black dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}><Icons.User className="w-5 h-5" /><span>{t.profile}</span></button>
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
                            <div className="bg-gray-100 dark:bg-white/5 p-6 rounded-full mb-6"><CompassLogo className="w-16 h-16 opacity-80" /></div>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t.welcomeBack} {auth.user?.name}</h2>
                            <p className="text-base max-w-md mx-auto leading-relaxed mb-8 opacity-70">{t.greetingSub}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl px-4">
                                {SUGGESTION_PROMPTS.map((prompt) => (
                                    <button key={prompt.id} onClick={() => handleSendMessage(undefined, lang === Language.VI ? prompt.text_vi : prompt.text_en)} className="flex items-center gap-4 p-4 text-left rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 hover:border-indigo-500 transition-all group">
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
                                <div className={`px-6 py-3.5 rounded-2xl shadow-sm relative transition-all duration-300 ${m.role === 'user' ? 'bg-black dark:bg-white text-white dark:text-black rounded-tr-none' : 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white border border-gray-200 dark:border-white/5 rounded-tl-none'}`}>
                                    <p className="leading-relaxed whitespace-pre-wrap text-[15px]"><FormattedText text={cleanText(m.text)} /></p>
                                </div>
                                <span className={`text-[10px] mt-1.5 opacity-40 font-bold px-1 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>{m.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                        </div>
                    ))}
                    {isChatLoading && (<div className="flex w-full justify-start"><div className="hidden md:flex w-8 h-8 mr-4 flex-shrink-0 bg-indigo-600 rounded-full items-center justify-center mt-1"><CompassLogo className="w-5 h-5 animate-spin-slow text-white" /></div><div className="px-6 py-4 bg-gray-50 dark:bg-white/5 rounded-2xl rounded-tl-none"><ShimmerText text={t.thinking} /></div></div>)}
                    <div ref={messagesEndRef} className="h-4" />
                </div>
                <div className="p-6 bg-white dark:bg-[#050505] w-full flex justify-center border-t border-gray-200 dark:border-white/5 relative">
                    <form onSubmit={handleSendMessage} className="relative w-full max-w-4xl flex items-center bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
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
                        <div className="w-full max-w-sm h-24 rounded-2xl overflow-hidden mb-8 bg-black/5 dark:bg-white/5 backdrop-blur-sm p-4"><Visualizer isActive={isVoiceActive} level={audioLevel} /></div>
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
                             <button onClick={handleVoiceToggle} className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-xl active:scale-[0.98] ${isVoiceActive ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>{isVoiceActive ? t.endVoice : t.startVoice}</button>
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
                        </div>
                        <div className="mt-12 pt-8 border-t border-gray-100 dark:border-white/5 flex justify-end"><button className="px-10 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 hover:-translate-y-1 shadow-lg shadow-indigo-500/20 transition-all active:scale-95">{t.saveChanges}</button></div>
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