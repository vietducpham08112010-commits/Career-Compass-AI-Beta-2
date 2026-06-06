import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Language } from '../types';
import { searchUniversityScores } from '../services/geminiService';
import { InlineGuide } from './InlineGuide';
import { Globe, ExternalLink, ShieldCheck } from 'lucide-react';

const MOCK_DATA = [
  { id: 1, name: 'Đại học Bách Khoa Hà Nội', major: 'Khoa học Máy tính (IT1)', year: 2023, score: 29.42, group: 'A00, A01' },
  { id: 2, name: 'Đại học Bách Khoa Hà Nội', major: 'Kỹ thuật Máy tính (IT2)', year: 2023, score: 28.29, group: 'A00, A01' },
  { id: 3, name: 'Đại học Công nghệ - ĐHQGHN', major: 'Công nghệ Thông tin', year: 2023, score: 27.85, group: 'A00, A01' },
  { id: 4, name: 'Đại học Kinh tế Quốc dân', major: 'Logistics và QLCCTU', year: 2023, score: 27.4, group: 'A00, A01, D01, D07' },
  { id: 5, name: 'Đại học Ngoại thương', major: 'Kinh tế đối ngoại', year: 2023, score: 28.3, group: 'A00, A01, D01' },
];

export const UniversityScores = ({ lang, t, Icons }: { lang: Language, t: any, Icons: any }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [groundingMetadata, setGroundingMetadata] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setIsSearching(true);
    setError(null);
    setAiResult(null);
    setGroundingMetadata(null);
    try {
      const response = await searchUniversityScores(searchTerm, lang);
      setAiResult(response.text);
      setGroundingMetadata(response.groundingMetadata);
    } catch (err: any) {
      setError(err.message || "Failed to fetch scores.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-stretch">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t.universityScores || 'Tra cứu điểm chuẩn'}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {lang === Language.VI 
            ? 'Theo dõi dữ liệu điểm chuẩn các trường Đại học bằng AI' 
            : 'Track university admission scores with AI'}
        </p>
      </motion.div>

      <InlineGuide 
        sectionKey="scores"
        lang={lang === Language.VI ? 'vi' : 'en'}
        title={lang === Language.VI ? "💡 Hướng dẫn tra cứu điểm chuẩn" : "💡 Admission Lookup Guide"}
        steps={lang === Language.VI ? [
          "Gõ tên trường, tên ngành hoặc tổ hợp thi (vd: Đại học Ngoại thương Kinh tế đối ngoại, hoặc Điểm chuẩn Bách khoa khoa học máy tính).",
          "AI sẽ thu thập thông tin điểm ngưỡng năm ngoái, dự báo xu hướng điểm năm nay và phân tích cơ hội đỗ cho học sinh.",
          "Bảng tham khảo bên dưới liệt kê một số học viện tiêu biểu và điểm chuẩn khối tự nhiên/xã hội để dọn đường chiến lược."
        ] : [
          "Type in your target university, major name, or exam codes (e.g., NEU Business Analytics admision score).",
          "AI evaluates thresholds, compares trends, and advises you on strategic test sets.",
          "Reference a selection of baseline school grades listed below for historical reference."
        ]}
      />

      <div className="w-full relative mb-12">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Icons.Search className="w-5 h-5 text-gray-400" />
        </div>
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={lang === Language.VI ? 'Nhập tên trường, ngành học (vd: Bách khoa CNTT)...' : 'Search university or major (e.g., MIT Computer Science)...'}
          className="w-full bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-2xl py-4 pl-12 pr-32 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
        />
        <button
          onClick={handleSearch}
          disabled={isSearching || !searchTerm.trim()}
          className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 rounded-xl font-medium transition-colors disabled:opacity-50"
        >
          {isSearching ? <Icons.Refresh className="w-5 h-5 animate-spin" /> : (lang === Language.VI ? 'Tìm kiếm' : 'Search')}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {isSearching && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-12 text-gray-500">
            <Icons.Refresh className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
            <p>{lang === Language.VI ? 'Đang tìm kiếm dữ liệu điểm chuẩn...' : 'Searching for admission scores...'}</p>
          </motion.div>
        )}
        
        {error && !isSearching && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-xl border border-red-100 dark:border-red-900/30 text-center">
            {error}
          </motion.div>
        )}

        {aiResult && !isSearching && (() => {
          const webCitations = (groundingMetadata?.groundingChunks || [])
            .map((chunk: any) => chunk?.web)
            .filter((webItem: any) => webItem && webItem.uri);

          const uniqueCitations: { uri: string; title?: string }[] = [];
          const seenUris = new Set();
          for (const webItem of webCitations) {
            if (webItem && webItem.uri && !seenUris.has(webItem.uri)) {
              seenUris.add(webItem.uri);
              uniqueCitations.push(webItem);
            }
          }

          return (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-sm">
              <div className="prose prose-indigo dark:prose-invert max-w-none markdown-body mb-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {aiResult}
                </ReactMarkdown>
              </div>

              {uniqueCitations.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                    <span>
                      {lang === Language.VI 
                        ? "Nguồn xác thực uy tín được AI tham khảo thực thời:" 
                        : "Authoritative sources referenced by AI in real-time:"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {uniqueCitations.map((cit, idx) => (
                      <a
                        key={idx}
                        href={cit.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-xs text-gray-700 dark:text-gray-300 rounded-xl border border-gray-100 dark:border-white/10 transition-colors duration-200 font-medium"
                      >
                        <Globe className="w-3.5 h-3.5 text-gray-400" />
                        <span className="max-w-[200px] md:max-w-[300px] truncate">{cit.title || cit.uri}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-gray-400 ml-0.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })()}

        {!aiResult && !isSearching && !error && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 pl-2">
              {lang === Language.VI ? 'Dữ liệu tham khảo (Năm 2023):' : 'Reference Data (2023):'}
            </h3>
            <div className="w-full bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                        <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-200">{lang === Language.VI ? 'Trường' : 'University'}</th>
                        <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-200">{lang === Language.VI ? 'Ngành' : 'Major'}</th>
                        <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-200">{lang === Language.VI ? 'Tổ hợp' : 'Group'}</th>
                        <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-200 text-right">{lang === Language.VI ? 'Điểm chuẩn' : 'Score'}</th>
                    </tr>
                    </thead>
                    <tbody>
                        {MOCK_DATA.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 text-gray-800 dark:text-gray-300">{item.name}</td>
                            <td className="px-6 py-4 font-medium text-indigo-600 dark:text-indigo-400">{item.major}</td>
                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{item.group}</td>
                            <td className="px-6 py-4 font-bold text-gray-900 dark:text-white text-right">{item.score}</td>
                        </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
