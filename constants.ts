import { Language } from './types';

export const AVATARS = [
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Pepper",
  "https://api.dicebear.com/7.x/micah/svg?seed=George",
  "https://api.dicebear.com/7.x/notionists/svg?seed=Molly",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Tech",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Sasha",
  "https://api.dicebear.com/7.x/open-peeps/svg?seed=Alex",
  "https://api.dicebear.com/7.x/miniavs/svg?seed=Jace",
  "https://api.dicebear.com/7.x/big-ears/svg?seed=Oliver",
  "https://api.dicebear.com/7.x/micah/svg?seed=Willow",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe",
  "https://api.dicebear.com/7.x/notionists/svg?seed=Leo",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Chloe",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Max",
  "https://api.dicebear.com/7.x/open-peeps/svg?seed=Sam",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Robot01",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Happy",
  "https://api.dicebear.com/7.x/thumbs/svg?seed=Buddy",
  "https://api.dicebear.com/7.x/personas/svg?seed=Maria"
];

// Updated to Object for localization
export const CAREER_TAGS = [
  { en: "Software Engineer", vi: "Kỹ sư phần mềm" },
  { en: "Data Scientist", vi: "Khoa học dữ liệu" },
  { en: "Product Manager", vi: "Quản lý sản phẩm" },
  { en: "UX Designer", vi: "Thiết kế UX/UI" },
  { en: "Digital Marketing", vi: "Tiếp thị số" },
  { en: "Cybersecurity", vi: "An ninh mạng" },
  { en: "Blockchain Dev", vi: "Lập trình Blockchain" },
  { en: "AI Specialist", vi: "Chuyên gia AI" },
  { en: "Cloud Architect", vi: "Kiến trúc sư đám mây" },
  { en: "Content Creator", vi: "Sáng tạo nội dung" },
  { en: "Growth Hacker", vi: "Tăng trưởng số" },
  { en: "DevOps Engineer", vi: "Kỹ sư DevOps" }
];

export const HOT_INDUSTRIES = [
  { 
    id: 1, 
    name_en: "Artificial Intelligence", 
    name_vi: "Trí tuệ nhân tạo (AI)", 
    desc_en: "The driving force of the future. Roles in ML, NLP, and Data are booming.", 
    desc_vi: "Động lực của tương lai. Các vai trò về ML, NLP và Dữ liệu đang bùng nổ.", 
    color: "from-blue-500 to-indigo-600",
    icon: "Cpu"
  },
  { 
    id: 2, 
    name_en: "Green Energy & Sustainability", 
    name_vi: "Năng lượng xanh & Bền vững", 
    desc_en: "Fighting climate change with tech. High demand for engineers and analysts.", 
    desc_vi: "Chống biến đổi khí hậu bằng công nghệ. Nhu cầu cao về kỹ sư và nhà phân tích.", 
    color: "from-emerald-400 to-teal-600",
    icon: "Leaf"
  },
  { 
    id: 3, 
    name_en: "Cybersecurity", 
    name_vi: "An ninh mạng", 
    desc_en: "Protecting the digital world. Critical shortage of skilled defenders.", 
    desc_vi: "Bảo vệ thế giới số. Sự thiếu hụt trầm trọng các chuyên gia bảo mật.", 
    color: "from-red-500 to-rose-600",
    icon: "Shield"
  },
  { 
    id: 4, 
    name_en: "Digital Health (HealthTech)", 
    name_vi: "Y tế kỹ thuật số", 
    desc_en: "Telemedicine and BioTech are revolutionizing patient care.", 
    desc_vi: "Khám chữa bệnh từ xa và Công nghệ sinh học đang cách mạng hóa việc chăm sóc bệnh nhân.", 
    color: "from-cyan-400 to-blue-600",
    icon: "Activity"
  },
  { 
    id: 5, 
    name_en: "Fintech & Blockchain", 
    name_vi: "Công nghệ tài chính", 
    desc_en: "Reshaping banking, payments, and decentralized finance.", 
    desc_vi: "Định hình lại ngân hàng, thanh toán và tài chính phi tập trung.", 
    color: "from-violet-500 to-purple-600",
    icon: "CreditCard"
  },
  { 
    id: 6, 
    name_en: "EdTech & E-Learning", 
    name_vi: "Công nghệ giáo dục", 
    desc_en: "Remote learning is here to stay. Opportunities in instructional design and dev.", 
    desc_vi: "Học tập từ xa đang phát triển mạnh. Cơ hội trong thiết kế bài giảng và lập trình.", 
    color: "from-amber-400 to-orange-600",
    icon: "BookOpen"
  }
];

