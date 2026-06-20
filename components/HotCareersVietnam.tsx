import React, { useState } from 'react';
import { motion } from 'motion/react';
import { InlineGuide } from './InlineGuide';

interface HotJob {
  id: string;
  title_vi: string;
  title_en: string;
  category: string;
  salary: string;
  growth: string;
  description: string;
  skills: string[];
  education: string;
  outlook: 'high' | 'very-high' | 'stable';
}

const JOBS_VIETNAM: HotJob[] = [
  {
    id: 'ai-engineer',
    title_vi: 'Kỹ sư Trí tuệ nhân tạo (AI Engineeer)',
    title_en: 'AI / Machine Learning Engineer',
    category: 'Information Technology',
    salary: '35,000,000 - 95,000,000 VND / tháng',
    growth: '+45% tăng trưởng tuyển dụng toàn quốc',
    description: 'Nghiên cứu, thiết kế và triển khai các thuật toán xử lý ngôn ngữ tự nhiên, học máy, mô hình LLM và thị giác máy tính cho các doanh nghiệp công nghệ, viễn thông và tài chính tại Việt Nam.',
    skills: ['Python', 'Deep Learning', 'PyTorch / TensorFlow', 'API Integration', 'Data Science'],
    education: 'Cử nhân CNTT, Khoa học dữ liệu hoặc Toán tin ứng dụng',
    outlook: 'very-high'
  },
  {
    id: 'cybersecurity',
    title_vi: 'Chuyên gia An ninh mạng & Bảo mật',
    title_en: 'Cybersecurity Specialist',
    category: 'Information Technology',
    salary: '25,000,000 - 75,000,000 VND / tháng',
    growth: '+30% nhu cầu bảo vệ hạ tầng số quốc gia',
    description: 'Đánh giá nguy cơ an toàn thông tin, lập kế hoạch ứng phó sự cố số và triển khai các biện pháp bảo mật hệ thống thanh toán, ngân hàng số và cổng dịch vụ đám mây.',
    skills: ['Network Security', 'Ethical Hacking', 'SecOps', 'ISO 27001', 'Cloud Infrastructure'],
    education: 'Cử nhân An toàn thông tin hoặc kỹ sư CNTT',
    outlook: 'very-high'
  },
  {
    id: 'sustainability',
    title_vi: 'Kỹ sư Năng lượng xanh & Phát triển Bền vững',
    title_en: 'Sustainability / Renewable Energy Engineer',
    category: 'Engineering & Environment',
    salary: '22,000,000 - 60,000,000 VND / tháng',
    growth: '+40% đầu tư FDI trong lĩnh vực năng lượng và ESG',
    description: 'Thiết kế, bảo trì hệ thống điện mặt trời, điện gió và tối ưu hóa hệ sinh thái trung hòa các-bon (ESG) cho các nhà máy và công trình hạ tầng xanh tại Việt Nam.',
    skills: ['Grid Integration', 'ESG Standards', 'CAD Designing', 'Energy Audit', 'Environmental Law'],
    education: 'Cử nhân Công nghệ Kỹ thuật Môi trường, Điện hạt nhân/Năng lượng tái tạo',
    outlook: 'high'
  },
  {
    id: 'logistics-supply-chain',
    title_vi: 'Trưởng nhóm Quản trị Chuỗi cung ứng & Logistics',
    title_en: 'Logistics & Supply Chain Manager',
    category: 'Management & Logistics',
    salary: '30,000,000 - 80,000,000 VND / tháng',
    growth: '+25% tăng trưởng ngành cảng biển và thương mại điện tử',
    description: 'Tối ưu hóa hành trình vận chuyển nội địa - quốc tế, quản lý kho bãi tự động công nghệ cao và thúc đẩy hoạt động thương mại xuyên biên giới mượt mà.',
    skills: ['Supply Chain Analytics', 'ERP / SAP', 'Inventory Control', 'Customs Regulations', 'Negotiation'],
    education: 'Cử nhân Logistics, Chuỗi cung ứng hoặc Kinh doanh quốc tế',
    outlook: 'very-high'
  },
  {
    id: 'digital-marketing',
    title_vi: 'Quản lý Tiếp thị Kỹ thuật số (Digital Marketer)',
    title_en: 'Digital Marketing Manager',
    category: 'Marketing & Multimedia',
    salary: '20,000,000 - 55,000,000 VND / tháng',
    growth: '+20% chuyển dịch ngân sách tiếp thị số trực tuyến',
    description: 'Xây dựng chiến lược thương hiệu đa nền tảng, quản trị dữ liệu người tiêu dùng (Data-driven Marketing) và phân tích hành vi mua sắm thương mại điện tử (Shopee, TikTok Shop...).',
    skills: ['SEO/SEM', 'Data Analytics', 'Growth Hacking', 'Content Strategy', 'AI Marketing Tools'],
    education: 'Cử nhân Tiếp thị, Truyền thông đa phương tiện hoặc Quản trị kinh doanh',
    outlook: 'stable'
  },
  {
    id: 'agritech',
    title_vi: 'Chuyên gia Nông nghiệp Công nghệ cao (AgriTech)',
    title_en: 'AgriTech Specialist',
    category: 'Agriculture & BioTech',
    salary: '18,000,000 - 45,000,000 VND / tháng',
    growth: '+28% chuyển giao kỹ thuật canh tác bền vững Đồng bằng Sông Cửu Long',
    description: 'Nghiên cứu phương pháp lai tạo giống chống chịu mặn, ứng dụng giải pháp nhà kính thông minh kết hợp IoT cảm biến đất và điều hành hệ thống phân tích thổ nhưỡng tự động.',
    skills: ['BioTech', 'IoT Implementation', 'Soil Nutrition Chemistry', 'Hydroponics', 'GIS Mapping'],
    education: 'Cử nhân Công nghệ Sinh học, Khoa học Cây trồng hoặc Nông nghiệp xanh',
    outlook: 'high'
  }
];

