
import { Language } from './types';

export const AVATARS = [
  "https://robohash.org/Felix.png?set=set5&bgset=bg1",
  "https://robohash.org/Aneka.png?set=set5&bgset=bg1",
  "https://robohash.org/Pepper.png?set=set5&bgset=bg1",
  "https://robohash.org/George.png?set=set5&bgset=bg1",
  "https://robohash.org/Molly.png?set=set5&bgset=bg1",
  "https://robohash.org/Tech.png?set=set5&bgset=bg1",
  "https://robohash.org/Sasha.png?set=set5&bgset=bg1",
  "https://robohash.org/Alex.png?set=set5&bgset=bg1",
  "https://robohash.org/Jace.png?set=set5&bgset=bg1",
  "https://robohash.org/Oliver.png?set=set5&bgset=bg1",
  "https://robohash.org/Willow.png?set=set5&bgset=bg1",
  "https://robohash.org/Zoe.png?set=set5&bgset=bg1",
  "https://robohash.org/Leo.png?set=set5&bgset=bg1",
  "https://robohash.org/Chloe.png?set=set5&bgset=bg1",
  "https://robohash.org/Max.png?set=set5&bgset=bg1",
  "https://robohash.org/Sam.png?set=set5&bgset=bg1",
  "https://robohash.org/Robot01.png?set=set5&bgset=bg1",
  "https://robohash.org/Happy.png?set=set5&bgset=bg1",
  "https://robohash.org/Buddy.png?set=set5&bgset=bg1",
  "https://robohash.org/Maria.png?set=set5&bgset=bg1",
  "https://robohash.org/Jack.png?set=set5&bgset=bg1",
  "https://robohash.org/Sarah.png?set=set5&bgset=bg1",
  "https://robohash.org/David.png?set=set5&bgset=bg1",
  "https://robohash.org/Emma.png?set=set5&bgset=bg1",
  "https://robohash.org/Bot2.png?set=set5&bgset=bg1",
  "https://robohash.org/Lily.png?set=set5&bgset=bg1",
  "https://robohash.org/Tom.png?set=set5&bgset=bg1",
  "https://robohash.org/Mia.png?set=set5&bgset=bg1",
  "https://robohash.org/Noah.png?set=set5&bgset=bg1",
  "https://robohash.org/Olivia.png?set=set5&bgset=bg1"
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
  },
  { 
    id: 7, 
    name_en: "Semiconductor Industry", 
    name_vi: "Công nghiệp Bán dẫn", 
    desc_en: "The brain of every electronic device. Vietnam is becoming a global hub.", 
    desc_vi: "Bộ não của mọi thiết bị điện tử. Việt Nam đang trở thành trung tâm toàn cầu.", 
    color: "from-indigo-500 to-blue-700",
    icon: "Cpu"
  }
];

