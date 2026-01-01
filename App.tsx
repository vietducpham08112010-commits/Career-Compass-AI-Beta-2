import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Language, 
  AppMode, 
  DashboardTab, 
  ChatMessage, 
  AuthState,
  Theme,
  ChatSession
} from './types';
import { TRANSLATIONS, Icons, HOT_INDUSTRIES, CAREER_QUOTES, CompassLogo, AVATARS, SUGGESTION_PROMPTS } from './constants';
import { sendChatMessage, LiveSessionManager } from './services/geminiService';
import { decode, createPcmBlob, decodeAudioData } from './utils/audio';
import { Visualizer } from './components/Visualizer';

// --- Sub-Components ---

const cleanText = (text: string) => text.trim();

const ShimmerText = ({ text }: { text: string }) => (
    <div className="inline-block animate-shimmer-text font-medium text-lg tracking-wide">
        {text}
    </div>
);

const FormattedText = ({ text }: { text: string }) => {
    // Split by **bold** syntax
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

export default function App() {
  // --- Global State ---
  const [lang, setLang] = useState<Language>(Language.EN);
  const [theme, setTheme] = useState<Theme>(Theme.LIGHT);
  const [mode, setMode] = useState<AppMode>(AppMode.LANDING);
  const [tab, setTab] = useState<DashboardTab>(DashboardTab.CHAT);
  
  // --- Auth State ---
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    user: null
  });
  const [authType, setAuthType] = useState<'login' | 'register'>('login');

  // --- Chat State ---
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Voice State ---
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [transcripts, setTranscripts] = useState<{isUser: boolean, text: string}[]>([]);
  const liveSessionRef = useRef<LiveSessionManager | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[lang];

  // --- Effects ---
  useEffect(() => {
    // Apply dark mode class
    if (theme === Theme.DARK) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // --- Handlers: Navigation ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isChatLoading]);

  // Scroll transcript
  useEffect(() => {
      transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  const toggleLang = () => {
    setLang(l => l === Language.EN ? Language.VI : Language.EN);
  };

  const toggleTheme = () => {
    setTheme(t => t === Theme.LIGHT ? Theme.DARK : Theme.LIGHT);
  };

  // --- Helpers ---
  const getRandomAvatar = () => {
    return AVATARS[Math.floor(Math.random() * AVATARS.length)];
  };

  // --- Handlers: Auth ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuth({
      isAuthenticated: true,
      user: { 
          name: 'Alex Johnson', 
          email: 'alex@example.com', 
          careerGoal: 'Software Engineer', 
          isGuest: false,
          avatar: getRandomAvatar()
      }
    });
    setMode(AppMode.DASHBOARD);
  };

  const handleGuestLogin = () => {
    setAuth({
      isAuthenticated: true,
      user: { 
          name: 'Guest User', 
          email: '', 
          careerGoal: 'Exploring', 
          isGuest: true,
          avatar: getRandomAvatar()
      }
    });
    setMode(AppMode.DASHBOARD);
  };

  const changeAvatar = () => {
      if (auth.user) {
          setAuth({ ...auth, user: { ...auth.user, avatar: getRandomAvatar() } });
      }
  };

  const handleLogout = () => {
    setAuth({ isAuthenticated: false, user: null });
    setMode(AppMode.LANDING);
    setMessages([]);
    // Cleanup voice if active
    if (isVoiceActive) handleVoiceToggle();
  };

  // --- Handlers: Chat History ---
  const startNewChat = () => {
      if (messages.length > 0) {
          const newSession: ChatSession = {
              id: Date.now().toString(),
              title: messages[0].text.substring(0, 30) + "...",
              date: new Date(),
              messages: [...messages]
          };
          setChatHistory(prev => [newSession, ...prev]);
      }
      setMessages([]);
      setTab(DashboardTab.CHAT);
  };

  const loadSession = (session: ChatSession) => {
      // Save current if needed
      if (messages.length > 0) {
           const currentSession: ChatSession = {
              id: Date.now().toString(),
              title: messages[0].text.substring(0, 30) + "...",
              date: new Date(),
              messages: [...messages]
          };
          setChatHistory(prev => [currentSession, ...prev]);
      }
      // Load selected
      setMessages(session.messages);
      // Remove from history list (since it's now active) - optional logic, but keeps list clean
      setChatHistory(prev => prev.filter(s => s.id !== session.id));
      setTab(DashboardTab.CHAT);
  };

  // --- Handlers: Chat ---
  const handleSendMessage = async (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    
    const textToSend = overrideText || inputMsg;
    if (!textToSend.trim()) return;

    // Clear input if coming from state
    if (!overrideText) setInputMsg('');
    
    const newMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: textToSend, timestamp: new Date() };
    
    setMessages(prev => [...prev, newMsg]);
    setIsChatLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      const responseText = await sendChatMessage(history, textToSend, lang);
      
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'model', text: responseText || '', timestamp: new Date() }
      ]);
    } catch (error) {
        setMessages(prev => [
            ...prev,
            { id: (Date.now() + 1).toString(), role: 'model', text: t.error, timestamp: new Date() }
          ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // --- Handlers: Voice ---
  // Load devices on mount (or when entering voice tab)
  useEffect(() => {
    const loadDevices = async () => {
        // Needs a temp session to access enumerator logic or just direct call if logic was static
        const tempSession = new LiveSessionManager(lang); 
        const devices = await tempSession.getAudioInputDevices();
        setInputDevices(devices);
        if (devices.length > 0) setSelectedDeviceId(devices[0].deviceId);
    };
    if (tab === DashboardTab.VOICE) loadDevices();
  }, [tab]);

  const handleVoiceToggle = useCallback(async () => {
    if (isVoiceActive) {
      // Disconnect
      setVoiceStatus(t.disconnecting);
      liveSessionRef.current?.disconnect();
      setIsVoiceActive(false);
      setVoiceStatus('');
      setAudioLevel(0);
    } else {
      // Connect
      setVoiceStatus(t.connecting);
      setTranscripts([]);
      const session = new LiveSessionManager(lang);
      
      session.onConnect = () => {
        setIsVoiceActive(true);
        setVoiceStatus(t.listening);
      };
      session.onDisconnect = () => {
        setIsVoiceActive(false);
        setVoiceStatus('');
      };
      session.onError = (err) => {
          console.error(err);
          setVoiceStatus(t.error);
          setIsVoiceActive(false);
      };
      session.onAudioLevel = (level) => {
          setAudioLevel(level);
      };
      session.onTranscript = (text, isUser) => {
          // Append to transcript, if last msg is same role, append text, else new entry
          setTranscripts(prev => {
              const last = prev[prev.length - 1];
              if (last && last.isUser === isUser) {
                  // Only update if it seems to be continuation or just replace (simplification for real-time)
                  // For a simple view, we might just keep pushing new chunks or debounce. 
                  // Here we just push new line for simplicity
                  return [...prev, { isUser, text }];
              }
              return [...prev, { isUser, text }];
          });
      };

      liveSessionRef.current = session;
      await session.connect(selectedDeviceId, decodeAudioData, createPcmBlob, decode);
    }
  }, [isVoiceActive, lang, t, selectedDeviceId]);

  const switchToVoice = () => {
      setTab(DashboardTab.VOICE);
      // Optionally start immediately
      if (!isVoiceActive) {
          handleVoiceToggle();
      }
  };

  // Clean up on unmount
  useEffect(() => {
      return () => {
          liveSessionRef.current?.disconnect();
      };
  }, []);

  // --- Render Helpers ---

  const renderLanding = () => {
    const randomQuote = CAREER_QUOTES[Math.floor(Math.random() * CAREER_QUOTES.length)];
    const quoteText = lang === Language.VI && randomQuote.text_vi ? randomQuote.text_vi : randomQuote.text;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/50 to-gray-50 dark:from-slate-950 dark:via-indigo-950/30 dark:to-slate-950 animate-gradient-x flex flex-col transition-colors duration-300 relative overflow-hidden">
        {/* Background Effects */}
        <div className="aurora-bg">
            <div className="aurora-blob aurora-1"></div>
            <div className="aurora-blob aurora-2"></div>
            <div className="aurora-blob aurora-3"></div>
        </div>

        <header className="p-6 flex justify-between items-center backdrop-blur-md bg-white/30 dark:bg-slate-900/30 sticky top-0 z-20 border-b border-white/20 dark:border-white/5">
          <div className="flex items-center gap-3 group cursor-default">
              <CompassLogo className="w-10 h-10 drop-shadow-md" needleClassName="animate-compass-wander" />
              <span className="font-bold text-xl text-gray-800 dark:text-white tracking-tight whitespace-nowrap">Career Compass AI</span>
          </div>
          <div className="flex items-center gap-4">
              <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-gray-600 dark:text-gray-300">
                {theme === Theme.LIGHT ? <Icons.Moon className="w-5 h-5"/> : <Icons.Sun className="w-5 h-5"/>}
              </button>
              <button onClick={toggleLang} className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  <Icons.Globe className="w-4 h-4" />
                  {lang === Language.EN ? 'VI' : 'EN'}
              </button>
              <div className="hidden md:flex items-center gap-4">
                 <button onClick={() => { setMode(AppMode.AUTH); setAuthType('login'); }} className="text-gray-600 dark:text-gray-300 font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{t.login}</button>
                 <button onClick={() => { setMode(AppMode.AUTH); setAuthType('register'); }} className="bg-indigo-600 text-white px-5 py-2.5 rounded-full font-medium hover:bg-indigo-700 hover:scale-105 transition-all shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95">
                     {t.getStarted}
                 </button>
              </div>
          </div>
        </header>
        
        <main className="flex-1 flex flex-col items-center px-4 relative z-10">
          
          {/* Hero Section */}
          <div className="max-w-5xl w-full text-center mt-20 mb-20">
            <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-indigo-50/80 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 text-sm font-semibold animate-bounce-small backdrop-blur-sm">
              ✨ AI-Powered Career Guidance
            </div>
            
            {/* One Line Title with animated Gradient */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 py-4 leading-tight whitespace-nowrap overflow-visible">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-pink-500 to-indigo-600 dark:from-indigo-400 dark:via-pink-400 dark:to-indigo-400 animate-gradient-x bg-size-200">
              {t.appName}
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-12 leading-relaxed font-light">
              {t.tagline}
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button onClick={() => { setMode(AppMode.AUTH); setAuthType('register'); }} className="group relative inline-flex items-center justify-center px-10 py-5 text-lg font-bold text-white transition-all duration-200 bg-indigo-600 font-pj rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/30 hover:-translate-y-1">
                  {t.getStarted}
                  <Icons.Send className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={handleGuestLogin} className="inline-flex items-center justify-center px-10 py-5 text-lg font-bold text-indigo-600 dark:text-indigo-300 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-2 border-indigo-50 dark:border-slate-700 rounded-full hover:bg-white dark:hover:bg-slate-700 transition-all hover:-translate-y-1 shadow-lg">
                  {t.guestLogin}
              </button>
            </div>
          </div>

          {/* Hot Industries Section */}
          <div className="w-full max-w-6xl mb-24">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white text-center mb-10 flex items-center justify-center gap-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">🔥</span>
              {t.hotIndustries}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {HOT_INDUSTRIES.map((industry) => (
                <div key={industry.id} className="group p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/50 dark:border-white/5 hover:border-indigo-300 dark:hover:border-indigo-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 cursor-pointer relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className={`h-2 w-16 rounded-full bg-gradient-to-r ${industry.color} mb-4 relative z-10`}></div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 relative z-10">
                      {lang === Language.VI ? industry.name_vi : industry.name_en}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 relative z-10">
                      {lang === Language.VI ? industry.desc_vi : industry.desc_en}
                  </p>
                  <div className="mt-4 flex items-center text-indigo-600 dark:text-indigo-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity relative z-10">
                    Explore <Icons.ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quote Section */}
          <div className="w-full bg-indigo-900 dark:bg-black text-white py-16 px-4 mb-20 rounded-3xl relative overflow-hidden shadow-2xl">
             <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
             <div className="max-w-3xl mx-auto text-center relative z-10">
                <div className="mb-4 text-indigo-300 uppercase tracking-widest text-xs font-bold">{t.dailyQuote}</div>
                <blockquote className="text-2xl md:text-3xl font-serif italic mb-6 leading-relaxed">
                  "{quoteText}"
                </blockquote>
                <cite className="not-italic text-lg font-medium text-indigo-200">— {randomQuote.author}</cite>
             </div>
          </div>

        </main>
        
        <footer className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm border-t border-gray-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md">
          © 2024 Career Compass AI. Empowering Futures.
        </footer>
      </div>
    );
  }

  const renderAuth = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-300 relative">
      <div className="aurora-bg">
        <div className="aurora-blob aurora-1"></div>
        <div className="aurora-blob aurora-3"></div>
      </div>
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-gray-100 dark:border-slate-700 relative z-10">
        <div className="p-8">
            <div className="flex justify-center mb-6">
                 <div className="bg-gradient-to-br from-indigo-600 to-pink-500 p-1 rounded-full shadow-lg animate-float">
                    <div className="bg-white dark:bg-slate-800 rounded-full p-2">
                        <CompassLogo className="w-16 h-16" needleClassName="animate-compass-wander" />
                    </div>
                 </div>
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-2">
                {authType === 'login' ? t.login : t.register}
            </h2>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-8 text-sm">
                {t.tagline}
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
                {authType === 'register' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                        <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900 outline-none transition-all bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400" placeholder="John Doe" />
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.email}</label>
                    <input type="email" className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900 outline-none transition-all bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400" placeholder="you@example.com" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.password}</label>
                    <input type="password" className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900 outline-none transition-all bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400" placeholder="••••••••" />
                </div>
                
                {authType === 'login' && (
                    <div className="flex justify-end">
                        <button type="button" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">{t.forgotPassword}</button>
                    </div>
                )}

                <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg transform active:scale-95 duration-200">
                    {authType === 'login' ? t.login : t.register}
                </button>
            </form>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-slate-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400">{t.or}</span>
                </div>
            </div>

            <button onClick={handleLogin} className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-200 font-medium py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors active:scale-95">
                <Icons.Google className="w-5 h-5" />
                {t.loginWithGoogle}
            </button>
            
            <button onClick={handleGuestLogin} className="w-full mt-3 flex items-center justify-center gap-3 bg-transparent border border-dashed border-gray-300 dark:border-slate-500 text-gray-500 dark:text-gray-400 font-medium py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors active:scale-95">
                {t.guestLogin}
            </button>

            <div className="mt-8 text-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                    {authType === 'login' ? t.dontHaveAccount : t.alreadyHaveAccount}{' '}
                </span>
                <button 
                    onClick={() => setAuthType(authType === 'login' ? 'register' : 'login')}
                    className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                >
                    {authType === 'login' ? t.register : t.login}
                </button>
            </div>
        </div>
        <div className="bg-gray-50 dark:bg-slate-900 p-4 text-center border-t border-gray-100 dark:border-slate-700">
             <button onClick={() => setMode(AppMode.LANDING)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Back to Home</button>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 overflow-hidden transition-colors duration-300 relative">
      <div className="aurora-bg opacity-30 pointer-events-none">
         <div className="aurora-blob aurora-1"></div>
      </div>
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-72 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg flex-col transition-colors duration-300 h-full border-r border-gray-200 dark:border-slate-800 z-10">
        <div className="p-6 flex items-center gap-3">
             <CompassLogo className="w-8 h-8 drop-shadow-sm" needleClassName="animate-compass-wander" />
             <span className="font-semibold text-lg text-gray-800 dark:text-white tracking-tight">Career Compass AI</span>
        </div>
        
        {/* New Chat Button */}
        <div className="px-4 mb-2">
            <button 
                onClick={startNewChat}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all font-medium"
            >
                <span className="text-xl leading-none">+</span> {t.newChat}
            </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            <button 
                onClick={() => setTab(DashboardTab.CHAT)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${tab === DashboardTab.CHAT ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800/50'}`}
            >
                <Icons.MessageSquare className="w-5 h-5" />
                <span>{t.chatMode}</span>
            </button>
            <button 
                onClick={() => setTab(DashboardTab.VOICE)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${tab === DashboardTab.VOICE ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800/50'}`}
            >
                <Icons.Microphone className="w-5 h-5" />
                <span>{t.voiceMode}</span>
            </button>
             <button 
                onClick={() => setTab(DashboardTab.PROFILE)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${tab === DashboardTab.PROFILE ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800/50'}`}
            >
                <Icons.User className="w-5 h-5" />
                <span>{t.profile}</span>
            </button>

            {/* Chat History List */}
            {chatHistory.length > 0 && (
                <div className="mt-8">
                    <div className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Icons.History className="w-3 h-3" />
                        {t.chatHistory}
                    </div>
                    <div className="space-y-1">
                        {chatHistory.map((session) => (
                            <button
                                key={session.id}
                                onClick={() => loadSession(session)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg truncate transition-colors"
                            >
                                {session.title}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <div onClick={changeAvatar} title="Click to change avatar" className="flex items-center gap-3 mb-4 px-2 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer transition-colors group">
                <img 
                    src={auth.user?.avatar} 
                    alt="Avatar" 
                    className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-slate-600 shadow-sm group-hover:scale-110 transition-transform"
                />
                <div className="overflow-hidden flex-1">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{auth.user?.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{auth.user?.isGuest ? 'Guest Session' : auth.user?.email}</p>
                </div>
                <Icons.Refresh className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
             <div className="flex gap-2 mb-2">
                 <button onClick={toggleLang} className="flex-1 flex items-center justify-center px-3 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-white dark:hover:bg-slate-700 shadow-sm transition-all active:scale-95">
                    <span className="uppercase text-indigo-600 dark:text-indigo-400">{lang}</span>
                </button>
                <button onClick={toggleTheme} className="flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-white dark:hover:bg-slate-700 shadow-sm transition-all active:scale-95">
                    {theme === Theme.LIGHT ? <Icons.Moon className="w-4 h-4"/> : <Icons.Sun className="w-4 h-4"/>}
                </button>
             </div>
            <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors">
                <Icons.LogOut className="w-4 h-4" />
                Logout
            </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative w-full bg-white dark:bg-slate-950 z-10">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between px-4 z-20">
             <div className="flex items-center gap-2">
                <CompassLogo className="w-8 h-8" needleClassName="animate-compass-wander" />
                <span className="font-bold text-gray-800 dark:text-white">Career Compass AI</span>
            </div>
            <div className="flex gap-2">
                <button onClick={toggleTheme} className="p-2 text-gray-500 dark:text-gray-400">{theme === Theme.LIGHT ? <Icons.Moon className="w-5 h-5"/> : <Icons.Sun className="w-5 h-5"/>}</button>
                <button onClick={() => setTab(DashboardTab.CHAT)} className={`p-2 rounded-lg ${tab === DashboardTab.CHAT ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}><Icons.MessageSquare className="w-5 h-5"/></button>
                 <button onClick={handleLogout} className="p-2 text-red-500"><Icons.LogOut className="w-5 h-5"/></button>
            </div>
        </header>

        {tab === DashboardTab.CHAT && (
            <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-white dark:bg-slate-950">
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 dark:text-gray-500 animate-fade-in">
                            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 p-8 rounded-full mb-6 shadow-inner animate-float">
                                <CompassLogo className="w-24 h-24 opacity-80" needleClassName="animate-compass-wander" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{t.welcomeBack} {auth.user?.name}</h2>
                            <p className="text-base max-w-md mx-auto leading-relaxed mb-1">{t.greeting}</p>
                            <p className="text-sm max-w-md mx-auto leading-relaxed mb-8 opacity-70">{t.greetingSub}</p>
                            
                            {/* Suggestion Bubbles (Pure Counseling) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl px-4">
                                {SUGGESTION_PROMPTS.map((prompt) => (
                                    <button 
                                        key={prompt.id}
                                        onClick={() => handleSendMessage(undefined, lang === Language.VI ? prompt.text_vi : prompt.text_en)}
                                        className="flex items-center gap-4 p-4 text-left rounded-xl bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all group"
                                    >
                                        <div className={`p-2 rounded-lg ${prompt.color} group-hover:scale-110 transition-transform`}>
                                            <prompt.icon className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {lang === Language.VI ? prompt.text_vi : prompt.text_en}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {messages.map((m) => (
                        <div key={m.id} className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                            {m.role === 'model' && (
                                <div className="hidden md:flex w-10 h-10 mr-4 flex-shrink-0 bg-white dark:bg-slate-800 rounded-full items-center justify-center border border-gray-100 dark:border-slate-700 shadow-sm mt-1">
                                    <CompassLogo className="w-6 h-6" needleClassName="animate-compass-wander" />
                                </div>
                            )}
                            
                            <div className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[70%]`}>
                                <div className={`px-6 py-4 rounded-2xl shadow-sm relative transition-all duration-300 ${
                                    m.role === 'user' 
                                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-200 dark:shadow-none' 
                                    : 'bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-slate-800 rounded-tl-none'
                                }`}>
                                    <p className="leading-relaxed whitespace-pre-wrap text-[15px]">
                                        <FormattedText text={cleanText(m.text)} />
                                    </p>
                                </div>
                                <span className={`text-[10px] mt-1.5 opacity-40 font-medium px-1 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                                    {m.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>

                             {m.role === 'user' && (
                                <img src={auth.user?.avatar} className="w-10 h-10 rounded-full ml-4 mt-1 object-cover hidden md:block border-2 border-white dark:border-slate-800 shadow-sm" alt="Me" />
                            )}
                        </div>
                    ))}
                    
                    {isChatLoading && (
                        <div className="flex w-full justify-start">
                            <div className="hidden md:flex w-10 h-10 mr-4 flex-shrink-0 bg-white dark:bg-slate-800 rounded-full items-center justify-center border border-gray-100 dark:border-slate-700 shadow-sm mt-1">
                                <CompassLogo className="w-6 h-6 animate-spin-slow" />
                            </div>
                            <div className="px-6 py-4">
                                <ShimmerText text={t.thinking} />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} className="h-4" />
                </div>
                
                {/* Chat Input Area */}
                <div className="p-6 bg-white dark:bg-slate-950 w-full flex justify-center border-t border-gray-100 dark:border-slate-800/50 relative">
                    <form onSubmit={handleSendMessage} className="relative w-full max-w-4xl flex items-center bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 focus-within:border-indigo-500/50 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all shadow-sm">
                        <input 
                            type="text" 
                            value={inputMsg}
                            onChange={(e) => setInputMsg(e.target.value)}
                            placeholder={t.typeMessage}
                            className="w-full pl-6 pr-24 py-4 bg-transparent border-none focus:ring-0 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-base"
                        />
                         
                         {/* Quick Switch to Voice Button inside input */}
                         <button
                            type="button"
                            onClick={switchToVoice}
                            className="absolute right-14 p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            title={t.switchToVoice}
                         >
                             <Icons.Microphone className="w-5 h-5" />
                         </button>

                        <button 
                            type="submit" 
                            disabled={!inputMsg.trim() || isChatLoading}
                            className="absolute right-3 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-95 transform active:rotate-12"
                        >
                            {isChatLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Icons.Send className="w-5 h-5" />}
                        </button>
                    </form>
                </div>
                 <div className="text-center pb-3 text-[11px] text-gray-400 dark:text-gray-600 font-medium">
                    {t.footerDisclaimer}
                </div>
            </div>
        )}

        {tab === DashboardTab.VOICE && (
             <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-950">
                 {/* Top Bar with Status */}
                 <div className="w-full p-4 flex justify-between items-center z-20">
                    <div className="flex flex-col">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white tracking-tight">{t.voiceMode}</h2>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{voiceStatus || t.micPermission}</span>
                    </div>
                     <div className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-full flex items-center gap-2 animate-pulse">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        LIVE
                     </div>
                 </div>

                 {/* Main Voice Content: Split View for Controls & Transcript */}
                 <div className="flex-1 flex flex-col md:flex-row p-4 gap-6 overflow-hidden">
                    
                    {/* Left: Controls & Visualizer */}
                    <div className="flex-1 flex flex-col items-center justify-center relative rounded-3xl bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 p-6">
                        
                        {/* Sci-Fi Orb Visual */}
                        <div 
                            className={`relative w-48 h-48 transition-all duration-700 cursor-pointer group mb-10`}
                            onClick={handleVoiceToggle}
                        >
                             <div className={`absolute inset-0 rounded-full blur-3xl transition-opacity duration-1000 ${isVoiceActive ? 'bg-indigo-500 opacity-60' : 'bg-gray-400 dark:bg-indigo-900 opacity-20'}`}></div>
                             <div className={`relative w-full h-full rounded-full flex items-center justify-center shadow-2xl border-4 transition-all duration-500 overflow-hidden ${
                                 isVoiceActive 
                                 ? 'bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 border-indigo-400 animate-orb-breath' 
                                 : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-900 border-gray-200 dark:border-slate-700 group-hover:scale-105'
                             }`}>
                                 {isVoiceActive && (
                                    <>
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 animate-spin-slow"></div>
                                        <div className="absolute w-[200%] h-[200%] bg-gradient-to-t from-transparent via-white/10 to-transparent rotate-45 animate-pulse-slow"></div>
                                    </>
                                 )}
                                 <Icons.Microphone className={`w-16 h-16 z-10 transition-colors duration-300 ${isVoiceActive ? 'text-white drop-shadow-lg' : 'text-gray-400 dark:text-slate-500'}`} />
                             </div>
                        </div>

                        {/* Visualizer */}
                        <div className="w-full max-w-sm h-16 rounded-xl overflow-hidden mb-8">
                             <Visualizer isActive={isVoiceActive} level={audioLevel} />
                        </div>

                        {/* Controls */}
                        <div className="w-full max-w-sm space-y-4">
                            {/* Mic Selector */}
                             <div className="relative group">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 ml-1 uppercase tracking-wider">{t.selectMic}</label>
                                <div className="relative">
                                    <select 
                                        value={selectedDeviceId}
                                        onChange={(e) => setSelectedDeviceId(e.target.value)}
                                        disabled={isVoiceActive}
                                        className="w-full appearance-none bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 py-3 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {inputDevices.map((device) => (
                                            <option key={device.deviceId} value={device.deviceId}>
                                                {device.label || `Microphone ${device.deviceId.slice(0, 5)}...`}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-400">
                                        <Icons.ChevronDown className="w-4 h-4" />
                                    </div>
                                </div>
                             </div>

                             <button 
                                onClick={handleVoiceToggle}
                                className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl active:scale-[0.98] ${
                                    isVoiceActive 
                                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                }`}
                            >
                                {isVoiceActive ? t.endVoice : t.startVoice}
                            </button>
                        </div>
                    </div>

                    {/* Right: Transcript Viewer */}
                    <div className="flex-1 flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
                            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">{t.transcript}</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {transcripts.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-gray-400 dark:text-slate-600 text-sm italic">
                                    {isVoiceActive ? t.listening : "Ready to start..."}
                                </div>
                            ) : (
                                transcripts.map((t, i) => (
                                    <div key={i} className={`flex ${t.isUser ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                                            t.isUser 
                                            ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-200 rounded-tr-none' 
                                            : 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-200 rounded-tl-none'
                                        }`}>
                                            {t.text}
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={transcriptEndRef} />
                        </div>
                    </div>

                 </div>
             </div>
        )}

        {tab === DashboardTab.PROFILE && (
            <div className="flex-1 p-8 overflow-y-auto bg-white dark:bg-slate-950 flex justify-center">
                <div className="max-w-2xl w-full">
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">{t.profile}</h2>
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-gray-100 dark:border-slate-800 p-8">
                        <div className="flex items-center gap-6 mb-8">
                             <div className="relative group cursor-pointer" onClick={changeAvatar}>
                                <img 
                                    src={auth.user?.avatar} 
                                    alt="Profile" 
                                    className="w-24 h-24 rounded-full object-cover border-4 border-indigo-50 dark:border-slate-800 shadow-md group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center text-white">
                                    <Icons.Refresh className="w-4 h-4" />
                                </div>
                             </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{auth.user?.name}</h3>
                                <p className="text-gray-500 dark:text-gray-400">{auth.user?.isGuest ? t.guestMode : auth.user?.email}</p>
                                {auth.user?.isGuest && <span className="inline-block mt-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 text-xs rounded-full font-bold uppercase tracking-wider">{t.guestMode}</span>}
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t.careerGoal}</label>
                                <input disabled value={auth.user?.careerGoal} className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t.prefLang}</label>
                                <select value={lang} onChange={(e) => setLang(e.target.value as Language)} className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer">
                                    <option value={Language.EN}>English</option>
                                    <option value={Language.VI}>Tiếng Việt</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-10 pt-8 border-t border-gray-100 dark:border-slate-800 flex justify-end">
                            <button className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 hover:-translate-y-0.5 shadow-md transition-all active:scale-95">{t.saveChanges}</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );

  switch (mode) {
    case AppMode.AUTH:
        return renderAuth();
    case AppMode.DASHBOARD:
        return renderDashboard();
    case AppMode.LANDING:
    default:
        return renderLanding();
  }
}