interface Props {
  lang: 'en' | 'vi';
  onConsult: (careerTitle: string) => void;
}

export const HotCareersVietnam: React.FC<Props> = ({ lang, onConsult }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const categories = ['All', 'Information Technology', 'Engineering & Environment', 'Management & Logistics', 'Marketing & Multimedia', 'Agriculture & BioTech'];

  const getCategoryLabel = (cat: string) => {
    if (lang !== 'vi') return cat;
    const map: Record<string, string> = {
      'All': 'Tất cả',
      'Information Technology': 'Công nghệ thông tin',
      'Engineering & Environment': 'Kỹ thuật & Môi trường',
      'Management & Logistics': 'Chuỗi cung ứng & Vận tải',
      'Marketing & Multimedia': 'Tiếp thị & Truyền thông số',
      'Agriculture & BioTech': 'Nông nghiệp & Sinh học',
    };
    return map[cat] || cat;
  };

  const filteredJobs = JOBS_VIETNAM.filter(job => {
    const matchesCat = selectedCategory === 'All' || job.category === selectedCategory;
    const matchesSearch = job.title_vi.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          job.title_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          job.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-gray-50/50 dark:bg-black p-6">
      
      {/* Upper Intro & Disclaimer */}
      <div className="mb-8 max-w-4xl">
        <div className="flex items-center gap-2 mb-2 text-xs font-bold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase">
          <span>● TRENDING IN VIETNAM</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-3">
          {lang === 'vi' ? 'Gợi Ý Nghề Nghiệp Khởi Sắc 2026' : 'Trending Careers Vietnam 2026'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-4">
          {lang === 'vi' 
            ? 'Danh sách các ngành nghề dẫn đầu về nhu cầu tuyển dụng, thu hút nguồn vốn FDI vững mạnh và phát triển sôi nổi tại thị trường Việt Nam hiện nay.' 
            : 'Explore top roles leading the Vietnamese job market in employment growth, FDI investments, and industry revolutions.'}
        </p>

        {/* HIGHLY COMPLIANT DISCLAIMER IN GOLD CANVASES */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs leading-relaxed flex gap-3">
          <svg className="w-5 h-5 flex-shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <strong>{lang === 'vi' ? 'Tuyên bố miễn trừ trách nhiệm:' : 'Disclaimer:'}</strong>{' '}
            {lang === 'vi'
              ? 'Mọi số liệu và gợi ý xu hướng chỉ mang tính chất tham khảo dựa trên báo cáo thị trường lao động tổng quát 2026. Công nghệ AI hay các bộ gợi ý hoàn toàn không thay thế được sự tư vấn, tầm nhìn sắc bén từ các tư vấn viên nghề nghiệp chuyên nghiệp thực tế.'
              : 'All market trends and salary estimates are for informational reference purposes. AI recommendations do NOT substitute for direct strategic consultations with human professional career coaches.'}
          </div>
        </div>

        <div className="mt-4">
          <InlineGuide 
            sectionKey="trending-careers"
            lang={lang === 'vi' ? 'vi' : 'en'}
            title={lang === 'vi' ? "💡 Hướng dẫn khám phá xu hướng" : "💡 Trending Careers Guide"}
            steps={lang === 'vi' ? [
              "Chọn một Danh mục ngành nghề ở bộ lọc (vd: Công nghệ thông tin, Nông nghiệp...) hoặc nhập từ khóa tìm kiếm.",
              "Đọc kĩ phân tích chi tiết về mức thu nhập trung bình tại Việt Nam, tăng trưởng việc làm và kiến thức cần tích lũy.",
              "Click 'Thảo luận với AI' ở góc bất kỳ thẻ nghề nghiệp nào. Hệ thống tự động chuyển sang trang Trò chuyện với câu hỏi nạp sẵn về cách dấn thân lập nghiệp cho ngành đó."
            ] : [
              "Select an Industry category or type key terms inside the search field.",
              "Examine custom metrics: Average VN income bands, national growth ratios, core skills, and degrees.",
              "Click 'Discuss with AI' on any career profile to jump directly to Chat, pre-populated with questions about building a career path for that specific job."
            ]}
          />
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedCategory === cat
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-white dark:bg-[#111] border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-indigo-400'
              }`}
            >
              {getCategoryLabel(cat)}
            </button>
          ))}
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={lang === 'vi' ? 'Tìm kiếm tên nghề...' : 'Search jobs...'}
            className="w-full md:w-64 pl-9 pr-4 py-2 bg-white dark:bg-[#0c0c0c] border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-indigo-500 dark:text-white transition-all"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Bento Grid layout of Jobs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredJobs.map(job => (
          <motion.div
            key={job.id}
            whileHover={{ y: -6, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="glow-card rounded-3xl p-6 bg-white dark:bg-[#0c0c0c] border border-gray-100 dark:border-white/5 shadow-sm flex flex-col justify-between cursor-pointer"
          >
            <div>
              {/* Category tag */}
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                  {getCategoryLabel(job.category)}
                </span>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md ${
                  job.outlook === 'very-high' 
                    ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                    : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                }`}>
                  {job.outlook === 'very-high' 
                    ? (lang === 'vi' ? 'Tăng trưởng phi mã' : 'Booming Outlook')
                    : (lang === 'vi' ? 'Ổn định & Cao' : 'High Growth')}
                </span>
              </div>

              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 leading-snug">
                {lang === 'vi' ? job.title_vi : job.title_en}
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mb-3">
                {lang === 'vi' ? job.title_en : job.title_vi}
              </p>

              {/* Salary Section */}
              <div className="p-3 bg-gray-50 dark:bg-[#111] rounded-xl border border-gray-100 dark:border-white/5 mb-4">
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                  {lang === 'vi' ? 'THU NHẬP ƯỚC TÍNH' : 'ESTIMATED SALARY'}
                </div>
                <div className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono">
                  {job.salary}
                </div>
                <div className="text-[10px] text-emerald-500 font-medium mt-1">
                  {job.growth}
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                {job.description}
              </p>

              {/* Essential Skills */}
              <div className="mb-4">
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">
                  {lang === 'vi' ? 'KỸ NĂNG THEN CHỐT' : 'ESSENTIAL SKILLS'}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {job.skills.map(skill => (
                    <span key={skill} className="px-2 py-0.5 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 rounded text-[10px] font-mono border border-gray-200/40 dark:border-white/5">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div className="mb-4">
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                  {lang === 'vi' ? 'ĐỊNH HƯỚNG HỌC PHẦN' : 'RECOMMENDED DEGREE'}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 block font-medium">
                  {job.education}
                </p>
              </div>
            </div>

            {/* Quick Consultation Trigger */}
            <button
              onClick={() => onConsult(lang === 'vi' ? job.title_vi : job.title_en)}
              className="mt-2 w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {lang === 'vi' ? 'Tư vấn chuyên sâu qua AI' : 'Consult with Career AI'}
            </button>
          </motion.div>
        ))}

        {filteredJobs.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400 text-sm">
            {lang === 'vi' ? 'Không tìm thấy kết quả nào phù hợp.' : 'No matching career found.'}
          </div>
        )}
      </div>
    </div>
  );
};