export const CAREER_QUOTES = [
  { text: "Choose a job you love, and you will never have to work a day in your life.", text_vi: "Hãy chọn công việc bạn yêu thích, và bạn sẽ không bao giờ phải làm việc một ngày nào trong đời.", author: "Confucius" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", text_vi: "Tương lai thuộc về những ai tin vào vẻ đẹp của giấc mơ của mình.", author: "Eleanor Roosevelt" },
  { text: "Opportunities don't happen, you create them.", text_vi: "Cơ hội không tự đến, bạn phải tạo ra chúng.", author: "Chris Grosser" },
  { text: "Your work is going to fill a large part of your life, and the only way to be truly satisfied is to do what you believe is great work.", text_vi: "Công việc sẽ chiếm phần lớn cuộc đời bạn, cách duy nhất để thực sự hài lòng là làm những gì bạn tin là tuyệt vời.", author: "Steve Jobs" }
];

export const SUGGESTION_PROMPTS = [
  { id: 'strengths', text_en: 'Identify my strengths', text_vi: 'Tìm điểm mạnh của tôi', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
  { id: 'passion', text_en: 'Discover my passion', text_vi: 'Khám phá đam mê', color: 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400' },
  { id: 'path', text_en: 'Plan a career path', text_vi: 'Lập lộ trình sự nghiệp', color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' },
  { id: 'explore', text_en: 'Explore new industries', text_vi: 'Khám phá ngành mới', color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' }
];

export const TRANSLATIONS = {
  [Language.EN]: {
    appName: 'Career Compass AI', tagline: 'Career guidance for everyone.', subTagline: 'Pause or cancel your confusion anytime. Available 24/7.', getStarted: 'Get Started', login: 'Login', register: 'Register', guestLogin: 'Try as Guest', email: 'Email Address', password: 'Password', forgotPassword: 'Forgot Password?', loginWithGoogle: 'Login with Google', or: 'or', dontHaveAccount: "Don't have an account?", alreadyHaveAccount: 'Already have an account?', chatMode: 'Chat Consultant', voiceMode: 'Live Consultation', profile: 'My Profile', welcomeBack: 'Welcome Back,', greeting: "I'm your AI career counselor. Ask me anything.", greetingSub: "I can help you identify strengths, explore passions, and plan your career path.", typeMessage: 'Type your career question...', startVoice: 'Start Live Conversation', endVoice: 'End Conversation', listening: 'Listening...', speaking: 'Speaking...', connecting: 'Connecting to Career Compass...', disconnecting: 'Disconnecting...', micPermission: 'Please allow microphone access to use voice mode.', error: 'An error occurred. Please try again.', hotIndustries: 'Trending Industries', dailyQuote: 'Daily Inspiration', chatHistory: 'Chat History', switchToVoice: 'Switch to Live Voice', newChat: 'New Chat', footerDisclaimer: 'AI can make mistakes. All information is for reference only, the decision is yours.', thinking: 'Thinking...', profileName: 'Full Name', careerGoal: 'Career Goal', prefLang: 'Preferred Language', saveChanges: 'Save Changes', guestMode: 'Guest Mode', selectMic: 'Select Microphone', transcript: 'Live Transcript',
    
    // Auth - Forgot Password
    resetPasswordTitle: 'Reset Password',
    resetPasswordDesc: 'Enter your email address and we will send you instructions to reset your password.',
    sendLink: 'Send Reset Link',
    backToLogin: 'Back to Login',
    linkSent: 'Success! Please check your email for the reset link.',

    // AI Config
    aiConfigTitle: 'AI Model Configuration (Advanced)',
    aiProvider: 'AI Provider',
    providerGemini: 'Google Gemini',
    providerCustom: 'Custom (Self-Hosted)',
    endpointUrl: 'Endpoint URL (OpenAI Compatible)',
    endpointNote: 'Compatible with Ollama, vLLM, or LM Studio.',
    modelName: 'Model Name',

    // New Translations
    heroBadge: 'AI-Powered Guidance',
    heroTitlePrefix: 'Career clarity for ',
    heroTitleSuffix: 'everyone',
    hotIndustriesTitle: 'Future-Proof Your Career',
    hotIndustriesSub: 'Discover high-growth industries where our AI can help you navigate and land your dream role.',
    
    // Feature Translations - UPDATED
    featureVoiceTitle: 'Direct 1-on-1 Consultation',
    featureVoiceDesc: 'Voice chat with AI just like a real academic advisor. Get instant feedback and personalized guidance.',
    feature247Title: 'Always Available',
    feature247Desc: 'No appointments. No waiting. Career advice whenever you need it.',
    featureScanTitle: 'Resume Scan',
    featureScanDesc: 'AI-powered analysis to beat the ATS systems and highlight your strengths.',
    featureRoadmapTitle: 'Personalized Roadmap',
    featureRoadmapDesc: 'From exploring passions to landing the offer, we map out every step specifically for you.',
    featureHeader: 'The way career guidance',
    featureHeaderHighlight: 'should',
    featureHeaderSuffix: 'have always been.',
    featureSub: 'One platform replacing expensive counselors and scattered Google searches.',
    
    systemInstruction: 'You are an expert career counselor named Career Compass. You help users with job search strategies, resume reviews, interview preparation, and career path planning. Be encouraging, professional, and practical. Keep responses concise unless asked for detail. IMPORTANT: You can use markdown bold syntax (**) to emphasize key points.',
    voiceSystemInstruction: 'You are an expert career counselor. Engage in a natural, spoken conversation. Keep your responses relatively short and conversational, as this is a real-time voice chat.'
  },
  [Language.VI]: {
    appName: 'Career Compass AI', tagline: 'Hướng nghiệp cho mọi người.', subTagline: 'Xóa tan mọi sự bối rối về sự nghiệp. Sẵn sàng 24/7.', getStarted: 'Bắt đầu ngay', login: 'Đăng nhập', register: 'Đăng ký', guestLogin: 'Dùng thử ngay', email: 'Địa chỉ Email', password: 'Mật khẩu', forgotPassword: 'Quên mật khẩu?', loginWithGoogle: 'Đăng nhập bằng Google', or: 'hoặc', dontHaveAccount: "Chưa có tài khoản?", alreadyHaveAccount: 'Đã có tài khoản?', chatMode: 'Trợ lý Chat', voiceMode: 'Hội thoại trực tiếp', profile: 'Hồ sơ cá nhân', welcomeBack: 'Chào mừng trở lại,', greeting: "Tôi là trợ lý hướng nghiệp AI của bạn. Hãy hỏi tôi bất cứ điều gì.", greetingSub: "Tôi có thể giúp bạn xác định điểm mạnh, khám phá đam mê và lập kế hoạch sự nghiệp.", typeMessage: 'Nhập câu hỏi của bạn...', startVoice: 'Bắt đầu cuộc gọi', endVoice: 'Kết thúc cuộc gọi', listening: 'Đang nghe...', speaking: 'Đang nói...', connecting: 'Đang kết nối...', disconnecting: 'Đang ngắt kết nối...', micPermission: 'Vui lòng cho phép truy cập micro.', error: 'Đã xảy ra lỗi. Vui lòng thử lại.', hotIndustries: 'Xu hướng nghề nghiệp', dailyQuote: 'Cảm Hứng Mỗi Ngày', chatHistory: 'Lịch sử trò chuyện', switchToVoice: 'Chuyển sang hội thoại', newChat: 'Cuộc trò chuyện mới', footerDisclaimer: 'AI có thể gây ra sai sót, mọi thông tin chỉ mang tính chất tham khảo, quyền quyết định thuộc về bạn.', thinking: 'Đang suy nghĩ...', profileName: 'Họ và tên', careerGoal: 'Mục tiêu sự nghiệp', prefLang: 'Ngôn ngữ ưu tiên', saveChanges: 'Lưu thay đổi', guestMode: 'Chế độ khách', selectMic: 'Chọn Micro', transcript: 'Hội thoại trực tiếp',
    
    // Auth - Forgot Password
    resetPasswordTitle: 'Đặt lại Mật khẩu',
    resetPasswordDesc: 'Nhập địa chỉ email của bạn và chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.',
    sendLink: 'Gửi liên kết',
    backToLogin: 'Quay lại đăng nhập',
    linkSent: 'Thành công! Vui lòng kiểm tra email của bạn để lấy liên kết.',

    // AI Config
    aiConfigTitle: 'Cấu hình Mô hình AI (Nâng cao)',
    aiProvider: 'Nhà cung cấp AI',
    providerGemini: 'Google Gemini',
    providerCustom: 'Tùy chỉnh (Tự lưu trữ)',
    endpointUrl: 'Đường dẫn Endpoint (Tương thích OpenAI)',
    endpointNote: 'Tương thích với Ollama, vLLM, hoặc LM Studio.',
    modelName: 'Tên Mô hình',

    // New Translations
    heroBadge: 'Định hướng bằng AI',
    heroTitlePrefix: 'Định hướng cho ',
    heroTitleSuffix: 'mọi người',
    hotIndustriesTitle: 'Đón Đầu Tương Lai',
    hotIndustriesSub: 'Khám phá các ngành nghề tăng trưởng cao, nơi AI của chúng tôi có thể giúp bạn định hướng và tìm được công việc mơ ước.',

    // Feature Translations - UPDATED
    featureVoiceTitle: 'Tư vấn 1-1 Trực tiếp',
    featureVoiceDesc: 'Trò chuyện thoại với AI như một cố vấn học tập thực thụ. Nhận phản hồi và định hướng ngay lập tức.',
    feature247Title: 'Luôn sẵn sàng 24/7',
    feature247Desc: 'Không cần đặt hẹn. Không phải chờ đợi. Lời khuyên sự nghiệp bất cứ khi nào bạn cần.',
    featureScanTitle: 'Phân tích Hồ sơ (CV)',
    featureScanDesc: 'Phân tích bằng AI để vượt qua hệ thống ATS và làm nổi bật điểm mạnh của bạn.',
    featureRoadmapTitle: 'Lộ trình Cá nhân hóa',
    featureRoadmapDesc: 'Từ việc khám phá đam mê đến khi nhận được lời mời làm việc, chúng tôi vạch ra từng bước dành riêng cho bạn.',
    featureHeader: 'Cách hướng nghiệp',
    featureHeaderHighlight: 'nên',
    featureHeaderSuffix: 'được thực hiện từ lâu.',
    featureSub: 'Một nền tảng thay thế các chuyên gia đắt đỏ và việc tìm kiếm thông tin rời rạc.',

    systemInstruction: 'Bạn là chuyên gia tư vấn nghề nghiệp tên là Career Compass. Bạn giúp người dùng về chiến lược tìm việc, đánh giá hồ sơ năng lực (CV), chuẩn bị phỏng vấn và lập kế hoạch lộ trình sự nghiệp. Hãy khuyến khích, chuyên nghiệp và thực tế. Giữ câu trả lời ngắn gọn trừ khi được yêu cầu chi tiết. QUAN TRỌNG: Bạn có thể sử dụng định dạng in đậm markdown (**) để nhấn mạnh các ý chính.',
    voiceSystemInstruction: 'Bạn là chuyên gia tư vấn nghề nghiệp. Hãy tham gia vào cuộc trò chuyện tự nhiên bằng giọng nói. Giữ câu trả lời tương đối ngắn gọn và mang tính đàm thoại vì đây là cuộc trò chuyện trực tiếp.'
  }
};