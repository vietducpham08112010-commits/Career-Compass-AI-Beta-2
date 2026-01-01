import React from 'react';
import { Language } from './types';

// Modern Tech Compass Logo
export const CompassLogo = ({ className = "w-24 h-24", needleClassName = "" }: { className?: string, needleClassName?: string }) => 
  React.createElement("svg", {
    viewBox: "0 0 100 100",
    className: className,
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  },
    React.createElement("defs", null,
      React.createElement("linearGradient", { id: "tech-grad", x1: "0", y1: "0", x2: "100", y2: "100" },
        React.createElement("stop", { offset: "0%", stopColor: "#6366f1" }), // Indigo 500
        React.createElement("stop", { offset: "100%", stopColor: "#ec4899" })  // Pink 500
      ),
      React.createElement("filter", { id: "glow" },
        React.createElement("feGaussianBlur", { stdDeviation: "2.5", result: "coloredBlur" }),
        React.createElement("feMerge", null,
          React.createElement("feMergeNode", { in: "coloredBlur" }),
          React.createElement("feMergeNode", { in: "SourceGraphic" })
        )
      )
    ),
    // Outer Glow Ring
    React.createElement("circle", { cx: "50", cy: "50", r: "45", stroke: "url(#tech-grad)", strokeWidth: "1.5", opacity: "0.5" }),
    // Inner Dashed Ring
    React.createElement("circle", { cx: "50", cy: "50", r: "38", stroke: "currentColor", strokeWidth: "0.5", strokeDasharray: "4 4", className: "text-gray-400 dark:text-gray-600" }),
    
    // Cardinal Points (Modern Dots)
    React.createElement("circle", { cx: "50", cy: "10", r: "2", fill: "#ec4899" }), // N
    React.createElement("circle", { cx: "50", cy: "90", r: "2", fill: "currentColor", className: "text-gray-400" }), // S
    React.createElement("circle", { cx: "90", cy: "50", r: "2", fill: "currentColor", className: "text-gray-400" }), // E
    React.createElement("circle", { cx: "10", cy: "50", r: "2", fill: "currentColor", className: "text-gray-400" }), // W

    // Rotating Core
    React.createElement("g", { className: needleClassName, style: { transformOrigin: "50px 50px" } },
      // The Needle
      React.createElement("path", { d: "M50 15 L58 50 L50 85 L42 50 Z", fill: "url(#tech-grad)", filter: "url(#glow)" }),
      // Center Point
      React.createElement("circle", { cx: "50", cy: "50", r: "4", fill: "white" })
    )
  );

export const AVATARS = [
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Pepper",
  "https://api.dicebear.com/7.x/micah/svg?seed=George",
  "https://api.dicebear.com/7.x/notionists/svg?seed=Molly",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Tech",
];

