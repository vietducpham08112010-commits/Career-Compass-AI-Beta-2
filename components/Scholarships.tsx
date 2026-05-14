import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { Loader2, Search } from 'lucide-react';
import { searchScholarships } from '../services/geminiService';
import Markdown from 'react-markdown';

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
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-fuchsia-600 dark:from-indigo-400 dark:to-fuchsia-400 mb-2">
          {t.scholarships}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t.scholarshipDesc}
        </p>
      </div>

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
        <div className="flex-1 overflow-y-auto bg-white/40 dark:bg-black/30 backdrop-blur-3xl border border-white/60 dark:border-white/10 rounded-[32px] p-6 md:p-8 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
          <div className="markdown-body">
             <Markdown>{results}</Markdown>
          </div>
        </div>
      )}
    </motion.div>
  );
};