export const CAREER_QUOTES = [
  { text: "Choose a job you love, and you will never have to work a day in your life.", text_vi: "Hãy chọn công việc bạn yêu thích, và bạn sẽ không bao giờ phải làm việc một ngày nào trong đời.", author: "Confucius" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", text_vi: "Tương lai thuộc về những ai tin vào vẻ đẹp của giấc mơ của mình.", author: "Eleanor Roosevelt" },
  { text: "Opportunities don't happen, you create them.", text_vi: "Cơ hội không tự đến, bạn phải tạo ra chúng.", author: "Chris Grosser" },
  { text: "Your work is going to fill a large part of your life, and the only way to be truly satisfied is to do what you believe is great work.", text_vi: "Công việc sẽ chiếm phần lớn cuộc đời bạn, cách duy nhất để thực sự hài lòng là làm những gì bạn tin là tuyệt vời.", author: "Steve Jobs" }
];

export const SUGGESTION_PROMPTS = {
  [Language.EN]: [
    { title: 'Identify Strengths', prompt: 'Can you help me identify my core strengths and how they apply to a career?', icon: 'Activity' },
    { title: 'Discover Passion', prompt: 'I am not sure what I am passionate about. How can I discover my true interests?', icon: 'Heart' },
    { title: 'Career Roadmap', prompt: 'I want to become a Software Engineer. Can you create a 3-month roadmap for me?', icon: 'Target' },
    { title: 'Explore Industries', prompt: 'What are the top trending industries in Vietnam right now for high school graduates?', icon: 'Compass' }
  ],
  [Language.VI]: [
    { title: 'Tìm điểm mạnh', prompt: 'Bạn có thể giúp tôi xác định các điểm mạnh cốt lõi và cách áp dụng chúng vào sự nghiệp không?', icon: 'Activity' },
    { title: 'Khám phá đam mê', prompt: 'Tôi không chắc mình đam mê điều gì. Làm thế nào để tôi khám phá được sở thích thực sự của mình?', icon: 'Heart' },
    { title: 'Lộ trình sự nghiệp', prompt: 'Tôi muốn trở thành Kỹ sư phần mềm. Bạn có thể lập lộ trình 3 tháng cho tôi không?', icon: 'Target' },
    { title: 'Khám phá ngành nghề', prompt: 'Những ngành nghề nào đang là xu hướng hàng đầu tại Việt Nam hiện nay cho học sinh tốt nghiệp THPT?', icon: 'Compass' }
  ]
};

export const TRANSLATIONS = {
  [Language.EN]: {
    appName: 'Career Compass AI', home: 'Home', tagline: 'Career guidance for everyone.', subTagline: 'Pause or cancel your confusion anytime. Available 24/7.', getStarted: 'Get Started', login: 'Login', register: 'Register', guestLogin: 'Try as Guest', email: 'Email Address', password: 'Password', forgotPassword: 'Forgot Password?', loginWithGoogle: 'Login with Google', or: 'or', dontHaveAccount: "Don't have an account?", alreadyHaveAccount: 'Already have an account?', chatMode: 'Chat Consultant', voiceMode: 'Live Consultation', welcomeBack: 'Welcome Back,', greeting: "How can I help you today?", greetingSub: "Ask me about careers, majors, or RIASEC results.", typeMessage: 'Type your career question...', startVoice: 'Start Live Conversation', endVoice: 'End Conversation', listening: 'Listening...', speaking: 'Speaking...', connecting: 'Connecting to Career Compass...', disconnecting: 'Disconnecting...', micPermission: 'Mic access required', readyToConnect: 'Ready to connect', error: 'An error occurred. Please try again.', hotIndustries: 'Trending Industries', dailyQuote: 'Daily Inspiration', chatHistory: 'Chat History', switchToVoice: 'Switch to Live Voice', newChat: 'New Chat', footerDisclaimer: 'AI can make mistakes. All information is for reference only, the decision is yours.', thinking: 'Thinking...', saveChanges: 'Save Changes', guestMode: 'Guest Mode', selectMic: 'Select Microphone', transcript: 'Live Transcript', aiBusy: 'The AI is currently busy due to high demand. Please wait a moment and try again.',
    
    // Auth - Forgot Password
    resetPasswordTitle: 'Reset Password',
    resetPasswordDesc: 'Enter your email address and we will send you instructions to reset your password.',
    sendLink: 'Send Reset Link',
    backToLogin: 'Back to Login',
    linkSent: 'Success! Please check your email for the reset link.',

    // AI Config
    aiConfigTitle: 'AI Model Configuration',
    aiProvider: 'AI Provider',
    providerGemini: 'Google Gemini',
    providerCustom: 'Custom (OpenAI)',
    providerN8N: 'n8n Workflow',
    endpointUrl: 'Endpoint URL',
    n8nWebhookUrl: 'n8n Webhook URL (POST)',
    endpointNote: 'Compatible with Ollama, vLLM, or LM Studio.',
    n8nNote: 'Requires a Webhook node (POST) returning a JSON property "output" or "text".',
    modelName: 'Model Name',
    
    // New Translations
    chatPlaceholder: 'Ask me anything about your career...',
    heroBadge: 'AI-Powered Guidance',
    heroTitlePrefix: 'Career clarity for ',
    heroTitleSuffix: 'everyone',
    hotIndustriesTitle: 'Future-Proof Your Career',
    hotIndustriesSub: 'Discover high-growth industries where our AI can help you navigate and land your dream role.',
    vnLaborMarketTitle: 'VN Labor Market 2024-2025',
    vnLaborMarketDesc: 'High demand for skilled talent in Tech (AI, Semiconductor), Logistics, and Renewable Energy is skyrocketing.',
    careerQuizTitle: 'Career Quiz',
    careerQuizDesc: 'Discover your career personality group (RIASEC) in just 2 minutes.',
    accuracyRate: 'AI Accuracy Rate',
    userCount: 'Trusted Users',
    activeSessions: '24h Sessions',
    accuracyValue: '98.5%',
    userValue: '12,500+',
    sessionValue: '1,240',
    continueJourney: 'Ready to continue your journey,',
    goToDashboard: 'Go to Dashboard',
    guestSession: 'Guest Session',
    logout: 'Logout',
    searchChats: 'Search chats...',
    collapseSidebar: 'Collapse sidebar',
    expandSidebar: 'Expand sidebar',
    discussWithAI: 'Discuss result with AI',
    progress: 'Progress',
    streakTooltip: '{{streak}} day streak!',
    
    // Feature Translations - UPDATED
    featureVoiceTitle: 'Direct 1-on-1 Consultation',
    featureVoiceDesc: 'Voice chat with AI just like a real academic advisor. Get instant feedback and personalized guidance.',
    feature247Title: 'Always Available',
    feature247Desc: 'No appointments. No waiting. Career advice whenever you need it.',
    featureScanTitle: 'Academic Profile Analysis',
    featureScanDesc: 'AI-powered analysis of your grades and activities to suggest the best academic tracks.',
    featureRoadmapTitle: 'Personalized Roadmap',
    featureRoadmapDesc: 'From identifying your strengths to choosing the right major, we map out every step specifically for you.',
    featureHeader: 'The way career guidance',
    featureHeaderHighlight: 'should',
    featureHeaderSuffix: 'have always been.',
    featureSub: 'One platform replacing expensive counselors and scattered Google searches.',
    
    systemInstruction: 'You are an expert career counselor for high school students named Career Compass. Your mission is to help students identify their strengths, choose the right academic tracks (khối thi), majors, and universities in Vietnam. You should also help them create a 3-month action plan to achieve their career goals. ONLY when the user explicitly requests a roadmap, a plan, or asks to update their progress board, you should provide a structured roadmap by outputting a JSON block like this: ```json [{"id": "1", "title": "Step 1", "description": "Details", "status": "todo"}] ```. Do NOT include this JSON block in normal conversation unless specifically requested. Encourage the user to sync this to their board to track their progress. Be professional, encouraging, and concise. If the user shares a RIASEC profile, use it for personalized suggestions. Use English and Vietnamese only.',
    voiceSystemInstruction: 'You are an expert career counselor for high school students. Engage in a natural, friendly, and encouraging conversation. Keep responses short and focused on academic and career orientation. Use English and Vietnamese only.',
    
    // Terms of Service
    termsTitle: 'Terms of Service & Disclaimer',
    terms1: '1. Acceptance of Terms:',
    terms1Desc: 'By using Career Compass AI, you agree to these terms.',
    terms2: '2. AI Limitations:',
    terms2Desc: 'The career advice provided is generated by Artificial Intelligence. It may contain errors, inaccuracies, or outdated information.',
    terms3: '3. No Professional Liability:',
    terms3Desc: 'This tool is for educational and informational purposes only. It does not replace professional career counseling, legal, or financial advice.',
    terms4: '4. Data Privacy:',
    terms4Desc: 'We respect your privacy. Uploaded images and chat logs are processed securely but please avoid sharing highly sensitive personal information.',
    terms5: '5. User Responsibility:',
    terms5Desc: 'You are solely responsible for any decisions made based on the AI\'s suggestions.',
    termsAccept: 'I Understand & Got It'
  },
  [Language.VI]: {
    appName: 'Career Compass AI', home: 'Trang chủ', tagline: 'Hướng nghiệp cho mọi người.', subTagline: 'Xóa tan mọi sự bối rối về sự nghiệp. Sẵn sàng 24/7.', getStarted: 'Bắt đầu ngay', login: 'Đăng nhập', register: 'Đăng ký', guestLogin: 'Dùng thử ngay', email: 'Địa chỉ Email', password: 'Mật khẩu', forgotPassword: 'Quên mật khẩu?', loginWithGoogle: 'Đăng nhập bằng Google', or: 'hoặc', dontHaveAccount: "Chưa có tài khoản?", alreadyHaveAccount: 'Đã có tài khoản?', chatMode: 'Trợ lý Chat', voiceMode: 'Hội thoại trực tiếp', welcomeBack: 'Chào mừng trở lại,', greeting: "Tôi có thể giúp gì cho bạn?", greetingSub: "Hỏi tôi về nghề nghiệp, ngành học hoặc kết quả RIASEC.", typeMessage: 'Nhập câu hỏi của bạn...', startVoice: 'Bắt đầu cuộc gọi', endVoice: 'Kết thúc cuộc gọi', listening: 'Đang nghe...', speaking: 'Đang nói...', connecting: 'Đang kết nối...', disconnecting: 'Đang ngắt kết nối...', micPermission: 'Cần cấp quyền micro', readyToConnect: 'Sẵn sàng kết nối', error: 'Đã xảy ra lỗi. Vui lòng thử lại.', hotIndustries: 'Xu hướng nghề nghiệp', dailyQuote: 'Cảm Hứng Mỗi Ngày', chatHistory: 'Lịch sử trò chuyện', switchToVoice: 'Chuyển sang hội thoại', newChat: 'Cuộc trò chuyện mới', footerDisclaimer: 'AI có thể gây ra sai sót, mọi thông tin chỉ mang tính chất tham khảo, quyền quyết định thuộc về bạn.', thinking: 'Đang suy nghĩ...', saveChanges: 'Lưu thay đổi', guestMode: 'Chế độ khách', selectMic: 'Chọn Micro', transcript: 'Hội thoại trực tiếp', aiBusy: 'Hệ thống AI đang bận do lượng yêu cầu cao. Vui lòng đợi giây lát và thử lại.',
    
    // Auth - Forgot Password
    resetPasswordTitle: 'Đặt lại Mật khẩu',
    resetPasswordDesc: 'Nhập địa chỉ email của bạn và chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.',
    sendLink: 'Gửi liên kết',
    backToLogin: 'Quay lại đăng nhập',
    linkSent: 'Thành công! Vui lòng kiểm tra email của bạn để lấy liên kết.',

    // AI Config
    aiConfigTitle: 'Cấu hình Mô hình AI',
    aiProvider: 'Nhà cung cấp AI',
    providerGemini: 'Google Gemini',
    providerCustom: 'Tùy chỉnh (OpenAI)',
    providerN8N: 'n8n Workflow',
    endpointUrl: 'Đường dẫn Endpoint',
    n8nWebhookUrl: 'n8n Webhook URL (POST)',
    endpointNote: 'Tương thích với Ollama, vLLM, hoặc LM Studio.',
    n8nNote: 'Yêu cầu Webhook (POST) trả về JSON có thuộc tính "output" hoặc "text".',
    modelName: 'Tên Mô hình',
    
    // New Translations
    chatPlaceholder: 'Hỏi tôi bất cứ điều gì về sự nghiệp của bạn...',
    heroBadge: 'Định hướng bằng AI',
    heroTitlePrefix: 'Định hướng cho ',
    heroTitleSuffix: 'mọi người',
    hotIndustriesTitle: 'Đón Đầu Tương Lai',
    hotIndustriesSub: 'Khám phá các ngành nghề tăng trưởng cao tại Việt Nam, nơi AI của chúng mình có thể giúp bạn định hướng và tìm được công việc mơ ước.',
    vnLaborMarketTitle: 'Thị Trường Lao Động VN 2024-2025',
    vnLaborMarketDesc: 'Nhu cầu nhân lực chất lượng cao trong mảng Công nghệ (AI, Bán dẫn), Logistics và Năng lượng tái tạo đang tăng vọt.',
    careerQuizTitle: 'Trắc Nghiệm Nghề Nghiệp',
    careerQuizDesc: 'Khám phá nhóm tính cách nghề nghiệp của bạn (RIASEC) chỉ trong 2 phút.',
    accuracyRate: 'Tỉ lệ chính xác AI',
    userCount: 'Người dùng tin tưởng',
    activeSessions: 'Phiên tư vấn 24h',
    accuracyValue: '98.5%',
    userValue: '12,500+',
    sessionValue: '1,240',
    continueJourney: 'Sẵn sàng tiếp tục hành trình,',
    goToDashboard: 'Vào Dashboard',
    guestSession: 'Phiên Khách',
    logout: 'Đăng xuất',
    chooseAvatar: 'Chọn Ảnh Đại Diện',
    randomAvatar: 'Ảnh Ngẫu Nhiên',
    searchChats: 'Tìm kiếm cuộc trò chuyện...',
    collapseSidebar: 'Thu gọn thanh bên',
    expandSidebar: 'Mở rộng thanh bên',
    discussWithAI: 'Thảo luận kết quả với AI',
    progress: 'Tiến độ',
    streakTooltip: 'Chuỗi {{streak}} ngày hoàn thành nhiệm vụ!',
    
    // Feature Translations - UPDATED
    featureVoiceTitle: 'Tư vấn 1-1 Trực tiếp',
    featureVoiceDesc: 'Trò chuyện thoại với AI như một cố vấn học tập thực thụ. Nhận phản hồi và định hướng ngay lập tức.',
    feature247Title: 'Luôn sẵn sàng 24/7',
    feature247Desc: 'Không cần đặt hẹn. Không phải chờ đợi. Lời khuyên sự nghiệp bất cứ khi nào bạn cần.',
    featureScanTitle: 'Phân tích Hồ sơ học tập',
    featureScanDesc: 'Phân tích điểm số và hoạt động ngoại khóa bằng AI để gợi ý khối thi và ngành học phù hợp.',
    featureRoadmapTitle: 'Lộ trình Cá nhân hóa',
    featureRoadmapDesc: 'Từ việc xác định thế mạnh đến việc chọn ngành học, chúng tôi vạch ra lộ trình dành riêng cho bạn.',
    featureHeader: 'Cách hướng nghiệp',
    featureHeaderHighlight: 'nên',
    featureHeaderSuffix: 'được thực hiện từ lâu.',
    featureSub: 'Một nền tảng thay thế các chuyên gia đắt đỏ và việc tìm kiếm thông tin rời rạc.',

    systemInstruction: 'Bạn là chuyên gia tư vấn hướng nghiệp dành riêng cho học sinh THPT tên là Career Compass. Nhiệm vụ của bạn là giúp học sinh xác định thế mạnh, chọn khối thi, ngành học và trường đại học phù hợp tại Việt Nam. Bạn cũng cần hỗ trợ học sinh lập kế hoạch hành động cụ thể trong 3 tháng tới để đạt được mục tiêu nghề nghiệp. CHỈ khi người dùng yêu cầu lập lộ trình, kế hoạch hoặc yêu cầu cập nhật bảng tiến độ, bạn mới cung cấp lộ trình dưới dạng khối JSON như sau: ```json [{"id": "1", "title": "Bước 1", "description": "Chi tiết", "status": "todo"}] ```. KHÔNG bao gồm khối JSON này trong các cuộc trò chuyện thông thường trừ khi được yêu cầu cụ thể. Hãy trả lời chuyên nghiệp, khích lệ và súc tích. Nếu có kết quả RIASEC, hãy dựa vào đó để tư vấn. CHỈ sử dụng tiếng Anh và tiếng Việt.',
    voiceSystemInstruction: 'Bạn là chuyên gia tư vấn hướng nghiệp cho học sinh THPT. Hãy trò chuyện tự nhiên, thân thiện, khích lệ và ngắn gọn. CHỈ sử dụng tiếng Anh và tiếng Việt.',

    // Terms of Service
    termsTitle: 'Điều khoản Dịch vụ & Tuyên bố miễn trừ trách nhiệm',
    terms1: '1. Chấp nhận Điều khoản:',
    terms1Desc: 'Bằng cách sử dụng Career Compass AI, bạn đồng ý với các điều khoản này.',
    terms2: '2. Hạn chế của AI:',
    terms2Desc: 'Lời khuyên nghề nghiệp được cung cấp bởi Trí tuệ Nhân tạo. Nó có thể chứa lỗi, thông tin không chính xác hoặc lỗi thời.',
    terms3: '3. Không chịu trách nhiệm chuyên môn:',
    terms3Desc: 'Công cụ này chỉ dành cho mục đích giáo dục và cung cấp thông tin. Nó không thay thế cho tư vấn nghề nghiệp, pháp lý hoặc tài chính chuyên nghiệp.',
    terms4: '4. Quyền riêng tư dữ liệu:',
    terms4Desc: 'Chúng tôi tôn trọng quyền riêng tư của bạn. Hình ảnh tải lên và nhật ký trò chuyện được xử lý an toàn nhưng vui lòng tránh chia sẻ thông tin cá nhân quá nhạy cảm.',
    terms5: '5. Trách nhiệm của người dùng:',
    terms5Desc: 'Bạn hoàn toàn chịu trách nhiệm về bất kỳ quyết định nào được đưa ra dựa trên các đề xuất của AI.',
    termsAccept: 'Tôi Đã Hiểu & Đồng Ý'
  }
};