// Simple Icons as SVG components
export const Icons = {
  Microphone: (props: React.SVGProps<SVGSVGElement>) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...props
  }, React.createElement("path", {
    d: "M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"
  }), React.createElement("path", {
    d: "M19 10v2a7 7 0 0 1-14 0v-2"
  }), React.createElement("line", {
    x1: "12",
    x2: "12",
    y1: "19",
    y2: "22"
  })),
  MessageSquare: (props: React.SVGProps<SVGSVGElement>) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...props
  }, React.createElement("path", {
    d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
  })),
  User: (props: React.SVGProps<SVGSVGElement>) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...props
  }, React.createElement("path", {
    d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"
  }), React.createElement("circle", {
    cx: "12",
    cy: "7",
    r: "4"
  })),
  LogOut: (props: React.SVGProps<SVGSVGElement>) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...props
  }, React.createElement("path", {
    d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
  }), React.createElement("polyline", {
    points: "16 17 21 12 16 7"
  }), React.createElement("line", {
    x1: "21",
    x2: "9",
    y1: "12",
    y2: "12"
  })),
  Send: (props: React.SVGProps<SVGSVGElement>) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...props
  }, React.createElement("line", {
    x1: "22",
    y1: "2",
    x2: "11",
    y2: "13"
  }), React.createElement("polygon", {
    points: "22 2 15 22 11 13 2 9 22 2"
  })),
  Globe: (props: React.SVGProps<SVGSVGElement>) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...props
  }, React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), React.createElement("line", {
    x1: "2",
    x2: "22",
    y1: "12",
    y2: "12"
  }), React.createElement("path", {
    d: "M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
  })),
  Sun: (props: React.SVGProps<SVGSVGElement>) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...props
  }, React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "5"
  }), React.createElement("line", { x1: "12", y1: "1", x2: "12", y2: "3" }), React.createElement("line", { x1: "12", y1: "21", x2: "12", y2: "23" }), React.createElement("line", { x1: "4.22", y1: "4.22", x2: "5.64", y2: "5.64" }), React.createElement("line", { x1: "18.36", y1: "18.36", x2: "19.78", y2: "19.78" }), React.createElement("line", { x1: "1", y1: "12", x2: "3", y2: "12" }), React.createElement("line", { x1: "21", y1: "12", x2: "23", y2: "12" }), React.createElement("line", { x1: "4.22", y1: "19.78", x2: "5.64", y2: "18.36" }), React.createElement("line", { x1: "18.36", y1: "5.64", x2: "19.78", y2: "4.22" })),
  Moon: (props: React.SVGProps<SVGSVGElement>) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...props
  }, React.createElement("path", {
    d: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
  })),
  Google: (props: React.SVGProps<SVGSVGElement>) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    width: "24",
    height: "24",
    ...props
  }, React.createElement("path", {
    fill: "#4285F4",
    d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
  }), React.createElement("path", {
    fill: "#34A853",
    d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
  }), React.createElement("path", {
    fill: "#FBBC05",
    d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
  }), React.createElement("path", {
    fill: "#EA4335",
    d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
  })),
  ArrowRight: (props: React.SVGProps<SVGSVGElement>) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...props
  }, React.createElement("line", { x1: "5", y1: "12", x2: "19", y2: "12" }), React.createElement("polyline", { points: "12 5 19 12 12 19" })),
  History: (props: React.SVGProps<SVGSVGElement>) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...props
  }, React.createElement("path", {
    d: "M3 3v5h5"
  }), React.createElement("path", {
    d: "M3.05 13A9 9 0 1 0 6 5.3L3 8"
  }), React.createElement("path", {
    d: "M12 7v5l4 2"
  })),
  Refresh: (props: React.SVGProps<SVGSVGElement>) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...props
  }, React.createElement("path", {
    d: "M21 2v6h-6"
  }), React.createElement("path", {
    d: "M3 12a9 9 0 0 1 15-6.7L21 8"
  }), React.createElement("path", {
    d: "M3 22v-6h6"
  }), React.createElement("path", {
    d: "M21 12a9 9 0 0 1-15 6.7L3 16"
  })),
  FileText: (props: React.SVGProps<SVGSVGElement>) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...props
  }, React.createElement("path", { d: "M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" }), React.createElement("polyline", { points: "14 2 14 8 20 8" }), React.createElement("line", { x1: "16", y1: "13", x2: "8", y2: "13" }), React.createElement("line", { x1: "16", y1: "17", x2: "8", y2: "17" }), React.createElement("line", { x1: "10", y1: "9", x2: "8", y2: "9" })),
  TrendingUp: (props: React.SVGProps<SVGSVGElement>) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...props
  }, React.createElement("polyline", { points: "23 6 13.5 15.5 8.5 10.5 1 18" }), React.createElement("polyline", { points: "17 6 23 6 23 12" })),
  Briefcase: (props: React.SVGProps<SVGSVGElement>) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...props
  }, React.createElement("rect", { x: "2", y: "7", width: "20", height: "14", rx: "2", ry: "2" }), React.createElement("path", { d: "M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" })),
  Zap: (props: React.SVGProps<SVGSVGElement>) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...props
  }, React.createElement("polygon", { points: "13 2 3 14 12 14 11 22 21 10 12 10 13 2" })),
  Compass: (props: React.SVGProps<SVGSVGElement>) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...props
  }, React.createElement("circle", { cx: "12", cy: "12", r: "10" }), React.createElement("polygon", { points: "16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" })),
  Target: (props: React.SVGProps<SVGSVGElement>) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...props
  }, React.createElement("circle", { cx: "12", cy: "12", r: "10" }), React.createElement("circle", { cx: "12", cy: "12", r: "6" }), React.createElement("circle", { cx: "12", cy: "12", r: "2" })),
  Heart: (props: React.SVGProps<SVGSVGElement>) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...props
  }, React.createElement("path", { d: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" })),
  ChevronDown: (props: React.SVGProps<SVGSVGElement>) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...props
  }, React.createElement("path", { d: "M6 9l6 6 6-6" })),
};

