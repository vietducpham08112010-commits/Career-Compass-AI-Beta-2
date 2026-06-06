import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { Loader2, Search } from 'lucide-react';
import { searchScholarships } from '../services/geminiService';
import Markdown from 'react-markdown';
import { InlineGuide } from './InlineGuide';

export const Scholarships = ({
  language,
  userProfile
}: {
  language: Language;
  userProfile: any;
}) => {
  const t = TRANSLATIONS[language];
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<string>('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setResults('');
    
    try {
      const resultText = await searchScholarships(query, language, userProfile);
      setResults(resultText);
    } catch (e: any) {
      console.error(e);
      setResults(language === Language.EN ? "Sorry, I couldn't find scholarships right now. Please try again." : "Xin lỗi, tôi không thể tìm thấy học bổng lúc này. Vui lòng thử lại.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 md:p-8 max-w-5xl mx-auto h-full flex flex-col"
    >
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-fuchsia-600 dark:from-indigo-400 dark:to-fuchsia-400 mb-2">
          {t.scholarships}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t.scholarshipDesc}
        </p>
      </div>

      <InlineGuide 
        sectionKey="scholarships"
        lang={language === Language.VI ? 'vi' : 'en'}
        title={language === Language.VI ? "💡 Hướng dẫn săn học bổng" : "💡 Scholarships Guide"}
        steps={language === Language.VI ? [
          "Nhập từ khóa gồm ngành học, hệ đào tạo hoặc quốc gia mơ ước (vd: Học bổng du học sinh ngành Sinh học Canada).",
          "Hệ thống sẽ dùng AI kết nối internet thời gian thực để rà soát danh sách học bổng còn hiệu lực đăng ký.",
          "Kết quả trả về tự ứng hợp cấu trúc hồ sơ hiện tại của bạn, hiển thị cụ thể điều kiện xét tuyển, hồ sơ chuẩn bị và giá trị tài trợ."
        ] : [
          "Input keywords specifying your study major, region or grade levels (e.g., Undergraduate Data Science grants Sweden).",
          "AI scans web sources in real-time to find valid open scholarships fitting your search query.",
          "The returned list matches your active profile metrics, specifying full eligibility standards, required documents, and grant values."
        ]}
      />

      <div className="flex gap-3 mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={t.scholarshipSearchPlaceholder}
          className="flex-1 bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-2xl px-6 py-4 text-base focus:outline-none focus:border-indigo-500 text-gray-900 dark:text-white shadow-sm"
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
          className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white px-8 py-4 rounded-2xl font-medium shadow-md disabled:opacity-50 flex items-center gap-2"
        >
          {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          <span className="hidden sm:inline">{t.findScholarships}</span>
        </motion.button>
      </div>

      {isSearching && (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
          <p>{language === Language.EN ? "Searching the web for the best scholarships..." : "Đang tìm kiếm các học bổng tốt nhất trên mạng..."}</p>
        </div>
      )}

      {results && !isSearching && (
        <div className="flex-1 overflow-y-auto bg-white dark:bg-[#111] border border-gray-100 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="markdown-body">
             <Markdown>{results}</Markdown>
          </div>
        </div>
      )}
    </motion.div>
  );
};