export const HOT_INDUSTRIES = [
  { 
      id: 1, 
      name_en: "AI & Data", name_vi: "Trí tuệ nhân tạo & Dữ liệu",
      desc_en: "Machine Learning, NLP, Data Science", desc_vi: "Học máy, NLP, Khoa học dữ liệu",
      color: "from-blue-500 to-indigo-600" 
  },
  { 
      id: 2, 
      name_en: "Green Energy", name_vi: "Năng lượng xanh",
      desc_en: "Sustainability, Solar, EV Tech", desc_vi: "Bền vững, Năng lượng mặt trời, Xe điện",
      color: "from-green-400 to-emerald-600" 
  },
  { 
      id: 3, 
      name_en: "Cybersecurity", name_vi: "An ninh mạng",
      desc_en: "Network Defense, Ethical Hacking", desc_vi: "Bảo vệ mạng, Hacking mũ trắng",
      color: "from-red-500 to-orange-600" 
  },
  { 
      id: 4, 
      name_en: "Digital Health", name_vi: "Y tế kỹ thuật số",
      desc_en: "Telemedicine, BioTech, Health Apps", desc_vi: "Khám từ xa, Công nghệ sinh học",
      color: "from-teal-400 to-cyan-600" 
  }
];

export const CAREER_QUOTES = [
  { 
      text: "Choose a job you love, and you will never have to work a day in your life.", 
      text_vi: "Hãy chọn công việc bạn yêu thích, và bạn sẽ không bao giờ phải làm việc một ngày nào trong đời.",
      author: "Confucius" 
  },
  { 
      text: "The future belongs to those who believe in the beauty of their dreams.", 
      text_vi: "Tương lai thuộc về những ai tin vào vẻ đẹp của giấc mơ của mình.",
      author: "Eleanor Roosevelt" 
  },
  { 
      text: "Opportunities don't happen, you create them.", 
      text_vi: "Cơ hội không tự đến, bạn phải tạo ra chúng.",
      author: "Chris Grosser" 
  },
  { 
      text: "Your work is going to fill a large part of your life, and the only way to be truly satisfied is to do what you believe is great work.", 
      text_vi: "Công việc sẽ chiếm phần lớn cuộc đời bạn, cách duy nhất để thực sự hài lòng là làm những gì bạn tin là tuyệt vời.",
      author: "Steve Jobs" 
  }
];

export const SUGGESTION_PROMPTS = [
  { 
    id: 'strengths', 
    text_en: 'Identify my strengths', 
    text_vi: 'Tìm điểm mạnh của tôi',
    icon: Icons.Target,
    color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
  },
  { 
    id: 'passion', 
    text_en: 'Discover my passion', 
    text_vi: 'Khám phá đam mê',
    icon: Icons.Heart,
    color: 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400'
  },
  { 
    id: 'path', 
    text_en: 'Plan a career path', 
    text_vi: 'Lập lộ trình sự nghiệp',
    icon: Icons.TrendingUp,
    color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
  },
  { 
    id: 'explore', 
    text_en: 'Explore new industries', 
    text_vi: 'Khám phá ngành mới',
    icon: Icons.Compass,
    color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
  }
];

export const TRANSLATIONS = {
  [Language.EN]: {
    appName: 'Career Compass AI',
    tagline: 'Your AI Guide to a Fulfilling Career',
    getStarted: 'Get Started',
    login: 'Login',
    register: 'Register',
    guestLogin: 'Continue as Guest',
    email: 'Email Address',
    password: 'Password',
    forgotPassword: 'Forgot Password?',
    loginWithGoogle: 'Login with Google',
    or: 'or',
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: 'Already have an account?',
    chatMode: 'Chat Consultant',
    voiceMode: 'Live Consultation',
    profile: 'My Profile',
    welcomeBack: 'Welcome Back,',
    greeting: "I'm your AI career counselor. Ask me anything.",
    greetingSub: "I can help you identify strengths, explore passions, and plan your career path.",
    typeMessage: 'Type your career question...',
    startVoice: 'Start Live Conversation',
    endVoice: 'End Conversation',
    listening: 'Listening...',
    speaking: 'Speaking...',
    connecting: 'Connecting to Career Compass...',
    disconnecting: 'Disconnecting...',
    micPermission: 'Please allow microphone access to use voice mode.',
    error: 'An error occurred. Please try again.',
    hotIndustries: 'Trending Industries',
    dailyQuote: 'Daily Inspiration',
    chatHistory: 'Chat History',
    switchToVoice: 'Switch to Live Voice',
    newChat: 'New Chat',
    footerDisclaimer: 'AI can make mistakes. All information is for reference only, the decision is yours.',
    thinking: 'Career Compass is thinking...',
    profileName: 'Full Name',
    careerGoal: 'Career Goal',
    prefLang: 'Preferred Language',
    saveChanges: 'Save Changes',
    guestMode: 'Guest Mode',
    selectMic: 'Select Microphone',
    transcript: 'Live Transcript',
    systemInstruction: 'You are an expert career counselor named Career Compass. You help users with job search strategies, resume reviews, interview preparation, and career path planning. Be encouraging, professional, and practical. Keep responses concise unless asked for detail. IMPORTANT: You can use markdown bold syntax (**) to emphasize key points.',
    voiceSystemInstruction: 'You are an expert career counselor. Engage in a natural, spoken conversation. Keep your responses relatively short and conversational, as this is a real-time voice chat.'
  },
  [Language.VI]: {
    appName: 'Career Compass AI',
    tagline: 'Người dẫn đường AI cho sự nghiệp của bạn',
    getStarted: 'Bắt đầu ngay',
    login: 'Đăng nhập',
    register: 'Đăng ký',
    guestLogin: 'Tiếp tục với tư cách Khách',
    email: 'Địa chỉ Email',
    password: 'Mật khẩu',
    forgotPassword: 'Quên mật khẩu?',
    loginWithGoogle: 'Đăng nhập bằng Google',
    or: 'hoặc',
    dontHaveAccount: "Chưa có tài khoản?",
    alreadyHaveAccount: 'Đã có tài khoản?',
    chatMode: 'Trợ lý Chat',
    voiceMode: 'Hội thoại trực tiếp',
    profile: 'Hồ sơ cá nhân',
    welcomeBack: 'Chào mừng trở lại,',
    greeting: "Tôi là trợ lý hướng nghiệp AI của bạn. Hãy hỏi tôi bất cứ điều gì.",
    greetingSub: "Tôi có thể giúp bạn xác định điểm mạnh, khám phá đam mê và lập kế hoạch sự nghiệp.",
    typeMessage: 'Nhập câu hỏi của bạn...',
    startVoice: 'Bắt đầu cuộc gọi',
    endVoice: 'Kết thúc cuộc gọi',
    listening: 'Đang nghe...',
    speaking: 'Đang nói...',
    connecting: 'Đang kết nối...',
    disconnecting: 'Đang ngắt kết nối...',
    micPermission: 'Vui lòng cho phép truy cập micro.',
    error: 'Đã xảy ra lỗi. Vui lòng thử lại.',
    hotIndustries: 'Xu hướng nghề nghiệp',
    dailyQuote: 'Cảm Hứng Mỗi Ngày',
    chatHistory: 'Lịch sử trò chuyện',
    switchToVoice: 'Chuyển sang hội thoại',
    newChat: 'Cuộc trò chuyện mới',
    footerDisclaimer: 'AI có thể gây ra sai sót, mọi thông tin chỉ mang tính chất tham khảo, quyền quyết định thuộc về bạn.',
    thinking: 'Career Compass đang suy nghĩ...',
    profileName: 'Họ và tên',
    careerGoal: 'Mục tiêu sự nghiệp',
    prefLang: 'Ngôn ngữ ưu tiên',
    saveChanges: 'Lưu thay đổi',
    guestMode: 'Chế độ khách',
    selectMic: 'Chọn Micro',
    transcript: 'Hội thoại trực tiếp',
    systemInstruction: 'Bạn là chuyên gia tư vấn nghề nghiệp tên là Career Compass. Bạn giúp người dùng về chiến lược tìm việc, đánh giá hồ sơ năng lực (CV), chuẩn bị phỏng vấn và lập kế hoạch lộ trình sự nghiệp. Hãy khuyến khích, chuyên nghiệp và thực tế. Giữ câu trả lời ngắn gọn trừ khi được yêu cầu chi tiết. QUAN TRỌNG: Bạn có thể sử dụng định dạng in đậm markdown (**) để nhấn mạnh các ý chính.',
    voiceSystemInstruction: 'Bạn là chuyên gia tư vấn nghề nghiệp. Hãy tham gia vào cuộc trò chuyện tự nhiên bằng giọng nói. Giữ câu trả lời tương đối ngắn gọn và mang tính đàm thoại vì đây là cuộc trò chuyện trực tiếp.'
  }
};